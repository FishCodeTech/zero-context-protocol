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

type SemanticOverallRow = {
  backend_id: string;
  answer_accuracy: number;
  workbook_accuracy: number;
  tool_compliance: number;
  avg_total_tokens: number;
  avg_turns: number;
  avg_tool_calls: number;
};

type SemanticTierRow = {
  tier: string;
  zcp_avg_total_tokens: number;
  mcp_avg_total_tokens: number;
  ratio: number;
  zcp_answer_accuracy: number;
  zcp_workbook_accuracy: number;
  zcp_tool_compliance: number;
};

type SemanticReport = {
  model: string;
  repeats: number;
  overall_pairwise: {
    left_id: string;
    right_id: string;
    left_avg_total_tokens: number;
    right_avg_total_tokens: number;
    right_minus_left: number;
    right_div_left: number;
  };
  overall_summary: SemanticOverallRow[];
  tier_summary: SemanticTierRow[];
};

async function loadCompactReport(): Promise<BenchmarkReport | null> {
  try {
    const reportPath = path.join(process.cwd(), "..", "..", "benchmark_reports", "zcp_mcp_tool_call_benchmark.json");
    const content = await readFile(reportPath, "utf-8");
    return JSON.parse(content) as BenchmarkReport;
  } catch {
    return null;
  }
}

async function loadSemanticReport(): Promise<SemanticReport | null> {
  try {
    const reportPath = path.join(
      process.cwd(),
      "..",
      "..",
      "benchmark_reports",
      "full_semantic_compare_v5",
      "semantic_benchmark_summary.json",
    );
    const content = await readFile(reportPath, "utf-8");
    return JSON.parse(content) as SemanticReport;
  } catch {
    return null;
  }
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export async function BenchmarksPageView({ locale }: { locale: Locale }) {
  const copy = benchmarksCopy[locale];
  const compactReport = await loadCompactReport();
  const semanticReport = await loadSemanticReport();

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
        <h2 id="snapshot">{copy.snapshotTitle}</h2>
        <p>
          {copy.modelLabel}: <code>{semanticReport?.model ?? compactReport?.model ?? "unknown"}</code>.{" "}
          {copy.repeatsLabel}: <code>{semanticReport?.repeats ?? compactReport?.repeats ?? "unknown"}</code>.
        </p>

        {semanticReport ? (
          <>
            <h2 id="semantic">{copy.semanticTitle}</h2>
            <h3>{copy.semanticHeadlineTitle}</h3>
            <p>
              <code>{semanticReport.overall_pairwise.left_id}</code> vs{" "}
              <code>{semanticReport.overall_pairwise.right_id}</code>: {copy.ratioLabel}{" "}
              <strong>{semanticReport.overall_pairwise.right_div_left.toFixed(2)}x</strong>. Token delta:{" "}
              <code>{semanticReport.overall_pairwise.right_minus_left.toFixed(1)}</code>.
            </p>
            <p>
              {copy.artifactLabel}:{" "}
              <code>benchmark_reports/full_semantic_compare_v5/semantic_benchmark_summary.json</code>
            </p>

            <h3>{copy.semanticOverallTitle}</h3>
            <table>
              <thead>
                <tr>
                  {copy.semanticOverallHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {semanticReport.overall_summary.map((row) => (
                  <tr key={row.backend_id}>
                    <td>{row.backend_id}</td>
                    <td>{percent(row.answer_accuracy)}</td>
                    <td>{percent(row.workbook_accuracy)}</td>
                    <td>{percent(row.tool_compliance)}</td>
                    <td>{row.avg_total_tokens.toFixed(1)}</td>
                    <td>{row.avg_turns.toFixed(1)}</td>
                    <td>{row.avg_tool_calls.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>{copy.semanticTierTitle}</h3>
            <table>
              <thead>
                <tr>
                  {copy.semanticTierHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {semanticReport.tier_summary.map((row) => (
                  <tr key={row.tier}>
                    <td>{row.tier}</td>
                    <td>{row.zcp_avg_total_tokens.toFixed(1)}</td>
                    <td>{row.mcp_avg_total_tokens.toFixed(1)}</td>
                    <td>{row.ratio.toFixed(2)}x</td>
                    <td>
                      {percent(row.zcp_answer_accuracy)} / {percent(row.zcp_workbook_accuracy)} /{" "}
                      {percent(row.zcp_tool_compliance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}

        {compactReport ? (
          <>
            <h2 id="compact">{copy.compactTitle}</h2>
            <p>
              {copy.artifactLabel}: <code>benchmark_reports/zcp_mcp_tool_call_benchmark.json</code>
            </p>

            <h3>{copy.compactSummaryTitle}</h3>
            <table>
              <thead>
                <tr>
                  {copy.compactSummaryHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compactReport.summary.map((row) => (
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

            <h3>{copy.compactCasesTitle}</h3>
            <table>
              <thead>
                <tr>
                  {copy.compactCaseHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compactReport.cases.map((row) => (
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
        ) : null}
      </main>
    </div>
  );
}
