"use client";

import {
  Flame,
  ArrowDownUp,
  Gift,
  PoundSterling,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { WalletMultiButton } from "@demox-labs/miden-wallet-adapter";
import { useState } from "react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isConnected: boolean;
  onConnect: () => void;
}

export default function Navigation({
  activeTab,
  onTabChange,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const tabs = [
    { id: "faucet", label: "FAUCET", icon: PoundSterling },
    { id: "stake", label: "STAKE", icon: Flame },
    // { id: "wrap", label: "WRAP", icon: Package },
    { id: "withdrawals", label: "WITHDRAWALS", icon: ArrowDownUp },
    {
      id: "lend",
      label: "LEND",
      icon: ArrowDownUp,
      children: [
        { id: "lend", label: "LEND" },
        { id: "withdraw_lend", label: "WITHDRAW LEND" },
      ],
    },
    {
      id: "borrow",
      label: "BORROW",
      icon: ArrowDownUp,
      children: [
        { id: "borrow", label: "BORROW" },
        { id: "return_borrow", label: "RETURN BORROW" },
      ],
    },
    { id: "rewards", label: "REWARDS", icon: Gift },
  ];

  const renderTab = (tab: any) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    if (tab.children) {
      return (
        <div key={tab.id} className="relative">
          <div
            className={`flex items-center space-x-1 cursor-pointer transition-colors ${isActive ? "text-orange-500" : "text-gray-600 hover:text-gray-800"
              }`}
            onClick={() => toggleDropdown(tab.id)}
          >
            <Icon className="h-4 w-4" />
            <span className={isActive ? "font-medium" : ""}>{tab.label}</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          {openDropdown === tab.id && (
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md border border-gray-100 z-20">
              {tab.children.map((child: any) => (
                <div
                  key={child.id}
                  onClick={() => {
                    onTabChange(child.id);
                    setOpenDropdown(null);
                    setMobileMenuOpen(false); // close menu on mobile
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  {child.label}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={tab.id}
        className={`flex items-center space-x-1 cursor-pointer transition-colors ${isActive ? "text-orange-500" : "text-gray-600 hover:text-gray-800"
          }`}
        onClick={() => {
          onTabChange(tab.id);
          setMobileMenuOpen(false); // close menu on mobile
        }}
      >
        <Icon className="h-4 w-4" />
        <span className={isActive ? "font-medium" : ""}>{tab.label}</span>
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-8">
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-slate-800">Privy</span>
              <span className="text-2xl font-bold text-cyan-500">Fi</span>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center space-x-6">
              {tabs.map(renderTab)}
            </nav>
          </div>

          {/* Mobile menu toggle */}


          {/* Wallet Button */}
          <WalletMultiButton />
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-4">
            {tabs.map(renderTab)}
          </div>
        )}
      </div>
    </header>
  );
}
