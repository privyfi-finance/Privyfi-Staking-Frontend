"use client"

import { useState } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import StakePage from "@/components/pages/stake-page"
import WithdrawalsPage from "@/components/pages/withdrawals-page"
import WrapPage from "@/components/pages/wrap-page"
import RewardsPage from "@/components/pages/rewards-page"
import LendPage from "@/components/pages/lend-page"
import BorrowPage from "@/components/pages/borrow-page"
import FaucetPage from "@/components/pages/faucet-page"
import WithdawLendPage from "@/components/pages/lend-withdraw"
import ReturnBorrowPage from "@/components/pages/return-borrow"

export default function StakingApp() {
  const [activeTab, setActiveTab] = useState("faucet")
  const [isConnected, setIsConnected] = useState(false)

  const handleConnect = () => {
    setIsConnected(true)
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case "faucet":
        return <FaucetPage />
      case "stake":
        return <StakePage />
      case "withdrawals":
        return <WithdrawalsPage />
      case "wrap":
        return <WrapPage />
      case "lend":
        return <LendPage />
      case "withdraw_lend":
        return <WithdawLendPage />
      case "return_borrow":
        return <ReturnBorrowPage />
      case "borrow":
        return <BorrowPage />
      case "rewards":
        return <RewardsPage />
      default:
        return <FaucetPage />
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
