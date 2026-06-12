"use client";

import "@/styles/markdown.css";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article
      className="prose prose-slate max-w-none dark:prose-invert
        prose-headings:font-heading prose-headings:font-bold
        prose-h1:text-4xl prose-h1:mb-6
        prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
        prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:font-semibold prose-strong:text-foreground
        prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-muted prose-pre:border
        prose-img:rounded-lg prose-img:shadow-md
        prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic
        prose-ul:my-4 prose-ol:my-4
        prose-li:my-1"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
