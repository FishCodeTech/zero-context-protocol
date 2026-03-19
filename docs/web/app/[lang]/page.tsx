import { notFound } from "next/navigation";

import { HomePageView } from "../_components/home-page-view";
import { normalizeLocale } from "../lib/i18n";

export default async function LocalizedHomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = normalizeLocale(lang);
  if (locale !== "zh") {
    notFound();
  }

  return <HomePageView locale="zh" />;
}
