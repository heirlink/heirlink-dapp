"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-semibold text-ink transition hover:text-gold"
          >
            Heirlink
          </Link>
          <div className="flex gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition hover:text-gold ${
                pathname === "/" ? "text-ink" : "text-muted"
              }`}
            >
              Наследство
            </Link>
            <Link
              href="/manage"
              className={`text-sm font-medium transition hover:text-gold ${
                pathname === "/manage" ? "text-ink" : "text-muted"
              }`}
            >
              Управлять наследством
            </Link>
            <Link
              href="/claim"
              className={`text-sm font-medium transition hover:text-gold ${
                pathname === "/claim" ? "text-ink" : "text-muted"
              }`}
            >
              Получить наследство
            </Link>
            <Link
              href="/docs"
              className={`text-sm font-medium transition hover:text-gold ${
                pathname?.startsWith("/docs") ? "text-ink" : "text-muted"
              }`}
            >
              Документация
            </Link>
            <Link
              href="/secret"
              className={`text-sm font-medium transition hover:text-gold ${
                pathname === "/secret" ? "text-ink" : "text-muted"
              }`}
            >
              Тесты
            </Link>
          </div>
        </div>

        <div className="shrink-0">
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </nav>
  );
}
