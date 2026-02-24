"use client";

import * as React from "react";
import { verifyMerkleProof } from "@/lib/merkle";

type TreeFile = { root: string; tokens?: string[] };
type ProofFile = {
  leaf: string;
  proof: string[];
  heirId?: number;
  name?: string;
  sharesBps?: number[];
};

export function ProofVerification() {
  const [treeFile, setTreeFile] = React.useState<TreeFile | null>(null);
  const [proofFile, setProofFile] = React.useState<ProofFile | null>(null);
  const [treeError, setTreeError] = React.useState<string | null>(null);
  const [proofError, setProofError] = React.useState<string | null>(null);
  const [verified, setVerified] = React.useState<boolean | null>(null);

  const onTreeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTreeError(null);
    setTreeFile(null);
    setVerified(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as unknown;
        if (
          json &&
          typeof json === "object" &&
          "root" in json &&
          typeof (json as TreeFile).root === "string"
        ) {
          setTreeFile({
            root: (json as TreeFile).root,
            tokens: (json as TreeFile).tokens,
          });
        } else {
          setTreeError("В файле должен быть объект с полем root (строка)");
        }
      } catch {
        setTreeError("Неверный JSON");
      }
    };
    reader.readAsText(file);
  };

  const onProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofError(null);
    setProofFile(null);
    setVerified(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as unknown;
        if (
          json &&
          typeof json === "object" &&
          "leaf" in json &&
          "proof" in json
        ) {
          const p = json as ProofFile;
          if (typeof p.leaf !== "string" || !Array.isArray(p.proof)) {
            setProofError(
              "В файле должны быть поля leaf (строка) и proof (массив)",
            );
            return;
          }
          setProofFile(p);
        } else {
          setProofError("В файле должны быть поля leaf и proof");
        }
      } catch {
        setProofError("Неверный JSON");
      }
    };
    reader.readAsText(file);
  };

  const handleVerify = () => {
    setVerified(null);
    if (!treeFile) {
      setTreeError("Загрузите файл дерева (merkleTree.json)");
      return;
    }
    if (!proofFile) {
      setProofError("Загрузите файл с пруфом (heir_*.json)");
      return;
    }
    setTreeError(null);
    setProofError(null);
    const ok = verifyMerkleProof(
      proofFile.proof,
      proofFile.leaf,
      treeFile.root,
    );
    setVerified(ok);
  };

  return (
    <section className="rounded-2xl border border-black/5 bg-paper/40 p-6">
      <h2 className="text-lg font-semibold text-ink">Проверка Merkle proof</h2>
      <p className="mt-1 text-sm text-muted">
        Загрузите файл дерева (root) и файл наследника (leaf + proof). Проверка
        убедится, что лист входит в дерево с данным корнем.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink">
            1. Файл дерева (merkleTree.json)
          </label>
          <p className="text-xs text-muted">
            Объект с полем root и опционально tokens
          </p>
          <input
            type="file"
            accept=".json,application/json"
            onChange={onTreeChange}
            className="mt-1 block w-full max-w-sm text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink file:hover:bg-gold/30"
          />
          {treeError && (
            <p className="mt-1 text-sm text-red-600">{treeError}</p>
          )}
          {treeFile && (
            <p className="mt-1 text-sm text-green-700">
              Загружено: root = {treeFile.root.slice(0, 18)}…
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">
            2. Файл с пруфом (heir_*.json)
          </label>
          <p className="text-xs text-muted">Объект с полями leaf и proof</p>
          <input
            type="file"
            accept=".json,application/json"
            onChange={onProofChange}
            className="mt-1 block w-full max-w-sm text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink file:hover:bg-gold/30"
          />
          {proofError && (
            <p className="mt-1 text-sm text-red-600">{proofError}</p>
          )}
          {proofFile && (
            <p className="mt-1 text-sm text-green-700">
              Загружено: leaf = {proofFile.leaf.slice(0, 18)}…, proof length ={" "}
              {proofFile.proof.length}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={!treeFile || !proofFile}
          className="rounded-xl border-2 border-gold bg-gold px-6 py-2 text-sm font-semibold text-ink hover:bg-gold/90 disabled:border-black/20 disabled:bg-muted disabled:text-muted"
        >
          Проверить proof по root
        </button>

        {verified !== null && (
          <div
            className={`rounded-xl border p-4 text-sm font-medium ${
              verified
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            {verified
              ? "Пруф верен: лист входит в дерево с данным корнем."
              : "Пруф неверен: лист не входит в дерево с данным корнем."}
          </div>
        )}
      </div>
    </section>
  );
}
