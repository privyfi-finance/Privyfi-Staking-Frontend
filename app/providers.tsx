"use client";

import React, { ReactNode, useMemo } from "react";
import { WalletProvider } from "@demox-labs/miden-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/miden-wallet-adapter-reactui";
import { MidenWalletAdapter } from "@demox-labs/miden-wallet-adapter-miden";
// try importing the shipped CSS (if present)
import "@demox-labs/miden-wallet-adapter-reactui/dist/styles.css";

interface Props { children: ReactNode; }

export default function Providers({ children }: Props) {
  // memoize adapters so they aren't recreated every render
  const wallets = useMemo(
    () => [ new MidenWalletAdapter({ appName: "Your Miden App" }) ],
    []
  );

  return (
    <WalletProvider wallets={wallets}>
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletProvider>
  );
}
