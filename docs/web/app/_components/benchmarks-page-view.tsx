import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { Locale, localeHref } from "../lib/i18n";
import { benchmarksCopy } from "../lib/site-copy";

type SummaryRow = {
  protocol: string;
  runs: number;
  answer_accuracy: number;
  tool_compliance: number;
  avg_prompt_tokens: number;
  avg_completion_tokens: number;
  avg_total_tokens: number;
};

type CaseRow = {
  case_id: string;
  zcp_avg_total_tokens: number;
  mcp_avg_total_tokens: number;
  mcp_vs_zcp_ratio: number;
  token_delta_mcp_minus_zcp: number;
};

type BenchmarkReport = {
  model: string;
  repeats: number;
  summary: SummaryRow[];
  cases: CaseRow[];
};

async function loadReport(): Promise<BenchmarkReport | null> {
  try {
    const reportPath = path.join(process.cwd(), "..", "..", "benchmark_reports", "zcp_mcp_tool_call_benchmark.json");
    const content = await readFile(reportPath, "utf-8");
    return JSON.parse(content) as BenchmarkReport;
  } catch {
    return null;
  }
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export async function BenchmarksPageView({ locale }: { locale: Locale }) {
  const copy = benchmarksCopy[locale];
  const report = await loadReport();

  return (
    <div className="site-shell article">
      <aside className="sidebar">
        <div className="eyebrow">{copy.navLabel}</div>
        <nav>
          {copy.nav.map((item) =>
            item.href.startsWith("#") ? (
              <a href={item.href} key={item.href}>
                {item.label}
              </a>
            ) : (
              <Link href={localeHref(locale, item.href)} key={item.href}>
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </aside>
      <main className="prose">
        <h1>{copy.title}</h1>
        <div className="page-summary">
          <p>{copy.summary}</p>
        </div>
        <p>{copy.description}</p>

        {!report ? (
          <>
            <h2 id="snapshot">{copy.missingTitle}</h2>
            <p>{copy.missingBody}</p>
          </>
        ) : (
          <>
            <h2 id="snapshot">{copy.snapshotTitle}</h2>
            <p>
              {copy.modelLabel}: <code>{report.model}</code>. {copy.repeatsLabel}: <code>{report.repeats}</code>.
            </p>

            <h2 id="summary">{copy.summaryTitle}</h2>
            <table>
              <thead>
                <tr>
                  {copy.summaryHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.summary.map((row) => (
                  <tr key={row.protocol}>
                    <td>{row.protocol}</td>
                    <td>{row.runs}</td>
                    <td>{percent(row.answer_accuracy)}</td>
                    <td>{percent(row.tool_compliance)}</td>
                    <td>{row.avg_prompt_tokens.toFixed(1)}</td>
                    <td>{row.avg_completion_tokens.toFixed(1)}</td>
                    <td>{row.avg_total_tokens.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 id="cases">{copy.casesTitle}</h2>
            <table>
              <thead>
                <tr>
                  {copy.caseHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.cases.map((row) => (
                  <tr key={row.case_id}>
                    <td>{row.case_id}</td>
                    <td>{row.zcp_avg_total_tokens.toFixed(1)}</td>
                    <td>{row.mcp_avg_total_tokens.toFixed(1)}</td>
                    <td>{row.mcp_vs_zcp_ratio.toFixed(2)}x</td>
                    <td>{row.token_delta_mcp_minus_zcp.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </main>
    </div>
  );
}
