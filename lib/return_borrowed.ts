import { returnBorrowed } from "./db";

// const P2ID_NOTE_SCRIPT = `
// use.miden::account
// use.miden::account_id
// use.miden::note

// # ERRORS
// # =================================================================================================

// const.ERR_P2ID_WRONG_NUMBER_OF_INPUTS="P2ID note expects exactly 2 note inputs"

// const.ERR_P2ID_TARGET_ACCT_MISMATCH="P2ID's target account address and transaction address do not match"

// #! Pay-to-ID script: adds all assets from the note to the account, assuming ID of the account
// #! matches target account ID specified by the note inputs.
// #!
// #! Requires that the account exposes:
// #! - miden::contracts::wallets::basic::receive_asset procedure.
// #!
// #! Inputs:  []
// #! Outputs: []
// #!
// #! Note inputs are assumed to be as follows:
// #! - target_account_id is the ID of the account for which the note is intended.
// #!
// #! Panics if:
// #! - Account does not expose miden::contracts::wallets::basic::receive_asset procedure.
// #! - Account ID of executing account is not equal to the Account ID specified via note inputs.
// #! - The same non-fungible asset already exists in the account.
// #! - Adding a fungible asset would result in amount overflow, i.e., the total amount would be
// #!   greater than 2^63.
// begin
//     # store the note inputs to memory starting at address 0
//     padw push.0 exec.note::get_inputs
//     # => [num_inputs, inputs_ptr, EMPTY_WORD]

//     # make sure the number of inputs is 2
//     eq.2 assert.err=ERR_P2ID_WRONG_NUMBER_OF_INPUTS
//     # => [inputs_ptr, EMPTY_WORD]

//     # read the target account ID from the note inputs
//     mem_loadw drop drop
//     # => [target_account_id_prefix, target_account_id_suffix]

//     exec.account::get_id
//     # => [account_id_prefix, account_id_suffix, target_account_id_prefix, target_account_id_suffix, ...]

//     # ensure account_id = target_account_id, fails otherwise
//     exec.account_id::is_equal assert.err=ERR_P2ID_TARGET_ACCT_MISMATCH
//     # => []

//     exec.note::add_note_assets_to_account
//     # => []
// end
// `;

export async function return_borrow(USER_ID: string, amount: number): Promise<void> {
  // Ensure this runs only in a browser context
  if (typeof window === "undefined") return console.warn("Run in browser");

  const { AccountId, NoteType } = await import("@demox-labs/miden-sdk");
  const { createWebClient, getOrImportAccount } = await import("./midenClient");


  if (!USER_ID) throw new Error("return_borrow(): USER_ID is required (wallet not connected)");
  if (!amount || amount <= 0) throw new Error("return_borrow(): amount must be > 0");

  const client = await createWebClient(process.env.NEXT_PUBLIC_MIDEN_RPC_URL);

  const FAUCET_ID = process.env.NEXT_PUBLIC_FAUCET_ID2 || "0xf8359b8753f46a207cb1fc0b50aee6";

  console.log("Latest block:", (await client.syncState()).blockNum());

  const faucetId = AccountId.fromHex(FAUCET_ID);
  const faucet = await getOrImportAccount(client, faucetId.toString(), "hex");
  try {
    const checkId = AccountId.fromHex(faucet.id().toString());
    if (!checkId.isFaucet()) {
      throw new Error("Configured FAUCET_ID2 does not refer to a faucet account");
    }
  } catch (e) {
    console.error("FAUCET2 check failed", {
      rpcUrl: process.env.NEXT_PUBLIC_MIDEN_RPC_URL,
      faucetId: FAUCET_ID,
      resolvedId: faucet.id().toString(),
      error: e,
    });
    throw e;
  }
  console.log("Faucet ID:", faucet.id().toString());

  const returnAmount = BigInt(amount * 1000000*2);
  console.log("Returning", returnAmount, "to user:", USER_ID);
  
  const mintTxRequest = client.newMintTransactionRequest(
    AccountId.fromBech32(USER_ID),
    faucet.id(),
    NoteType.Public,
    BigInt(returnAmount),
  );
  
  const txResult = await client.newTransaction(faucet.id(), mintTxRequest);
  
  await client.submitTransaction(txResult);

  console.log("Waiting 10 seconds for transaction confirmation...");
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await client.syncState();

  console.log("Transaction confirmed. Asset transfer chain completed ✅");

  console.log("borrow transfer completed ✅");

  await returnBorrowed(USER_ID, amount);

  console.log("User's return borrow amount updated in the database.");
}
