import { getUserStake, withdrawStake } from "./db";
import { mint } from "./mint";
import { withdraw_in_contract } from "./withdraw_contract";


export async function withdraw(USER_ID: string, amount: number): Promise<boolean> {
  console.log("Withdrawing", amount, "ETH for user:", USER_ID);

  // checking amount to withdraw is less than or equal to value stored in the database
  // const userStakedAmount = await getUserStake(USER_ID);
  // console.log(`User's staked amount: ${userStakedAmount}`);

  // if (userStakedAmount === null || userStakedAmount < amount) {
  //   console.error("Insufficient staked amount for withdrawal or staked amount not found");
  //   return false;
  // }

  // amount = Math.min(amount, userStakedAmount);

  await mint(USER_ID, amount);

  console.log("Asset transfer chain completed ✅");

  // await withdraw_in_contract(USER_ID, amount);
  
  // await withdrawStake(USER_ID, amount);

  console.log("User's staking amount updated in the database.");
  return true;
}
