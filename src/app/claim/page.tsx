"use client";

import * as React from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { formatUnits, erc20Abi } from "viem";
import sss from "shamirs-secret-sharing";
import { FACTORY_ADDRESS } from "@/lib/contracts";
import { formatNumberWithSpaces } from "@/lib/format";
import { CopyIcon, CheckIcon } from "@/components/copy-icons";
import { ETH_PLACEHOLDER } from "@/lib/inheritance-utils";
import { decryptSharesBps } from "@/lib/crypto";
import factoryAbi from "@/contracts/DMSFactory.abi.json";
import vaultAbi from "@/contracts/DeadMansSwitchVault.abi.json";

const factoryAbiTyped = factoryAbi as readonly unknown[];
const vaultAbiTyped = vaultAbi as readonly unknown[];
const MAX_TOKENS = 32;

type HeirFile = {
  owner?: string;
  vault?: string;
  heirId: number;
  name?: string;
  sharesBps?: number[];
  encryptedShares?: string;
  shamirShare?: string;
  shamirThreshold?: number;
  shamirTotal?: number;
  shamirMode?: "heirs" | "organization";
  leaf?: string;
  proof?: string[];
};

function toBytes32Array(proof: string[]): `0x${string}`[] {
  return proof.map((p) =>
    p.startsWith("0x") ? (p as `0x${string}`) : (`0x${p}` as `0x${string}`),
  );
}

const ZERO = "0x0000000000000000000000000000000000000000";

function shortAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ClaimPage() {
  const { address: userAddress } = useAccount();
  const { writeContractAsync: writeVault } = useWriteContract();

  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [heirData, setHeirData] = React.useState<HeirFile | null>(null);
  const [vaultOverride, setVaultOverride] = React.useState("");
  const [txError, setTxError] = React.useState<string | null>(null);
  const [txSuccess, setTxSuccess] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [copiedTokenAddr, setCopiedTokenAddr] = React.useState<string | null>(
    null,
  );
  const [keyShareValue, setKeyShareValue] = React.useState<string | null>(null);
  const [keyShareMeta, setKeyShareMeta] = React.useState<{
    threshold?: number;
    total?: number;
    description?: string;
  } | null>(null);
  const [keyShareError, setKeyShareError] = React.useState<string | null>(null);
  const [keyShareCopied, setKeyShareCopied] = React.useState(false);

  const copyTokenAddress = (addr: string) => {
    void navigator.clipboard.writeText(addr).then(() => {
      setCopiedTokenAddr(addr);
      setTimeout(() => setCopiedTokenAddr(null), 1500);
    });
  };

  const copyKeyShare = (share: string) => {
    void navigator.clipboard.writeText(share).then(() => {
      setKeyShareCopied(true);
      setTimeout(() => setKeyShareCopied(false), 1500);
    });
  };

  const ownerFromFile = React.useMemo(() => {
    const o = heirData?.owner?.trim();
    if (o && /^0x[a-fA-F0-9]{40}$/.test(o)) return o as `0x${string}`;
    return undefined;
  }, [heirData?.owner]);

  const { data: vaultFromFactory } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbiTyped,
    functionName: "vaults",
    args: ownerFromFile ? [ownerFromFile] : undefined,
  });

  const vaultAddress = React.useMemo(() => {
    const over = vaultOverride.trim();
    if (over && /^0x[a-fA-F0-9]{40}$/.test(over)) return over as `0x${string}`;
    const fromFactory =
      vaultFromFactory &&
      (vaultFromFactory as string).toLowerCase() !== ZERO.toLowerCase()
        ? (vaultFromFactory as `0x${string}`)
        : undefined;
    if (fromFactory) return fromFactory;
    const fromFile = heirData?.vault?.trim();
    if (fromFile && /^0x[a-fA-F0-9]{40}$/.test(fromFile))
      return fromFile as `0x${string}`;
    return undefined;
  }, [vaultOverride, vaultFromFactory, heirData?.vault]);

  const heirLeaf = React.useMemo(() => {
    const l = heirData?.leaf?.trim();
    if (l && /^0x[a-fA-F0-9]{64}$/.test(l.startsWith("0x") ? l : "0x" + l))
      return (l.startsWith("0x") ? l : "0x" + l) as `0x${string}`;
    return undefined;
  }, [heirData?.leaf]);

  const { data: claimedLeaf } = useReadContract({
    address: vaultAddress,
    abi: vaultAbiTyped,
    functionName: "claimedLeaf",
    args: heirLeaf ? [heirLeaf] : undefined,
  });

  const { data: lastActivityAt } = useReadContract({
    address: vaultAddress,
    abi: vaultAbiTyped,
    functionName: "lastActivityAt",
  });
  const { data: periodSeconds } = useReadContract({
    address: vaultAddress,
    abi: vaultAbiTyped,
    functionName: "periodSeconds",
  });
  const { data: isExpired } = useReadContract({
    address: vaultAddress,
    abi: vaultAbiTyped,
    functionName: "isExpired",
  });
  const { data: dmsEnabled } = useReadContract({
    address: vaultAddress,
    abi: vaultAbiTyped,
    functionName: "dmsEnabled",
  });

  const canClaimTokens =
    isExpired === true && dmsEnabled === true && claimedLeaf !== true;

  const periodEndsAt = React.useMemo(() => {
    if (lastActivityAt == null || periodSeconds == null) return null;
    return Number(lastActivityAt) * 1000 + Number(periodSeconds) * 1000;
  }, [lastActivityAt, periodSeconds]);

  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (periodEndsAt == null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [periodEndsAt]);

  const periodRemainingText = React.useMemo(() => {
    if (periodEndsAt == null) return null;
    const remainingMs = periodEndsAt - now;
    if (remainingMs <= 0) return "период истёк";
    const totalSec = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} дн.`);
    if (hours > 0) parts.push(`${hours} ч.`);
    if (minutes > 0 || (days === 0 && hours === 0))
      parts.push(`${minutes} мин.`);
    if (days === 0 && hours === 0) parts.push(`${seconds} сек.`);
    return "осталось " + parts.join(" ");
  }, [periodEndsAt, now]);

  const tokenIndices = React.useMemo(
    () => Array.from({ length: MAX_TOKENS }, (_, i) => i),
    [],
  );
  const vaultTokenContracts = React.useMemo(() => {
    if (!vaultAddress) return [];
    return tokenIndices.map((i) => ({
      address: vaultAddress,
      abi: vaultAbiTyped as readonly unknown[],
      functionName: "tokens" as const,
      args: [BigInt(i)] as const,
    }));
  }, [vaultAddress, tokenIndices]);

  const { data: vaultTokenResults } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: vaultTokenContracts as any,
    query: { enabled: vaultTokenContracts.length > 0 },
  });

  const vaultTokens = React.useMemo(() => {
    if (!vaultTokenResults) return [];
    const list: string[] = [];
    for (let i = 0; i < vaultTokenResults.length; i++) {
      const r = vaultTokenResults[i];
      if (
        r?.status === "success" &&
        r.result &&
        (r.result as string) !== "0x0000000000000000000000000000000000000000"
      ) {
        list.push(r.result as string);
      }
    }
    return list;
  }, [vaultTokenResults]);

  const erc20Only = React.useMemo(
    () =>
      vaultTokens.filter(
        (t) => t.trim().toLowerCase() !== ETH_PLACEHOLDER.toLowerCase(),
      ),
    [vaultTokens],
  );

  const tokenMetaContracts = React.useMemo(() => {
    const list: {
      address: `0x${string}`;
      abi: typeof erc20Abi;
      functionName: "symbol" | "name" | "decimals" | "balanceOf";
      args?: readonly [`0x${string}`];
    }[] = [];
    erc20Only.forEach((addr) => {
      const a = addr as `0x${string}`;
      list.push({ address: a, abi: erc20Abi, functionName: "symbol" });
      list.push({ address: a, abi: erc20Abi, functionName: "name" });
      list.push({ address: a, abi: erc20Abi, functionName: "decimals" });
      if (vaultAddress) {
        list.push({
          address: a,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [vaultAddress],
        });
      }
    });
    return list;
  }, [erc20Only, vaultAddress]);

  const { data: tokenMetaResults } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: tokenMetaContracts as any,
    query: { enabled: tokenMetaContracts.length > 0 },
  });

  const { data: vaultEthBalance } = useBalance({
    address: vaultAddress,
  });

  type TokenRow = {
    addr: string;
    symbol: string;
    name: string;
    decimals: number;
    vaultBal: bigint;
    shareBps: number;
    entitledRaw: bigint;
  };

  const tokenTableRows = React.useMemo((): TokenRow[] => {
    if (!heirData || vaultTokens.length === 0) return [];
    const sharesBps = heirData.sharesBps ?? [];
    const alreadyClaimed = claimedLeaf === true;
    const rows: TokenRow[] = [];
    let erc20Idx = 0;
    for (let i = 0; i < vaultTokens.length; i++) {
      const addr = vaultTokens[i];
      const shareBps = sharesBps[i] ?? 0;
      const isEth = addr.trim().toLowerCase() === ETH_PLACEHOLDER.toLowerCase();
      if (isEth) {
        const vaultBal = vaultEthBalance?.value ?? BigInt(0);
        const entitledRaw = alreadyClaimed
          ? BigInt(0)
          : (vaultBal * BigInt(Math.min(10000, Math.max(0, shareBps)))) /
            BigInt(10000);
        rows.push({
          addr,
          symbol: "ETH",
          name: "Ethereum",
          decimals: 18,
          vaultBal,
          shareBps,
          entitledRaw,
        });
      } else {
        const perToken = 4;
        const base = erc20Idx * perToken;
        const symbol =
          tokenMetaResults?.[base]?.status === "success"
            ? (tokenMetaResults[base].result as string)
            : "—";
        const name =
          tokenMetaResults?.[base + 1]?.status === "success"
            ? (tokenMetaResults[base + 1].result as string)
            : "—";
        const decimals =
          tokenMetaResults?.[base + 2]?.status === "success"
            ? Number(tokenMetaResults[base + 2].result)
            : 18;
        const vaultBal =
          tokenMetaResults?.[base + 3]?.status === "success"
            ? BigInt(tokenMetaResults[base + 3].result as unknown as string)
            : BigInt(0);
        const entitledRaw = alreadyClaimed
          ? BigInt(0)
          : (vaultBal * BigInt(Math.min(10000, Math.max(0, shareBps)))) /
            BigInt(10000);
        rows.push({
          addr,
          symbol,
          name,
          decimals,
          vaultBal,
          shareBps,
          entitledRaw,
        });
        erc20Idx++;
      }
    }
    return rows;
  }, [
    heirData,
    vaultTokens,
    vaultEthBalance?.value,
    tokenMetaResults,
    claimedLeaf,
  ]);

  const [shamirInputs, setShamirInputs] = React.useState<string[]>(["", ""]);
  const [decryptError, setDecryptError] = React.useState<string | null>(null);
  const [decrypting, setDecrypting] = React.useState(false);

  const isEncrypted = !!(heirData?.encryptedShares && !heirData?.sharesBps);

  const maxShamirInputs =
    heirData?.shamirTotal ?? heirData?.shamirThreshold ?? undefined;

  const onKeyShareFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyShareError(null);
    setKeyShareValue(null);
    setKeyShareMeta(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as unknown;
        if (!json || typeof json !== "object" || !("shamirShare" in json)) {
          setKeyShareError("В файле должно быть поле shamirShare.");
          return;
        }
        const data = json as {
          shamirShare?: string;
          shamirThreshold?: number;
          shamirTotal?: number;
          description?: string;
        };
        if (!data.shamirShare || typeof data.shamirShare !== "string") {
          setKeyShareError("Поле shamirShare должно быть строкой.");
          return;
        }
        setKeyShareValue(data.shamirShare);
        setKeyShareMeta({
          threshold:
            typeof data.shamirThreshold === "number"
              ? data.shamirThreshold
              : undefined,
          total:
            typeof data.shamirTotal === "number" ? data.shamirTotal : undefined,
          description:
            typeof data.description === "string"
              ? data.description
              : undefined,
        });
      } catch {
        setKeyShareError("Неверный JSON");
      }
    };
    reader.readAsText(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setHeirData(null);
    setVaultOverride("");
    setTxError(null);
    setTxSuccess(null);
    setDecryptError(null);
    setShamirInputs(["", ""]);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as unknown;
        if (!json || typeof json !== "object" || !("heirId" in json)) {
          setUploadError("В файле должно быть поле heirId.");
          return;
        }
        const parsed = json as HeirFile;
        const hasPlainShares = Array.isArray(parsed.sharesBps);
        const hasEncrypted = typeof parsed.encryptedShares === "string";
        if (!hasPlainShares && !hasEncrypted) {
          setUploadError(
            "В файле должны быть поля sharesBps (массив) или encryptedShares (зашифрованные доли).",
          );
          return;
        }
        if (hasEncrypted && parsed.shamirShare) {
          setShamirInputs([parsed.shamirShare, ""]);
        }
        setHeirData(parsed);
      } catch {
        setUploadError("Неверный JSON");
      }
    };
    reader.readAsText(file);
  };

  const handleDecrypt = async () => {
    if (!heirData?.encryptedShares) return;
    setDecryptError(null);
    setDecrypting(true);
    try {
      const shares = shamirInputs.map((s) => s.trim()).filter(Boolean);
      if (shares.length < 2) {
        setDecryptError("Нужно минимум 2 доли ключа для восстановления.");
        return;
      }
      const buffers = shares.map((h) => sss.Buffer.from(h, "hex"));
      const combined = sss.combine(buffers);
      const keyHex = combined.toString("hex");
      const decrypted = await decryptSharesBps(
        heirData.encryptedShares,
        keyHex,
      );
      setHeirData({ ...heirData, sharesBps: decrypted });
    } catch {
      setDecryptError(
        "Не удалось расшифровать доли. Проверьте доли ключа — возможно, не хватает долей или они неверны.",
      );
    } finally {
      setDecrypting(false);
    }
  };

  const handleClaim = async () => {
    if (!userAddress || !vaultAddress || !heirData) return;
    const proof = heirData.proof ?? [];
    if (proof.length === 0) {
      setTxError("В файле отсутствует proof.");
      return;
    }
    setTxError(null);
    setTxSuccess(null);
    setPending(true);
    try {
      const hash = await writeVault({
        address: vaultAddress,
        abi: vaultAbiTyped as readonly unknown[],
        functionName: "claimWithProof",
        args: [
          userAddress,
          BigInt(heirData.heirId),
          (heirData.sharesBps ?? []).map((n) =>
            Math.max(0, Math.min(65535, n)),
          ),
          toBytes32Array(proof),
        ],
        gas: BigInt(16_000_000), // лимит сети 16_777_216, ставим ниже
      });
      setTxSuccess(
        hash ? `Транзакция отправлена: ${hash}` : "Доля успешно получена.",
      );
    } catch (err) {
      setTxError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  };

  const canClaim =
    userAddress &&
    vaultAddress &&
    heirData &&
    Array.isArray(heirData.sharesBps) &&
    Array.isArray(heirData.proof) &&
    heirData.proof.length > 0 &&
    claimedLeaf !== true &&
    canClaimTokens;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Получить наследство
        </h1>
        <p className="mt-2 text-muted">
          Загрузите файл наследника (heir_*.json) с полем owner (адрес
          наследодателя). Vault будет получен через фабрику. Подтвердите
          получение доли.
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-black/5 bg-paper/40 p-6">
        <h2 className="text-lg font-semibold text-ink">
          Извлечь долю ключа из файла
        </h2>
        <p className="mt-1 text-sm text-muted">
          Загрузите JSON-файл с долей ключа (например, файл наследника
          heir_&lt;id&gt; или файл организации organization_key_share). Мы
          покажем только строку доли ключа, чтобы вы могли переслать её другим
          участникам, не передавая весь файл. Обработка выполняется локально в
          вашем браузере.
        </p>
        <input
          type="file"
          accept=".json,application/json"
          onChange={onKeyShareFileChange}
          className="mt-4 block w-full max-w-sm text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink file:hover:bg-gold/30"
        />
        {keyShareError && (
          <p className="mt-2 text-sm text-red-600">{keyShareError}</p>
        )}
        {keyShareValue && (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-ink">
              Доля ключа (hex):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={keyShareValue}
                className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-xs text-ink outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                type="button"
                onClick={() => copyKeyShare(keyShareValue)}
                className="shrink-0 rounded-xl border border-black/10 bg-paper px-3 py-2 text-sm font-medium text-ink hover:bg-black/5"
              >
                {keyShareCopied ? "Скопировано" : "Скопировать"}
              </button>
            </div>
            {keyShareMeta?.threshold != null &&
              keyShareMeta?.total != null && (
                <p className="text-sm text-muted">
                  Для восстановления ключа нужно{" "}
                  <strong>{keyShareMeta.threshold}</strong> из{" "}
                  <strong>{keyShareMeta.total}</strong> долей.
                </p>
              )}
            {keyShareMeta?.description && (
              <p className="text-xs text-muted">{keyShareMeta.description}</p>
            )}
          </div>
        )}
      </section>

      {!userAddress ? (
        <div className="rounded-2xl border border-black/10 bg-paper/40 p-6 text-center text-muted">
          Подключите кошелёк (адрес наследника), чтобы вызвать получение доли.
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
            <h2 className="text-lg font-semibold text-ink">Файл наследника</h2>
            <p className="mt-1 text-sm text-muted">
              Загрузите heir_&lt;id&gt;_&lt;имя&gt;.json.
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
          </section>

          {heirData && isEncrypted && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
              <h2 className="text-lg font-semibold text-ink">
                Расшифровка долей
              </h2>
              {heirData.shamirMode === "organization" ? (
                <div className="mt-3 rounded-xl border-2 border-amber-400 bg-amber-100/80 px-4 py-3 text-sm font-semibold text-amber-900">
                  Нужно связаться с организацией — вторая доля ключа хранится у
                  доверенной организации. Организация выйдет на связь с
                  наследниками.
                </div>
              ) : (
                <div className="mt-3 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-ink">
                  Нужно связаться с другими наследниками — соберите доли ключа
                  от наследников (организация не участвует).
                </div>
              )}
              {heirData.shamirThreshold != null &&
                heirData.shamirTotal != null && (
                  <p className="mt-3 text-sm font-medium text-ink">
                    Для восстановления ключа нужно{" "}
                    <strong>{heirData.shamirThreshold}</strong> из{" "}
                    <strong>{heirData.shamirTotal}</strong> долей.
                  </p>
                )}
              <p className="mt-2 text-sm text-muted">
                Доли в файле зашифрованы. Введите доли ключа Shamir для
                восстановления ключа шифрования. Ваша доля из файла уже
                подставлена — добавьте недостающие доли от других наследников
                или организации.
              </p>
              <div className="mt-4 space-y-2">
                {shamirInputs.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={s}
                      onChange={(e) =>
                        setShamirInputs((prev) => {
                          const next = [...prev];
                          next[i] = e.target.value;
                          return next;
                        })
                      }
                      placeholder={`Доля ключа ${i + 1} (hex)`}
                      className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (shamirInputs.length <= 2) return;
                        setShamirInputs((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        );
                      }}
                      disabled={shamirInputs.length <= 2}
                      className="rounded-xl border border-black/10 px-3 py-2 text-sm text-muted hover:bg-black/5 disabled:opacity-40"
                    >
                      −
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setShamirInputs((prev) => {
                      if (
                        maxShamirInputs != null &&
                        prev.length >= maxShamirInputs
                      ) {
                        return prev;
                      }
                      return [...prev, ""];
                    })
                  }
                  disabled={
                    maxShamirInputs != null &&
                    shamirInputs.length >= maxShamirInputs
                  }
                  className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-ink hover:bg-amber-100"
                >
                  + Добавить долю ключа
                </button>
              </div>
              {decryptError && (
                <p className="mt-3 text-sm text-red-600">{decryptError}</p>
              )}
              <button
                type="button"
                onClick={handleDecrypt}
                disabled={decrypting}
                className="mt-4 rounded-xl border-2 border-gold bg-gold px-6 py-2 text-sm font-semibold text-ink hover:bg-gold/90 disabled:opacity-50"
              >
                {decrypting ? "Расшифровка…" : "Расшифровать доли"}
              </button>
            </section>
          )}

          {heirData && !isEncrypted && (
            <>
              <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
                <h2 className="text-lg font-semibold text-ink">Информация</h2>
                <div className="mt-3 space-y-2 text-sm">
                  {heirData.owner && (
                    <div>
                      <span className="text-muted">Наследодатель: </span>
                      <span className="break-all font-mono text-ink">
                        {heirData.owner}
                      </span>
                    </div>
                  )}
                  {vaultAddress && (
                    <div>
                      <span className="text-muted">Хранилище: </span>
                      <span className="break-all font-mono text-ink">
                        {vaultAddress}
                      </span>
                    </div>
                  )}
                  {vaultAddress && lastActivityAt != null && (
                    <div>
                      <span className="text-muted">Последняя активность: </span>
                      <span className="text-ink">
                        {new Date(Number(lastActivityAt) * 1000).toLocaleString(
                          "ru-RU",
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                          },
                        )}
                      </span>
                    </div>
                  )}
                  {vaultAddress && periodRemainingText != null && (
                    <div>
                      <span className="text-muted">До конца периода: </span>
                      <span
                        className={
                          periodRemainingText === "период истёк"
                            ? "font-medium text-green-700"
                            : "text-ink"
                        }
                      >
                        {periodRemainingText}
                      </span>
                    </div>
                  )}
                  {vaultAddress && (
                    <div>
                      <span className="text-muted">Можно забрать токены: </span>
                      {isExpired === undefined || dmsEnabled === undefined ? (
                        <span className="text-ink">…</span>
                      ) : canClaimTokens ? (
                        <span className="font-medium text-green-700">да</span>
                      ) : (
                        <span className="text-ink">
                          нет
                          {!dmsEnabled && " (DMS не включён)"}
                          {dmsEnabled && !isExpired && " (период не истёк)"}
                          {claimedLeaf === true && " (доля уже получена)"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {tokenTableRows.length > 0 && (
                <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
                  <h2 className="text-lg font-semibold text-ink">
                    Вам положено по токенам хранилища
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Доля в % и расчёт суммы по текущему балансу хранилища.
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[500px] border-collapse rounded-xl border border-black/10 bg-white text-sm">
                      <thead>
                        <tr className="border-b border-black/10 bg-paper/60">
                          <th className="p-3 text-left font-semibold text-ink">
                            Токен
                          </th>
                          <th className="p-3 text-right font-semibold text-ink">
                            Доля %
                          </th>
                          <th className="p-3 text-right font-semibold text-ink">
                            Баланс хранилища
                          </th>
                          <th className="p-3 text-right font-semibold text-ink">
                            Вам положено
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tokenTableRows.map((row, i) => (
                          <tr key={i} className="border-b border-black/5">
                            <td className="p-3 text-ink">
                              {row.addr.trim().toLowerCase() ===
                              ETH_PLACEHOLDER.toLowerCase() ? (
                                "ETH"
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => copyTokenAddress(row.addr)}
                                    title="Скопировать адрес"
                                    className="inline-flex items-center gap-1.5 font-mono text-muted hover:text-ink cursor-pointer border-0 bg-transparent p-0 text-left underline-offset-2 hover:underline"
                                  >
                                    {shortAddress(row.addr)}
                                    {copiedTokenAddr === row.addr ? (
                                      <CheckIcon className="shrink-0 text-green-600" />
                                    ) : (
                                      <CopyIcon className="shrink-0 opacity-70" />
                                    )}
                                  </button>{" "}
                                  {row.symbol}
                                </>
                              )}
                            </td>
                            <td className="p-3 text-right text-ink">
                              {(row.shareBps / 100).toFixed(2)}%
                            </td>
                            <td className="p-3 text-right text-ink">
                              {formatNumberWithSpaces(
                                formatUnits(row.vaultBal, row.decimals),
                              )}{" "}
                              {row.symbol}
                            </td>
                            <td className="p-3 text-right font-medium text-ink">
                              {formatNumberWithSpaces(
                                formatUnits(row.entitledRaw, row.decimals),
                              )}{" "}
                              {row.symbol}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {claimedLeaf === true && (
                <p className="text-sm font-medium text-green-700">
                  Вы уже получили эту долю.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={!canClaim || pending}
                  className="rounded-xl border-2 border-gold bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold/90 disabled:opacity-50"
                >
                  {pending ? "Отправка…" : "Получить наследство"}
                </button>
                {txError && <p className="text-sm text-red-600">{txError}</p>}
                {txSuccess && (
                  <p className="text-sm font-medium text-green-700 break-all">
                    {txSuccess}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
