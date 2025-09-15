"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import {
  useWallet,
  MidenWalletAdapter,
  SendTransaction,
} from "@demox-labs/miden-wallet-adapter";
import { checkReturnableBorrows } from "@/lib/db";
import { return_borrow } from "@/lib/return_borrowed";


export default function ReturnBorrowPage() {
  const [ethAmount, setEthAmount] = useState("")
  const { wallet, accountId } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const faucetPublicKey = process.env.NEXT_PUBLIC_FAUCET_PUBLIC_KEY;
  const adminPublicKey = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY;


  const handleMaxClick = () => {
    setEthAmount("32.0")
  }

  const handleReturnBorrow = async (amount: number) => {
    if (!accountId) {
      toast.error("User account not found.");
      return;
    }

    if (!wallet) {
      toast.error("Please connect the wallet first.");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Amount must be greater than 0.");
      return;
    }

    try {
      setIsLoading(true);

      const data = await checkReturnableBorrows(accountId.toString());
      if (!data.canReturn || data.totalReturnable <= 0) {
        toast.error("You have no returnable borrow amount.");
        return;
      }

      const adjustedAmount = Math.min(amount, data.totalReturnable);
      console.log("Returning", adjustedAmount, "stPFY for user:", accountId);

      const midenTransaction = new SendTransaction(
        accountId,
        adminPublicKey ?? "",
        faucetPublicKey ?? "",
        "public",
        adjustedAmount
      );

      const txId =
        (await (wallet?.adapter as MidenWalletAdapter).requestSend(midenTransaction)) || "";

      await new Promise((r) => setTimeout(r, 10_000));
      console.log("Transfer transaction sent with ID:", txId);

      await return_borrow(accountId, adjustedAmount);
      toast.success("Borrow successfully returned!");
      console.log("Borrow transaction sent");
    } catch (error) {
      console.error("Return borrow failed:", error);
      toast.error("Return failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto">
      {/* Staking Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Return Borrow</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6">
          <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">Ξ</span>
                  </div>
                  <input
                    type="number"
                    placeholder="PFY amount"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    className="border-0 text-lg font-medium bg-transparent p-0 focus:outline-none w-full"
                  />
                </div>
                <button
                  onClick={handleMaxClick}
                  className="px-3 py-1 text-sm border border-orange-200 text-orange-500 rounded hover:bg-orange-50 bg-transparent"
                >
                  MAX
                </button>
              </div>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium" onClick={() => handleReturnBorrow(Number(ethAmount))}>
                {isLoading ? <ClipLoader color="#FFFFFF" /> : "Proceed"}
              </button>
            </div>

            {/* APR Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">Total 4.3% APR</span>
                <span className="text-gray-600">+ Mellow points</span>
              </div>
              <p className="text-sm text-gray-600">New way to support PrivyFi decentralization.</p>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-orange-500">←</span>
                    <span className="text-orange-500">→</span>
                  </div>
                  <span className="text-sm">stPFY 0.04% SSV APR</span>
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <span className="text-sm">Mellow points</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                The financial advice information on this site is for informational purposes only and does not constitute
                financial advice. You are solely responsible for any third-party use.
              </p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You will receive</span>
                <span>0.0 stPFY</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Exchange rate</span>
                <span>1 USDT = 1 stPFY</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max transaction cost</span>
                <span>$1.95</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-600">Reward fee</span>
                  <Info className="h-3 w-3 text-gray-400" />
                </div>
                <span>10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
