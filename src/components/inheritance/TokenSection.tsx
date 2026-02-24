"use client";

import { formatUnits } from "viem";
import { isValidAddress } from "@/lib/inheritance-utils";
import { formatNumberWithSpaces } from "@/lib/format";
import type { TokenInfo, TreeMode } from "@/types/inheritance";

type TokenSectionProps = {
  treeMode: TreeMode;
  setTreeMode: (mode: TreeMode) => void;
  includeEth: boolean;
  setIncludeEth: (v: boolean) => void;
  tokens: string[];
  addToken: () => void;
  removeToken: (i: number) => void;
  setToken: (i: number, v: string) => void;
  tokenInfosMap: Map<number, TokenInfo>;
  duplicateIndices: Set<number>;
  ethBalance: { value: bigint; decimals: number; symbol: string } | undefined;
  userAddress: string | undefined;
};

export function TokenSection({
  treeMode,
  setTreeMode,
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
}: TokenSectionProps) {
  const sharesExpanded = treeMode === "expand_shares";

  const handleSharesMode = () => {
    setTreeMode(
      treeMode === "expand_shares" ? "collapse_shares" : "expand_shares",
    );
  };

  return (
    <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Доли в файлах:</span>
        <button
          type="button"
          role="switch"
          aria-checked={sharesExpanded}
          aria-label={
            sharesExpanded ? "Режим: раскрыть доли" : "Режим: скрыть доли"
          }
          onClick={handleSharesMode}
          disabled
          aria-disabled="true"
          className="relative inline-flex h-8 w-52 flex-shrink-0 overflow-hidden rounded-full border-2 border-amber-200 bg-amber-50/80 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span
            className={`absolute top-1 bottom-1 w-1/2 rounded-full bg-amber-500 shadow transition-transform ${
              sharesExpanded ? "left-1 translate-x-[calc(100%+2px)]" : "left-1"
            }`}
          />
          <span
            className={`z-10 flex h-full w-1/2 items-center justify-center rounded-l-full text-xs font-bold transition-all ${
              !sharesExpanded ? "bg-amber-500 text-white" : "bg-white text-ink"
            }`}
          >
            Скрыть доли
          </span>
          <span
            className={`z-10 flex h-full w-1/2 items-center justify-center rounded-r-full text-xs font-bold transition-all ${
              sharesExpanded ? "bg-amber-500 text-white" : "bg-white text-ink"
            }`}
          >
            Раскрыть доли
          </span>
        </button>
      </div>
      <h2 className="text-lg font-semibold text-ink">Токены</h2>
      <p className="mt-1 text-sm text-muted">
        Адреса ERC-20 (или ETH). Добавьте нужное количество.
      </p>
      <label className="mt-4 flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={includeEth}
          onChange={(e) => setIncludeEth(e.target.checked)}
          className="h-4 w-4 rounded border-black/20 text-gold focus:ring-gold/30"
        />
        <span className="text-sm font-medium text-ink">ETH</span>
      </label>
      <div className="mt-4 space-y-3">
        {includeEth && (
          <EthRow ethBalance={ethBalance} userAddress={userAddress} />
        )}
        {tokens.map((t, i) => (
          <TokenRow
            key={i}
            index={i}
            value={t}
            displayIdx={i + 1}
            effectiveIdx={includeEth ? i + 1 : i}
            isDuplicate={duplicateIndices.has(includeEth ? i + 1 : i)}
            info={tokenInfosMap.get(i)}
            onChange={(v) => setToken(i, v)}
            onRemove={() => removeToken(i)}
            canRemove={tokens.length > 0}
            userAddress={userAddress}
          />
        ))}
        <button
          type="button"
          onClick={addToken}
          className="rounded-xl border-2 border-dashed border-gold bg-gold/20 px-4 py-2 text-sm font-medium text-ink hover:bg-gold/30"
        >
          + Добавить токен
        </button>
      </div>
    </section>
  );
}

function EthRow({
  ethBalance,
  userAddress,
}: {
  ethBalance: { value: bigint; decimals: number; symbol: string } | undefined;
  userAddress: string | undefined;
}) {
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input
          type="text"
          value="ETH"
          readOnly
          disabled
          className="flex-1 cursor-not-allowed rounded-xl border border-black/10 bg-black/5 px-3 py-2 font-mono text-sm text-ink"
        />
        <span className="flex items-center rounded-xl border border-transparent px-4 py-2 text-sm text-muted">
          —
        </span>
      </div>
      <div className="rounded-lg border border-black/5 bg-white/70 px-3 py-2 text-sm">
        <span className="text-ink">
          Ethereum (ETH)
          {ethBalance?.value != null ? (
            <>
              {" "}
              · Баланс:{" "}
              {formatNumberWithSpaces(
                formatUnits(ethBalance.value, ethBalance.decimals),
              )}{" "}
              {ethBalance.symbol}
            </>
          ) : userAddress ? (
            <span className="ml-1 text-muted">· Баланс: …</span>
          ) : (
            <span className="ml-1 text-muted">
              · Подключите кошелёк для баланса
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function TokenRow({
  value,
  displayIdx,
  isDuplicate,
  info,
  onChange,
  onRemove,
  canRemove,
  userAddress,
}: {
  value: string;
  index: number;
  displayIdx: number;
  effectiveIdx: number;
  isDuplicate: boolean;
  info: TokenInfo | undefined;
  onChange: (v: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  userAddress: string | undefined;
}) {
  const isValid = isValidAddress(value.trim());

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Токен ${displayIdx} (0x...)`}
          className={`flex-1 rounded-xl border px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-gold/30 ${
            isDuplicate
              ? "border-red-500 bg-red-50"
              : "border-black/10 bg-white/80"
          }`}
        />
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="rounded-xl border border-black/10 px-4 py-2 text-sm text-muted hover:bg-black/5 disabled:opacity-40"
        >
          −
        </button>
      </div>
      {isValid && (
        <div className="rounded-lg border border-black/5 bg-white/70 px-3 py-2 text-sm">
          {info ? (
            <span className="text-ink">
              {info.name ?? "—"} ({info.symbol ?? "—"})
              {info.balance != null ? (
                <>
                  {" "}
                  · Баланс: {formatNumberWithSpaces(info.balance)}{" "}
                  {info.symbol ?? ""}
                </>
              ) : userAddress ? (
                <span className="ml-1 text-muted">· Баланс: …</span>
              ) : (
                <span className="ml-1 text-muted">
                  · Подключите кошелёк для баланса
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted">Загружаю…</span>
          )}
        </div>
      )}
    </div>
  );
}
