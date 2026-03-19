import Link from "next/link";
import { Fragment, ReactNode } from "react";

import { Locale, localeHref } from "../lib/i18n";
import { SimplePageCopy } from "../lib/site-copy";

export function SimpleDocPage({ locale, page }: { locale: Locale; page: SimplePageCopy }) {
  return (
    <div className="site-shell article">
      <aside className="sidebar">
        <div className="eyebrow">{page.navLabel}</div>
        <nav>
          {page.nav.map((item) => (
            <Link href={localeHref(locale, item.href)} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="prose">
        <h1>{page.title}</h1>
        <div className="page-summary">
          <p>{renderInline(page.summary, locale)}</p>
        </div>
        {page.intro?.map((paragraph) => (
          <p key={paragraph}>{renderInline(paragraph, locale)}</p>
        ))}

        {page.sections.map((section) => (
          <section className="simple-page-section" id={section.id} key={section.id}>
            <h2>{section.title}</h2>
            {section.body?.map((paragraph) => (
              <p key={paragraph}>{renderInline(paragraph, locale)}</p>
            ))}
            {section.code ? <pre>{section.code}</pre> : null}
            {section.list ? (
              <ul className="summary-list">
                {section.list.map((item) => (
                  <li key={item}>{renderInline(item, locale)}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <h2 id="read-next">{locale === "zh" ? "继续阅读" : "Read next"}</h2>
        <p>
          {page.readNext.map((item, index) => (
            <span key={item.href}>
              {index > 0 ? ", " : ""}
              <Link href={localeHref(locale, item.href)}>{item.label}</Link>
            </span>
          ))}
          .
        </p>
      </main>
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
    } else if (token.startsWith("**")) {
      parts.push(<strong key={`${match.index}-${token}`}>{token.slice(2, -2)}</strong>);
    } else {
      const parsed = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (parsed) {
        const [, label, href] = parsed;
        parts.push(
          <Link href={href.startsWith("#") ? href : localeHref(locale, href)} key={`${match.index}-${href}`}>
            {label}
          </Link>,
        );
      } else {
        parts.push(token);
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.map((part, index) => <Fragment key={index}>{part}</Fragment>);
}
