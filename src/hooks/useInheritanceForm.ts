"use client";

import * as React from "react";
import { useBalance, useConnection, useReadContracts } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { buildMerkleTree } from "@/lib/merkle";
import {
  ETH_PLACEHOLDER,
  isValidAddress,
  normalizeAddress,
  resizeArray,
} from "@/lib/inheritance-utils";
import type {
  HeirForm,
  MerkleResult,
  TokenInfo,
  TreeMode,
} from "@/types/inheritance";

export type SubmitMode = "update" | "createNew";

type UseInheritanceFormOptions = {
  /** Вызывается после генерации дерева и скачивания файлов; mode — обновить существующее хранилище или создать новое. */
  onAfterGenerate?: (
    result: MerkleResult,
    mode: SubmitMode,
  ) => void | Promise<void>;
  /** Адрес vault для отображения (если хранилище уже есть). */
  vaultAddress?: `0x${string}` | undefined;
};

export function useInheritanceForm(options?: UseInheritanceFormOptions) {
  const { address: userAddress } = useConnection();
  const onAfterGenerate = options?.onAfterGenerate;
  const vaultAddress = options?.vaultAddress;
  const { data: ethBalance } = useBalance({
    address: userAddress ?? undefined,
  });

  const [includeEth, setIncludeEth] = React.useState(false);
  const [tokens, setTokens] = React.useState<string[]>([]);
  const [heirs, setHeirs] = React.useState<HeirForm[]>([
    { heirId: "", name: "", shares: [""] },
  ]);
  const [tokenErrors, setTokenErrors] = React.useState<Set<number>>(new Set());
  const [heirIdError, setHeirIdError] = React.useState(false);
  const [duplicateIndices, setDuplicateIndices] = React.useState<Set<number>>(
    new Set(),
  );
  const [merkleResult, setMerkleResult] = React.useState<MerkleResult | null>(
    null,
  );
  /** Пока работаем только с раскрытыми долями. Режим "скрыть доли" добавим позже. */
  const treeMode: TreeMode = "expand_shares";
  const setTreeMode = React.useCallback((_mode: TreeMode) => {
    // намеренно пусто
  }, []);

  const effectiveTokens = includeEth ? [ETH_PLACEHOLDER, ...tokens] : tokens;
  const tokenCount = effectiveTokens.length;
  const validTokenCount = effectiveTokens.filter((t) =>
    isValidAddress(t.trim()),
  ).length;

  const duplicateCheck = React.useMemo(() => {
    const eff = includeEth ? [ETH_PLACEHOLDER, ...tokens] : tokens;
    const seen = new Map<string, number>();
    const dups = new Set<number>();
    eff.forEach((t, i) => {
      const addr = t.trim();
      if (!addr) return;
      const norm = normalizeAddress(addr);
      if (seen.has(norm)) {
        dups.add(i);
        dups.add(seen.get(norm)!);
      } else {
        seen.set(norm, i);
      }
    });
    return dups;
  }, [includeEth, tokens]);

  React.useEffect(() => {
    setDuplicateIndices(duplicateCheck);
  }, [duplicateCheck]);

  const tokenContracts = React.useMemo(() => {
    const list: {
      address: `0x${string}`;
      abi: typeof erc20Abi;
      functionName: "name" | "symbol" | "decimals" | "balanceOf";
      args?: readonly [`0x${string}`];
    }[] = [];
    tokens.forEach((t) => {
      const addr = t.trim();
      if (!isValidAddress(addr)) return;
      const a = addr as `0x${string}`;
      list.push({ address: a, abi: erc20Abi, functionName: "name" });
      list.push({ address: a, abi: erc20Abi, functionName: "symbol" });
      list.push({ address: a, abi: erc20Abi, functionName: "decimals" });
      if (userAddress) {
        list.push({
          address: a,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [userAddress],
        });
      }
    });
    return list;
  }, [tokens, userAddress]);

  const { data: tokenData } = useReadContracts({
    contracts: tokenContracts,
    query: { enabled: tokenContracts.length > 0 },
  });

  const tokenInfosMap = React.useMemo(() => {
    if (!tokenData) return new Map<number, TokenInfo>();
    const perToken = userAddress ? 4 : 3;
    const map = new Map<number, TokenInfo>();
    let idx = 0;
    tokens.forEach((t, i) => {
      if (!isValidAddress(t.trim())) return;
      const [nameR, symbolR, decimalsR, balanceR] = tokenData.slice(
        idx * perToken,
        (idx + 1) * perToken,
      );
      const name =
        nameR?.status === "success" ? (nameR.result as string) : null;
      const symbol =
        symbolR?.status === "success" ? (symbolR.result as string) : null;
      const decimals =
        decimalsR?.status === "success" ? Number(decimalsR.result) : null;
      const balance =
        balanceR?.status === "success" && decimals != null
          ? formatUnits(
              BigInt(balanceR.result as string | number | bigint),
              decimals,
            )
          : null;
      map.set(i, { name, symbol, balance });
      idx++;
    });
    return map;
  }, [tokenData, userAddress, tokens]);

  const prevIncludeEthRef = React.useRef(includeEth);
  const lastEthSharesRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    const prevIncludeEth = prevIncludeEthRef.current;
    prevIncludeEthRef.current = includeEth;

    setHeirs((prev) =>
      prev.map((h, hi) => {
        let newShares: string[];
        if (!prevIncludeEth && includeEth) {
          const ethShare = lastEthSharesRef.current[hi] ?? "";
          newShares = [ethShare, ...(h.shares ?? [])];
        } else if (prevIncludeEth && !includeEth) {
          lastEthSharesRef.current = prev.map((heir) => heir.shares[0] ?? "");
          newShares = h.shares.slice(1) ?? [];
        } else {
          newShares = resizeArray(h.shares, tokenCount, "");
        }
        return { ...h, shares: newShares };
      }),
    );
  }, [includeEth, tokenCount]);

  const addToken = () => setTokens((t) => [...t, ""]);
  const removeToken = (i: number) => {
    setTokens((t) => t.filter((_, idx) => idx !== i));
  };
  const setToken = (i: number, v: string) => {
    setTokens((t) => {
      const next = [...t];
      next[i] = v;
      return next;
    });
  };

  const addHeir = () =>
    setHeirs((h) => [
      ...h,
      { heirId: "", name: "", shares: Array(tokenCount).fill("") },
    ]);
  const removeHeir = (i: number) => {
    if (heirs.length <= 1) return;
    setHeirs((h) => h.filter((_, idx) => idx !== i));
  };
  const setHeirId = (i: number, v: string) => {
    setHeirIdError(false);
    setHeirs((h) => {
      const next = [...h];
      next[i] = { ...next[i], heirId: v };
      return next;
    });
  };
  const setHeirName = (i: number, v: string) => {
    setHeirs((h) => {
      const next = [...h];
      next[i] = { ...next[i], name: v };
      return next;
    });
  };
  const setHeirShare = (heirIdx: number, tokenIdx: number, v: string) => {
    setHeirs((h) => {
      const next = [...h];
      next[heirIdx].shares[tokenIdx] = v;
      return next;
    });
  };

  const validate = (): boolean => {
    const errs = new Set<number>();
    for (let t = 0; t < tokenCount; t++) {
      let sum = 0;
      for (const heir of heirs) {
        const s = parseFloat(heir.shares[t] ?? "0");
        if (!Number.isNaN(s)) sum += s;
      }
      if (sum > 100) errs.add(t);
    }
    setTokenErrors(errs);
    return errs.size === 0 && duplicateIndices.size === 0;
  };

  const tokenList = React.useMemo(
    () => effectiveTokens.filter((t) => isValidAddress(t.trim())),
    [effectiveTokens],
  );

  /** Скачивает общее дерево и файлы наследников. В heir_*.json сохраняется owner (адрес наследодателя) — vault при клейме берётся через фабрику. */
  const doDownload = React.useCallback(
    (result: MerkleResult) => {
      const tokensToSave = result.tokens ?? tokenList;

      const downloadJson = (obj: object, filename: string) => {
        const blob = new Blob([JSON.stringify(obj, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename.replace(/[<>:"/\\|?*]/g, "_").trim() + ".json";
        a.click();
        URL.revokeObjectURL(url);
      };

      downloadJson(
        {
          root: result.root,
          tokens: tokensToSave,
          leaves: result.heirs.map((h) => h.leaf),
          heirs: result.heirs,
        },
        "merkleTree",
      );

      result.heirs.forEach((h) => {
        const namePart = h.name?.trim()
          ? `_${h.name.replace(/[<>:"/\\|?*]/g, "_").trim()}`
          : "";
        downloadJson(
          {
            heirId: h.heirId,
            name: h.name,
            sharesBps: h.sharesBps,
            leaf: h.leaf,
            proof: h.proof,
            ...(userAddress ? { owner: userAddress } : {}),
          },
          `heir_${h.heirId}${namePart}`,
        );
      });
    },
    [tokenList, userAddress],
  );

  const handleSubmit = async (mode: SubmitMode = "createNew") => {
    setMerkleResult(null);
    setHeirIdError(false);
    if (duplicateIndices.size > 0) return;
    if (!validate()) return;

    const heirsWithIds = heirs.filter((h) => h.heirId.trim() !== "");
    const hasInvalidHeirId = heirsWithIds.some((h) =>
      Number.isNaN(parseInt(h.heirId, 10)),
    );
    if (hasInvalidHeirId) {
      setHeirIdError(true);
      return;
    }

    const heirsData = heirsWithIds.map((h) => ({
      heirId: parseInt(h.heirId, 10),
      name: h.name.trim() || undefined,
      sharesBps: h.shares.map((s) => Math.round(parseFloat(s || "0") * 100)),
    }));

    if (heirsData.length === 0) {
      setTokenErrors(new Set([0]));
      return;
    }

    const result = buildMerkleTree(
      heirsData.map(({ heirId, sharesBps }) => ({ heirId, sharesBps })),
    );
    const heirsWithNames = result.heirs.map((h, i) => ({
      ...h,
      name: heirsData[i]?.name,
    }));
    const fullResult: MerkleResult = {
      ...result,
      heirs: heirsWithNames,
      tokens: tokenList,
    };
    setMerkleResult(fullResult);
    doDownload(fullResult);
    if (onAfterGenerate) {
      try {
        await onAfterGenerate(fullResult, mode);
      } catch (e) {
        console.error("onAfterGenerate:", e);
      }
    }
  };

  const canSubmit =
    !heirs.every((h) => !h.heirId.trim()) &&
    duplicateIndices.size === 0 &&
    validTokenCount > 0;

  return {
    // Tokens
    includeEth,
    setIncludeEth,
    tokens,
    addToken,
    removeToken,
    setToken,
    tokenInfosMap,
    duplicateIndices,
    ethBalance,
    userAddress,
    // Heirs
    heirs,
    addHeir,
    removeHeir,
    setHeirId,
    setHeirName,
    setHeirShare,
    tokenErrors,
    tokenCount,
    // Tree mode (бегунок скрыть/раскрыть доли)
    treeMode,
    setTreeMode,
    // Errors
    heirIdError,
    // Submit
    handleSubmit,
    canSubmit,
    // Result
    merkleResult,
    doDownload,
    effectiveTokens,
    tokenList,
  };
}
