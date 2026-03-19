import { notFound } from "next/navigation";

import { BenchmarksPageView } from "../../_components/benchmarks-page-view";
import { normalizeLocale } from "../../lib/i18n";

export default async function LocalizedBenchmarksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = normalizeLocale(lang);
  if (locale !== "zh") {
    notFound();
  }

  return <BenchmarksPageView locale="zh" />;
}
