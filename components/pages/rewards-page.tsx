"use client"

import { useEffect, useState } from "react"
import { Info } from "lucide-react"
import { getUserHistory, getUserStats } from "@/lib/db"
import {
  useWallet,
  ConsumeTransaction,
  WalletNotConnectedError,
  MidenWalletAdapter,
  SendTransaction,
} from "@demox-labs/miden-wallet-adapter";

interface RewardsPageProps {
  isConnected: boolean
  onConnect: () => void
}

export default function RewardsPage({ isConnected, onConnect }: RewardsPageProps) {
  const { accountId} = useWallet();
  const [address, setAddress] = useState("")
  useEffect(() => {
    fetchData(address)
  })
  async function fetchData(address: string) {
    
    const userHistory = await getUserHistory(accountId ?? "");
    console.log(userHistory);

    const userStats = await getUserStats(accountId ?? "");
    console.log(userStats);

  }
  return (
    <div className="max-w-4xl mx-auto">
      {/* Rewards Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reward History</h1>
        <p className="text-gray-600">Track your Ethereum staking rewards with PrivyFi</p>
      </div>

      {/* Main Rewards Card */}
      <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-lg shadow-lg mb-8 overflow-hidden">
        <div className="p-6">
          {/* Address Input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-4 rounded-lg bg-pink-100 border-0 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Stats Grid */}
          <div className="bg-white rounded-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">stETH balance</div>
                <div className="text-2xl font-bold text-gray-400">–</div>
                <div className="text-sm text-gray-400">–</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">stETH rewarded</div>
                <div className="text-2xl font-bold text-gray-400">–</div>
                <div className="text-sm text-gray-400">–</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-2">
                  <span>Average APR</span>
                  <Info className="h-3 w-3 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-400">–</div>
                <div className="text-sm text-gray-400">–</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">stETH price</div>
                <div className="text-2xl font-bold text-gray-400">–</div>
                <div className="text-sm text-gray-400">–</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reward History Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Reward history</h2>

          {/* Empty State */}
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">Connect your wallet or enter your Ethereum address to see the stats.</p>
            {!isConnected && (
              <button
                onClick={onConnect}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                Connect wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
