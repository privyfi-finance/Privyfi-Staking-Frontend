import { AccountStorageMode, Felt, FeltArray, FungibleAsset, Note, NoteAssets, NoteExecutionHint, NoteExecutionMode, NoteInputs, NoteMetadata, NoteRecipient, NoteTag, NoteType, OutputNote, OutputNotesArray, TransactionProver, TransactionRequestBuilder, Word } from "@demox-labs/miden-sdk";
import { getUserDetails } from "./db";

export async function stake(publicKey: string, amount: number): Promise<void> {
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
  //   console.log("Current block number: ", (await client.syncState()).blockNum());
  const FAUCET_ID = process.env.NEXT_PUBLIC_FAUCET_ID || "0xf99ba914c814ac200fa49cf9e7e2d0";
  const faucetId = AccountId.fromHex(FAUCET_ID);
  const faucet = await client.getAccount(faucetId);
  if (!faucet) {
    console.error(
      "Failed to fetch Faucet's account. Please check the account ID."
    );
    return;
  }
  console.log("Faucet ID:", faucet.id().toString());

  const prover = TransactionProver.newRemoteProver(
    "https://tx-prover.testnet.miden.io",
  );

  // Counter contract code in Miden Assembly
  const counterContractCode =
  `
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

  // Counter contract account id on testnet
  const counterContractId = AccountId.fromBech32(
    "mtst1qqugv0myjaprqsqcnlzpyz30pc7pwg8g"
  );

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

  const data = await getUserDetails(publicKey);
  console.log(data);

  const account_id = data ? data.id : 0;
  const updated_amount = data ? Number(data.amount_staked) + amount : amount;
  console.log("Account ID:", account_id, "Updated Amount:", updated_amount, "for public key:", publicKey);

  // Building the transaction script which will call the counter contract
//   let txScriptCode = `
//    use.external_contract::staking_contract
// use.miden::contracts::wallets::basic->wallet
// use.miden::note
// use.std::sys

// begin
//     # Load the ASSET on to memory position 1 and ensure the note only has 1 ASSET
//     push.0
//     exec.note::get_assets

//     assert.err="Staking notes has more than one fungible asset. Only one fungible asset per note is allowed"
//     # => [1]

//     padw mem_loadw.0
//     # => [ASSET]

//     exec.note::get_sender
//     # => [sender_id_prefix, sender_id_suffix, ASSET]

//     debug.stack

//     # Store info about Staker (KEY) and Asset (VALUE) in contract
//     call.staking_contract::stake_info

//     # Load ASSET from memory
//     padw mem_loadw.0
//     # => [ASSET]

//     # Call receive asset in wallet
//     call.wallet::receive_asset
//     # => []

//     exec.sys::truncate_stack
//     # => []
// end
//   `;

  let txScriptCode = `
use.std::sys

const.STAKING_SLOT=0

begin
    push.1
    exec.sys::truncate_stack const metadata = new NoteMetadata(
    AccountId.fromHex(acct.id().toString()),
    NoteType.Public,
    NoteTag.fromAccountId(AccountId.fromHex(acct.id().toString()), NoteExecutionMode.newLocal()),
    NoteExecutionHint.always(),
  );
end

`;
  // Creating the library to call the counter contract
  let stakeComponentLib = AssemblerUtils.createAccountComponentLibrary(
    assembler, // assembler
    "external_contract::staking_contract", // library path to call the contract
    counterContractCode // account code of the contract
  );
  const acct = await client.newWallet(AccountStorageMode.public(), true);//AccountId.fromBech32(publicKey);
  console.log("Alice account created:", acct.id().toString());

  // const user = await client.getAccount(acct);
  // if (!user) {
  //   console.error("Failed to fetch Alice's account. Please check the account ID.");
  //   return;
  // }

  const mintTxRequest = client.newMintTransactionRequest(
    AccountId.fromHex(acct.id().toString()),
    faucet.id(),
    NoteType.Public,
    BigInt(100),
  );

  const txResult1 = await client.newTransaction(faucet.id(), mintTxRequest);

  await client.submitTransaction(txResult1);

  console.log("Waiting 10 seconds for transaction confirmation...");
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await client.syncState();

  console.log("Transaction confirmed. Asset transfer chain completed :white_check_mark:");
//


  // Creating the transaction script
  // let txScript = TransactionScript.compile(
  //   txScriptCode,
  //   assembler.withLibrary(stakeComponentLib)
  // );

  const script = client.compileNoteScript(txScriptCode);
// const script = TransactionScript.compile(
//   txScriptCode,
//   assembler.withLibrary(stakeComponentLib)
// );
  console.log("Alice accout ID:");

  const assets = new NoteAssets([new FungibleAsset(faucet.id(), BigInt(1))]);
  const metadata = new NoteMetadata(
    AccountId.fromHex(acct.id().toString()),
    NoteType.Public,
    NoteTag.fromAccountId(AccountId.fromHex(acct.id().toString()), 
    // NoteExecutionMode.newLocal()
),
    NoteExecutionHint.always(),
  );
  let serialNumber = Word.newFromFelts([
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
    ]);
    const inputs = new NoteInputs(
      new FeltArray([(AccountId.fromHex(acct.id().toString())).suffix(), (AccountId.fromHex(acct.id().toString())).prefix()]),
    );

    let note = new Note(
      assets,
      metadata,
      new NoteRecipient(serialNumber, script, inputs),
    );

    const p2idNotes = OutputNote.full(note);
  // });

  // ── create all P2ID notes ───────────────────────────────────────────────────────────────
  let transaction = await client.newTransaction(
    AccountId.fromHex(acct.id().toString()),
    new TransactionRequestBuilder()
      .withOwnOutputNotes(new OutputNotesArray([p2idNotes]))
      .build(),
  );

  // ── submit tx ───────────────────────────────────────────────────────────────
  await client.submitTransaction(transaction, prover);






  // Creating a transaction request with the transaction script
  // let txRequest = new TransactionRequestBuilder()
  //   .withCustomScript(txScript)
  //   .build();

  // // Executing the transaction script against the counter contract
  // let txResult = await client.newTransaction(
  //   stakeContractAccount.id(),
  //   txRequest
  // );

  // // Submitting the transaction result to the node
  // await client.submitTransaction(txResult);

  // // Sync state
  // await client.syncState();

  // // Logging the count of counter contract
  // let counter = await client.getAccount(stakeContractAccount.id());

  // // Here we get the first Word from storage of the counter contract
  // // A word is comprised of 4 Felts, 2**64 - 2**32 + 1
  // let count = counter?.storage().getItem(1);

  // // Converting the Word represented as a hex to a single integer value
  // const value = Number(
  //   BigInt("0x" + count!.toHex().slice(-16).match(/../g)!.reverse().join(""))
  // );

  // console.log("Count: ", value);
}