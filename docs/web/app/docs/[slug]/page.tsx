import { notFound } from "next/navigation";

import { MarkdownDocument } from "../../_components/markdown-document";
import { PageShell } from "../../_components/page-shell";
import { DOC_SLUGS, getDocEntry, getDocSections, parseMarkdown, readDocEntry } from "../../lib/docs";

export async function generateStaticParams() {
  return DOC_SLUGS.map((slug) => ({ slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getDocEntry(slug, "en");
  if (!entry) {
    notFound();
  }

  const loaded = await readDocEntry(slug, "en");
  const { blocks, headings } = parseMarkdown(loaded.markdown);
  const navSections = getDocSections("en").map((section) => ({
    title: section.title,
    items: section.entries.map((docEntry) => ({
      href: `/docs/${docEntry.slug}`,
      label: docEntry.title,
      active: docEntry.slug === slug,
    })),
  }));

  return (
    <PageShell
      locale="en"
      title={loaded.entry.title}
      description={loaded.entry.description}
      navSections={navSections}
    >
      <MarkdownDocument blocks={blocks} headings={headings} locale="en" />
    </PageShell>
  );
}
