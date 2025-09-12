// Lightweight helpers to create a web client and fetch/import accounts
// All SDK imports happen inside functions to avoid server-side WASM issues
import type { WebClient as SDKWebClient, Account } from "@demox-labs/miden-sdk";

export async function createWebClient(rpcUrl?: string): Promise<SDKWebClient> {
  const { WebClient } = await import("@demox-labs/miden-sdk");
  const url = rpcUrl || process.env.NEXT_PUBLIC_MIDEN_RPC_URL || "https://rpc.testnet.miden.io";
  const client = await WebClient.createClient(url);
  await client.syncState();
  return client;
}

export async function getOrImportAccount(client: SDKWebClient, id: string, format: "hex" | "bech32" = "hex"): Promise<Account> {
  const { AccountId } = await import("@demox-labs/miden-sdk");
  const accId = format === "hex" ? AccountId.fromHex(id) : AccountId.fromBech32(id);
  let acct = await client.getAccount(accId);
  if (!acct) {
    await client.importAccountById(accId);
    await client.syncState();
    acct = await client.getAccount(accId);
  }
  if (!acct) throw new Error(`Account not found after import: ${id}`);
  return acct;
}
