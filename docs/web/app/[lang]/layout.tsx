import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { normalizeLocale } from "../lib/i18n";

export default async function LocalizedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = normalizeLocale(lang);
  if (locale !== "zh") {
    notFound();
  }

  return children;
}
