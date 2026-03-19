import { notFound } from "next/navigation";

import { TechnicalReportPage } from "../../_components/technical-report-page";
import { normalizeLocale } from "../../lib/i18n";

export default async function LocalizedArchitecturePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = normalizeLocale(lang);
  if (locale !== "zh") {
    notFound();
  }

  return <TechnicalReportPage locale="zh" />;
}
