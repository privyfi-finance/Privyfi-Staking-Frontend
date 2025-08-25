export async function mint(): Promise<void> {
  const amount: number = 10;
  // Ensure this runs only in a browser context
  if (typeof window === "undefined") return console.warn("Run in browser");

  const {
    WebClient,
    AccountStorageMode,
    AccountId,
    NoteType,
    TransactionProver,
    NoteInputs,
    Note,
    NoteAssets,
    NoteRecipient,
    Word,
    OutputNotesArray,
    NoteExecutionHint,
    NoteTag,
    NoteExecutionMode,
    NoteMetadata,
    FeltArray,
    Felt,
    FungibleAsset,
    NoteAndArgsArray,
    NoteAndArgs,
    TransactionRequestBuilder,
    OutputNote,
  } = await import("@demox-labs/miden-sdk");

  const USER_ID = process.env.PUBLIC_NEXT_USER_ID || "0xa014b8e02a130e1032b4e6b0824617";
  const FAUCET_ID = process.env.PUBLIC_NEXT_FAUCET_ID || "0xf99ba914c814ac200fa49cf9e7e2d0";

  const client = await WebClient.createClient(
    "https://rpc.testnet.miden.io:443"
  );
  const prover = TransactionProver.newRemoteProver(
    "https://tx-prover.testnet.miden.io"
  );

  console.log("Latest block:", (await client.syncState()).blockNum());


  // const alice = await client.newWallet(AccountStorageMode.public(), true);
  // console.log("Alice ID:", alice.id().toString());


  //   const bob = await client.newWallet(AccountStorageMode.public(), true);
  // console.log("bob ID:", bob.id().toString());


  // const faucet1 = await client.newFaucet(
  //   AccountStorageMode.public(),
  //   false,
  //   "ATI",
  //   8,
  //   BigInt(1_000_000_000),
  // );
  // console.log("Faucet ID:", faucet1.id().toString());


  // const faucet2 = await client.newFaucet(
  //   AccountStorageMode.public(),
  //   false,
  //   "USDC",
  //   8,
  //   BigInt(1_000_000_000),
  // );
  // console.log("Faucet ID:", faucet2.id().toString());







  // ── Creating new account ──────────────────────────────────────────────────────

  const userId = AccountId.fromHex(USER_ID);
  const user = await client.getAccount(userId);
  if (!user) {
    console.error(
      "Failed to fetch User's account. Please check the account ID."
    );
    return;
  }
  console.log("User1 accout ID:", user.id().toString());

  const faucetId = AccountId.fromHex(FAUCET_ID);
  const faucet = await client.getAccount(faucetId);
  if (!faucet) {
    console.error(
      "Failed to fetch Faucet's account. Please check the account ID."
    );
    return;
  }
  console.log("Faucet ID:", faucet.id().toString());

  await client.submitTransaction(
    await client.newTransaction(
      faucet.id(),
      client.newMintTransactionRequest(
        user.id(),
        faucet.id(),
        NoteType.Public,
        BigInt(amount)
      )
    ),
    prover
  );

  console.log("Waiting for settlement");
  await new Promise((r) => setTimeout(r, 7_000));
  await client.syncState();

  //   ── Consume the freshly minted note ──────────────────────────────────────────────
  const noteIds = (await client.getConsumableNotes(user.id())).map((rec) =>
    rec.inputNoteRecord().id().toString()
  );

  await client.submitTransaction(
    await client.newTransaction(
      user.id(),
      client.newConsumeTransactionRequest(noteIds)
    ),
    prover
  );
  await client.syncState();

  console.log("Minted and consumed 10 tokens successfully");
}
