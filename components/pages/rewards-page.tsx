"use client"

import { useEffect, useState } from "react"
// import { Info } from "lucide-react"
import { getUserHistory, getUserStats } from "@/lib/db"
import {
  useWallet
} from "@demox-labs/miden-wallet-adapter";
import dayjs from "dayjs"; 


export default function RewardsPage() {
  const { accountId, wallet } = useWallet();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (accountId) fetchData(accountId);
  }, [accountId]);

  async function fetchData(address: string) {
    try {
      const userHistory = await getUserHistory(address);
      console.log(userHistory,"userHistory")
      setHistory(userHistory);
      const userStats = await getUserStats(address);
      console.log(userStats);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  }
  console.log(history,"history")
  return (
    <div className="max-w-4xl mx-auto">
      {/* Rewards Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reward History</h1>
        <p className="text-gray-600">Track your Ethereum staking rewards with PrivyFi</p>
      </div>

      {/* Main Rewards Card 
      <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-lg shadow-lg mb-8 overflow-hidden">
        <div className="p-6">
          {/* Address Input
          <div className="mb-6">
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-4 rounded-lg bg-pink-100 border-0 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Stats Grid 
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
      </div> */}

      {/* Reward History Section */}
       {!wallet ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">
                Connect your wallet or enter your Ethereum address to see the stats.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">Action</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length > 0 ? (
                  history.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{item.action}</td>
                      <td className="px-4 py-3 text-gray-700">{item.amount}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {dayjs(item.createdAt).format("YYYY-MM-DD HH:mm")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                      No reward history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
  )
}
