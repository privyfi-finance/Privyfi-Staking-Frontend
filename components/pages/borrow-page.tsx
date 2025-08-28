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
import { canBurrow } from "@/lib/db";
import { borrow } from "@/lib/borrow";

export default function BorrowPage() {
  const [ethAmount, setEthAmount] = useState("")
  const { wallet, accountId } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const adminPublicKey =
    process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY

  const faucetPublicKey2 =
    process.env.NEXT_PUBLIC_FAUCET_PUBLIC_KEY2


  const handleMaxClick = () => {
    setEthAmount("32.0")
  }

  const handleBorrow = async (amount: number) => {
    if (!wallet) {
      toast.error("Please connect the wallet first");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Amount is required");
      return;
    }

    try {
      setIsLoading(true);

      const data = await canBurrow(accountId?.toString() || "");
      if (!data.canBurrow) {
        toast.error("You have unreturned borrow(s). Please return them before borrowing again.");
        return;
      }

      const midenTransaction = new SendTransaction(
        accountId ?? "",
        adminPublicKey ?? "",
        faucetPublicKey2 ?? "",
        "public",
        amount
      );
      toast.info(`Borrow ${amount} token requested`);
      const txId =
        (await (wallet?.adapter as MidenWalletAdapter).requestSend(
          midenTransaction
        )) || "";

      await new Promise((r) => setTimeout(r, 10_000));
      console.log("Transfer transaction sent with ID:", txId);

      const res = await borrow(accountId?.toString() || "", Number(amount));
      if (res === true) {
        toast.success("Borrow successful!. Please claim in Miden wallet");
        console.log("Borrow transaction sent");
        setEthAmount("");
      } else {
        toast.error("Borrow failed.");
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Borrowing failed:", error);
      toast.error("Borrowing failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Staking Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Borrow Ether</h1>
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
                    placeholder="ETH amount"
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
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium" onClick={() => handleBorrow(Number(ethAmount))}>
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
                  <span className="text-sm">stETH 0.04% SSV APR</span>
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
                <span>0.0 stETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Exchange rate</span>
                <span>1 ETH = 1 stETH</span>
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
