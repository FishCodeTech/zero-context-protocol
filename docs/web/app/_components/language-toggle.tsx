"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { localeHref, stripLocaleFromPath } from "../lib/i18n";

export function LanguageToggle() {
  const pathname = usePathname();
  const basePath = stripLocaleFromPath(pathname || "/");
  const isZh = pathname === "/zh" || pathname?.startsWith("/zh/");

  return (
    <div className="language-toggle" aria-label="Language switch">
      <Link href={localeHref("en", basePath)} aria-current={!isZh ? "page" : undefined}>
        EN
      </Link>
      <Link href={localeHref("zh", basePath)} aria-current={isZh ? "page" : undefined}>
        中文
      </Link>
    </div>
  );
}
