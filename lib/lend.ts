import { lendTokens } from "./db";

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

export async function lend(amount: number): Promise<void> {
  // Ensure this runs only in a browser context
  if (typeof window === "undefined") return console.warn("Run in browser");

  const {
    WebClient,
    // AccountStorageMode,
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

  const USER_ID = process.env.USER_ID || "0xa014b8e02a130e1032b4e6b0824617";
  const ADMIN_ID = process.env.ADMIN_ID || "0x2c7713208c2a39107164424992d5c0";
  const FAUCET_ID = process.env.FAUCET_ID || "0xf99ba914c814ac200fa49cf9e7e2d0";
  
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
  console.log("Admin accout ID:", admin.id().toString());

  const faucetId = AccountId.fromHex(FAUCET_ID);
  const faucet = await client.getAccount(faucetId);
  if (!faucet) {
    console.error("Failed to fetch Faucet's account. Please check the account ID.");
    return;
  }
  console.log("Faucet ID:", faucet.id().toString());

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

    const serialNumber = Word.newFromFelts([
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
    ]);

    const receiverAcct = AccountId.fromHex(receiver.id().toString());
    const inputs = new NoteInputs(
      new FeltArray([receiverAcct.suffix(), receiverAcct.prefix()]),
    );

    const p2idNote = new Note(
      assets,
      metadata,
      new NoteRecipient(serialNumber, script, inputs),
    );

    const outputP2ID = OutputNote.full(p2idNote);

    console.log("Creating P2ID note...");
    const transaction = await client.newTransaction(
      sender.id(),
      new TransactionRequestBuilder()
        .withOwnOutputNotes(new OutputNotesArray([outputP2ID]))
        .build(),
    );
    await client.submitTransaction(transaction, prover);

    console.log("Consuming P2ID note...");

    const noteIdAndArgs = new NoteAndArgs(p2idNote, null);

    const consumeRequest = new TransactionRequestBuilder()
      .withUnauthenticatedInputNotes(new NoteAndArgsArray([noteIdAndArgs]))
      .build();

    const txExecutionResult = await client.newTransaction(
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

  await lendTokens(user.id().toString(), amount);

  console.log("User's lending amount updated in the database.");
}
