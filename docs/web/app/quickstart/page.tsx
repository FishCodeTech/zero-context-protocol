import Link from "next/link";

export default function QuickstartPage() {
  return (
    <div className="site-shell article">
      <aside className="sidebar">
        <div className="eyebrow">Quickstart</div>
        <nav>
          <Link href="/">Home</Link>
          <a href="#what-runs">What runs</a>
          <a href="#what-zcp-is-not">What ZCP is not</a>
          <a href="#api-server">API server</a>
          <a href="#docs-server">Docs server</a>
          <a href="#routes">Routes</a>
        </nav>
      </aside>
      <main className="prose">
        <h1>Quickstart</h1>
        <p>
          The product now uses two repositories: <code>zero-context-protocol-python</code> for the SDK and this
          repository for the docs site.
        </p>

        <h2 id="what-runs">What runs</h2>
        <p>
          In the <code>zero-context-protocol-python</code> repository,
          <code> examples/run_zcp_api_server.py </code>
          runs the protocol host. It is a standard-library HTTP runner for the ASGI application defined in
          <code> examples/zcp_server_template.py </code>.
        </p>
        <p>
          It exists because your environment did not have <code>uvicorn</code>. It is a fallback runner so you can start
          the ZCP API without installing anything else.
        </p>

        <h2 id="what-zcp-is-not">What ZCP is not</h2>
        <p>
          ZCP is not a prebuilt universal backend that replaces your business service. The template file is only an example
          of how a user would build their own server using the SDK.
        </p>

        <h2 id="api-server">Run the API server</h2>
        <pre>{`python3 examples/run_zcp_api_server.py`}</pre>
        <p>Run that from the Python SDK repository to start the backend service on port <code>8000</code>.</p>

        <h2 id="docs-server">Run the docs server</h2>
        <pre>{`cd docs/web
npm install
npm run dev`}</pre>
        <p>That starts this docs app on port <code>3000</code> by default.</p>

        <h2 id="routes">Routes</h2>
        <p>
          <code>/zcp</code> is the protocol RPC endpoint. SDK clients, gateways, or agent runtimes post JSON-RPC / ZCP
          messages there.
        </p>
        <p>
          <code>/metadata</code> is public service metadata. <code>/healthz</code> and <code>/readyz</code> are public
          health routes. Documentation is not part of the Python package surface and should live in the docs repository.
        </p>
      </main>
    </div>
  );
}
