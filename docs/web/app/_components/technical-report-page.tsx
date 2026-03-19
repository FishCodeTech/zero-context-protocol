import Link from "next/link";

import { getTechnicalReportCopy } from "../lib/technical-report";
import { Locale, localeHref } from "../lib/i18n";

export function TechnicalReportPage({ locale }: { locale: Locale }) {
  const copy = getTechnicalReportCopy(locale);

  return (
    <div className="site-shell article">
      <aside className="sidebar">
        <div className="eyebrow">{copy.navLabel}</div>
        <nav>
          {copy.nav.map((item) => (
            <a href={localeHref(locale, item.href)} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="prose report-paper">
        <header className="report-header">
          <h1>{copy.title}</h1>
          <div className="page-summary">
            <p>{copy.subtitle}</p>
          </div>
          <section className="report-abstract" id="abstract">
            <h2>{copy.abstractTitle}</h2>
            {copy.abstract.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
          <div className="report-metrics">
            {copy.metrics.map((metric) => (
              <div className="report-metric" key={metric.label}>
                <div className="report-metric-label">{metric.label}</div>
                <div className="report-metric-value">{metric.value}</div>
                <p>{metric.note}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="simple-page-section" id="architecture-figure">
          <h2>{copy.figureArchitectureTitle}</h2>
          <p>{copy.figureArchitectureCaption}</p>
          <ArchitectureFigure locale={locale} />
        </section>

        {copy.sections.map((section) => (
          <section className="simple-page-section" id={section.id} key={section.id}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets ? (
              <ul className="summary-list">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <section className="simple-page-section" id="mechanism">
          <h2>{copy.mechanismTitle}</h2>
          <p>{copy.mechanismIntro}</p>
          <div className="report-mechanisms">
            {copy.mechanismSteps.map((step, index) => (
              <article className="report-mechanism" key={step.title}>
                <div className="report-mechanism-index">{index + 1}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="simple-page-section" id="code-comparison">
          <h2>{copy.codeComparisonTitle}</h2>
          <p>{copy.codeComparisonCaption}</p>
          <div className="table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  {copy.codeComparisonHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {copy.codeComparisonRows.map((row) => (
                  <tr key={row.join("|")}>
                    {row.map((cell) => (
                      <td key={cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="simple-page-section" id="principle-table">
          <h2>{locale === "zh" ? "表 1. 原理级对比" : "Table 1. Principle-Level Comparison"}</h2>
          <div className="table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  {copy.principleHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {copy.principleRows.map((row) => (
                  <tr key={row.join("|")}>
                    {row.map((cell) => (
                      <td key={cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="simple-page-section" id="code-snippets">
          <h2>{copy.codeSnippetsTitle}</h2>
          <p>{copy.codeSnippetsIntro}</p>
          <div className="report-code-grid">
            {copy.codeSnippets.map((snippet) => (
              <article className="report-code-card" key={snippet.title}>
                <div className="report-code-head">
                  <div>
                    <h3>{snippet.title}</h3>
                    <p className="report-code-path">{snippet.path}</p>
                  </div>
                </div>
                <p className="report-code-caption">{snippet.caption}</p>
                <pre className="report-code">
                  <code>{snippet.code}</code>
                </pre>
              </article>
            ))}
          </div>
        </section>

        <section className="simple-page-section" id="execution-figure">
          <h2>{copy.figureExecutionTitle}</h2>
          <p>{copy.figureExecutionCaption}</p>
          <ExecutionFigure locale={locale} />
        </section>

        <section className="simple-page-section" id="benchmarks-overall">
          <h2>{locale === "zh" ? "表 2. Overall Benchmark" : "Table 2. Overall Benchmark"}</h2>
          <div className="table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  {copy.overallHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {copy.overallRows.map((row) => (
                  <tr key={row.join("|")}>
                    {row.map((cell) => (
                      <td key={cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="simple-page-section" id="benchmarks-tier">
          <h2>{locale === "zh" ? "表 3. Tier Breakdown" : "Table 3. Tier Breakdown"}</h2>
          <div className="table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  {copy.tierHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {copy.tierRows.map((row) => (
                  <tr key={row.join("|")}>
                    {row.map((cell) => (
                      <td key={cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="simple-page-section" id="benchmarks">
          <h2>{copy.tierInsightsTitle}</h2>
          <div className="report-code-grid">
            {copy.tierInsights.map((item) => (
              <article className="report-code-card" key={item.tier}>
                <div className="report-tier-badge">{item.tier}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="simple-page-section" id="limits">
          <h2>{copy.limitsTitle}</h2>
          <ul className="summary-list">
            {copy.limits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="simple-page-section" id="conclusion">
          <h2>{copy.conclusionTitle}</h2>
          {copy.conclusion.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>

        <h2 id="read-next">{locale === "zh" ? "继续阅读" : "Read next"}</h2>
        <p>
          {copy.readNext.map((item, index) => (
            <span key={item.href}>
              {index > 0 ? ", " : ""}
              <Link href={localeHref(locale, item.href)}>{item.label}</Link>
            </span>
          ))}
          .
        </p>
      </main>
    </div>
  );
}

function ArchitectureFigure({ locale }: { locale: Locale }) {
  const labels = getTechnicalReportCopy(locale).figureLabels;
  return (
    <div className="report-figure">
      <div className="report-figure-grid">
        <div className="report-column">
          <div className="report-column-label">{labels.clients}</div>
          <div className="report-node report-node-strong">{labels.clientMcp}</div>
          <div className="report-node report-node-strong">{labels.clientZcp}</div>
        </div>
        <div className="report-column">
          <div className="report-column-label">{labels.surfaces}</div>
          <div className="report-node">{labels.mcpSurface}</div>
          <div className="report-node">{labels.nativeSurface}</div>
        </div>
        <div className="report-column">
          <div className="report-column-label">{labels.runtime}</div>
          <div className="report-node report-node-runtime">{labels.host}</div>
          <div className="report-node report-node-muted">{labels.policy}</div>
        </div>
      </div>
    </div>
  );
}

function ExecutionFigure({ locale }: { locale: Locale }) {
  const labels = getTechnicalReportCopy(locale).figureLabels;
  return (
    <div className="report-comparison">
      <div className="report-track">
        <h3>{labels.mcpSurface}</h3>
        <div className="report-step">{labels.toolListAll}</div>
        <div className="report-arrow" />
        <div className="report-step">{labels.genericPlanning}</div>
        <div className="report-arrow" />
        <div className="report-step">{labels.verboseResults}</div>
      </div>
      <div className="report-track">
        <h3>{labels.nativeSurface}</h3>
        <div className="report-step report-step-accent">{labels.semanticSubset}</div>
        <div className="report-arrow" />
        <div className="report-step report-step-accent">{labels.stagedPlanning}</div>
        <div className="report-arrow" />
        <div className="report-step report-step-accent">{labels.compactResults}</div>
        <div className="report-feedback">{labels.feedbackLoop}</div>
      </div>
    </div>
  );
}
