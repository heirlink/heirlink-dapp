"use client";

import { useEffect } from "react";
import { InheritanceForm } from "@/components/InheritanceForm";
import { buildLeaf } from "@/lib/merkle";

export default function HomePage() {
  useEffect(() => {
    const leaf = buildLeaf(BigInt(332), [3000, 4000]);
    console.log(leaf);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        Распределение наследства
      </h1>
      <p className="mt-2 text-muted">
        Введите токены и доли наследников. Сумма долей по каждому токену не
        должна превышать 100%.
      </p>

      <InheritanceForm />
    </div>
  );
}
