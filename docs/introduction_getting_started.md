# Introduction And Getting Started

This is the best first document if you understand MCP conceptually but are new
to Zero Context Protocol.

## What ZCP Is

Zero Context Protocol, or ZCP, is a protocol runtime and SDK surface for
tool-enabled LLM systems with two simultaneous goals:

1. remain compatible with the MCP ecosystem at the integration boundary
2. reduce prompt and token overhead when both sides can speak native ZCP

The project is not trying to replace MCP's role in the ecosystem. It is trying
to let one backend serve both worlds:

- `/mcp`, stdio, and websocket for MCP hosts and SDKs
- `/zcp` for compact native sessions that keep more orchestration state outside
  the model-visible path

## Why ZCP Exists

Many real deployments pay unnecessary context cost because they keep sending
the same information through the model path on every turn:

- large tool schemas
- repeated registry listings
- verbose transport envelopes
- full raw outputs that should have stayed server-side
- repeated restatement of capability metadata

ZCP moves validation, state, result storage, task tracking, and transport
orchestration into the runtime wherever possible. MCP compatibility is still
preserved at the boundary.

## How ZCP Relates To MCP

Think about the relationship this way:

- MCP is the interoperability contract
- ZCP is the runtime architecture and native optimization path

When a client connects through stdio, `/mcp`, or `/ws`, ZCP projects the
runtime into MCP-shaped requests, notifications, and results. When a controlled
runtime connects through `/zcp`, the backend can avoid some of the context and
registry costs that MCP-compatible clients still need.

## Repository Layout In This Workspace

Two repositories matter in this workspace:

- `zero-context-protocol`
  - protocol docs
  - docs site
  - capability matrix
  - migration and benchmark framing
- `zero-context-protocol-python`
  - Python SDK
  - runtime implementation
  - MCP compatibility surfaces
  - tests and examples

The docs in this directory describe what the SDK exposes today. They should be
kept aligned with `zero-context-protocol-python`.

## Choose Your Starting Path

### Path 1: Existing MCP Host Integration

Choose this path if you already have an MCP host or want the fastest path to
interoperability.

Use:

- stdio with `run_mcp_stdio_server_sync`
- streamable HTTP on `/mcp`
- websocket on `/ws`

This is the correct path for compatibility-first rollouts.

### Path 2: Native ZCP Runtime

Choose this path if you control the runtime on both ends and want the smallest
model-visible overhead.

Use:

- native JSON-RPC on `/zcp`
- handle-oriented results
- runtime-managed state instead of repeated schema exposure

This is the correct path for long-running, stateful, token-sensitive systems.

## Quick Start

### Run A Minimal MCP-Compatible Stdio Server

From `zero-context-protocol-python`:

```bash
python3 examples/run_zcp_mcp_stdio_server.py
```

That example exposes:

- `initialize`
- `tools/list`
- `tools/call`
- `resources/list`
- `resources/read`
- `prompts/list`
- `prompts/get`
- `completion/complete`

### Run The ASGI Host

From `zero-context-protocol-python`:

```bash
python3 examples/run_zcp_api_server.py
```

The default host exposes:

- `/zcp` for native ZCP JSON-RPC
- `/mcp` for MCP streamable HTTP
- `/ws` for MCP-compatible websocket traffic
- `/healthz`
- `/readyz`
- `/metadata`

### Write Your Own Server

```python
from zcp import FastZCP, PromptArgument, run_mcp_stdio_server_sync

app = FastZCP(
    "Weather Backend",
    version="1.0.0",
    instructions="Example server with one tool and one prompt.",
)


@app.tool(
    name="weather.get_current",
    description="Get weather for a city.",
    input_schema={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
        "additionalProperties": False,
    },
    output_schema={
        "type": "object",
        "properties": {
            "city": {"type": "string"},
            "temperature": {"type": "integer"},
            "condition": {"type": "string"},
        },
        "required": ["city", "temperature", "condition"],
    },
    output_mode="scalar",
    inline_ok=True,
)
def get_weather(city: str, ctx=None):
    return {"city": city, "temperature": 24, "condition": "Cloudy"}


@app.prompt(
    name="weather.summary",
    arguments=[PromptArgument(name="city", required=True)],
)
def weather_prompt(city: str):
    return [{"role": "user", "content": f"Summarize weather for {city}"}]


run_mcp_stdio_server_sync(app)
```

## First Production Decision

Before you build too much, choose these three things explicitly:

1. interoperability surface
   - stdio
   - `/mcp`
   - `/ws`
   - `/zcp`
2. auth model
   - none
   - static bearer token
   - OAuth 2.1 style flow with PKCE
3. execution model
   - synchronous `tools/call`
   - task-augmented `tools/call`
   - explicit `tasks/create`

Those decisions influence docs, testing, and operational behavior much more
than the first demo usually reveals.

## What "Compatible" Means In Practice

For this project, MCP compatibility means more than method names. It includes:

- official request and result shapes
- streamable HTTP behavior on `/mcp`
- websocket interoperability
- capability discovery
- auth metadata exposure
- compatibility testing against the official MCP Python SDK client

Compatibility does not mean ZCP gives up its native optimization path. It means
the runtime can project itself into MCP correctly at the boundary.

## Recommended Next Steps

1. Read [Core Concepts: Tools, Resources, Templates, And Prompts](/docs/core-concepts) to model your surface.
2. Read [Core Concepts: Sampling, Elicitation, Roots, Logging, Progress, And Tasks](/docs/runtime-features) before designing long-running workflows.
3. Read [Transport Guide](/docs/transports) and [Authorization Guide](/docs/authorization) before deployment.
4. Use [Server Guide](/docs/servers) and [Client Guide](/docs/clients) while implementing.
