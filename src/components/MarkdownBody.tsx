import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";

export function MarkdownBody({ children }: { children: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        components={{
          h1: ({ children: content }) => (
            <h1 className="mt-0 text-h1 font-medium tracking-wordmark">{content}</h1>
          ),
          h2: ({ children: content }) => (
            <h2 className="mt-10 text-h2 font-medium">{content}</h2>
          ),
          h3: ({ children: content }) => (
            <h3 className="mt-8 text-h3 font-medium">{content}</h3>
          ),
          p: ({ children: content }) => <p className="mt-4">{content}</p>,
          ul: ({ children: content }) => (
            <ul className="mt-4 list-disc space-y-1 pl-5">{content}</ul>
          ),
          ol: ({ children: content }) => (
            <ol className="mt-4 list-decimal space-y-1 pl-5">{content}</ol>
          ),
          li: ({ children: content }) => <li>{content}</li>,
          strong: ({ children: content }) => (
            <strong className="font-medium">{content}</strong>
          ),
          a: ({ href, children: content }) => (
            <a href={href} className="underline decoration-green/70 underline-offset-4">
              {content}
            </a>
          ),
          hr: () => <hr className="my-10 border-paper-ink/15" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function PaperPage({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[calc(100dvh-4.5rem)] bg-paper text-paper-ink">
      <article className="mx-auto max-w-[38rem] px-6 py-16 sm:px-8 lg:py-20">{children}</article>
    </main>
  );
}
