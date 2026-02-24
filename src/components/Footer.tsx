import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/5 bg-paper/60">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Heirlink — обеспечение сохранности цифрового капитала
          </p>
          <div className="flex gap-6">
            <Link
              href="/"
              className="text-sm text-muted transition hover:text-gold"
            >
              Home
            </Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted/80">
          © {new Date().getFullYear()} Heirlink. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
