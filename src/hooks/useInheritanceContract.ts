"use client";

import * as React from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { FACTORY_ADDRESS } from "@/lib/contracts";
import factoryAbi from "@/contracts/DMSFactory.abi.json";
import vaultAbi from "@/contracts/DeadMansSwitchVault.abi.json";

const factoryAbiTyped = factoryAbi as readonly unknown[];

/** Токены для контракта: все переданные адреса, включая ETH placeholder (0xEee...). */
function tokensForContract(tokens: string[]): `0x${string}`[] {
  return tokens.filter((t) => t.trim()).map((t) => t.trim() as `0x${string}`);
}

/** root должен быть 0x + 64 hex (32 bytes). */
function rootToBytes32(root: string): `0x${string}` {
  const h = root.startsWith("0x") ? root.slice(2) : root;
  if (h.length !== 64) throw new Error("Root must be 32 bytes (64 hex chars)");
  return ("0x" + h) as `0x${string}`;
}

export function useInheritanceContract() {
  const { address: userAddress } = useAccount();

  const { data: vaultAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbiTyped,
    functionName: "vaults",
    args: userAddress ? [userAddress] : undefined,
  });

  const { writeContractAsync: writeFactory } = useWriteContract();
  const { writeContractAsync: writeVault } = useWriteContract();

  const sendToContract = React.useCallback(
    async (root: string, tokens: string[], periodDays: number = 365) => {
      if (!userAddress) throw new Error("Подключите кошелёк");
      const tokenList = tokensForContract(tokens);
      const rootBytes = rootToBytes32(root);

      const zero = "0x0000000000000000000000000000000000000000";
      const vault = vaultAddress as `0x${string}` | undefined;
      const hasVault =
        vault && (vault as string).toLowerCase() !== zero.toLowerCase();

      if (hasVault && vault) {
        await writeVault({
          address: vault,
          abi: vaultAbi as readonly unknown[],
          functionName: "updateWill",
          args: [tokenList, rootBytes],
        });
      } else {
        await writeFactory({
          address: FACTORY_ADDRESS,
          abi: factoryAbiTyped,
          functionName: "deployVault",
          args: [BigInt(periodDays), userAddress, tokenList, rootBytes],
        });
      }
    },
    [userAddress, vaultAddress, writeFactory, writeVault],
  );

  /** Обновить существующее хранилище (updateWill). */
  const updateVault = React.useCallback(
    async (root: string, tokens: string[]) => {
      if (!userAddress) throw new Error("Подключите кошелёк");
      const zero = "0x0000000000000000000000000000000000000000";
      const vault = vaultAddress as `0x${string}` | undefined;
      if (!vault || (vault as string).toLowerCase() === zero.toLowerCase())
        throw new Error("Нет хранилища для обновления");
      const tokenList = tokensForContract(tokens);
      const rootBytes = rootToBytes32(root);
      await writeVault({
        address: vault,
        abi: vaultAbi as readonly unknown[],
        functionName: "updateWill",
        args: [tokenList, rootBytes],
      });
    },
    [userAddress, vaultAddress, writeVault],
  );

  /** Создать новое хранилище через фабрику (deployVault), даже если уже есть. */
  const deployNewVault = React.useCallback(
    async (root: string, tokens: string[], periodDays: number = 365) => {
      if (!userAddress) throw new Error("Подключите кошелёк");
      const tokenList = tokensForContract(tokens);
      const rootBytes = rootToBytes32(root);
      await writeFactory({
        address: FACTORY_ADDRESS,
        abi: factoryAbiTyped,
        functionName: "deployVault",
        args: [BigInt(periodDays), userAddress, tokenList, rootBytes],
      });
    },
    [userAddress, writeFactory],
  );

  return {
    sendToContract,
    updateVault,
    deployNewVault,
    vaultAddress: vaultAddress as `0x${string}` | undefined,
    userAddress,
  };
}
