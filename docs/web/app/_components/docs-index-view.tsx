import Link from "next/link";

import { getDocSections } from "../lib/docs";
import { Locale, localeHref } from "../lib/i18n";
import { docsIndexCopy } from "../lib/site-copy";

export function DocsIndexView({ locale }: { locale: Locale }) {
  const copy = docsIndexCopy[locale];
  const sections = getDocSections(locale);

  return (
    <div className="site-shell page-stack">
      <section className="intro-block">
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <div className="intro-actions">
          {copy.actions.map((action) => (
            <Link
              className={`button-link${action === copy.actions[0] ? " primary" : ""}`}
              href={localeHref(locale, action.href)}
              key={action.href}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="docs-section-grid">
        {sections.map((section) => (
          <article className="docs-section-card" id={section.id} key={section.id}>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
            <p>{section.summary}</p>
            <div className="docs-section-list">
              {section.entries.map((entry) => (
                <Link className="docs-section-link" href={localeHref(locale, `/docs/${entry.slug}`)} key={entry.slug}>
                  <strong>{entry.title}</strong>
                  <span>{entry.summary}</span>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
