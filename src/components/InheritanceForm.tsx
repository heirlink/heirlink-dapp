"use client";

import * as React from "react";
import { useInheritanceForm } from "@/hooks/useInheritanceForm";
import { useInheritanceContract } from "@/hooks/useInheritanceContract";
import {
  TokenSection,
  HeirsSection,
  FormErrors,
  MerkleResult,
} from "./inheritance";

const ZERO = "0x0000000000000000000000000000000000000000";

export function InheritanceForm() {
  const { sendToContract, updateVault, deployNewVault, vaultAddress } =
    useInheritanceContract();
  const [periodDays, setPeriodDays] = React.useState(365);

  const hasVault =
    vaultAddress &&
    (vaultAddress as string).toLowerCase() !== ZERO.toLowerCase();

  const form = useInheritanceForm({
    onAfterGenerate: async (result, mode) => {
      const tokens = result.tokens ?? [];
      if (mode === "update") {
        await updateVault(result.root, tokens);
      } else {
        await deployNewVault(result.root, tokens, periodDays);
      }
    },
    vaultAddress: hasVault ? vaultAddress : undefined,
  });

  return (
    <div className="mt-8 space-y-10">
      <TokenSection
        treeMode={form.treeMode}
        setTreeMode={form.setTreeMode}
        includeEth={form.includeEth}
        setIncludeEth={form.setIncludeEth}
        tokens={form.tokens}
        addToken={form.addToken}
        removeToken={form.removeToken}
        setToken={form.setToken}
        tokenInfosMap={form.tokenInfosMap}
        duplicateIndices={form.duplicateIndices}
        ethBalance={form.ethBalance}
        userAddress={form.userAddress}
      />

      <HeirsSection
        heirs={form.heirs}
        includeEth={form.includeEth}
        tokenErrors={form.tokenErrors}
        setHeirId={form.setHeirId}
        setHeirName={form.setHeirName}
        setHeirShare={form.setHeirShare}
        removeHeir={form.removeHeir}
        addHeir={form.addHeir}
      />

      <FormErrors
        hasDuplicates={form.duplicateIndices.size > 0}
        hasTokenErrors={form.tokenErrors.size > 0}
        hasHeirIdError={form.heirIdError}
      />

      <div className="flex flex-wrap items-center justify-center gap-6">
        <label className="flex items-center gap-2 text-sm text-muted">
          Период неактивности (дней):
          <input
            type="number"
            min={1}
            value={periodDays}
            onChange={(e) => setPeriodDays(parseInt(e.target.value, 10) || 365)}
            className="w-20 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-ink outline-none focus:ring-2 focus:ring-gold/30"
          />
        </label>
        {hasVault ? (
          <>
            <button
              type="button"
              onClick={() => form.handleSubmit("update")}
              disabled={!form.canSubmit}
              className="rounded-xl border-2 border-gold bg-gold px-8 py-3 font-semibold text-ink shadow-md hover:bg-gold/90 disabled:border-black/20 disabled:bg-muted disabled:text-muted disabled:shadow-none"
            >
              Обновить хранилище
            </button>
            <button
              type="button"
              onClick={() => form.handleSubmit("createNew")}
              disabled={!form.canSubmit}
              className="rounded-xl border-2 border-gold/70 bg-gold/80 px-8 py-3 font-semibold text-ink shadow-md hover:bg-gold/90 disabled:border-black/20 disabled:bg-muted disabled:text-muted disabled:shadow-none"
            >
              Создать новое хранилище
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => form.handleSubmit("createNew")}
            disabled={!form.canSubmit}
            className="rounded-xl border-2 border-gold bg-gold px-8 py-3 font-semibold text-ink shadow-md hover:bg-gold/90 disabled:border-black/20 disabled:bg-muted disabled:text-muted disabled:shadow-none"
          >
            Создать хранилище
          </button>
        )}
      </div>

      {form.merkleResult && (
        <MerkleResult
          result={form.merkleResult}
          effectiveTokens={form.effectiveTokens}
          onDownload={form.doDownload}
          onSendToContract={sendToContract}
        />
      )}
    </div>
  );
}
