"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsNav } from "@/content/docs/config";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r border-black/10 pr-6">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
        Документация
      </h3>
      <ul className="space-y-1">
        {docsNav.map(({ slug, title }) => {
          const href = slug === "" ? "/docs" : `/docs/${slug}`;
          const isActive =
            pathname === href || (slug !== "" && pathname.startsWith(href));
          return (
            <li key={slug || "index"}>
              <Link
                href={href}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-gold/20 font-medium text-ink"
                    : "text-muted hover:bg-black/5 hover:text-ink"
                }`}
              >
                {title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
