"use client";

import "@rainbow-me/rainbowkit/styles.css";

import * as React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet, hoodi } from "wagmi/chains";

const config = getDefaultConfig({
  appName: "Heirlink DApp",
  projectId:
    process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [hoodi, mainnet],
  transports: {
    [hoodi.id]: http("https://0xrpc.io/hoodi"),
    [mainnet.id]: http("https://eth-mainnet.public.blastapi.io"),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" showRecentTransactions={false}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
