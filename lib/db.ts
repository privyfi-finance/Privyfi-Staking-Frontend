// lib/db.ts
"use server";

import { Client } from "pg";

const client = new Client({
  host: process.env.NEXT_PUBLIC_PG_HOST || "localhost",
  port: Number(process.env.NEXT_PUBLIC_PG_PORT) || 5432,
  user: process.env.NEXT_PUBLIC_PG_USER || "postgres",
  password: process.env.NEXT_PUBLIC_PG_PASSWORD || "password",
  database: process.env.NEXT_PUBLIC_PG_DATABASE || "miden",
  ssl: {
    rejectUnauthorized: false, // Neon uses SSL but doesn’t require CA verification
  },
});

let isConnected = false;

async function connectDB() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
    console.log("✅ Connected to Postgres");
  }
}

// ───────────────────────────────────────────────────────────────
// Create users and user_history tables
// ───────────────────────────────────────────────────────────────
export async function setupDatabase() {
  await connectDB();

  // Users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      wallet_address VARCHAR(255) UNIQUE NOT NULL,
      amount_staked NUMERIC DEFAULT 0,
      last_staked_at TIMESTAMP DEFAULT NOW(),
      has_claimed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // User history table with foreign key reference to users.wallet_address
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_history (
      id SERIAL PRIMARY KEY,
      wallet_address VARCHAR(255) NOT NULL,
      action VARCHAR(50) NOT NULL, -- e.g., 'STAKE', 'CLAIM', 'WITHDRAW'
      amount NUMERIC DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS borrows (
      id SERIAL PRIMARY KEY,
      wallet_address VARCHAR(255) NOT NULL ,
      amount NUMERIC NOT NULL,
      borrowed_at TIMESTAMP DEFAULT NOW(),
      returned BOOLEAN DEFAULT FALSE,
      returned_at TIMESTAMP,
      is_returnable BOOLEAN DEFAULT TRUE
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS lends (
      id SERIAL PRIMARY KEY,
      wallet_address VARCHAR(255) NOT NULL,
      amount NUMERIC NOT NULL,
      lend_at TIMESTAMP DEFAULT NOW(),
      withdrawn BOOLEAN DEFAULT FALSE,
      withdrawn_at TIMESTAMP
    );
  `);
  console.log("✅ Users & UserHistory tables are ready");
}

// ───────────────────────────────────────────────────────────────
// Helper: insert into user_history
// ───────────────────────────────────────────────────────────────
export async function addUserHistory(
  walletAddress: string,
  action: string,
  amount: number
) {
  await setupDatabase();

  const normalizedAddress = walletAddress.toLowerCase();
  console.log(
    `Adding user history: ${normalizedAddress} | ${action} | ${amount}`
  );

  await client.query(
    `
      INSERT INTO user_history (wallet_address, action, amount, created_at)
      VALUES ($1, $2, $3, NOW())
    `,
    [normalizedAddress, action, amount]
  );
  console.log(`📜 History added: ${normalizedAddress} | ${action} | ${amount}`);
}

// ───────────────────────────────────────────────────────────────
// Upsert User (stake)
// ───────────────────────────────────────────────────────────────
export async function upsertUser(walletAddress: string, amountStaked: number) {
  const normalizedAddress = walletAddress.toLowerCase();
  console.log(
    `Upserting user: ${normalizedAddress} with amount: ${amountStaked}`
  );

  await setupDatabase();
  const res = await client.query(
    `
      INSERT INTO users (wallet_address, amount_staked, last_staked_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (wallet_address)
      DO UPDATE SET
        has_claimed = FALSE,
        amount_staked = users.amount_staked + EXCLUDED.amount_staked,
        last_staked_at = CASE 
          WHEN EXCLUDED.amount_staked > 0 THEN NOW() 
          ELSE users.last_staked_at 
        END,
        updated_at = NOW()
      RETURNING *;
    `,
    [normalizedAddress, amountStaked]
  );

  // Record in history
  await addUserHistory(normalizedAddress, "STAKE", amountStaked);

  console.log("✅ User upserted:", res.rows[0]);
  return res.rows[0];
}

export async function calculateClaimableReward(walletAddress: string) {
  const normalizedAddress = walletAddress.toLowerCase();
  await setupDatabase();
  const res = await client.query(
    `SELECT amount_staked, last_staked_at, has_claimed FROM users WHERE wallet_address = $1`,
    [normalizedAddress]
  );
  if (res.rows.length === 0) {
    console.log(`⚠️ No user found for wallet: ${normalizedAddress}`);
    return 0;
  }
  const { amount_staked, last_staked_at, has_claimed } = res.rows[0];
  if (has_claimed) {
    console.log(`⚠️ Reward already claimed for ${normalizedAddress}`);
    return 0;
  }
  if (amount_staked <= 0) {
    console.log(`⚠️ No staked amount for ${normalizedAddress}`);
    return 0;
  }
  const now = new Date();
  const lastStakeDate = new Date(last_staked_at);
  const diffDays = Math.floor(
    (now.getTime() - lastStakeDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 30) {
    console.log(
      `⚠️ Rewards not yet available. ${30 - diffDays} day(s) remaining.`
    );
    return 0;
  } // Reward multiplier: 3% per 30 days
  const periods = Math.floor(diffDays / 30);
  const rewardRate = periods * 0.03;
  const reward = Number(amount_staked) * rewardRate;
  console.log(
    `✅ Claimable reward for ${normalizedAddress}: ${reward} (${
      rewardRate * 100
    }%)`
  );
  return Number(amount_staked) + Number(reward);
}

// ───────────────────────────────────────────────────────────────
// Claim Reward
// ───────────────────────────────────────────────────────────────
export async function updateUserAfterClaim(walletAddress: string) {
  const normalizedAddress = walletAddress.toLowerCase();
  await setupDatabase();

  const claimedAmount = await calculateClaimableReward(normalizedAddress);
  // Record in history BEFORE resetting

  const res = await client.query(
    `
      UPDATE users
      SET amount_staked = 0,
          has_claimed = TRUE,
          updated_at = NOW()
      WHERE wallet_address = $1
      RETURNING *;
    `,
    [normalizedAddress]
  );

  await addUserHistory(normalizedAddress, "CLAIM", claimedAmount);

  console.log(
    `✅ User claimed reward: ${normalizedAddress}, Amount: ${claimedAmount}`
  );
  return res.rows[0];
}

// ───────────────────────────────────────────────────────────────
// Withdraw Stake
// ───────────────────────────────────────────────────────────────
export async function withdrawStake(walletAddress: string, amount: number) {
  const normalizedAddress = walletAddress.toLowerCase();
  await setupDatabase();

  const currentStake = await getUserStake(normalizedAddress);
  if (currentStake === null || currentStake < amount) {
    throw new Error("⚠️ Insufficient staked amount");
  }

  const res = await client.query(
    `
      UPDATE users
      SET amount_staked = amount_staked - $2,
          updated_at = NOW()
      WHERE wallet_address = $1
      RETURNING *;
    `,
    [normalizedAddress, amount]
  );

  // Record in history
  await addUserHistory(normalizedAddress, "WITHDRAW", amount);

  console.log(`✅ ${amount} withdrawn for ${normalizedAddress}`);
  return res.rows[0];
}

// ───────────────────────────────────────────────────────────────
// Get User Stake
// ───────────────────────────────────────────────────────────────
export async function getUserStake(walletAddress: string) {
  const normalizedAddress = walletAddress.toLowerCase();
  await setupDatabase();

  const res = await client.query(
    `SELECT amount_staked FROM users WHERE wallet_address = $1`,
    [normalizedAddress]
  );

  if (res.rows.length === 0) {
    return null;
  }
  return Number(res.rows[0].amount_staked);
}

// ───────────────────────────────────────────────────────────────
// Fetch User History
// ───────────────────────────────────────────────────────────────
export async function getUserHistory(walletAddress: string) {
  const normalizedAddress = walletAddress.toLowerCase();
  console.log(`Fetching history for ${normalizedAddress}`);

  await setupDatabase();

  const res = await client.query(
    `
      SELECT action, amount, created_at
      FROM user_history
      WHERE wallet_address = $1
      ORDER BY created_at DESC
    `,
    [normalizedAddress]
  );
  console.log(res.rows);

  return res.rows;
}

// ───────────────────────────────────────────────────────────────
// Get User Stats (staked, claimable, growth %)
// ───────────────────────────────────────────────────────────────
export async function getUserStats(walletAddress: string) {
  const normalizedAddress = walletAddress.toLowerCase();
  await setupDatabase();

  const res = await client.query(
    `SELECT amount_staked, last_staked_at FROM users WHERE wallet_address = $1`,
    [normalizedAddress]
  );

  if (res.rows.length === 0) {
    return null;
  }

  const { amount_staked, last_staked_at } = res.rows[0];
  const stakedAmount = Number(amount_staked);

  if (stakedAmount <= 0) {
    return {
      stakedAmount,
      claimableAmount: 0,
      percentageIncrease: 0,
    };
  }

  const now = new Date();
  const lastStakeDate = new Date(last_staked_at);
  const diffDays = Math.floor(
    (now.getTime() - lastStakeDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 30) {
    console.log(
      `⚠️ Rewards not yet available. ${30 - diffDays} day(s) remaining.`
    );
    return 0;
  } // Reward multiplier: 3% per 30 days
  const periods = Math.floor(diffDays / 30);
  const rewardRate = periods * 0.03;
  const reward = Number(amount_staked) * rewardRate;

  const claimableAmount = stakedAmount + reward;
  const percentageIncrease = (rewardRate * 100).toFixed(2);

  return {
    stakedAmount,
    claimableAmount,
    percentageIncrease,
  };
}

// ───────────────────────────────────────────────────────────────
// Borrowing / Returning
// ───────────────────────────────────────────────────────────────
export async function borrowTokens(walletAddress: string, amount: number) {
  await setupDatabase();
  const addr = walletAddress.toLowerCase();

  const res = await client.query(
    `INSERT INTO borrows (wallet_address, amount) VALUES ($1, $2) RETURNING *`,
    [addr, amount]
  );
  await addUserHistory(addr, "BORROW", amount);
  return res.rows[0];
}

export async function returnBorrowed(walletAddress: string, amount: number) {
  await setupDatabase();
  const addr = walletAddress.toLowerCase();
  // Fetch only returnable borrows
  const res = await client.query(
    `SELECT * FROM borrows 
     WHERE wallet_address = $1 AND returned = FALSE AND is_returnable = TRUE 
     ORDER BY borrowed_at ASC`,
    [addr]
  );

  if (res.rows.length === 0) {
    throw new Error("⚠️ No returnable borrows available");
  }

  let remaining = amount;
  for (const b of res.rows) {
    if (remaining <= 0) break;

    const repay = Math.min(Number(b.amount), remaining);
    await client.query(
      `UPDATE borrows 
       SET amount = amount - $2, 
           returned = CASE WHEN amount - $2 <= 0 THEN TRUE ELSE FALSE END, 
           returned_at = CASE WHEN amount - $2 <= 0 THEN NOW() ELSE returned_at END 
       WHERE id = $1`,
      [b.id, repay]
    );

    remaining -= repay;
  }

  if (remaining > 0) {
    console.log(
      `⚠️ ${remaining} could not be returned because some borrows expired`
    );
  }

  if (amount - remaining > 0) {
    await addUserHistory(addr, "RETURN", amount - remaining);
  }

  return { success: true, returned: amount - remaining, unreturned: remaining };
}

// ───────────────────────────────────────────────────────────────
// Lending / Withdrawing
// ───────────────────────────────────────────────────────────────
export async function lendTokens(walletAddress: string, amount: number) {
  await setupDatabase();
  const addr = walletAddress.toLowerCase();
  const res = await client.query(
    `INSERT INTO lends (wallet_address, amount) VALUES ($1, $2) RETURNING *`,
    [addr, amount]
  );
  await addUserHistory(addr, "LEND", amount);
  return res.rows[0];
}

export async function withdrawlend(walletAddress: string, amount: number) {
  await setupDatabase();
  const addr = walletAddress.toLowerCase();

  const res = await client.query(
    `SELECT * FROM lends WHERE wallet_address = $1 AND withdrawn = FALSE ORDER BY lend_at ASC`,
    [addr]
  );
  let remaining = amount;
  for (const l of res.rows) {
    if (remaining <= 0) break;
    const wit = Math.min(Number(l.amount), remaining);
    await client.query(
      `UPDATE lends SET amount = amount - $2, withdrawn = CASE WHEN amount - $2 <= 0 THEN TRUE ELSE FALSE END, withdrawn_at = CASE WHEN amount - $2 <= 0 THEN NOW() ELSE withdrawn_at END WHERE id = $1`,
      [l.id, wit]
    );
    remaining -= wit;
  }

  if (remaining > 0) throw new Error("Withdraw exceeds lend amount");
  await addUserHistory(addr, "WITHDRAW_LEND", amount);
  return { success: true };
}

export async function checkReturnableBorrows(walletAddress: string) {
  await setupDatabase();
  const addr = walletAddress.toLowerCase();

  // Step 1: mark expired borrows
  await client.query(
    `
    UPDATE borrows
    SET is_returnable = FALSE
    WHERE wallet_address = $1
      AND returned = FALSE
      AND borrowed_at < NOW() - INTERVAL '7 days'
  `,
    [addr]
  );

  // Step 2: fetch returnable borrows
  const res = await client.query(
    `SELECT SUM(amount) AS total_returnable
     FROM borrows
     WHERE wallet_address = $1
       AND returned = FALSE
       AND is_returnable = TRUE`,
    [addr]
  );

  const totalReturnable = res.rows[0]?.total_returnable
    ? Number(res.rows[0].total_returnable)
    : 0;

  if (totalReturnable > 0) {
    return { canReturn: true, totalReturnable };
  }

  return { canReturn: false, totalReturnable: 0 };
}

export async function canBurrow(walletAddress: string) {
  await setupDatabase();
  const addr = walletAddress.toLowerCase();

  // Step 1: mark expired borrows
  await client.query(
    `
    UPDATE borrows
    SET is_returnable = FALSE
    WHERE wallet_address = $1
      AND returned = FALSE
      AND borrowed_at < NOW() - INTERVAL '7 days'
  `,
    [addr]
  );

  // Step 2: fetch returnable borrows
  const res = await client.query(
    `SELECT SUM(amount) AS total_returnable
     FROM borrows
     WHERE wallet_address = $1
       AND returned = FALSE
       AND is_returnable = TRUE`,
    [addr]
  );

  const totalReturnable = res.rows[0]?.total_returnable
    ? Number(res.rows[0].total_returnable)
    : 0;

  if (totalReturnable > 0) {
    return { canBurrow: false };
  }

  return { canBurrow: true };
}

export async function canWithdrawlend(walletAddress: string, amount: number) {
  await setupDatabase();
  const addr = walletAddress.toLowerCase();

  // Fetch all active lends (not withdrawn yet)
  const res = await client.query(
    `SELECT * FROM lends WHERE wallet_address = $1 AND withdrawn = FALSE ORDER BY lend_at ASC`,
    [addr]
  );

  // Calculate total available for withdrawal
  const totalAvailable = res.rows.reduce(
    (sum, row) => sum + Number(row.amount),
    0
  );

  if (totalAvailable >= amount) {
    return { canWithdraw: true, available: totalAvailable };
  } else {
    return { canWithdraw: false, available: totalAvailable };
  }
}
