import Link from "next/link";

export default function ArchitecturePage() {
  return (
    <div className="site-shell article">
      <aside className="sidebar">
        <div className="eyebrow">Architecture</div>
        <nav>
          <Link href="/">Home</Link>
          <a href="#separation">Separation</a>
          <a href="#ownership">Ownership</a>
          <a href="#api">API surface</a>
          <a href="#sdk">SDK surface</a>
          <a href="#gateway">Gateway</a>
          <a href="#repos">Repo split</a>
        </nav>
      </aside>
      <main className="prose">
        <h1>ZCP Architecture</h1>

        <h2 id="separation">Separation of concerns</h2>
        <p>
          The documentation app is now a Next.js frontend under <code>docs/web</code>. It is the primary surface of
          this repository. The Python service under <code>src/zcp</code> now lives separately as
          <code>zero-context-protocol-python</code>.
        </p>

        <h2 id="ownership">Ownership model</h2>
        <p>
          Users own the business backend they build with ZCP. ZCP owns the protocol runtime, session model, capability
          model, gateway behavior, and transport helpers. The example backend is a template, not a universal shared server.
        </p>

        <h2 id="api">API surface</h2>
        <p>
          The production API service exposes <code>/zcp</code> as the RPC entrypoint. That route is for protocol calls,
          not for humans reading docs.
        </p>
        <pre>{`POST /zcp
GET  /metadata
GET  /healthz
GET  /readyz
GET  /sse`}</pre>

        <h2 id="sdk">SDK surface</h2>
        <p>
          The SDK gives you <code>FastZCP</code>, <code>ZCPServerSession</code>, <code>ZCPClientSession</code>,
          transport helpers, MCP gateway helpers, and the OpenAI-compatible profile.
        </p>

        <h2 id="gateway">Gateway</h2>
        <p>
          Gateway mode exists so ZCP can speak MCP-compatible method shapes without turning the native core into MCP’s
          wire format. Native mode stays compact. Gateway mode stays interoperable.
        </p>

        <h2 id="repos">Repository split</h2>
        <p>
          The split is now simple: docs, protocol explanation, and benchmark presentation belong in this repository;
          runtime code, tests, examples, and benchmark generation belong in
          <code>zero-context-protocol-python</code>.
        </p>
      </main>
    </div>
  );
}
