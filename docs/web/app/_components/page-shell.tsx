import Link from "next/link";
import { ReactNode } from "react";

import { localeHref, Locale } from "../lib/i18n";

type NavItem = {
  href: string;
  label: string;
  active?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export function PageShell({
  locale,
  title,
  description,
  navSections,
  children,
}: {
  locale: Locale;
  title: string;
  description?: string;
  navSections: NavSection[];
  children: ReactNode;
}) {
  const label = locale === "zh" ? "文档" : "Docs";

  return (
    <div className="site-shell content-grid">
      <aside className="side-panel">
        <div className="side-panel-label">{label}</div>
        <div className="side-nav-groups">
          {navSections.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-group-label">{group.title}</div>
              <nav className="side-nav">
                {group.items.map((item) => (
                  <Link key={item.href} href={localeHref(locale, item.href)} aria-current={item.active ? "page" : undefined}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </aside>
      <section className="content-panel">
        <header className="page-header">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </header>
        {children}
      </section>
    </div>
  );
}
