"use client";

import { useState } from "react";
import StatisticsSection from "../statistics-section";
import FAQSection from "../faq-section";
import { mint } from "@/lib/mint";
import { borrow } from "@/lib/borrow";
import { return_borrow } from "@/lib/return_borrowed";
import { withdraw_lend } from "@/lib/withdraw_lend";
import {
  useWallet,
  MidenWalletAdapter,
  SendTransaction,
} from "@demox-labs/miden-wallet-adapter";
import { canBurrow, canWithdrawlend, checkReturnableBorrows, lendTokens } from "@/lib/db";


export default function WrapPage() {
  const [stethAmount, setStethAmount] = useState("");
  const [wrapTab, setWrapTab] = useState("wrap");
  const { accountId, wallet } = useWallet();
  const faucetPublicKey =
    process.env.NEXT_PUBLIC_FAUCET_PUBLIC_KEY

  const adminPublicKey =
    process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY

  const faucetPublicKey2 =
    process.env.NEXT_PUBLIC_FAUCET_PUBLIC_KEY2

  const handleMaxClick = () => {
    setStethAmount("32.0");
  };

  const handleMint = async () => {
    console.log("Minting", "stPFY for user:", accountId);
    await mint(accountId?.toString() || "");

    console.log("Mint transaction sent");
  };

  const handleBorrow = async (amount: number) => {
    const data = await canBurrow(accountId?.toString() || "");
    if (!data.canBurrow) {
      console.error(
        "You have unreturned borrow(s). Please return them before borrowing again."
      );
      return;
    }
    const midenTransaction = new SendTransaction(
      accountId ?? "",
      adminPublicKey ?? "",
      faucetPublicKey2 ?? "",
      "public",
      amount
    );

    const txId =
      (await (wallet?.adapter as MidenWalletAdapter).requestSend(
        midenTransaction
      )) || "";

    await new Promise((r) => setTimeout(r, 10_000));
    console.log("Transfer transaction sent with ID:", txId);

    borrow(accountId?.toString() || "", Number(stethAmount));
    console.log("Borrow transaction sent");
  };

  const handleReturnBorrow = async (amount: number) => {
    const data = await checkReturnableBorrows(accountId?.toString() || "");
    if (!data.canReturn) {
      console.error(
        "You have unreturned borrow(s). Please return them before borrowing again."
      );
      return;
    }
    amount = Math.min(amount, data.totalReturnable);
    console.log("Returning", amount, "stPFY for user:", accountId);

    const midenTransaction = new SendTransaction(
      accountId ?? "",
      adminPublicKey ?? "",
      faucetPublicKey ?? "",
      "public",
      amount
    );

    const txId =
      (await (wallet?.adapter as MidenWalletAdapter).requestSend(
        midenTransaction
      )) || "";

    await new Promise((r) => setTimeout(r, 10_000));
    console.log("Transfer transaction sent with ID:", txId);

    await return_borrow(accountId?.toString() || "", amount);
    console.log("Borrow transaction sent");
  };

  const handleLend = async (amount: number) => {
    console.log("Lending", amount, "stPFY for user:", accountId);
    const midenTransaction = new SendTransaction(
      accountId ?? "",
      adminPublicKey ?? "",
      faucetPublicKey ?? "",
      "public",
      amount
    );

    const txId =
      (await (wallet?.adapter as MidenWalletAdapter).requestSend(
        midenTransaction
      )) || "";

    await new Promise((r) => setTimeout(r, 10_000));
    console.log("Transfer transaction sent with ID:", txId);

    await lendTokens(accountId?.toString() || "", amount);

    console.log("User's lending amount updated in the database.");
  };

  const handleWithdrawLend = async (amount: number) => {
    const data = await canWithdrawlend(accountId?.toString() || "", amount);
    if (!data.canWithdraw) {
      console.error(
        "You don't have any lended amount."
      );
      return;
    }
    const temp = await withdraw_lend(accountId?.toString() || "", amount);
    console.log(temp, "temppppppppppp");
    console.log("Lending amount withdrawn for user:", accountId);
  }
  return (
    <div className="max-w-2xl mx-auto">
      {/* Wrap Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wrap & Unwrap</h1>
        <p className="text-gray-600">Stable-balance stPFY wrapper for DeFi</p>
      </div>

      {/* Wrap/Unwrap Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-8 max-w-xs mx-auto">
        <button
          onClick={() => setWrapTab("wrap")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${wrapTab === "wrap"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
            }`}
        >
          Wrap
        </button>
        <button
          onClick={() => setWrapTab("unwrap")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${wrapTab === "unwrap"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
            }`}
        >
          Unwrap
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6">
          <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">🔥</span>
                  </div>
                  <input
                    type="number"
                    placeholder={
                      wrapTab === "wrap" ? "stPFY amount" : "wstETH amount"
                    }
                    value={stethAmount}
                    onChange={(e) => setStethAmount(e.target.value)}
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

              <button
                onClick={() => handleMint()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
              >
                Mint
              </button>
              <button
                onClick={() => handleBorrow(Number(stethAmount))}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
              >
                Borrow
              </button>
              <button
                onClick={() => handleLend(Number(stethAmount))}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
              >
                Lend
              </button>
              <button
                onClick={() => handleReturnBorrow(Number(stethAmount))}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
              >
                Return Borrow
              </button>
              <button
                onClick={() => handleWithdrawLend(Number(stethAmount))}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
              >
                Withdraw Lend
              </button>
             
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium">
                  {wrapTab === "wrap" ? "Wrap" : "Unwrap"}
                </button>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You will receive</span>
                <span>{wrapTab === "wrap" ? "0.0 wstETH" : "0.0 stPFY"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max unlock cost</span>
                <span>$0.15</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max transaction cost</span>
                <span>$0.32</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Exchange rate</span>
                <span>
                  {wrapTab === "wrap"
                    ? "1 stPFY = 0.8262 wstETH"
                    : "1 wstETH = 1.2103 stPFY"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Allowance</span>
                <span>-</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatisticsSection />
      <FAQSection />
    </div>
  );
}
