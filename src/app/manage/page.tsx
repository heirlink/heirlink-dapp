"use client";

import * as React from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { formatUnits, parseUnits, parseEther, erc20Abi } from "viem";
import { FACTORY_ADDRESS } from "@/lib/contracts";
import { formatNumberWithSpaces } from "@/lib/format";
import { CopyIcon, CheckIcon } from "@/components/copy-icons";
import { ETH_PLACEHOLDER } from "@/lib/inheritance-utils";
import factoryAbi from "@/contracts/DMSFactory.abi.json";
import vaultAbi from "@/contracts/DeadMansSwitchVault.abi.json";

const factoryAbiTyped = factoryAbi as readonly unknown[];
const vaultAbiTyped = vaultAbi as readonly unknown[];

const MAX_TOKENS = 32;

function shortAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

type TreeFile = {
  root: string;
  tokens?: string[];
  heirs?: {
    heirId: number;
    name?: string;
    sharesBps: number[];
    leaf?: string;
    proof?: string[];
  }[];
};

export default function ManagePage() {
  const { address: userAddress } = useAccount();
  const { data: vaultAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbiTyped,
    functionName: "vaults",
    args: userAddress ? [userAddress] : undefined,
  });

  const zero = "0x0000000000000000000000000000000000000000";
  const vault =
    vaultAddress &&
    (vaultAddress as string).toLowerCase() !== zero.toLowerCase()
      ? (vaultAddress as `0x${string}`)
      : undefined;

  const tokenIndices = React.useMemo(
    () => Array.from({ length: MAX_TOKENS }, (_, i) => i),
    [],
  );

  const tokenContracts = React.useMemo(() => {
    if (!vault) return [];
    return tokenIndices.map((i) => ({
      address: vault,
      abi: vaultAbiTyped as readonly unknown[],
      functionName: "tokens" as const,
      args: [BigInt(i)] as const,
    }));
  }, [vault, tokenIndices]);

  const { data: tokenResults } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: tokenContracts as any,
    query: { enabled: tokenContracts.length > 0 },
  });

  const vaultTokens = React.useMemo(() => {
    if (!tokenResults) return [];
    const list: string[] = [];
    for (let i = 0; i < tokenResults.length; i++) {
      const r = tokenResults[i];
      if (
        r?.status === "success" &&
        r.result &&
        (r.result as string) !== "0x0000000000000000000000000000000000000000"
      ) {
        list.push(r.result as string);
      }
    }
    return list;
  }, [tokenResults]);

  const loggedTokensRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (vaultTokens.length === 0) return;
    const key = vaultTokens.join(",");
    if (loggedTokensRef.current === key) return;
    loggedTokensRef.current = key;
    console.log("Список токенов из vault:", vaultTokens);
  }, [vaultTokens]);

  const erc20Only = React.useMemo(
    () =>
      vaultTokens.filter(
        (t) => t.trim().toLowerCase() !== ETH_PLACEHOLDER.toLowerCase(),
      ),
    [vaultTokens],
  );

  const symbolContracts = React.useMemo(() => {
    return erc20Only.map((tokenAddr) => ({
      address: tokenAddr as `0x${string}`,
      abi: erc20Abi,
      functionName: "symbol" as const,
    }));
  }, [erc20Only]);

  const { data: symbolResults } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: symbolContracts as any,
    query: { enabled: symbolContracts.length > 0 },
  });

  const balanceContracts = React.useMemo(() => {
    if (!userAddress || !vault || erc20Only.length === 0) return [];
    const list: {
      address: `0x${string}`;
      abi: typeof erc20Abi;
      functionName: "balanceOf" | "decimals";
      args?: readonly [`0x${string}`];
    }[] = [];
    erc20Only.forEach((tokenAddr) => {
      const a = tokenAddr as `0x${string}`;
      list.push({
        address: a,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [userAddress],
      });
      list.push({
        address: a,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [vault],
      });
      list.push({ address: a, abi: erc20Abi, functionName: "decimals" });
    });
    return list;
  }, [userAddress, vault, erc20Only]);

  const { data: balanceResults } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: balanceContracts as any,
    query: { enabled: balanceContracts.length > 0 },
  });

  const { data: userEthBalance } = useBalance({ address: userAddress });
  const { data: vaultEthBalance } = useBalance({ address: vault });

  const tokenBalances = React.useMemo(() => {
    return vaultTokens.map((addr) => {
      const isEth = addr.trim().toLowerCase() === ETH_PLACEHOLDER.toLowerCase();
      if (isEth) {
        return {
          addr,
          symbol: "ETH",
          userBal: userEthBalance?.value ?? BigInt(0),
          vaultBal: vaultEthBalance?.value ?? BigInt(0),
          decimals: 18,
        };
      }
      const idx = erc20Only.findIndex(
        (t) => t.trim().toLowerCase() === addr.trim().toLowerCase(),
      );
      const symbol =
        symbolResults?.[idx]?.status === "success"
          ? (symbolResults[idx].result as string)
          : "—";
      if (idx < 0 || !balanceResults) {
        return {
          addr,
          symbol,
          userBal: BigInt(0),
          vaultBal: BigInt(0),
          decimals: 18,
        };
      }
      const perToken = 3;
      const base = idx * perToken;
      const userBal =
        balanceResults[base]?.status === "success"
          ? BigInt(
              (balanceResults[base] as { result: unknown }).result as string,
            )
          : BigInt(0);
      const vaultBal =
        balanceResults[base + 1]?.status === "success"
          ? BigInt(
              (balanceResults[base + 1] as { result: unknown })
                .result as string,
            )
          : BigInt(0);
      const decimals =
        balanceResults[base + 2]?.status === "success"
          ? Number((balanceResults[base + 2] as { result: unknown }).result)
          : 18;
      return { addr, symbol, userBal, vaultBal, decimals };
    });
  }, [
    balanceResults,
    symbolResults,
    vaultTokens,
    erc20Only,
    userEthBalance?.value,
    vaultEthBalance?.value,
  ]);

  const { data: merkleRoot } = useReadContract({
    address: vault,
    abi: vaultAbiTyped,
    functionName: "merkleRoot",
  });

  const { data: lastActivityAt } = useReadContract({
    address: vault,
    abi: vaultAbiTyped,
    functionName: "lastActivityAt",
  });
  const { data: periodSeconds } = useReadContract({
    address: vault,
    abi: vaultAbiTyped,
    functionName: "periodSeconds",
  });
  const { data: isExpired } = useReadContract({
    address: vault,
    abi: vaultAbiTyped,
    functionName: "isExpired",
  });
  const { data: dmsEnabled } = useReadContract({
    address: vault,
    abi: vaultAbiTyped,
    functionName: "dmsEnabled",
  });
  const { data: vaultOwner } = useReadContract({
    address: vault,
    abi: vaultAbiTyped,
    functionName: "owner",
  });

  const [newPeriodDays, setNewPeriodDays] = React.useState("");
  const [uploadedFile, setUploadedFile] = React.useState<TreeFile | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const [withdrawTokenAddr, setWithdrawTokenAddr] = React.useState("");
  const [withdrawTokenAmount, setWithdrawTokenAmount] = React.useState("");
  const [withdrawEthAmount, setWithdrawEthAmount] = React.useState("");
  const [copiedTokenAddr, setCopiedTokenAddr] = React.useState<string | null>(
    null,
  );

  const copyTokenAddress = (addr: string) => {
    void navigator.clipboard.writeText(addr).then(() => {
      setCopiedTokenAddr(addr);
      setTimeout(() => setCopiedTokenAddr(null), 1500);
    });
  };

  const { writeContractAsync: writeVault } = useWriteContract();

  const handleWithdrawToken = async () => {
    if (!vault || !userAddress) return;
    const addr = withdrawTokenAddr.trim() as `0x${string}`;
    const decimals =
      tokenBalances.find((t) => t.addr.toLowerCase() === addr.toLowerCase())
        ?.decimals ?? 18;
    const amount = parseUnits(withdrawTokenAmount || "0", decimals);
    await writeVault({
      address: vault,
      abi: vaultAbiTyped as readonly unknown[],
      functionName: "ownerWithdrawToken",
      args: [addr, amount, userAddress],
    });
    setWithdrawTokenAddr("");
    setWithdrawTokenAmount("");
  };

  const handleWithdrawEth = async () => {
    if (!vault || !userAddress) return;
    const amount = parseEther(withdrawEthAmount || "0");
    await writeVault({
      address: vault,
      abi: vaultAbiTyped as readonly unknown[],
      functionName: "ownerWithdrawEth",
      args: [amount, userAddress],
    });
    setWithdrawEthAmount("");
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadedFile(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as unknown;
        if (json && typeof json === "object" && "root" in json) {
          setUploadedFile(json as TreeFile);
        } else {
          setUploadError(
            "В файле должно быть поле root и опционально heirs, tokens",
          );
        }
      } catch {
        setUploadError("Неверный JSON");
      }
    };
    reader.readAsText(file);
  };

  const heirs = uploadedFile?.heirs ?? [];
  const tokensFromFile = uploadedFile?.tokens ?? vaultTokens;

  const fileTokenContracts = React.useMemo(() => {
    const list: {
      address: `0x${string}`;
      abi: typeof erc20Abi;
      functionName: "symbol" | "name";
    }[] = [];
    tokensFromFile.forEach((addr) => {
      if (addr.trim().toLowerCase() === ETH_PLACEHOLDER.toLowerCase()) return;
      list.push({
        address: addr.trim() as `0x${string}`,
        abi: erc20Abi,
        functionName: "symbol",
      });
      list.push({
        address: addr.trim() as `0x${string}`,
        abi: erc20Abi,
        functionName: "name",
      });
    });
    return list;
  }, [tokensFromFile]);

  const { data: fileTokenResults } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: fileTokenContracts as any,
    query: { enabled: fileTokenContracts.length > 0 },
  });

  const tokenMeta = React.useMemo(() => {
    let nonEthIdx = 0;
    return tokensFromFile.map((addr) => {
      if (addr.trim().toLowerCase() === ETH_PLACEHOLDER.toLowerCase()) {
        return { symbol: "ETH", name: "Ethereum" };
      }
      const base = nonEthIdx * 2;
      nonEthIdx++;
      const symbol =
        fileTokenResults?.[base]?.status === "success"
          ? (fileTokenResults[base].result as string)
          : "—";
      const name =
        fileTokenResults?.[base + 1]?.status === "success"
          ? (fileTokenResults[base + 1].result as string)
          : "—";
      return { symbol, name };
    });
  }, [tokensFromFile, fileTokenResults]);

  const tokenLabels = tokenMeta.map(
    (m) => `${m.symbol}${m.name && m.name !== m.symbol ? ` (${m.name})` : ""}`,
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Управлять моим наследством
        </h1>
        <p className="mt-2 text-muted">
          Ваше хранилище, токены в наследстве и таблица долей по загруженному
          файлу.
        </p>
      </header>

      {!userAddress ? (
        <div className="rounded-2xl border border-black/10 bg-paper/40 p-6 text-center text-muted">
          Подключите кошелёк, чтобы увидеть хранилище и токены.
        </div>
      ) : !vault ? (
        <div className="rounded-2xl border border-black/10 bg-paper/40 p-6 text-center text-muted">
          У вас пока нет хранилища. Сгенерируйте Merkle tree на странице
          «Наследство» и подтвердите транзакцию — хранилище будет создано.
        </div>
      ) : (
        <div className="space-y-10">
          <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
            <h2 className="text-lg font-semibold text-ink">Хранилище</h2>
            <p className="mt-1 text-sm text-muted">
              Адрес вашего vault и корень дерева на контракте.
            </p>
            <div className="mt-4 space-y-2 font-mono text-sm">
              <div>
                <span className="text-muted">Vault: </span>
                <span className="break-all text-ink">{vault}</span>
              </div>
              {merkleRoot != null && (
                <div>
                  <span className="text-muted">Merkle root: </span>
                  <span className="break-all text-ink">
                    {typeof merkleRoot === "string"
                      ? merkleRoot
                      : String(merkleRoot)}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
            <h2 className="text-lg font-semibold text-ink">
              Подтверждение активности (Dead Man&apos;s Switch)
            </h2>
            <p className="mt-1 text-sm text-muted">
              Периодически подтверждайте активность. Если период неактивности
              истечёт и DMS включён, наследники смогут получить долю.
            </p>
            <div className="mt-4 space-y-2 font-mono text-sm">
              {lastActivityAt != null && (
                <div>
                  <span className="text-muted">Последняя активность: </span>
                  <span className="text-ink">
                    {new Date(Number(lastActivityAt) * 1000).toLocaleString(
                      "ru-RU",
                    )}
                  </span>
                </div>
              )}
              {periodSeconds != null && (
                <div>
                  <span className="text-muted">Период (дней): </span>
                  <span className="text-ink">
                    {Math.round(Number(periodSeconds) / 86400)}
                  </span>
                </div>
              )}
              {lastActivityAt != null && periodSeconds != null && (
                <div>
                  <span className="text-muted">
                    Период активности истекает:{" "}
                  </span>
                  <span className="text-ink">
                    {new Date(
                      (Number(lastActivityAt) + Number(periodSeconds)) * 1000,
                    ).toLocaleString("ru-RU", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted">DMS включён: </span>
                <span className="text-ink">
                  {dmsEnabled === true
                    ? "да"
                    : dmsEnabled === false
                    ? "нет"
                    : "…"}
                </span>
              </div>
              <div>
                <span className="text-muted">Период истёк: </span>
                <span className="text-ink">
                  {isExpired === true
                    ? "да"
                    : isExpired === false
                    ? "нет"
                    : "…"}
                </span>
              </div>
              {vaultOwner != null && (
                <div>
                  <span className="text-muted">Владелец vault: </span>
                  <span className="break-all text-ink">
                    {String(vaultOwner)}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {dmsEnabled === false && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!vault) return;
                    await writeVault({
                      address: vault,
                      abi: vaultAbiTyped as readonly unknown[],
                      functionName: "enableDms",
                    });
                  }}
                  className="rounded-xl border-2 border-gold bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90"
                >
                  Включить DMS
                </button>
              )}
              {dmsEnabled === true &&
                vaultOwner != null &&
                (vaultOwner as string).toLowerCase() ===
                  userAddress?.toLowerCase() && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!vault) return;
                      await writeVault({
                        address: vault,
                        abi: vaultAbiTyped as readonly unknown[],
                        functionName: "cancelDms",
                      });
                    }}
                    className="rounded-xl border-2 border-black/20 bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-black/5"
                  >
                    Отменить DMS
                  </button>
                )}
              <button
                type="button"
                onClick={async () => {
                  if (!vault) return;
                  await writeVault({
                    address: vault,
                    abi: vaultAbiTyped as readonly unknown[],
                    functionName: "confirmActivity",
                  });
                }}
                className="rounded-xl border-2 border-gold bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90"
              >
                Подтвердить активность
              </button>
            </div>
            {vaultOwner != null &&
              (vaultOwner as string).toLowerCase() ===
                userAddress?.toLowerCase() && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/10 pt-4">
                  <label className="text-sm text-muted">
                    Изменить период (дней):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={newPeriodDays}
                    onChange={(e) => setNewPeriodDays(e.target.value)}
                    placeholder="365"
                    className="w-20 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  <button
                    type="button"
                    disabled={
                      !newPeriodDays.trim() || Number(newPeriodDays) < 1
                    }
                    onClick={async () => {
                      if (!vault || !newPeriodDays.trim()) return;
                      const days = Math.max(
                        1,
                        Math.min(3650, Number(newPeriodDays)),
                      );
                      await writeVault({
                        address: vault,
                        abi: vaultAbiTyped as readonly unknown[],
                        functionName: "setPeriodDays",
                        args: [BigInt(days)],
                      });
                      setNewPeriodDays("");
                    }}
                    className="rounded-xl border-2 border-gold bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90 disabled:opacity-50"
                  >
                    Установить период
                  </button>
                </div>
              )}
          </section>

          <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
            <h2 className="text-lg font-semibold text-ink">
              Токены в наследстве
            </h2>
            <p className="mt-1 text-sm text-muted">
              Список токенов из контракта: ваш баланс и баланс хранилища.
            </p>
            {vaultTokens.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Токенов пока нет.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse rounded-xl border border-black/10 bg-white text-sm">
                  <thead>
                    <tr className="border-b border-black/10 bg-paper/60">
                      <th className="p-3 text-left font-semibold text-ink">
                        Токен
                      </th>
                      <th className="p-3 text-right font-semibold text-ink">
                        Ваш баланс
                      </th>
                      <th className="p-3 text-right font-semibold text-ink">
                        Баланс хранилища
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokenBalances.map((t, i) => (
                      <tr key={i} className="border-b border-black/5">
                        <td className="p-3 text-ink">
                          {t.addr.trim().toLowerCase() ===
                          ETH_PLACEHOLDER.toLowerCase() ? (
                            "ETH"
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => copyTokenAddress(t.addr)}
                                title="Скопировать адрес"
                                className="inline-flex items-center gap-1.5 font-mono text-muted hover:text-ink cursor-pointer border-0 bg-transparent p-0 text-left underline-offset-2 hover:underline"
                              >
                                {shortAddress(t.addr)}
                                {copiedTokenAddr === t.addr ? (
                                  <CheckIcon className="shrink-0 text-green-600" />
                                ) : (
                                  <CopyIcon className="shrink-0 opacity-70" />
                                )}
                              </button>{" "}
                              {t.symbol}
                            </>
                          )}
                        </td>
                        <td className="p-3 text-right text-ink">
                          {formatNumberWithSpaces(
                            formatUnits(t.userBal, t.decimals),
                          )}{" "}
                          {t.symbol}
                        </td>
                        <td className="p-3 text-right text-ink">
                          {formatNumberWithSpaces(
                            formatUnits(t.vaultBal, t.decimals),
                          )}{" "}
                          {t.symbol}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
            <h2 className="text-lg font-semibold text-ink">
              Вывести токен из хранилища
            </h2>
            <p className="mt-1 text-sm text-muted">
              Адрес токена и сумма для вывода на ваш кошелёк (только владелец).
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">Адрес токена</span>
                <input
                  type="text"
                  value={withdrawTokenAddr}
                  onChange={(e) => setWithdrawTokenAddr(e.target.value)}
                  placeholder="0x..."
                  className="w-80 rounded-lg border border-black/10 bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-gold/30"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">Сумма</span>
                <input
                  type="text"
                  value={withdrawTokenAmount}
                  onChange={(e) => setWithdrawTokenAmount(e.target.value)}
                  placeholder="0"
                  className="w-32 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/30"
                />
              </label>
              <button
                type="button"
                onClick={handleWithdrawToken}
                disabled={
                  !withdrawTokenAddr.trim() || !withdrawTokenAmount.trim()
                }
                className="rounded-xl border-2 border-gold bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90 disabled:opacity-50"
              >
                Вывести токен
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
            <h2 className="text-lg font-semibold text-ink">Вывод ETH</h2>
            <p className="mt-1 text-sm text-muted">
              Баланс ETH в хранилище:{" "}
              {vaultEthBalance != null
                ? formatNumberWithSpaces(
                    formatUnits(
                      vaultEthBalance.value,
                      vaultEthBalance.decimals,
                    ),
                  )
                : "…"}{" "}
              ETH. Введите сумму для вывода на ваш кошелёк.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">Сумма (ETH)</span>
                <input
                  type="text"
                  value={withdrawEthAmount}
                  onChange={(e) => setWithdrawEthAmount(e.target.value)}
                  placeholder="0"
                  className="w-32 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/30"
                />
              </label>
              <button
                type="button"
                onClick={handleWithdrawEth}
                disabled={!withdrawEthAmount.trim()}
                className="rounded-xl border-2 border-gold bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90 disabled:opacity-50"
              >
                Вывести ETH
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
            <h2 className="text-lg font-semibold text-ink">
              Таблица долей по файлу
            </h2>
            <p className="mt-1 text-sm text-muted">
              Загрузите merkleTree.json (с полями root, tokens, heirs) —
              отобразится таблица: кому сколько % по каждому токену.
            </p>
            <input
              type="file"
              accept=".json,application/json"
              onChange={onFileChange}
              className="mt-4 block w-full max-w-sm text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink file:hover:bg-gold/30"
            />
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}
            {uploadedFile && heirs.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[400px] border-collapse rounded-xl border border-black/10 bg-white text-sm">
                  <thead>
                    <tr className="border-b border-black/10 bg-paper/60">
                      <th className="p-3 text-left font-semibold text-ink">
                        Наследник
                      </th>
                      {tokenLabels.map((label, i) => (
                        <th
                          key={i}
                          className="p-3 text-right font-semibold text-ink"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heirs.map((heir, hi) => (
                      <tr key={hi} className="border-b border-black/5">
                        <td className="p-3 text-ink">
                          {heir.name?.trim() || `ID ${heir.heirId}`}
                        </td>
                        {(heir.sharesBps ?? []).map((bps, ti) => (
                          <td key={ti} className="p-3 text-right text-muted">
                            {(bps / 100).toFixed(2)}%
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {uploadedFile && heirs.length === 0 && (
              <p className="mt-4 text-sm text-muted">
                В файле нет массива heirs или он пуст. Используйте
                merkleTree.json с полным деревом (leaves, heirs).
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
