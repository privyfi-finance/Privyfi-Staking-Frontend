"use client"

import { Flame, Package, ArrowDownUp, Gift } from "lucide-react"
import { WalletMultiButton, useWallet} from "@demox-labs/miden-wallet-adapter";

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isConnected: boolean
  onConnect: () => void
}

export default function Navigation({ activeTab, onTabChange, isConnected, onConnect }: NavigationProps) {
  const tabs = [
    { id: "stake", label: "STAKE", icon: Flame },
    { id: "wrap", label: "WRAP", icon: Package },
    { id: "withdrawals", label: "WITHDRAWALS", icon: ArrowDownUp },
    { id: "lend", label: "LEND", icon: ArrowDownUp },
    { id: "borrow", label: "BORROW", icon: ArrowDownUp },
    { id: "rewards", label: "REWARDS", icon: Gift },
  ]
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-slate-800">Privy</span>
              <span className="text-2xl font-bold text-cyan-500">Fi</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <div
                    key={tab.id}
                    className={`flex items-center space-x-1 cursor-pointer transition-colors ${
                      isActive ? "text-orange-500" : "text-gray-600 hover:text-gray-800"
                    }`}
                    onClick={() => onTabChange(tab.id)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className={isActive ? "font-medium" : ""}>{tab.label}</span>
                  </div>
                )
              })}
            </nav>
          </div>
         <WalletMultiButton />
        </div>
      </div>
    </header>
  )
}
