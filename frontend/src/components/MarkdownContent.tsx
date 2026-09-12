import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-yaml';

interface MarkdownContentProps {
  content: string;
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
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-lang-label">{cleanLang}</span>
        <button
          className={`btn-copy-code ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          type="button"
          aria-label="Copy code block"
        >
          {copied ? (
            <>
              <Check size={12} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-block-pre">
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

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code className="inline-code" {...props}>
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
              <div className="table-scroll-wrapper">
                <table className="markdown-table">{children}</table>
              </div>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
