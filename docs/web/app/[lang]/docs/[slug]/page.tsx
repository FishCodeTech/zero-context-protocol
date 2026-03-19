import { notFound } from "next/navigation";

import { MarkdownDocument } from "../../../_components/markdown-document";
import { PageShell } from "../../../_components/page-shell";
import { DOC_SLUGS, getDocEntry, getDocSections, parseMarkdown, readDocEntry } from "../../../lib/docs";
import { normalizeLocale } from "../../../lib/i18n";

export async function generateStaticParams() {
  return DOC_SLUGS.map((slug) => ({ lang: "zh", slug }));
}

export default async function LocalizedDocPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = normalizeLocale(lang);
  if (locale !== "zh") {
    notFound();
  }

  const entry = getDocEntry(slug, "zh");
  if (!entry) {
    notFound();
  }

  const loaded = await readDocEntry(slug, "zh");
  const { blocks, headings } = parseMarkdown(loaded.markdown);
  const navSections = getDocSections("zh").map((section) => ({
    title: section.title,
    items: section.entries.map((docEntry) => ({
      href: `/docs/${docEntry.slug}`,
      label: docEntry.title,
      active: docEntry.slug === slug,
    })),
  }));

  return (
    <PageShell locale="zh" title={loaded.entry.title} description={loaded.entry.description} navSections={navSections}>
      <MarkdownDocument blocks={blocks} headings={headings} locale="zh" />
    </PageShell>
  );
}
