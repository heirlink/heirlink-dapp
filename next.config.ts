import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve ??= {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@react-native-async-storage/async-storage": false,
        "@base-org/account": false,
        "@coinbase/wallet-sdk": false,
        "@gemini-wallet/core": false,
        "porto/internal": false,
      };
    }
    return config;
  },
};

export default nextConfig;
