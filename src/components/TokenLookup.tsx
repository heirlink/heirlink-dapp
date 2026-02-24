"use client";

import * as React from "react";
import { useConnection, useReadContracts } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { formatNumberWithSpaces } from "@/lib/format";

const isValidAddress = (addr: string) =>
  /^0x[a-fA-F0-9]{40}$/.test(addr.trim());

export function TokenLookup() {
  const { address: userAddress } = useConnection();
  const [tokenAddress, setTokenAddress] = React.useState("");
  const trimmed = tokenAddress.trim();
  const valid = isValidAddress(trimmed);

  const contracts = React.useMemo(() => {
    if (!valid || !trimmed) return [];
    const addr = trimmed as `0x${string}`;
    return [
      { address: addr, abi: erc20Abi, functionName: "name" as const },
      { address: addr, abi: erc20Abi, functionName: "symbol" as const },
      { address: addr, abi: erc20Abi, functionName: "decimals" as const },
      ...(userAddress
        ? [
            {
              address: addr,
              abi: erc20Abi,
              functionName: "balanceOf" as const,
              args: [userAddress] as const,
            },
          ]
        : []),
    ];
  }, [trimmed, valid, userAddress]);

  const { data, isLoading, isError, error } = useReadContracts({
    contracts,
    query: { enabled: valid && contracts.length > 0 },
  });

  const [name, symbol, decimals, balance] = React.useMemo(() => {
    if (!data || data.length < 3) return [null, null, null, null];
    const [nameRes, symbolRes, decimalsRes, balanceRes] = data;
    return [
      nameRes?.status === "success" ? (nameRes.result as string) : null,
      symbolRes?.status === "success" ? (symbolRes.result as string) : null,
      decimalsRes?.status === "success" ? Number(decimalsRes.result) : null,
      balanceRes?.status === "success" ? (balanceRes.result as bigint) : null,
    ];
  }, [data]);

  const formattedBalance = React.useMemo(() => {
    if (balance === null || decimals === null) return null;
    return formatUnits(balance, decimals);
  }, [balance, decimals]);

  return (
    <div className="rounded-2xl border border-black/5 bg-paper/40 p-5">
      <h2 className="text-lg font-semibold text-ink">Информация о токене</h2>
      <p className="mt-1 text-sm text-muted">
        Вставьте адрес ERC-20 токена — данные появятся автоматически
      </p>

      <input
        type="text"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        placeholder="0x..."
        className="mt-4 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-gold/30"
      />

      {valid && (
        <div className="mt-4 space-y-3 rounded-xl border border-black/5 bg-white/70 p-4">
          {isLoading && <p className="text-muted">Загружаю…</p>}
          {isError && (
            <p className="text-red-600">
              Ошибка: {error?.message ?? "Не удалось загрузить данные"}
            </p>
          )}
          {!isLoading &&
            !isError &&
            (name ?? symbol ?? formattedBalance !== null) && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted">Название</span>
                  <span className="font-medium text-ink">{name ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted">Символ</span>
                  <span className="font-medium text-ink">{symbol ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted">Баланс</span>
                  <span className="font-medium text-ink">
                    {userAddress ? (
                      formattedBalance !== null ? (
                        `${formatNumberWithSpaces(formattedBalance)} ${
                          symbol ?? ""
                        }`
                      ) : (
                        "—"
                      )
                    ) : (
                      <span className="text-muted">Подключите кошелёк</span>
                    )}
                  </span>
                </div>
              </>
            )}
        </div>
      )}
    </div>
  );
}
