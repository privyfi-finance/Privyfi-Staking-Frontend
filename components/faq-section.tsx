"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function FAQSection() {
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  const faqItems = [
    {
      id: "what-is-privyfi",
      question: "What is PrivyFi?",
      answer:
        "PrivyFi is the name of a family of open-source peer-to-peer system software tools deployed and functioning on the Ethereum and Polygon blockchain networks. PrivyFi is a liquid staking solution built on Ethereum that allows users to stake their Ethereum and receive liquid staking tokens in return, validation activities of staking data to the blockchain, while the tokens can be used in other on-chain activities.",
    },
    {
      id: "how-does-privyfi-work",
      question: "How does PrivyFi work?",
      answer:
        "PrivyFi works by pooling ETH from multiple users and staking it on the Ethereum network through a decentralized network of validators.",
    },
    {
      id: "is-it-safe",
      question: "Is it safe to work with PrivyFi?",
      answer:
        "PrivyFi implements multiple security measures including smart contract audits and decentralized validation to ensure user funds are protected.",
    },
    {
      id: "how-to-get-steth",
      question: "How can I get stETH?",
      answer:
        "You can get stETH by staking your ETH through the PrivyFi platform. The stETH tokens represent your staked ETH plus accumulated rewards.",
    },
    {
      id: "how-to-use-steth",
      question: "How can I use stETH?",
      answer:
        "stETH can be used in various DeFi protocols, traded on exchanges, or held to accumulate staking rewards automatically.",
    },
    {
      id: "where-to-cover-steth",
      question: "Where can I cover my stETH?",
      answer:
        "You can use your stETH across various DeFi platforms that support liquid staking tokens for lending, borrowing, and yield farming.",
    },
    {
      id: "how-to-unstake",
      question: "How can I unstake stETH?",
      answer:
        "You can unstake your stETH through the withdrawal process, which may involve a waiting period depending on network conditions.",
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">FAQ</h2>
      {faqItems.map((item) => (
        <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4">
            <div
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
              onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
            >
              <span className="font-medium">{item.question}</span>
              {openFaq === item.id ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {openFaq === item.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
