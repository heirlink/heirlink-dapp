"use client";

import type { HeirForm } from "@/types/inheritance";

type HeirCardProps = {
  heir: HeirForm;
  includeEth: boolean;
  tokenErrors: Set<number>;
  onHeirIdChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onShareChange: (tokenIdx: number, v: string) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export function HeirCard({
  heir,
  includeEth,
  tokenErrors,
  onHeirIdChange,
  onNameChange,
  onShareChange,
  onRemove,
  canRemove,
}: HeirCardProps) {
  return (
    <div className="rounded-xl border border-black/5 bg-white/60 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={heir.heirId}
          onChange={(e) => onHeirIdChange(e.target.value)}
          placeholder="ID наследника"
          className="w-32 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/30"
        />
        <input
          type="text"
          value={heir.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Имя"
          className="min-w-[140px] flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/30"
        />
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm text-muted hover:bg-black/5 disabled:opacity-40"
        >
          Удалить
        </button>
      </div>
      <div className="mb-2 text-xs text-muted">Доли по токенам (%)</div>
      <div className="flex flex-wrap gap-2">
        {heir.shares.map((s, ti) => (
          <div key={ti} className="flex flex-col">
            <label className="text-xs text-muted">
              {includeEth && ti === 0
                ? "ETH"
                : `Токен ${includeEth ? ti : ti + 1}`}
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={s}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || v === "-") {
                  onShareChange(ti, v);
                  return;
                }
                const n = parseFloat(v);
                if (!Number.isNaN(n)) {
                  const rounded = Math.min(100, Math.max(0, Math.round(n)));
                  onShareChange(ti, String(rounded));
                } else {
                  onShareChange(ti, v);
                }
              }}
              className={`mt-1 w-20 rounded-lg border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gold/30 ${
                tokenErrors.has(ti)
                  ? "border-red-500 bg-red-50"
                  : "border-black/10 bg-white"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
