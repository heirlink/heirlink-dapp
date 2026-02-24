"use client";

import { HeirCard } from "./HeirCard";
import type { HeirForm } from "@/types/inheritance";

type HeirsSectionProps = {
  heirs: HeirForm[];
  includeEth: boolean;
  tokenErrors: Set<number>;
  setHeirId: (i: number, v: string) => void;
  setHeirName: (i: number, v: string) => void;
  setHeirShare: (heirIdx: number, tokenIdx: number, v: string) => void;
  removeHeir: (i: number) => void;
  addHeir: () => void;
};

export function HeirsSection({
  heirs,
  includeEth,
  tokenErrors,
  setHeirId,
  setHeirName,
  setHeirShare,
  removeHeir,
  addHeir,
}: HeirsSectionProps) {
  return (
    <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
      <h2 className="text-lg font-semibold text-ink">Наследники</h2>
      <p className="mt-1 text-sm text-muted">
        ID наследника и доли в % по каждому токену (сумма по токену ≤ 100%).
      </p>
      <div className="mt-4 space-y-6">
        {heirs.map((heir, hi) => (
          <HeirCard
            key={hi}
            heir={heir}
            includeEth={includeEth}
            tokenErrors={tokenErrors}
            onHeirIdChange={(v) => setHeirId(hi, v)}
            onNameChange={(v) => setHeirName(hi, v)}
            onShareChange={(ti, v) => setHeirShare(hi, ti, v)}
            onRemove={() => removeHeir(hi)}
            canRemove={heirs.length > 1}
          />
        ))}
        <button
          type="button"
          onClick={addHeir}
          className="rounded-xl border-2 border-dashed border-gold bg-gold/20 px-4 py-2 text-sm font-medium text-ink hover:bg-gold/30"
        >
          + Добавить наследника
        </button>
      </div>
    </section>
  );
}
