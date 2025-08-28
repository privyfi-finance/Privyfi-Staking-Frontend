import { calculateClaimableReward, updateUserAfterClaim } from "./db";
import { mint } from "./mint";

export async function claim(USER_ID: string): Promise<boolean> {
  console.log("Claiming rewards for user:", USER_ID);
  
  const amount = await calculateClaimableReward(USER_ID);
  console.log(amount,"claimAmount")
  console.log(`Claimable reward amount: ${amount}`);

  if (amount <= 0) {
    console.error("No claimable reward or already claimed.");
    return false;
  }
  
  await mint(USER_ID, Math.floor(amount ));

  console.log("Asset transfer chain completed ✅");

  await updateUserAfterClaim(USER_ID);

  console.log("User's claim amount updated in the database.");
  return true;
}
