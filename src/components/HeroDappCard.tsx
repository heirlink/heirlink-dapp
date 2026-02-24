"use client";

import * as React from "react";
import { useConnection, useReadContract, useWriteContract } from "wagmi";

// 1) Вставь адрес деплоя твоего контракта (например, Sepolia)
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// 2) Мини-ABI: только то, что нужно фронту
const abi = [
  {
    type: "function",
    name: "greeting",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "setGreeting",
    stateMutability: "nonpayable",
    inputs: [{ name: "value", type: "string" }],
    outputs: [],
  },
] as const;

export function HeroDappCard() {
  const { isConnected } = useConnection();
  const [nextGreeting, setNextGreeting] = React.useState("Привет из фронта 👋");

  const read = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "greeting",
    // chainId можно указать, если хочешь строго sepolia:
    // chainId: 11155111,
    query: { enabled: true },
  });

  const { mutate, isPending, error } = useWriteContract();

  const onWrite = () => {
    mutate({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "setGreeting",
      args: [nextGreeting],
    });
  };

  return <></>;
}
