"use client";

import { isValidAddress } from "@/lib/inheritance-utils";
import type { MerkleResult as MerkleResultType } from "@/types/inheritance";

type MerkleResultProps = {
  result: MerkleResultType;
  effectiveTokens: string[];
  onDownload: (result: MerkleResultType) => void;
  onSendToContract?: (root: string, tokens: string[]) => void;
};

export function MerkleResult({
  result,
  effectiveTokens,
  onDownload,
  onSendToContract,
}: MerkleResultProps) {
  const tokenList =
    result.tokens ?? effectiveTokens.filter((t) => isValidAddress(t.trim()));

  const handleDownload = () => {
    onDownload({ ...result, tokens: tokenList });
  };

  return (
    <section className="rounded-2xl border-2 border-gold/50 bg-white p-6 shadow-md">
      <h2 className="text-lg font-semibold text-ink">Результат</h2>
      <p className="mt-1 text-sm text-muted">
        Скачаны общее дерево (merkleTree.json) и по одному файлу на наследника
        (heir_*.json).
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-xl border-2 border-ink bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
        >
          Скачать снова
        </button>
        {onSendToContract && (
          <button
            type="button"
            onClick={() => onSendToContract(result.root, tokenList)}
            className="rounded-xl border-2 border-gold bg-gold/20 px-4 py-2 text-sm font-medium text-ink hover:bg-gold/30"
          >
            Отправить в контракт
          </button>
        )}
      </div>
    </section>
  );
}
