import { DocsSidebar } from "@/components/docs/DocsSidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-5xl px-6 py-16">
      <DocsSidebar />
      <div className="min-w-0 flex-1 pl-10">{children}</div>
    </div>
  );
}
