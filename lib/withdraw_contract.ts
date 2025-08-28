import { getUserDetails } from "./db";

export async function withdraw_in_contract(publicKey: string, amount: number): Promise<void> {
  console.log("withdrawing for user...", publicKey);

  if (typeof window === "undefined") {
    console.warn("webClient() can only run in the browser");
    return;
  }

  // dynamic import → only in the browser, so WASM is loaded client‑side
  const {
    AccountId,
    AssemblerUtils,
    TransactionKernel,
    TransactionRequestBuilder,
    TransactionScript,
    WebClient,
  } = await import("@demox-labs/miden-sdk");

  const nodeEndpoint = "https://rpc.testnet.miden.io:443";
  const client = await WebClient.createClient(nodeEndpoint);
  //   console.log("Current block number: ", (await client.syncState()).blockNum());

  // Counter contract code in Miden Assembly
  const counterContractCode = `
    use.miden::account
use.std::sys

# Inputs: [KEY, VALUE]
# Outputs: []
export.stake
    # The storage map is in storage slot 1
    push.1
    # => [index, KEY, VALUE]

    # Setting the key value pair in the map
    exec.account::set_map_item
    # => [OLD_MAP_ROOT, OLD_MAP_VALUE]

    dropw dropw dropw dropw
    # => []
end

# Inputs: [KEY]
# Outputs: [VALUE]
export.get_stake_value
    # The storage map is in storage slot 1
    push.1
    # => [index]

    exec.account::get_map_item
    # => [VALUE]
end

# Inputs: []
# Outputs: [CURRENT_ROOT]
export.get_current_map_root
    # Getting the current root from slot 1
    push.1 exec.account::get_item
    # => [CURRENT_ROOT]

    exec.sys::truncate_stack
    # => [CURRENT_ROOT]
end

    `;

  // Building the counter contract
  const assembler = TransactionKernel.assembler();

  // Counter contract account id on testnet
  const counterContractId = AccountId.fromBech32(
    "mtst1qqsrz88as8u6sqzqe8g6eweh6v4a2790"
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
  console.log(data.amount_staked);
  
  const account_id = data ? data.id : 0;
  const updated_amount = data ? Number(data.amount_staked) - amount : amount;
  console.log("Account ID:", account_id, "Updated Amount:", updated_amount, "for public key:", publicKey);
  
  // Building the transaction script which will call the counter contract
  const txScriptCode = `
   use.miden_by_example::mapping_example_contract
use.std::sys
use.miden::account
use.miden::account_id
use.miden::note

const.ERR_P2ID_WRONG_NUMBER_OF_INPUTS="P2ID note expects exactly 2 note inputs"

const.ERR_P2ID_TARGET_ACCT_MISMATCH="P2ID's target account address and transaction address do not match"

begin
    push.0.0.0.${account_id}
    push.0.0.0.${updated_amount}
    # => [KEY, VALUE]


    # account id (key ) => stake(value), rewards (account id = > calucate rewardsvalue)

    call.mapping_example_contract::stake
    # => []

    push.0.0.0.0
    # => [KEY]

    call.mapping_example_contract::get_stake_value
    # => [VALUE]

    dropw
    # => []

    call.mapping_example_contract::get_current_map_root
    # => [CURRENT_ROOT]

    exec.sys::truncate_stack


end

  `;

  // Creating the library to call the counter contract
  const stakeComponentLib = AssemblerUtils.createAccountComponentLibrary(
    assembler, // assembler
    "miden_by_example::mapping_example_contract", // library path to call the contract
    counterContractCode // account code of the contract
  );

  // Creating the transaction script
  const txScript = TransactionScript.compile(
    txScriptCode,
    assembler.withLibrary(stakeComponentLib)
  );

  // Creating a transaction request with the transaction script
  const txRequest = new TransactionRequestBuilder()
    .withCustomScript(txScript)
    .build();

  // Executing the transaction script against the counter contract
  const txResult = await client.newTransaction(
    stakeContractAccount.id(),
    txRequest
  );

  // Submitting the transaction result to the node
  await client.submitTransaction(txResult);

  // Sync state
  await client.syncState();

  // Logging the count of counter contract
  const counter = await client.getAccount(stakeContractAccount.id());

  // Here we get the first Word from storage of the counter contract
  // A word is comprised of 4 Felts, 2**64 - 2**32 + 1
  const count = counter?.storage().getItem(1);

  // Converting the Word represented as a hex to a single integer value
  const value = Number(
    BigInt("0x" + count!.toHex().slice(-16).match(/../g)!.reverse().join(""))
  );

  console.log("Count: ", value);
}
