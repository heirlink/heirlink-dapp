"use client";

import ReactMarkdown from "react-markdown";

const components = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-4 text-2xl font-semibold text-ink">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-3 mt-8 border-b border-black/10 pb-2 text-xl font-semibold text-ink">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-2 mt-6 text-lg font-semibold text-ink">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-4 leading-relaxed text-muted">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-4 ml-6 list-disc space-y-1 text-muted">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-1 text-muted">{children}</ol>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-sm text-ink">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-black/10 bg-black/5 p-4 text-sm">
      {children}
    </pre>
  ),
};

type MarkdownContentProps = {
  content: string;
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="max-w-none">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
