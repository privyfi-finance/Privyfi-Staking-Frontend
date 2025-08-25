import { upsertUser } from "./db";

// lib/createMintConsume.ts
// export async function createMintConsume(amount: number): Promise<void> {
//   console.log("In createMintConsume");

//   if (typeof window === "undefined") {
//     console.warn("webClient() can only run in the browser");
//     return;
//   }

//   // dynamic import → only in the browser, so WASM is loaded client‑side
//   const { WebClient, AccountStorageMode, AccountId, NoteType } = await import(
//     "@demox-labs/miden-sdk"
//   );

//   const nodeEndpoint = "https://rpc.testnet.miden.io:443";
//   const client = await WebClient.createClient(nodeEndpoint);

//   const state = await client.syncState();
//   console.log("Latest block number:", state.blockNum());

//   const userId = AccountId.fromHex("0xa01a8ae48b9566103c64d8368bb3c8");

//   const user = await client.getAccount(userId);
//   if (!user) {
//     console.error(
//       "Failed to fetch User's account. Please check the account ID."
//     );
//     return;
//   }

//   const faucetId = AccountId.fromHex("0x0f4b894dc2e114204c13fbc1e945f3");

//   //Stake: Send tokens to Admin

//   const adminAccountId = "0xb1986d76c57108102bc512e6461d58";// admin account
//   console.log("Staking: Sending tokens to Admin's account...");
//   let sendTxRequest = client.newSendTransactionRequest(
//     userId,
//     AccountId.fromHex(adminAccountId),
//     faucetId,
//     NoteType.Public,
//     BigInt(amount)
//   );

//   let txResult = await client.newTransaction(user?.id(), sendTxRequest);

//   await client.submitTransaction(txResult);

//   await client.syncState();
//   console.log("Tokens sent to Admin's account.");

//   //Updating db
//   await upsertUser("0xa01a8ae48b9566103c64d8368bb3c8", amount);

//   // Consume transfered tokens
//   console.log("Consuming transfered tokens...");
//   const admin = await client.getAccount(AccountId.fromHex(adminAccountId));
//   if (!admin) {
//     console.error("Failed to fetch Admin's account. Please check the account ID.");
//     return;
//   }
//   const adminNotes = await client.getConsumableNotes(admin.id());

//   console.log("Unspent notes in Admin's account:", adminNotes.toString());

//   const noteIdsToConsume = adminNotes.map((n) =>
//     n.inputNoteRecord().id().toString()
//   );

//   console.log("Unspent notes to consume:", noteIdsToConsume);

//   // Consume the notes
//   let consumeTxRequest = client.newConsumeTransactionRequest(noteIdsToConsume);
//   let txResult2 = await client.newTransaction(admin.id(), consumeTxRequest);
//   await client.submitTransaction(txResult2);

//   await client.syncState();
//   console.log("Notes consumed successfully.");

// }

const P2ID_NOTE_SCRIPT = `
use.miden::account
use.miden::account_id
use.miden::note

# ERRORS
# =================================================================================================

const.ERR_P2ID_WRONG_NUMBER_OF_INPUTS="P2ID note expects exactly 2 note inputs"

const.ERR_P2ID_TARGET_ACCT_MISMATCH="P2ID's target account address and transaction address do not match"

#! Pay-to-ID script: adds all assets from the note to the account, assuming ID of the account
#! matches target account ID specified by the note inputs.
#!
#! Requires that the account exposes:
#! - miden::contracts::wallets::basic::receive_asset procedure.
#!
#! Inputs:  []
#! Outputs: []
#!
#! Note inputs are assumed to be as follows:
#! - target_account_id is the ID of the account for which the note is intended.
#!
#! Panics if:
#! - Account does not expose miden::contracts::wallets::basic::receive_asset procedure.
#! - Account ID of executing account is not equal to the Account ID specified via note inputs.
#! - The same non-fungible asset already exists in the account.
#! - Adding a fungible asset would result in amount overflow, i.e., the total amount would be
#!   greater than 2^63.
begin
    # store the note inputs to memory starting at address 0
    padw push.0 exec.note::get_inputs
    # => [num_inputs, inputs_ptr, EMPTY_WORD]

    # make sure the number of inputs is 2
    eq.2 assert.err=ERR_P2ID_WRONG_NUMBER_OF_INPUTS
    # => [inputs_ptr, EMPTY_WORD]

    # read the target account ID from the note inputs
    mem_loadw drop drop
    # => [target_account_id_prefix, target_account_id_suffix]

    exec.account::get_id
    # => [account_id_prefix, account_id_suffix, target_account_id_prefix, target_account_id_suffix, ...]

    # ensure account_id = target_account_id, fails otherwise
    exec.account_id::is_equal assert.err=ERR_P2ID_TARGET_ACCT_MISMATCH
    # => []

    exec.note::add_note_assets_to_account
    # => []
end
`;

export async function stake(amount: number): Promise<void> {
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
  const ADMIN_ID = process.env.PUBLIC_NEXT_ADMIN_ID || "0x2c7713208c2a39107164424992d5c0";
  const FAUCET_ID = process.env.PUBLIC_NEXT_FAUCET_ID || "0xf99ba914c814ac200fa49cf9e7e2d0";
  
  const client = await WebClient.createClient(
    "https://rpc.testnet.miden.io:443",
  );
  const prover = TransactionProver.newRemoteProver(
    "https://tx-prover.testnet.miden.io",
  );

  console.log("Latest block:", (await client.syncState()).blockNum());

  // ── Creating new account ──────────────────────────────────────────────────────
  console.log("Creating accounts");

  console.log("Creating account for User");
  const userId = AccountId.fromHex(USER_ID);
  // const user = await client.newWallet(AccountStorageMode.public(), true);
  const user = await client.getAccount(userId);
  if (!user) {
    console.error("Failed to fetch User's account. Please check the account ID.");
    return;
  }
  console.log("User accout ID:", user.id().toString());

  const adminId = AccountId.fromHex(ADMIN_ID);
  // const admin = await client.newWallet(AccountStorageMode.public(), true);
  const admin = await client.getAccount(adminId);
  if (!admin) {
    console.error("Failed to fetch Admin's account. Please check the account ID.");
    return;
  }
  // const admin = await client.newWallet(AccountStorageMode.public(), true);
  console.log("Admin accout ID:", admin.id().toString());

  // ── Creating new faucet ──────────────────────────────────────────────────────
  // const faucet = await client.newFaucet(
  //   AccountStorageMode.public(),
  //   false,
  //   "MID",
  //   8,
  //   BigInt(10_000_000),
  // );
  const faucetId = AccountId.fromHex(FAUCET_ID);
  const faucet = await client.getAccount(faucetId);
  if (!faucet) {
    console.error("Failed to fetch Faucet's account. Please check the account ID.");
    return;
  }
  console.log("Faucet ID:", faucet.id().toString());

  // ── mint 10 000 MID to Alice ──────────────────────────────────────────────────────
  // await client.submitTransaction(
  //   await client.newTransaction(
  //     faucet.id(),
  //     client.newMintTransactionRequest(
  //       user.id(),
  //       faucet.id(),
  //       NoteType.Public,
  //       BigInt(10_000),
  //     ),
  //   ),
  //   prover,
  // );

  // console.log("Waiting for settlement");
  // await new Promise((r) => setTimeout(r, 7_000));
  // await client.syncState();

  // ── Consume the freshly minted note ──────────────────────────────────────────────
  // const noteIds = (await client.getConsumableNotes(user.id())).map((rec) =>
  //   rec.inputNoteRecord().id().toString(),
  // );

  // await client.submitTransaction(
  //   await client.newTransaction(
  //     user.id(),
  //     client.newConsumeTransactionRequest(noteIds),
  //   ),
  //   prover,
  // );
  // await client.syncState();

  const script = client.compileNoteScript(P2ID_NOTE_SCRIPT);

  // ── Create unauthenticated note transfer chain ─────────────────────────────────────────────

    // Determine sender and receiver for this iteration
    const sender = user;
    const receiver = admin;

    console.log("Sender:", sender.id().toString());
    console.log("Receiver:", receiver.id().toString());

    const assets = new NoteAssets([new FungibleAsset(faucet.id(), BigInt(amount))]);
    const metadata = new NoteMetadata(
      sender.id(),
      NoteType.Public,
      NoteTag.fromAccountId(sender.id(), NoteExecutionMode.newLocal()),
      NoteExecutionHint.always(),
    );

    let serialNumber = Word.newFromFelts([
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
    ]);

    const receiverAcct = AccountId.fromHex(receiver.id());
    const inputs = new NoteInputs(
      new FeltArray([receiverAcct.suffix(), receiverAcct.prefix()]),
    );

    let p2idNote = new Note(
      assets,
      metadata,
      new NoteRecipient(serialNumber, script, inputs),
    );

    let outputP2ID = OutputNote.full(p2idNote);

    console.log("Creating P2ID note...");
    let transaction = await client.newTransaction(
      sender.id(),
      new TransactionRequestBuilder()
        .withOwnOutputNotes(new OutputNotesArray([outputP2ID]))
        .build(),
    );
    await client.submitTransaction(transaction, prover);

    console.log("Consuming P2ID note...");

    let noteIdAndArgs = new NoteAndArgs(p2idNote, null);

    let consumeRequest = new TransactionRequestBuilder()
      .withUnauthenticatedInputNotes(new NoteAndArgsArray([noteIdAndArgs]))
      .build();

    let txExecutionResult = await client.newTransaction(
      receiver.id(),
      consumeRequest,
    );

    await client.submitTransaction(txExecutionResult, prover);

    const txId = txExecutionResult
      .executedTransaction()
      .id()
      .toHex()
      .toString();

    console.log(
      `Consumed Note Tx on MidenScan: https://testnet.midenscan.com/tx/${txId}`,
    );
  

  console.log("Asset transfer chain completed ✅");

  await upsertUser(user.id().toString(), amount);

  console.log("User's staking amount updated in the database.");
}
