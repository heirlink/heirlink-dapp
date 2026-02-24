"use client";

import * as React from "react";
import { SecretSharingForm } from "../../components/SecretSharingForm";
import { ProofVerification } from "../../components/ProofVerification";

export default function SecretPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Тесты</h1>
        <p className="mt-2 text-muted">
          Разделение секрета по Шамиру и проверка Merkle proof. Всё выполняется
          в браузере.
        </p>
      </header>

      <section>
        <h2 className="mb-6 text-xl font-semibold text-ink">
          Разделение секрета
        </h2>
        <div className="space-y-10">
          <div>
            <h3 className="mb-2 text-lg font-medium text-ink">
              Shamir Secret Sharing
            </h3>
            <p className="mb-4 text-sm text-muted">
              Разделите секрет на доли и восстановите его из минимального
              количества долей.
            </p>
            <SecretSharingForm />
          </div>

          <div>
            <ProofVerification />
          </div>
        </div>
      </section>
    </div>
  );
}
