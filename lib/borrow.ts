import { borrowTokens } from "./db";
import { mint } from "./mint";

export async function borrow(USER_ID: string, amount: number): Promise<boolean> {
  console.log("Borrowing", amount, " for user:", USER_ID);
  
  await mint(USER_ID, Math.floor(amount/2));

  console.log("Asset transfer chain completed ✅");

  console.log("borrow transfer completed ✅");

  await borrowTokens(USER_ID, Math.floor(amount/2));

  console.log("User's borrow amount updated in the database.");
  return true;
}
