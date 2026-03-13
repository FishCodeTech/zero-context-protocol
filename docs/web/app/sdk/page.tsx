import Link from "next/link";

export default function SDKPage() {
  return (
    <div className="site-shell article">
      <aside className="sidebar">
        <div className="eyebrow">SDK</div>
        <nav>
          <Link href="/">Home</Link>
          <a href="#fastzcp">FastZCP</a>
          <a href="#mcp-surface">MCP Surface</a>
          <a href="#sessions">Sessions</a>
          <a href="#profiles">Profiles</a>
        </nav>
      </aside>
      <main className="prose">
        <h1>SDK Surface</h1>
        <p>
          The official Python SDK is the <code>zero-context-protocol-python</code> repository. It exposes one
          public package, <code>zcp</code>, and one runtime core. You can publish that runtime through an
          MCP-compatible server surface for ecosystem compatibility or a native ZCP surface for lower token overhead.
        </p>

        <h2 id="fastzcp">FastZCP</h2>
        <pre>{`from zcp import FastZCP

app = FastZCP("My Backend")

@app.tool(
    name="weather.get_current",
    description="Get current weather.",
    input_schema={...},
)
def get_weather(city: str):
    return {...}`}</pre>

        <h2 id="mcp-surface">MCP-Compatible Surface</h2>
        <p>
          If you want existing MCP clients to connect without custom client changes, use the compatibility surface.
          The repo ships both an ASGI <code>/mcp</code> path and a stdio helper for host-spawned integrations.
        </p>
        <pre>{`from zcp import FastZCP, run_mcp_stdio_server_sync

app = FastZCP("Weather MCP Server")

@app.tool(name="weather.get_current", description="Get weather.", input_schema={...})
def get_weather(city: str):
    return {...}

run_mcp_stdio_server_sync(app)`}</pre>

        <h2 id="sessions">Sessions</h2>
        <p>
          Use <code>ZCPServerSession</code> and <code>ZCPClientSession</code> for low-level control, or
          <code>ZCPSessionGroup</code> to aggregate multiple native servers. On the compatibility side,
          <code>MCPGatewayServer</code> exposes MCP method and result shapes from the same runtime state.
        </p>

        <h2 id="profiles">Profiles</h2>
        <p>
          <code>zcp.profiles.native</code> is compact-first. The MCP-compatible surface is for interoperability.
          <code>zcp.profiles.oai</code> is for OpenAI-compatible endpoints and tool-calling adapters.
        </p>
      </main>
    </div>
  );
}
