export type Locale = "en" | "zh";

export function isSupportedLocale(value: string): value is Locale {
  return value === "en" || value === "zh";
}

export function normalizeLocale(value: string | undefined): Locale {
  return value === "zh" ? "zh" : "en";
}

export function localeHref(locale: Locale, href: string): string {
  if (locale === "en") {
    return href;
  }
  return href === "/" ? "/zh" : `/zh${href}`;
}

export function stripLocaleFromPath(pathname: string): string {
  if (pathname === "/zh") {
    return "/";
  }
  if (pathname.startsWith("/zh/")) {
    return pathname.slice(3);
  }
  return pathname;
}

export const chromeCopy = {
  en: {
    home: "Home",
    docs: "Docs",
    quickstart: "Quickstart",
    architecture: "Architecture",
    sdk: "SDK",
    benchmarks: "Benchmarks",
    deploy: "Deploy",
    browseBySection: "Browse by section",
    docsLabel: "Docs",
  },
  zh: {
    home: "首页",
    docs: "文档",
    quickstart: "快速开始",
    architecture: "架构",
    sdk: "SDK",
    benchmarks: "基准测试",
    deploy: "部署",
    browseBySection: "按分区浏览",
    docsLabel: "文档",
  },
} as const;
