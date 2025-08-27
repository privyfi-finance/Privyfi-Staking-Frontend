import { withdrawlend } from "./db";
import { mint } from "./mint";

export async function withdraw_lend(USER_ID: string, amount: number): Promise<boolean> {
  
  await mint(USER_ID, amount+1)

  console.log("Asset transfer chain completed ✅");

  await withdrawlend(USER_ID, amount);

  console.log("User's lending amount updated in the database.");
  return true;
}
