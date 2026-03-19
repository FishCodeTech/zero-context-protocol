import { notFound } from "next/navigation";

import { DocsIndexView } from "../../_components/docs-index-view";
import { normalizeLocale } from "../../lib/i18n";

export default async function LocalizedDocsIndexPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = normalizeLocale(lang);
  if (locale !== "zh") {
    notFound();
  }

  return <DocsIndexView locale="zh" />;
}
