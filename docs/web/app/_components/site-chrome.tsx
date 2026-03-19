"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { chromeCopy, localeHref } from "../lib/i18n";
import { LanguageToggle } from "./language-toggle";

const DOC_SECTION_LINKS = {
  en: [
    { id: "overview", title: "Overview" },
    { id: "concepts", title: "Concepts" },
    { id: "guides", title: "Guides" },
    { id: "examples", title: "Examples" },
    { id: "reference", title: "Reference" },
  ],
  zh: [
    { id: "overview", title: "概览" },
    { id: "concepts", title: "核心概念" },
    { id: "guides", title: "指南" },
    { id: "examples", title: "示例" },
    { id: "reference", title: "参考" },
  ],
} as const;

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const locale = pathname === "/zh" || pathname.startsWith("/zh/") ? "zh" : "en";

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const copy = chromeCopy[locale];
  const sections = DOC_SECTION_LINKS[locale];
  const primaryLinks = [
    { href: "/", label: copy.home },
    { href: "/docs", label: copy.docs },
    { href: "/quickstart", label: copy.quickstart },
    { href: "/architecture", label: copy.architecture },
    { href: "/sdk", label: copy.sdk },
    { href: "/benchmarks", label: copy.benchmarks },
    { href: "/deploy", label: copy.deploy },
  ];

  return (
    <div className="site-root">
      <header className="site-header">
        <div className="site-shell header-row">
          <Link href={localeHref(locale, "/")} className="wordmark">
            Zero Context Protocol
          </Link>
          <nav className="primary-nav" aria-label="Primary">
            {primaryLinks.map((link) => (
              <Link key={link.href} href={localeHref(locale, link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>
          <LanguageToggle />
        </div>
        <div className="site-shell docs-bar">
          <span className="docs-bar-label">{copy.browseBySection}</span>
          <nav className="docs-nav" aria-label="Documentation Sections">
            {sections.map((section) => (
              <Link key={section.id} href={localeHref(locale, `/docs#${section.id}`)}>
                {section.title}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
