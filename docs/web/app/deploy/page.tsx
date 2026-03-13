import Link from "next/link";

export default function DeployPage() {
  return (
    <div className="site-shell article">
      <aside className="sidebar">
        <div className="eyebrow">Deploy</div>
        <nav>
          <Link href="/">Home</Link>
          <a href="#api-host">API Host</a>
          <a href="#uvicorn">Uvicorn</a>
          <a href="#fallback">Fallback Runner</a>
          <a href="#docs">Docs App</a>
        </nav>
      </aside>
      <main className="prose">
        <h1>Deploy ZCP</h1>

        <h2 id="api-host">API host</h2>
        <p>
          In the <code>zero-context-protocol-python</code> repository, your backend template lives in
          <code> examples/zcp_server_template.py </code>. That file defines the ASGI application and the example
          business capabilities.
        </p>

        <h2 id="uvicorn">Run with uvicorn</h2>
        <pre>{`uvicorn examples.zcp_server_template:application --host 0.0.0.0 --port 8000`}</pre>

        <h2 id="fallback">Run with the fallback runner</h2>
        <pre>{`python3 examples/run_zcp_api_server.py`}</pre>
        <p>
          Run that in the Python SDK repository. It exists only because your environment did not have
          <code> uvicorn </code>. It is not the docs server.
        </p>

        <h2 id="docs">Run the docs app</h2>
        <pre>{`cd docs/web
npm install
npm run dev`}</pre>
        <p>
          This app is the docs surface and should remain separate from the Python SDK repository’s runtime surface.
        </p>
      </main>
    </div>
  );
}
