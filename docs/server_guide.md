# Server Guide

This guide explains how to build, host, and reason about a ZCP server.

## Server Model

The main entry point is `FastZCP`.

```python
from zcp import FastZCP

app = FastZCP(
    "Weather Backend",
    version="1.0.0",
    instructions="Weather tools, prompts, resources, and tasks.",
)
```

A `FastZCP` application can register:

- tools
- resources
- resource templates
- prompts
- completions
- task handlers

From there you can expose the app through:

- stdio
- ASGI on `/mcp`, `/zcp`, and `/ws`

## End-To-End ASGI Example

This is the recommended baseline if you need one service that can satisfy both
MCP-compatible and native ZCP clients.

```python
from zcp import (
    AuthProfile,
    BearerAuthConfig,
    FastZCP,
    PromptArgument,
    RateLimitConfig,
    ToolExposureConfig,
    ZCPServerConfig,
    create_asgi_app,
)

app = FastZCP(
    "Weather Backend",
    version="1.0.0",
    instructions="Weather tools, prompts, and tasks.",
    default_tool_profile="semantic-workflow",
    auth_profile=AuthProfile(
        issuer="https://auth.example.com",
        authorization_url="https://auth.example.com/oauth/authorize",
        token_url="https://auth.example.com/oauth/token",
        scopes=["weather.read", "weather.admin"],
    ),
)


@app.tool(
    name="weather.get_current",
    description="Get current weather for a city.",
    input_schema={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
    required_scopes=("weather.read",),
)
def get_weather(city: str, ctx=None):
    return {"city": city, "temperature": 24, "condition": "Cloudy"}


@app.resource("weather://cities", name="Supported Cities", mime_type="application/json")
def cities():
    return ["Hangzhou", "Beijing", "Shanghai"]


@app.prompt(
    name="weather.summary",
    description="Build a user-facing weather summary prompt.",
    arguments=[PromptArgument(name="city", required=True)],
)
def weather_prompt(city: str):
    return [{"role": "user", "content": f"Summarize weather for {city}"}]


application = create_asgi_app(
    app,
    config=ZCPServerConfig(
        service_name="weather-backend",
        environment="production",
        auth=BearerAuthConfig(token="replace-me"),
        rate_limit=RateLimitConfig(window_seconds=60, max_requests=240),
        tool_exposure=ToolExposureConfig(default_profile="semantic-workflow"),
    ),
)
```

### Semantic Workflow Tool Exposure

If your server publishes both primitive MCP-compatible tools and native
workflow tools, declare that explicitly:

- tag workflow tools with `_meta.groups = ["workflow", ...]`
- set `FastZCP(default_tool_profile="semantic-workflow")` when the server is
  primarily used by native ZCP clients
- optionally mirror that through `ToolExposureConfig(default_profile="semantic-workflow")`

Clients can then request:

```python
tools = await client.list_tools(profile="semantic-workflow")
```

This keeps the MCP surface available while giving native clients a smaller and
more plan-friendly tool registry.

For the full explanation of the profile contract itself, see
[Semantic Workflow Profile](/docs/semantic-workflow-profile).

Run it with:

```bash
cd zero-context-protocol-python
uvicorn examples.zcp_server_template:application --host 0.0.0.0 --port 8000
```

Or with the bundled runner:

```bash
cd zero-context-protocol-python
python3 examples/run_zcp_api_server.py
```

What that gives you immediately:

- `/mcp` for MCP-compatible clients
- `/ws` for long-lived MCP-compatible socket sessions
- `/zcp` for native compact traffic
- `/metadata`, `/healthz`, and `/readyz` for operations

## Complete File Example: Hosted Dual-Surface Service

This is the file-level pattern to use when one service must support MCP
clients and native ZCP clients at the same time.

```python
from zcp import (
    AuthProfile,
    BearerAuthConfig,
    FastZCP,
    PromptArgument,
    RateLimitConfig,
    ZCPServerConfig,
    create_asgi_app,
)

app = FastZCP(
    "Docs And Weather Service",
    version="1.0.0",
    instructions="Hosted service with MCP compatibility and a native compact route.",
    auth_profile=AuthProfile(
        issuer="https://auth.example.com",
        authorization_url="https://auth.example.com/oauth/authorize",
        token_url="https://auth.example.com/oauth/token",
        scopes=["weather.read", "docs.read"],
    ),
)


@app.tool(
    name="weather.lookup",
    description="Lookup weather by city.",
    input_schema={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
    required_scopes=("weather.read",),
)
def weather_lookup(city: str, ctx=None):
    return {"city": city, "temperature": 24, "condition": "Cloudy"}


@app.resource("docs://faq", name="FAQ", mime_type="text/plain", required_scopes=("docs.read",))
def faq():
    return "Use /mcp for interoperability and /zcp for native compact traffic."


@app.prompt(
    name="weather.summary",
    description="Build a short weather summary prompt.",
    arguments=[PromptArgument(name="city", required=True)],
    required_scopes=("weather.read",),
)
def weather_summary(city: str):
    return [{"role": "user", "content": f"Summarize the weather in {city}."}]


application = create_asgi_app(
    app,
    config=ZCPServerConfig(
        service_name="docs-weather",
        environment="production",
        auth=BearerAuthConfig(token="replace-me"),
        rate_limit=RateLimitConfig(window_seconds=60, max_requests=240),
    ),
)
```

Run:

```bash
uvicorn examples.zcp_server_template:application --host 0.0.0.0 --port 8000
```

Use this when:

- third-party clients still need MCP
- internal workers benefit from `/zcp`
- one service should own discovery, auth, and lifecycle

## Define Tools

```python
@app.tool(
    name="weather.get_current",
    description="Get current weather for a city.",
    input_schema={
        "type": "object",
        "properties": {
            "city": {"type": "string"},
            "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
        },
        "required": ["city"],
        "additionalProperties": False,
    },
    output_schema={
        "type": "object",
        "properties": {
            "city": {"type": "string"},
            "unit": {"type": "string"},
            "temperature": {"type": "integer"},
            "condition": {"type": "string"},
        },
        "required": ["city", "unit", "temperature", "condition"],
    },
    output_mode="scalar",
    inline_ok=True,
    required_scopes=("weather.read",),
)
def get_weather(city: str, unit: str = "celsius", ctx=None):
    return {"city": city, "unit": unit, "temperature": 24, "condition": "Cloudy"}
```

Tool guidance:

- keep names stable
- keep schemas narrow
- state side effects clearly
- use `required_scopes` for policy
- add `execution` metadata when task support or runtime behavior matters

## Define Resources And Templates

```python
@app.resource(
    "weather://cities",
    name="Supported Cities",
    mime_type="application/json",
    required_scopes=("weather.read",),
)
def supported_cities():
    return ["Hangzhou", "Beijing", "Shanghai", "Shenzhen"]


@app.resource_template(
    "weather://city/{name}",
    name="City Weather",
    mime_type="application/json",
    required_scopes=("weather.read",),
)
def city_weather(uri: str):
    return {"uri": uri, "temperature": 24}
```

Use resources when the main operation is reading content, not running a
workflow.

## Define Prompts And Completions

```python
from zcp import PromptArgument


@app.prompt(
    name="weather.summary",
    description="Build a user-facing weather summary prompt.",
    arguments=[PromptArgument(name="city", required=True)],
    required_scopes=("weather.read",),
)
def weather_prompt(city: str):
    return [{"role": "user", "content": f"Summarize weather for {city}"}]


@app.completion("weather.summary")
def complete_city(request):
    cities = ["Hangzhou", "Beijing", "Shanghai"]
    return [item for item in cities if item.lower().startswith(request.value.lower())]
```

Prompts help centralize prompt construction. Completions help autocomplete
prompt or resource arguments.

## Define Tasks

You can register task handlers directly:

```python
@app.task("weather.refresh")
def refresh_weather(payload):
    return {"status": "refreshed", "city": payload["city"]}
```

You can also allow task-augmented tool calls by declaring task support in the
tool's `execution` metadata. That lets callers keep using `tools/call` while
receiving task lifecycle behavior when needed.

### Task-Capable Tool Pattern

This pattern is the best bridge when a tool starts synchronous and later needs
background execution without changing its public name.

```python
import asyncio


@app.tool(
    name="weather.refresh",
    description="Refresh cached weather data.",
    input_schema={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
    execution={"taskSupport": "optional"},
)
async def refresh_weather(city: str, task=None, ctx=None):
    if task is not None:
        await task.update_status(f"Fetching upstream data for {city}")
    await asyncio.sleep(0.2)
    if task is not None:
        await task.update_status(f"Writing cache for {city}")
    return {"city": city, "status": "refreshed"}
```

Use this when:

- callers should keep seeing one tool name
- some invocations can still complete inline
- long-running work should expose explicit task state

### Explicit Task Handler Pattern

Use `@app.task(...)` when the operation is naturally durable from the start.

```python
import asyncio


@app.task("weather.import")
async def import_weather(payload):
    task = payload.get("task")
    if task is not None:
        await task.update_status("Downloading source files")
    await asyncio.sleep(0.2)
    if task is not None:
        await task.update_status("Normalizing records")
    await asyncio.sleep(0.2)
    return {"source": payload["source"], "status": "completed"}
```

Use this when:

- the public contract is already job-oriented
- you need polling and cancellation from the beginning
- the operation is not naturally a normal tool call

## Expose A Stdio Server

Use this when the client or host launches your process directly.

```python
from zcp import run_mcp_stdio_server_sync

run_mcp_stdio_server_sync(app)
```

## Complete File Example: MCP-First Stdio Service

This is the right file shape when your first user is an existing MCP host and
you want the smallest possible migration surface.

```python
from zcp import FastZCP, PromptArgument
from zcp.mcp_stdio import run_mcp_stdio_server_sync

app = FastZCP("ZCP MCP Compatibility Server")


@app.tool(
    name="weather.get_current",
    description="Get the current weather for a city.",
    input_schema={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
)
def get_weather(city: str, ctx=None):
    return {"city": city, "temperature": 24, "condition": "Cloudy"}


@app.resource("weather://cities", name="Cities", mime_type="application/json")
def cities():
    return ["Hangzhou", "Beijing", "Shanghai"]


@app.prompt(
    name="weather.summary",
    description="Weather summary prompt.",
    arguments=[PromptArgument(name="city", required=True)],
)
def weather_prompt(city: str):
    return [{"role": "user", "content": f"Summarize weather for {city}"}]


run_mcp_stdio_server_sync(app)
```

Use this when:

- the host already owns process lifecycle
- you want a drop-in backend replacement
- you want to validate compatibility before introducing hosted transports

## Expose An ASGI Server

Use this when you want HTTP and websocket transports.

```python
from zcp import (
    AuthProfile,
    BearerAuthConfig,
    OAuthConfig,
    SQLiteOAuthProvider,
    ZCPServerConfig,
    create_asgi_app,
)

app.auth_profile = AuthProfile(
    issuer="https://auth.example.com",
    authorization_url="https://auth.example.com/oauth/authorize",
    token_url="https://auth.example.com/oauth/token",
    scopes=["weather.read", "weather.admin"],
)

application = create_asgi_app(
    app,
    config=ZCPServerConfig(
        service_name="zcp-weather",
        environment="production",
        auth=BearerAuthConfig(token="replace-me"),
        oauth=OAuthConfig(enabled=True, issuer="https://zcp.example.com"),
        oauth_provider=SQLiteOAuthProvider("zcp-oauth.db"),
    ),
)
```

The ASGI host can expose:

- `/zcp`
- `/mcp`
- `/ws`
- `/healthz`
- `/readyz`
- `/metadata`

## MCP-Compatible Stdio Example

If your first rollout target is an existing MCP host, keep the server simple
and expose only stdio first.

```python
from zcp import FastZCP
from zcp.mcp_stdio import run_mcp_stdio_server_sync

app = FastZCP("ZCP MCP Compatibility Server")


@app.tool(
    name="weather.get_current",
    description="Get the current weather for a city.",
    input_schema={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
)
def get_weather(city: str, ctx=None):
    return {"city": city, "temperature": 24, "condition": "Cloudy"}


run_mcp_stdio_server_sync(app)
```

This is the right first deployment when:

- the host process already manages server lifecycle
- you want fast MCP compatibility validation
- network auth and socket infrastructure are not yet part of the rollout

## End-To-End Example: One Hosted Service, Two Surfaces

The most common production shape is one backend that keeps the MCP-compatible
surface for ecosystem clients while also exposing native ZCP for internal
orchestration.

```python
from zcp import (
    AuthProfile,
    FastZCP,
    OAuthConfig,
    PromptArgument,
    SQLiteOAuthProvider,
    ZCPServerConfig,
    create_asgi_app,
)

app = FastZCP(
    "Weather Platform",
    version="1.0.0",
    instructions="Tenant-safe weather backend with MCP compatibility and native ZCP support.",
    auth_profile=AuthProfile(
        issuer="https://zcp.example.com",
        authorization_url="https://zcp.example.com/authorize",
        token_url="https://zcp.example.com/token",
        scopes=["weather.read", "weather.refresh"],
    ),
)


@app.tool(
    name="weather.get_current",
    description="Get current weather for a city.",
    input_schema={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
    required_scopes=("weather.read",),
)
def get_weather(city: str, ctx=None):
    return {"city": city, "temperature": 24, "condition": "Cloudy"}


@app.tool(
    name="weather.refresh_cache",
    description="Refresh remote weather cache.",
    input_schema={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
        "additionalProperties": False,
    },
    execution={"taskSupport": "optional"},
    required_scopes=("weather.refresh",),
)
def refresh_cache(city: str, task=None, ctx=None):
    if task is not None:
        task.set_status("working", f"Refreshing {city}")
    return {"city": city, "status": "refreshed"}


@app.resource("weather://cities", name="Cities", mime_type="application/json")
def cities():
    return ["Hangzhou", "Beijing", "Shanghai"]


@app.prompt(
    name="weather.summary",
    description="Summarize weather in concise Chinese.",
    arguments=[PromptArgument(name="city", required=True)],
)
def weather_summary(city: str):
    return [{"role": "user", "content": f"请总结 {city} 的天气。"}]


application = create_asgi_app(
    app,
    config=ZCPServerConfig(
        service_name="weather-platform",
        environment="production",
        oauth=OAuthConfig(enabled=True, issuer="https://zcp.example.com"),
        oauth_provider=SQLiteOAuthProvider("weather-oauth.db"),
    ),
)
```

In that layout:

- MCP hosts and official MCP SDK clients use `/mcp` or stdio
- browser and service clients that need long-lived connections use `/ws`
- internal orchestrators that care about token overhead use `/zcp`

## Rollout Pattern: Host Compatibility First

If you are replacing an existing MCP server, the safest sequence is:

1. rebuild the server on `FastZCP`
2. keep the same stdio or `/mcp` surface first
3. validate with the official MCP client path you already depend on
4. add `/zcp` only for the internal runtimes that can actually benefit from it

That rollout keeps the compatibility risk local while still letting you move new
agent orchestration onto the native path later.

## Server Configuration

`ZCPServerConfig` groups the operational server surface:

- `HTTPConfig`
  - route paths such as `/zcp`, `/mcp`, `/healthz`, `/metadata`
- `SSEConfig`
  - SSE path and keepalive behavior
- `StreamableHTTPConfig`
  - replay buffer size, retry interval, session TTL
- `WebSocketConfig`
  - websocket enablement and path
- `OAuthConfig`
  - OAuth routes and token behavior
- `BearerAuthConfig`
  - static bearer token
- `RateLimitConfig`
  - coarse request window limits

Treat config as part of your API surface. Transport and auth decisions become
observable client behavior.

## Testing A Server

At minimum, verify:

- `initialize`
- `tools/list`
- `tools/call`
- `resources/list`
- `resources/read`
- `prompts/list`
- `prompts/get`
- `completion/complete`
- auth failures
- task lifecycle behavior
- progress and logging behavior if your server emits them

For compatibility-first rollouts, also test against the official MCP client
paths you expect users to adopt.

## Recommended Rollout Sequence

1. build and validate the stdio or ASGI server locally
2. verify `initialize`, discovery methods, and one real tool call
3. add scopes and task handling before exposing higher-impact operations
4. run the official MCP compatibility tests for the transports you intend to support
5. only then move high-volume native traffic to `/zcp`

## Validation Pattern For A Real Service

For a production server, the test order should usually be:

1. validate the local runtime with `ZCPClientSession`
2. validate stdio if any host process still launches the server
3. validate `/mcp` with the official MCP client path you expect to support
4. validate `/ws` if notifications or long-lived sessions matter
5. validate scope failures, task cancellation, and reconnect behavior

This order catches most integration mistakes before you start tuning prompts,
benchmarks, or user-facing examples.

## Production Checklist

- choose one stable transport strategy per deployment
- declare auth and scopes explicitly
- use tasks for long-running work
- keep tool schemas narrow
- prefer resources for readable artifacts
- document prompt ownership on the server side
- validate against compatibility tests before rollout

## Related Reading

- [Client Guide](/docs/clients)
- [Authorization Guide](/docs/authorization)
- [Transport Guide](/docs/transports)
- [Examples And Use Cases](/docs/examples)
