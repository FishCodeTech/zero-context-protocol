import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";

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

export default async function BenchmarksPage() {
  const report = await loadReport();

  return (
    <div className="site-shell article">
      <aside className="sidebar">
        <div className="eyebrow">Benchmarks</div>
        <nav>
          <Link href="/">Home</Link>
          <a href="#snapshot">Snapshot</a>
          <a href="#summary">Summary</a>
          <a href="#cases">Cases</a>
        </nav>
      </aside>
      <main className="prose">
        <h1>Benchmark Reports</h1>
        <p>
          This page is designed to consume generated benchmark artifacts from the Python SDK repository. The benchmark
          logic itself belongs to <code>zero-context-protocol-python</code>, not the docs site.
        </p>

        {!report ? (
          <>
            <h2 id="snapshot">No benchmark report found</h2>
            <p>
              Expected a generated report at <code>benchmark_reports/zcp_mcp_tool_call_benchmark.json</code>. Run the
              real SDK benchmark from the Python repository before building this page.
            </p>
          </>
        ) : (
          <>
            <h2 id="snapshot">Latest Snapshot</h2>
            <p>
              Model: <code>{report.model}</code>. Repeats: <code>{report.repeats}</code>.
            </p>

            <h2 id="summary">Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Protocol</th>
                  <th>Runs</th>
                  <th>Answer Accuracy</th>
                  <th>Tool Compliance</th>
                  <th>Avg Prompt</th>
                  <th>Avg Completion</th>
                  <th>Avg Total</th>
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

            <h2 id="cases">Case Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>ZCP Avg Total</th>
                  <th>MCP Avg Total</th>
                  <th>MCP / ZCP</th>
                  <th>Token Delta</th>
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
