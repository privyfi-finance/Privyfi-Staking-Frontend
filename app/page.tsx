"use client"

import { useState } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import StakePage from "@/components/pages/stake-page"
import WithdrawalsPage from "@/components/pages/withdrawals-page"
import WrapPage from "@/components/pages/wrap-page"
import RewardsPage from "@/components/pages/rewards-page"

export default function StakingApp() {
  const [activeTab, setActiveTab] = useState("stake")
  const [isConnected, setIsConnected] = useState(false)

  const handleConnect = () => {
    setIsConnected(true)
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case "stake":
        return <StakePage isConnected={isConnected} onConnect={handleConnect} />
      case "withdrawals":
        return <WithdrawalsPage isConnected={isConnected} onConnect={handleConnect} />
      case "wrap":
        return <WrapPage />
      case "rewards":
        return <RewardsPage />
      default:
        return <StakePage isConnected={isConnected} onConnect={handleConnect} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isConnected={isConnected}
        onConnect={handleConnect}
      />

      <main className="container mx-auto px-4 py-8">{renderActivePage()}</main>

      <Footer />
    </div>
  )
}
