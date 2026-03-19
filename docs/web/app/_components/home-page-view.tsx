import Link from "next/link";

import { getDocSections } from "../lib/docs";
import { Locale, localeHref } from "../lib/i18n";
import { homeCopy } from "../lib/site-copy";

export function HomePageView({ locale }: { locale: Locale }) {
  const copy = homeCopy[locale];
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

      <section className="section-card">
        <h2 className="section-title">{copy.startTitle}</h2>
        <ul className="summary-list">
          {copy.startItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section-card">
        <h2 className="section-title">{copy.repositoryTitle}</h2>
        <p>{copy.repositoryDescription}</p>
        <div className="two-column-grid">
          {copy.repositories.map((repository) => (
            <article className="docs-section-card" key={repository.href}>
              <h2>{repository.name}</h2>
              <p>{repository.summary}</p>
              <div className="link-row">
                <Link className="button-link" href={repository.href} target="_blank" rel="noreferrer">
                  {copy.openRepository}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="docs-section-grid">
        {sections.map((section) => (
          <article className="docs-section-card" key={section.id}>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
            <div className="docs-section-list compact">
              {section.entries.slice(0, 3).map((entry) => (
                <Link className="docs-section-link" href={localeHref(locale, `/docs/${entry.slug}`)} key={entry.slug}>
                  <strong>{entry.title}</strong>
                  <span>{entry.summary}</span>
                </Link>
              ))}
            </div>
            <div className="link-row">
              <Link className="button-link" href={localeHref(locale, `/docs#${section.id}`)}>
                {copy.openSection}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
