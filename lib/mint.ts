export async function mint(USER_ID: string, amount = 10): Promise<void> {
  console.log(USER_ID, "USER_IDPRESENT")
  // Ensure this runs only in a browser context
  if (typeof window === "undefined") return console.warn("Run in browser");

  const {
    WebClient,
    AccountId,
    NoteType,
    // TransactionProver,
  } = await import("@demox-labs/miden-sdk");

  const FAUCET_ID = process.env.NEXT_PUBLIC_FAUCET_ID || "";

  const client = await WebClient.createClient(
    "https://rpc.testnet.miden.io:443"
  );
  // const prover = TransactionProver.newRemoteProver(
  //   "https://tx-prover.testnet.miden.io"
  // );

  
  // const faucet1 = await client.newFaucet(
  //   AccountStorageMode.public(),
  //   false,
  //   "MID",
  //   8,
  //   BigInt(1_000_000_000),
  // );
  // console.log("Faucet ID:", faucet1.id().toString());

  // const faucet2 = await client.newFaucet(
  //   AccountStorageMode.public(),
  //   false,
  //   "ABC",
  //   8,
  //   BigInt(1_000_000_000),
  // );
  // console.log("Faucet ID:", faucet2.id().toString());


  console.log("Latest block:", FAUCET_ID, (await client.syncState()).blockNum());

  const faucetId = AccountId.fromHex(FAUCET_ID);
  console.log("Faucet ID:", faucetId.isFaucet())

let faucet = await client.getAccount(faucetId);
  if (!faucet) {
    await client.importAccountById(faucetId);
    await client.syncState();
    console.log("reached here 1");
    
    faucet = await client.getAccount(faucetId);
    console.log("faucet import succesful")
    if (!faucet) {
      throw new Error(`Account not found after import: ${faucetId}`);
    }
  }



  // const faucet = await client.getAccount(faucetId);
  // client.importAccountById(faucetId)
  
  // if (!faucet) {
  //   console.error(
  //     "Failed to fetch Faucet's account. Please check the account ID."
  //   );
  //   return;
  // }
  // console.log("Faucet ID:", faucet.id().toString());
  console.log("Faucet Balance:");
   const userAccountId = AccountId.fromBech32(USER_ID);
    console.log("User Account ID:", userAccountId.toString());


  try {
    const userAccountId = AccountId.fromBech32(USER_ID);
    console.log("User Account ID:", userAccountId.toString());
    const mintTxRequest = client.newMintTransactionRequest(
      userAccountId,
      faucet.id(),
      NoteType.Public,
      BigInt(amount),
    );
    const txResult = await client.newTransaction(faucet.id(), mintTxRequest);
    await client.submitTransaction(txResult);
  } catch (err) {
    console.error("Minting failed:", err);
    throw err; // or handle gracefully
  }

  console.log("Waiting 10 seconds for transaction confirmation...");
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await client.syncState();

  console.log("Transaction confirmed. Asset transfer chain completed ✅");

}
