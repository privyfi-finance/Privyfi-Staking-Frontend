"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import StatisticsSection from "../statistics-section"
import FAQSection from "../faq-section"
import { withdraw } from "@/lib/withdraw"
import { claim } from "@/lib/claim"

interface WithdrawalsPageProps {
  isConnected: boolean
  onConnect: () => void
}

export default function WithdrawalsPage({ isConnected, onConnect }: WithdrawalsPageProps) {
  const [stethAmount, setStethAmount] = useState("")
  const [withdrawalTab, setWithdrawalTab] = useState("request")
  const [withdrawalMethod, setWithdrawalMethod] = useState("privyfi")

  const handleMaxClick = () => {
    setStethAmount("32.0")
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Withdrawals Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawals</h1>
        <p className="text-gray-600">Request stETH/wstETH withdrawal and claim ETH</p>
      </div>

      {/* Request/Claim Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-8 max-w-xs mx-auto">
        <button
          onClick={() => setWithdrawalTab("request")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            withdrawalTab === "request" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Request
        </button>
        <button
          onClick={() => setWithdrawalTab("claim")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            withdrawalTab === "claim" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Claim
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
                    placeholder="stETH amount"
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

              {/* Withdrawal Method Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setWithdrawalMethod("privyfi")}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    withdrawalMethod === "privyfi"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm mb-2">Use PrivyFi</div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Steps: 1 - 1</div>
                    <div>Waiting time: ~15 days</div>
                  </div>
                </div>
                <div
                  onClick={() => setWithdrawalMethod("dexs")}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    withdrawalMethod === "dexs"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-sm">Use DEXs</span>
                    <div className="flex space-x-1">
                      <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                      <div className="w-4 h-4 bg-black rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Best Rate</div>
                    <div>Waiting time: ~1-5 minutes</div>
                  </div>
                </div>
              </div>

              {/* PrivyFi Display */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">💧</span>
                  </div>
                  <span className="font-medium">PrivyFi</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-medium">0.0 ETH</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {!isConnected ? (
                <button
                  onClick={onConnect}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
                >
                  Connect wallet
                </button>
              ) : (
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium" onClick={() => claim()}>
                  Request withdrawal
                </button>
              )}
            </div>

            {/* Transaction Details */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-600">Max unlock cost</span>
                  <Info className="h-3 w-3 text-gray-400" />
                </div>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max transaction cost</span>
                <span>$0.86</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Allowance</span>
                <span>-</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Exchange rate</span>
                <span>1 stETH = 1 ETH</span>
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
