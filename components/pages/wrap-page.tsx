"use client"

import { useState } from "react"
import StatisticsSection from "../statistics-section"
import FAQSection from "../faq-section"
import { mint } from "@/lib/mint"
import { borrow } from "@/lib/borrow"
import { lend } from "@/lib/lend"
import { return_borrow } from "@/lib/return_borrowed"
import { withdraw_lend } from "@/lib/withdraw_lend"

interface WrapPageProps {
  isConnected: boolean
  onConnect: () => void
}

export default function WrapPage({ isConnected, onConnect }: WrapPageProps) {
  const [stethAmount, setStethAmount] = useState("")
  const [wrapTab, setWrapTab] = useState("wrap")

  const handleMaxClick = () => {
    setStethAmount("32.0")
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Wrap Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wrap & Unwrap</h1>
        <p className="text-gray-600">Stable-balance stETH wrapper for DeFi</p>
      </div>

      {/* Wrap/Unwrap Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-8 max-w-xs mx-auto">
        <button
          onClick={() => setWrapTab("wrap")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            wrapTab === "wrap" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Wrap
        </button>
        <button
          onClick={() => setWrapTab("unwrap")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            wrapTab === "unwrap" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
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
                    placeholder={wrapTab === "wrap" ? "stETH amount" : "wstETH amount"}
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
                  onClick={() => mint()}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
                >
                  Mint
                </button>
                <button
                  onClick={() => borrow(Number(stethAmount))}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
                >
                  Borrow
                </button>
                <button
                  onClick={() => lend(Number(stethAmount))}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
                >
                  Lend
                </button>
                <button
                  onClick={() => return_borrow(Number(stethAmount))}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
                >
                 Return Borrow
                </button>
                <button
                  onClick={() => withdraw_lend(Number(stethAmount))}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
                >
                 Withdraw Lend
                </button>
              {!isConnected ? (
                <button
                  onClick={onConnect}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
                >
                  Connect wallet
                </button>
              ) : (
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium">
                  {wrapTab === "wrap" ? "Wrap" : "Unwrap"}
                </button>
              )}
            </div>

            {/* Transaction Details */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You will receive</span>
                <span>{wrapTab === "wrap" ? "0.0 wstETH" : "0.0 stETH"}</span>
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
                <span>{wrapTab === "wrap" ? "1 stETH = 0.8262 wstETH" : "1 wstETH = 1.2103 stETH"}</span>
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
  )
}
