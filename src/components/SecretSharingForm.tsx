"use client";

import * as React from "react";
import sss from "shamirs-secret-sharing";

const MAX_SHARES = 255;

export function SecretSharingForm() {
  const [mode, setMode] = React.useState<"generate" | "recover">("generate");

  return (
    <div className="mt-8 space-y-8">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("generate")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "generate"
              ? "bg-gold text-ink"
              : "border border-black/10 bg-white text-muted hover:bg-paper/60"
          }`}
        >
          Генерация
        </button>
        <button
          type="button"
          onClick={() => setMode("recover")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "recover"
              ? "bg-gold text-ink"
              : "border border-black/10 bg-white text-muted hover:bg-paper/60"
          }`}
        >
          Восстановление
        </button>
      </div>

      {mode === "generate" ? <GenerateSection /> : <RecoverSection />}
    </div>
  );
}

function GenerateSection() {
  const [secret, setSecret] = React.useState("");
  const [sharesCount, setSharesCount] = React.useState(5);
  const [threshold, setThreshold] = React.useState(3);
  const [shares, setShares] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    setShares([]);
    try {
      if (!secret.trim()) {
        setError("Введите секрет");
        return;
      }
      if (threshold > sharesCount) {
        setError("Порог не может быть больше количества долей");
        return;
      }
      if (sharesCount > MAX_SHARES) {
        setError(`Максимум ${MAX_SHARES} долей`);
        return;
      }

      const secretBuf = sss.Buffer.from(secret, "utf8");
      const sharesBuf = sss.split(secretBuf, {
        shares: sharesCount,
        threshold,
      });
      const hexShares = sharesBuf.map((b) => b.toString("hex"));
      setShares(hexShares);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка генерации");
    }
  };

  const copyAll = () => {
    const text = shares.map((s, i) => `Доля ${i + 1}: ${s}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
      <h2 className="text-lg font-semibold text-ink">Генерация долей</h2>
      <p className="mt-1 text-sm text-muted">
        Введите секрет, выберите количество долей и порог (минимум долей для
        восстановления).
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted">Секрет</label>
            <button
              type="button"
              onClick={() => {
                const bytes = new Uint8Array(32);
                crypto.getRandomValues(bytes);
                setSecret(
                  Array.from(bytes)
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join(""),
                );
              }}
              className="rounded-lg border border-gold/50 bg-gold/10 px-3 py-1.5 text-sm font-medium text-ink hover:bg-gold/20"
            >
              Сгенерировать секрет
            </button>
          </div>
          <textarea
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Ваш секретный ключ или фраза..."
            rows={3}
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <label className="text-sm text-muted">Количество долей</label>
            <input
              type="number"
              min={2}
              max={MAX_SHARES}
              value={sharesCount}
              onChange={(e) =>
                setSharesCount(parseInt(e.target.value, 10) || 2)
              }
              className="mt-1 w-24 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label className="text-sm text-muted">
              Порог (минимум для восстановления)
            </label>
            <input
              type="number"
              min={2}
              max={sharesCount}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10) || 2)}
              className="mt-1 w-24 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          className="rounded-xl border-2 border-gold bg-gold px-6 py-2 text-sm font-semibold text-ink hover:bg-gold/90"
        >
          Разделить секрет
        </button>

        {shares.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Доли (hex)</span>
              <button
                type="button"
                onClick={copyAll}
                className="text-sm text-gold hover:underline"
              >
                Копировать все
              </button>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-black/5 bg-white/80 p-4">
              {shares.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="shrink-0 text-xs text-muted">
                    Доля {i + 1}:
                  </span>
                  <code className="break-all font-mono text-xs text-ink">
                    {s}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(s)}
                    className="shrink-0 text-xs text-gold hover:underline"
                  >
                    Копировать
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function RecoverSection() {
  const [shareInputs, setShareInputs] = React.useState<string[]>(["", ""]);
  const [recovered, setRecovered] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const addShare = () => setShareInputs((s) => [...s, ""]);
  const removeShare = (i: number) => {
    if (shareInputs.length <= 2) return;
    setShareInputs((s) => s.filter((_, idx) => idx !== i));
  };
  const setShare = (i: number, v: string) => {
    setShareInputs((s) => {
      const next = [...s];
      next[i] = v;
      return next;
    });
  };

  const handleRecover = () => {
    setError(null);
    setRecovered(null);
    try {
      const hexShares = shareInputs.map((s) => s.trim()).filter(Boolean);
      if (hexShares.length < 2) {
        setError("Нужно минимум 2 доли");
        return;
      }

      const buffers = hexShares.map((h) => sss.Buffer.from(h, "hex"));
      const combined = sss.combine(buffers);
      setRecovered(combined.toString("utf8"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка восстановления");
    }
  };

  return (
    <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
      <h2 className="text-lg font-semibold text-ink">Восстановление секрета</h2>
      <p className="mt-1 text-sm text-muted">
        Вставьте hex-доли (минимум порог из генерации). Порядок не важен.
      </p>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          {shareInputs.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={s}
                onChange={(e) => setShare(i, e.target.value)}
                placeholder={`Доля ${i + 1} (hex)`}
                className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-gold/30"
              />
              <button
                type="button"
                onClick={() => removeShare(i)}
                disabled={shareInputs.length <= 2}
                className="rounded-xl border border-black/10 px-3 py-2 text-sm text-muted hover:bg-black/5 disabled:opacity-40"
              >
                −
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addShare}
            className="rounded-xl border-2 border-dashed border-gold bg-gold/20 px-4 py-2 text-sm font-medium text-ink hover:bg-gold/30"
          >
            + Добавить долю
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleRecover}
          className="rounded-xl border-2 border-gold bg-gold px-6 py-2 text-sm font-semibold text-ink hover:bg-gold/90"
        >
          Восстановить секрет
        </button>

        {recovered !== null && (
          <div className="mt-6 rounded-xl border border-gold/30 bg-gold/5 p-4">
            <div className="text-sm font-medium text-ink">
              Восстановленный секрет
            </div>
            <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-sm text-ink">
              {recovered}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
