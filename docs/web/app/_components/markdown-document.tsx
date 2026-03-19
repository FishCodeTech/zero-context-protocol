import Link from "next/link";
import { Fragment, ReactNode } from "react";

import { Heading, MarkdownBlock } from "../lib/docs";
import { localeHref, Locale } from "../lib/i18n";

export function MarkdownDocument({
  blocks,
  headings,
  locale = "en",
}: {
  blocks: MarkdownBlock[];
  headings: Heading[];
  locale?: Locale;
}) {
  return (
    <div className="doc-layout">
      <article className="markdown-body">
        {blocks.map((block, index) => renderBlock(block, index, locale))}
      </article>
      <aside className="doc-outline">
        <div className="side-panel-label">{locale === "zh" ? "本页目录" : "On This Page"}</div>
        <nav className="outline-nav">
          {headings
            .filter((heading) => heading.level >= 2)
            .map((heading) => (
              <a key={heading.id} href={`#${heading.id}`} data-level={heading.level}>
                {heading.text}
              </a>
            ))}
        </nav>
      </aside>
    </div>
  );
}

function renderBlock(block: MarkdownBlock, index: number, locale: Locale): ReactNode {
  if (block.type === "heading") {
    const content = renderInline(block.text, locale);
    if (block.level === 1) {
      return <h1 key={block.id}>{content}</h1>;
    }
    if (block.level === 2) {
      return (
        <h2 key={block.id} id={block.id}>
          {content}
        </h2>
      );
    }
    return (
      <h3 key={block.id} id={block.id}>
        {content}
      </h3>
    );
  }

  if (block.type === "paragraph") {
    return <p key={`p-${index}`}>{renderInline(block.text, locale)}</p>;
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag key={`list-${index}`}>
        {block.items.map((item, itemIndex) => (
          <li key={`${itemIndex}-${item}`}>{renderInline(item, locale)}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "code") {
    return (
      <pre key={`code-${index}`}>
        <code>{block.code}</code>
      </pre>
    );
  }

  return (
    <div className="table-wrap" key={`table-${index}`}>
      <table>
        <thead>
          <tr>
            {block.headers.map((header) => (
              <th key={header}>{renderInline(header, locale)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join("-")}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{renderInline(cell, locale)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInline(text: string, locale: Locale): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("`")) {
      parts.push(<code key={`${match.index}-${token}`}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[")) {
      const parsed = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (parsed) {
        const [, label, href] = parsed;
        const external = /^https?:\/\//.test(href);
        parts.push(
          external ? (
            <a key={`${match.index}-${href}`} href={href} target="_blank" rel="noreferrer">
              {label}
            </a>
          ) : (
            <Link
              key={`${match.index}-${href}`}
              href={href.startsWith("#") ? href : localeHref(locale, href)}
            >
              {label}
            </Link>
          ),
        );
      } else {
        parts.push(token);
      }
    } else if (token.startsWith("**")) {
      parts.push(<strong key={`${match.index}-${token}`}>{token.slice(2, -2)}</strong>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.map((part, index) => <Fragment key={index}>{part}</Fragment>);
}
