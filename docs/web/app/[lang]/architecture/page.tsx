import { notFound } from "next/navigation";

import { SimpleDocPage } from "../../_components/simple-doc-page";
import { normalizeLocale } from "../../lib/i18n";
import { simplePageCopy } from "../../lib/site-copy";

export default async function LocalizedArchitecturePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = normalizeLocale(lang);
  if (locale !== "zh") {
    notFound();
  }

  return <SimpleDocPage locale="zh" page={simplePageCopy.zh.architecture} />;
}
