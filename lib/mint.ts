export async function mint(USER_ID: string, amount = 10): Promise<void> {
  console.log(USER_ID, "USER_IDPRESENT")
  // Ensure this runs only in a browser context
  if (typeof window === "undefined") return console.warn("Run in browser");

  const { AccountId, NoteType } = await import("@demox-labs/miden-sdk");
  const { createWebClient, getOrImportAccount } = await import("./midenClient");

  const FAUCET_ID = process.env.NEXT_PUBLIC_FAUCET_ID || "";

  if (!USER_ID) throw new Error("mint(): USER_ID is required (wallet not connected)");
  if (!amount || amount <= 0) throw new Error("mint(): amount must be > 0");

  const client = await createWebClient(process.env.NEXT_PUBLIC_MIDEN_RPC_URL);
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
  const faucet = await getOrImportAccount(client, faucetId.toString(), "hex");
  try {
    const checkId = AccountId.fromHex(faucet.id().toString());
    if (!checkId.isFaucet()) {
      throw new Error("Configured FAUCET_ID does not refer to a faucet account");
    }
  } catch (e) {
    console.error("FAUCET check failed", {
      rpcUrl: process.env.NEXT_PUBLIC_MIDEN_RPC_URL,
      faucetId: FAUCET_ID,
      resolvedId: faucet.id().toString(),
      error: e,
    });
    throw e;
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
    // Ensure the target user account exists in client state
    const user = await getOrImportAccount(client, USER_ID, "bech32");
    console.log("User Account ID:", user.id().toString());
    const mintTxRequest = client.newMintTransactionRequest(
      user.id(),
      faucet.id(),
      NoteType.Public,
      BigInt(amount),
    );
    const txResult = await client.newTransaction(faucet.id(), mintTxRequest);
    await client.submitTransaction(txResult);
  } catch (err) {
    console.error("Minting failed:", err, {
      rpcUrl: process.env.NEXT_PUBLIC_MIDEN_RPC_URL,
      faucetId: FAUCET_ID,
      userId: USER_ID,
      amount,
    });
    throw err; // or handle gracefully
  }

  console.log("Waiting 10 seconds for transaction confirmation...");
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await client.syncState();

  console.log("Transaction confirmed. Asset transfer chain completed ✅");

}
