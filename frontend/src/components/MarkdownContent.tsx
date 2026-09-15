import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RiFileCopyLine, RiCheckLine, RiFileTextLine, RiZoomInLine } from '@remixicon/react';
import Prism from 'prismjs';
import { ImageLightboxModal } from './ImageLightboxModal';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-yaml';

interface MarkdownContentProps {
  content: string;
  onCitationClick?: (docName: string, page?: string) => void;
}

interface CodeBlockProps {
  language: string;
  codeString: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, codeString }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const cleanLang = language.toLowerCase() || 'text';
  let highlightedHtml = '';
  try {
    const grammar = Prism.languages[cleanLang] || Prism.languages.text;
    if (grammar) {
      highlightedHtml = Prism.highlight(codeString, grammar, cleanLang);
    }
  } catch {
    highlightedHtml = '';
  }

  return (
    <div className="relative my-3 rounded-2xl bg-background-secondary-default border border-border-button-default overflow-hidden text-caption-1-regular shadow-xs">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-separator-border bg-background-tertiary-default/60">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
          {cleanLang}
        </span>
        <button
          className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-text-primary px-2 py-0.5 rounded-md hover:bg-background-secondary-hover transition-colors"
          onClick={handleCopy}
          type="button"
          aria-label="Copy code block"
        >
          {copied ? (
            <>
              <RiCheckLine className="size-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <RiFileCopyLine className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-[12.5px] leading-relaxed text-text-primary">
        {highlightedHtml ? (
          <code
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            className={`language-${cleanLang}`}
          />
        ) : (
          <code>{codeString}</code>
        )}
      </pre>
    </div>
  );
};

const MarkdownImage: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
  const [modalOpen, setModalOpen] = useState(false);
  if (!src) return null;

  return (
    <>
      <span className="relative group/mdimg inline-block my-2 max-w-full">
        <span
          onClick={() => setModalOpen(true)}
          className="relative block overflow-hidden rounded-2xl border border-border-button-default bg-background-secondary-default cursor-pointer hover:border-emerald-500/40 transition-all shadow-xs"
          title="Click to view full resolution"
        >
          <img
            src={src}
            alt={alt || 'Image preview'}
            className="max-h-80 max-w-full rounded-2xl object-cover group-hover/mdimg:scale-[1.01] transition-transform duration-200"
          />
          <span className="absolute inset-0 bg-black/0 group-hover/mdimg:bg-black/35 transition-colors flex items-center justify-center opacity-0 group-hover/mdimg:opacity-100">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/85 text-white text-caption-1-medium border border-white/15 shadow-lg backdrop-blur-sm">
              <RiZoomInLine className="size-4 text-emerald-400" />
              <span>Click to Enlarge</span>
            </span>
          </span>
        </span>
      </span>
      <ImageLightboxModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        src={src}
        alt={alt}
        title={alt || 'Document Image / Diagram'}
      />
    </>
  );
};

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, onCitationClick }) => {
  // Replace citation patterns with custom token to render as link chips
  const parseCitationText = (text: string) => {
    const citationRegex = /\[Source:\s*([^\|\]]+?)\s*\|\s*Page:\s*([^\|\]]+?)(?:\s*\|\s*Similarity:\s*([^\]]+?))?\]/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const doc = match[1].trim();
      const page = match[2].trim();
      const sim = match[3]?.trim();

      parts.push(
        <button
          key={match.index}
          type="button"
          onClick={() => onCitationClick?.(doc, page)}
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-caption-1-medium transition-colors cursor-pointer select-none"
          title={`Grounded citation: ${doc}, page ${page}${sim ? ` (${Math.round(parseFloat(sim) * 100)}% match)` : ''}`}
        >
          <RiFileTextLine className="size-3 shrink-0" />
          <span className="max-w-[120px] truncate font-medium">{doc}</span>
          <span className="opacity-80 text-[10.5px]">p.{page}</span>
        </button>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="prose prose-invert max-w-none text-body-regular text-text-primary leading-relaxed space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            if (typeof children === 'string') {
              return <p className="mb-2 leading-relaxed">{parseCitationText(children)}</p>;
            }
            if (Array.isArray(children)) {
              return (
                <p className="mb-2 leading-relaxed">
                  {children.map((child, i) =>
                    typeof child === 'string' ? (
                      <React.Fragment key={i}>{parseCitationText(child)}</React.Fragment>
                    ) : (
                      child
                    )
                  )}
                </p>
              );
            }
            return <p className="mb-2 leading-relaxed">{children}</p>;
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-background-tertiary-default text-emerald-400 font-mono text-[12px] border border-border-button-default"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const codeText = String(children).replace(/\n$/, '');
            return (
              <CodeBlock
                language={match ? match[1] : 'code'}
                codeString={codeText}
              />
            );
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-xl border border-border-button-default">
                <table className="w-full text-left text-body-2-regular">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 bg-background-secondary-default text-text-secondary font-semibold border-b border-border-button-default">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3 py-2 border-b border-border-separator-border text-text-primary">
                {children}
              </td>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline hover:text-emerald-300 font-medium"
              >
                {children}
              </a>
            );
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-emerald-500 pl-3.5 my-2 text-text-secondary italic">
                {children}
              </blockquote>
            );
          },
          img({ src, alt }) {
            return <MarkdownImage src={src as string} alt={alt} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
