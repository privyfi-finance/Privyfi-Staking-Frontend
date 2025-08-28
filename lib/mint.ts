export async function mint(USER_ID: string, amount = 10): Promise<any> {
  console.log(USER_ID, "USER_IDPRESENT")
  // Ensure this runs only in a browser context
  if (typeof window === "undefined") return console.warn("Run in browser");

  const {
    WebClient,
    AccountId,
    NoteType,
    // TransactionProver,
    // AccountStorageMode
  } = await import("@demox-labs/miden-sdk");

  const FAUCET_ID = process.env.NEXT_PUBLIC_FAUCET_ID || "0xf99ba914c814ac200fa49cf9e7e2d0";

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





  console.log("Latest block:", (await client.syncState()).blockNum());

  const faucetId = AccountId.fromHex(FAUCET_ID);
  const faucet = await client.getAccount(faucetId);
  if (!faucet) {
    console.error(
      "Failed to fetch Faucet's account. Please check the account ID."
    );
    return;
  }
  console.log("Faucet ID:", faucet.id().toString());

  const mintTxRequest = client.newMintTransactionRequest(
    AccountId.fromBech32(USER_ID),
    faucet.id(),
    NoteType.Public,
    BigInt(amount),
  );
  
  const txResult = await client.newTransaction(faucet.id(), mintTxRequest);
  
  await client.submitTransaction(txResult);

  console.log("Waiting 10 seconds for transaction confirmation...");
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await client.syncState();

  console.log("Transaction confirmed. Asset transfer chain completed ✅");

}
