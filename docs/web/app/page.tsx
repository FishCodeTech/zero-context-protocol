import Link from "next/link";

export default function HomePage() {
  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand">ZCP</div>
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/quickstart">Quickstart</Link>
          <Link href="/architecture">Architecture</Link>
          <Link href="/sdk">SDK</Link>
          <Link href="/benchmarks">Benchmarks</Link>
          <Link href="/deploy">Deploy</Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">One runtime, two protocol surfaces</p>
          <h1>Ship an MCP-compatible server now. Upgrade to ZCP native when context cost matters.</h1>
          <p className="lede">
            ZCP gives you one backend runtime with two outward-facing modes: an MCP-compatible server
            surface for existing clients and a native ZCP surface for lower token overhead, handle-aware
            results, and longer multi-turn sessions. You still own the backend logic; ZCP owns the protocol
            runtime, transports, gateway, validation, and session model.
          </p>
          <p className="lede">
            This repository now owns the docs site. The Python SDK and runtime live in
            <code> zero-context-protocol-python </code>
            while keeping <code>import zcp</code> stable.
          </p>
          <div className="actions">
            <Link className="button primary" href="/quickstart">
              Open Quickstart
            </Link>
            <Link className="button secondary" href="/architecture">
              Read Architecture
            </Link>
          </div>
        </div>
        <div className="panel">
          <div className="eyebrow">Mental model</div>
          <pre>{`Docs site
http://localhost:3000

Your backend code
examples/zcp_server_template.py

Native protocol surface
http://localhost:8000/zcp

MCP-compatible surface
http://localhost:8000/mcp

stdio MCP surface
python3 examples/run_zcp_mcp_stdio_server.py

Health
http://localhost:8000/healthz

Metadata
http://localhost:8000/metadata`}</pre>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">Product Shape</p>
        <h2>One backend runtime, one package, two protocol surfaces.</h2>
        <div className="cards">
          <article className="card">
            <h3>Protocol Docs Repo</h3>
            <p>This repository: protocol explanation, benchmarks, deployment, and integration docs.</p>
          </article>
          <article className="card">
            <h3>Python SDK Repo</h3>
            <p><code>zero-context-protocol-python</code>: the single public SDK under <code>src/zcp</code>.</p>
          </article>
          <article className="card">
            <h3>Protocol Surfaces</h3>
            <p><code>/mcp</code> exists for drop-in compatibility. <code>/zcp</code> exists for lower-overhead native integrations.</p>
          </article>
        </div>
      </section>

      <section className="section grid-two">
        <div>
          <p className="eyebrow">Run MCP-Compatible Stdio</p>
          <div className="codebox">{`python3 examples/run_zcp_mcp_stdio_server.py`}</div>
          <p className="lede">
            Run this in the <code>zero-context-protocol-python</code> repository when you want existing MCP clients
            or hosts to spawn your server with no custom client SDK.
          </p>
        </div>
        <div>
          <p className="eyebrow">Run Native + HTTP</p>
          <div className="codebox">{`python3 examples/run_zcp_api_server.py`}</div>
          <p className="lede">
            Run this in the <code>zero-context-protocol-python</code> repository to start the ASGI host that serves
            <code> /zcp </code>, <code>/mcp</code>, <code>/healthz</code>, and <code>/metadata</code>.
          </p>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">Ownership Boundary</p>
        <h2>ZCP is the protocol runtime, not your business backend.</h2>
        <div className="cards">
          <article className="card">
            <h3>What you own</h3>
            <p>Your actual tools, resources, prompts, auth policy, business logic, and deployment config.</p>
          </article>
          <article className="card">
            <h3>What ZCP owns</h3>
            <p>The runtime, MCP-compatible surface, native surface, validation, sessions, and transport helpers.</p>
          </article>
          <article className="card">
            <h3>Why native exists</h3>
            <p>Compatibility gets you into the MCP ecosystem quickly. Native ZCP is the upgrade path when token cost and multi-turn efficiency matter.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">Benchmark Snapshot</p>
        <h2>Real SDK comparison, not a hand-written compatibility mock.</h2>
        <div className="compare">
          <div className="card metric"><span>Official MCP Python SDK</span><strong>4504</strong><small>avg total tokens / run</small></div>
          <div className="card metric"><span>ZCP Native Surface</span><strong>2833</strong><small>avg total tokens / run</small></div>
          <div className="card metric"><span>Token Savings</span><strong>37.1%</strong><small>vs the MCP baseline</small></div>
          <div className="card metric"><span>Accuracy</span><strong>100%</strong><small>for both paths in the latest local run</small></div>
        </div>
        <p className="lede">
          Numbers above come from the Python SDK repository’s
          <code> examples/compare_zcp_mcp_tool_call_benchmark.py </code>
          on March 13, 2026, using DeepSeek chat completions with repeated multi-tool tasks.
        </p>
        <p className="lede">
          This docs repository consumes <code>benchmark_reports/*.json</code> from the Python SDK repo instead of
          reimplementing the benchmark logic.
        </p>
      </section>
    </div>
  );
}
