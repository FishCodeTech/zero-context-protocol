# Transport Guide

This document explains how ZCP surfaces the runtime over stdio, HTTP, and
websocket transports, and how those transports map to MCP expectations.

## Transport Overview

ZCP currently exposes four relevant transport surfaces:

- stdio for host-spawned MCP integrations
- streamable HTTP on `/mcp`
- websocket on `/ws`
- native JSON-RPC on `/zcp`

The first three are compatibility-facing. The last one is the native ZCP path.

## Stdio

Stdio is the standard transport when a host process launches the server.

Use stdio when:

- the host manages process lifetime
- local desktop integration matters
- you want the simplest MCP-compatible launch path

Server entry point:

```python
from zcp import FastZCP, run_mcp_stdio_server_sync

app = FastZCP("Desktop Integration")
run_mcp_stdio_server_sync(app)
```

Why stdio still matters:

- many MCP hosts start here first
- auth is often delegated to process trust rather than network auth
- it is the fastest path for local compatibility testing

## Streamable HTTP On `/mcp`

ZCP's MCP-facing HTTP surface implements streamable HTTP semantics at `/mcp`.

Supported HTTP methods:

- `GET /mcp`
- `POST /mcp`
- `DELETE /mcp`

### `GET /mcp`

Used for SSE streaming and replay-aware event delivery.

Important behavior:

- SSE event IDs are emitted
- `Last-Event-ID` is supported against a bounded replay buffer
- retry hints are emitted
- session identity is preserved with headers

### `POST /mcp`

Used for MCP JSON-RPC requests. Depending on request shape and session state,
responses may be:

- normal JSON responses
- streamed SSE responses
- `202 Accepted` for notification-only cases

### `DELETE /mcp`

Used to terminate server-side session state explicitly.

### Session Headers

Across HTTP flows, ZCP supports session tracking with:

- `mcp-session-id`
- the configured native session header, which defaults to `x-zcp-session`

That session tracking is what makes replay, subscriptions, and task lifecycle
behavior coherent across multiple requests.

### Minimal HTTP RPC Example

For compatibility testing, a single initialize call is enough to prove the
surface and headers are wired correctly.

```http
POST /mcp
Authorization: Bearer <token>
Mcp-Session-Id: session-1
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {},
    "clientInfo": {"name": "demo-client", "version": "1.0.0"}
  }
}
```

Typical follow-up requests on the same session:

- `tools/list`
- `tools/call`
- `resources/read`
- `prompts/get`
- `completion/complete`

### When To Prefer `/mcp` Over `/zcp`

Prefer `/mcp` when:

- the caller is an existing MCP client
- you want official client interoperability instead of custom runtime efficiency
- you need streamable HTTP semantics such as SSE replay behavior

## End-To-End Pattern: Hosted MCP Service

Use `/mcp` when you want network-facing MCP compatibility without giving up the
native `/zcp` path.

Typical layout:

1. run one ASGI service
2. expose `/mcp` for MCP-compatible clients
3. expose `/zcp` for internal orchestrators
4. keep `/ws` for clients that need long-lived bidirectional traffic
5. use the same auth policy across all protected routes

This layout is usually better than running a separate compatibility server and a
separate native server unless you truly need operational isolation.

## WebSocket On `/ws`

ZCP also exposes a websocket transport on `/ws`.

Use websocket when:

- you want a long-lived bidirectional connection
- low-latency request/notification flow matters
- you control infrastructure that can keep sockets open reliably

Websocket support is already compatible enough for local interoperability with
the official MCP Python SDK client. The remaining work is about broader soak
coverage and longer-lived reconnect scenarios, not basic availability.

### Websocket Deployment Guidance

Prefer `/ws` when:

- the client maintains a long-lived operator or agent session
- notifications and task updates should arrive with low latency
- your infrastructure is already comfortable with socket lifecycle management

Prefer `/mcp` instead when:

- HTTP ingress and auth infrastructure are already standardized
- the client tolerates request/response semantics
- SSE replay is easier to operate than socket reconnect state

## End-To-End Pattern: Notification-Heavy Session

Choose `/ws` when your client relies on:

- task status updates
- resource update notifications
- lower-latency progress events
- long-lived interactive sessions

In practice, `/ws` is the right fit for dashboards, operator consoles, and
agent runtimes that do not want to pay the reconnect and replay cost of many
separate HTTP requests.

## Native JSON-RPC On `/zcp`

`/zcp` is the native ZCP transport. It is not the MCP compatibility path.

Use it when:

- both sides are ZCP-aware
- you want tighter control over runtime state
- you care about token efficiency in long-running sessions

The native path is where ZCP can avoid some of the repeated schema and registry
exposure that MCP-compatible surfaces still need for interoperability.

## One Service, Two Client Classes

One practical deployment pattern is:

1. expose `/mcp` and `/ws` for ecosystem-facing clients
2. keep `/zcp` for internal agent traffic
3. let the same backend runtime serve both

This gives you:

- compatibility without a separate gateway process
- lower-overhead native traffic where you control both ends
- one server implementation instead of parallel MCP and non-MCP stacks

## Transport Selection

Choose a transport based on ownership and deployment shape:

- stdio
  - best for host-spawned local integrations
- `/mcp`
  - best for network-facing MCP clients and browser/server integrations
- `/ws`
  - best for long-lived bidirectional MCP-compatible sessions
- `/zcp`
  - best for controlled native runtime integrations

## Deployment Patterns

There are four repeatable patterns that cover most real deployments:

### 1. Desktop Or Host-Spawned Integration

- expose stdio only
- keep auth simple or delegated to the host
- validate launch, initialization, and tool discovery first

### 2. Hosted MCP API

- expose `/mcp`
- keep `/ws` available if your clients need long-lived sessions
- add OAuth or bearer auth at the ASGI boundary

### 3. Internal Agent Runtime

- expose `/zcp`
- keep `/mcp` enabled only if you still support external MCP clients
- move large results and long-running state off-context

### 4. Mixed Compatibility And Native Deployment

- expose `/mcp`, `/ws`, and `/zcp` from one service
- keep client ownership boundaries explicit
- benchmark the native path before forcing migrations

## Request Flow Checklist

For every transport, verify the same high-value behaviors:

1. initialize and capability discovery
2. tool invocation
3. resource reads and subscriptions when used
4. task creation, polling, and cancellation
5. auth failures and token refresh if relevant
6. reconnect behavior for long-lived sessions

## Operational Concerns

For every transport, verify:

- auth behavior
- timeout and keepalive behavior
- reconnect behavior
- notification delivery
- task and progress behavior
- rate limiting and session lifecycle

## Recommended Transport Playbooks

### Existing MCP Host

- start with stdio
- keep the launch contract simple
- defer network auth and reconnect complexity

### Hosted MCP API

- start with `/mcp`
- add `/ws` only when long-lived sockets materially help
- validate replay and session headers early

### Native Internal Runtime

- use `/zcp`
- keep `/mcp` enabled only for external interoperability
- move heavy multi-turn traffic to the native path first

These issues usually determine real production quality more than raw method
support does.

## Compatibility Notes

The project now has compatibility validation against the official MCP Python SDK
client for:

- stdio
- streamable HTTP
- websocket

That does not mean every edge case is fully exhausted. It means the core client
flows work against ZCP's compatibility surface today.

## Related Reading

- [Authorization Guide](/docs/authorization)
- [Protocol Reference](/docs/protocol)
- [Server Guide](/docs/servers)
- [Examples And Use Cases](/docs/examples)
