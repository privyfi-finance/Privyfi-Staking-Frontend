import { Info, ExternalLink } from "lucide-react"

export default function StatisticsSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">PrivyFi statistics</h2>
          <div className="flex items-center space-x-1 text-orange-500 text-sm cursor-pointer">
            <span>View on Etherscan</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">Annual percentage rate</span>
                <Info className="h-3 w-3 text-gray-400" />
              </div>
              <span className="text-sm">4.3%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total staked with PrivyFi</span>
              <span className="text-sm">9,888,031.07 ETH</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Stakers</span>
              <span className="text-sm">551,861</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">stPFY market cap</span>
              <span className="text-sm">$31,655,416,964</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
