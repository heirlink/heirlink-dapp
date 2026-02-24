import { notFound } from "next/navigation";
import { getDocContent, docsNav } from "@/lib/docs";
import { MarkdownContent } from "@/components/docs/MarkdownContent";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export function generateStaticParams() {
  return docsNav.map((d) => ({
    slug: d.slug === "" ? [] : [d.slug],
  }));
}

export default async function DocsPage({ params }: PageProps) {
  const { slug } = await params;
  const slugStr = slug?.[0] ?? "";

  const validSlugs = new Set(docsNav.map((d: { slug: string }) => d.slug));
  if (slug && slug.length > 1) notFound();
  if (!validSlugs.has(slugStr)) notFound();

  const content = getDocContent(slugStr);
  if (!content) notFound();

  return <MarkdownContent content={content} />;
}
