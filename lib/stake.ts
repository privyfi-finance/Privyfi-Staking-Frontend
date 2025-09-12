import { NoteType } from "@demox-labs/miden-sdk";
import { getUserDetails } from "./db";

export async function stake(publicKey: string, amount: number): Promise<any> {
  console.log("staking for user...", publicKey);

  if (typeof window === "undefined") {
    console.warn("webClient() can only run in the browser");
    return;
  }

  // dynamic import → only in the browser, so WASM is loaded client‑side
  const {
    WebClient,
    AccountStorageMode,
    AccountId,
    // NoteType,
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
    OutputNote,
    AssemblerUtils,
    StorageSlot,
    TransactionKernel,
    TransactionRequestBuilder,
    TransactionScript,
    TransactionScriptInputPairArray,
  } = await import("@demox-labs/miden-sdk");

  const nodeEndpoint = "https://rpc.testnet.miden.io:443";
  const client = await WebClient.createClient(nodeEndpoint);
  const FAUCET_ID =
    process.env.NEXT_PUBLIC_FAUCET_ID || "0xf99ba914c814ac200fa49cf9e7e2d0";

  console.log(
    "Latest block:",
    FAUCET_ID,
    (await client.syncState()).blockNum()
  );
  const faucetId = AccountId.fromHex(FAUCET_ID);
  console.log("Faucet ID:", faucetId.isFaucet());
  console.log("Faucet Balance:");

  let faucet = await client.getAccount(faucetId);
  if (!faucet) {
    await client.importAccountById(faucetId);
    await client.syncState();
    console.log("reached here 1");
    faucet = await client.getAccount(faucetId);
    console.log("faucet import succesful");
    if (!faucet) {
      throw new Error(`Account not found after import: ${faucetId}`);
    }
  }
  console.log("Faucet ID:", faucet.id().toString());

  const counterContractCode = `
use.miden::account
use.std::sys

const.STAKING_SLOT=0

# Constructor: just stores 1 at slot 1 as a initial transaction to deploy
# => []
export.deploy
    push.1 dup
    # => [1, 1]

    exec.account::set_item
    # => []

    exec.sys::truncate_stack
    # => []
end


# => []
export.get_count
    push.STAKING_SLOT
    # => [index]

    exec.account::get_item
    # => [count]

    exec.sys::truncate_stack
    # => []
end

# => [sender_acct_id_pre, sender_acct_id_suf, ASSET]
export.stake_info
    # (0, 0, sender_acct_id_pre, sender_acct_id_suf) will be KEY
    push.0.0
    # => [0, 0, sender_acct_id_pre, sender_acct_id_suf, ASSET]

    push.STAKING_SLOT
    # => [index, KEY, ASSET]

    debug.stack

    exec.account::set_map_item dropw dropw
    # => []

    exec.sys::truncate_stack
    # => []
end
`;
  // Building the counter contract
  let assembler = TransactionKernel.assembler();
  console.log("assembler created");

  // Counter contract account id on testnet
  const counterContractId = AccountId.fromHex(
    "0xab609d955282c9406dcc05c3dc8420" // "mtst1qqugv0myjaprqsqcnlzpyz30pc7pwg8g"
  );
  console.log("Counter contract ID");

  // Reading the public state of the counter contract from testnet,
  // and importing it into the WebClient
  let stakeContractAccount = await client.getAccount(counterContractId);
  if (!stakeContractAccount) {
    await client.importAccountById(counterContractId);
    await client.syncState();
    stakeContractAccount = await client.getAccount(counterContractId);
    if (!stakeContractAccount) {
      throw new Error(`Account not found after import: ${counterContractId}`);
    }
  }
  console.log(
    "Counter contract account:",
    stakeContractAccount.id().toString()
  );

  // Building the transaction script which will call the counter contract
  let txScriptCode = `
   use.external_contract::staking_contract
use.miden::contracts::wallets::basic->wallet
use.miden::note
use.std::sys

begin
    # Load the ASSET on to memory position 1 and ensure the note only has 1 ASSET
    push.0
    exec.note::get_assets

    assert.err="Staking notes has more than one fungible asset. Only one fungible asset per note is allowed"
    # => [1]

    padw mem_loadw.0
    # => [ASSET]

    exec.note::get_sender
    # => [sender_id_prefix, sender_id_suffix, ASSET]

    debug.stack

    # Store info about Staker (KEY) and Asset (VALUE) in contract
    call.staking_contract::stake_info

    # Load ASSET from memory
    padw mem_loadw.0
    # => [ASSET]

    # Call receive asset in wallet
    call.wallet::receive_asset
    # => []

    exec.sys::truncate_stack
    # => []
end
  `;

  // Creating the library to call the counter contract
  let stakeComponentLib = AssemblerUtils.createAccountComponentLibrary(
    assembler, // assembler
    "external_contract::staking_contract", // library path to call the contract
    counterContractCode // account code of the contract
  );

  assembler = assembler.withLibrary(stakeComponentLib);
  const script = assembler.compileNoteScript(txScriptCode);

  const assets = new NoteAssets([
    new FungibleAsset(faucet.id(), BigInt(amount * 1000000)),
  ]);
  const metadata = new NoteMetadata(
    AccountId.fromBech32(publicKey),
    NoteType.Public,
    NoteTag.fromAccountId(
      AccountId.fromBech32(publicKey)
      // NoteExecutionMode.newLocal()
    ),
    NoteExecutionHint.always()
  );
  let serialNumber = Word.newFromFelts([
    new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
    new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
    new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
    new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
  ]);
  const inputs = new NoteInputs(
    new FeltArray([
      AccountId.fromBech32(publicKey).suffix(),
      AccountId.fromBech32(publicKey).prefix(),
    ])
  );

  let note = new Note(
    assets,
    metadata,
    new NoteRecipient(serialNumber, script, inputs)
  );

  const p2idNotes = OutputNote.full(note);

  let transaction = new TransactionRequestBuilder()
    .withOwnOutputNotes(new OutputNotesArray([p2idNotes]))
    .build();

  console.log("Transaction created:", transaction);

  return transaction;
}