# FAQ

## Is ZCP Trying To Replace MCP?

No. ZCP treats MCP compatibility as an explicit product boundary. The goal is
to keep interoperability with existing MCP hosts and SDKs while offering a more
efficient native runtime path when both ends are under your control.

## Why Not Just Use MCP Everywhere?

In some environments, that is the right answer. ZCP exists because some systems
pay too much repeated token cost from registry exposure, large schemas, and
verbose payloads. Native ZCP exists to reduce that overhead without discarding
MCP compatibility.

## Does ZCP Break Existing MCP Clients?

Not when you use the compatibility surface correctly. ZCP exposes MCP-facing
transports through stdio, `/mcp`, and `/ws`, and the project includes
compatibility testing against the official MCP Python SDK client.

The practical rule is:

- if the client already speaks MCP, keep it on the compatibility surface
- if you own both ends, decide separately whether `/zcp` is worth it

The practical migration rule is:

1. keep existing MCP clients on the compatibility surface
2. verify them against the exact transport they already use
3. introduce `/zcp` only for the runtimes you control directly

## When Should I Use Native `/zcp` Instead Of `/mcp`?

Use `/zcp` when:

- you control both sides
- token cost matters
- sessions are long or stateful
- large results should remain outside prompt context when possible

Use `/mcp` when:

- interoperability is the priority
- you are serving standard MCP clients
- external tooling expects MCP method and transport behavior

Use `/ws` when:

- the MCP client benefits from long-lived bidirectional state
- task updates and notifications should arrive with lower latency

The common production shape is to keep both:

- `/mcp` for ecosystem-facing compatibility
- `/zcp` for your own internal orchestrators

## How Complete Is MCP Compatibility Today?

Core lifecycle, tools, resources, prompts, completions, logging, roots,
streamable HTTP, websocket, and core auth metadata are implemented. The
remaining work is mostly deeper edge-case coverage and some broader
experimental-feature interoperability, not basic availability. The strict list
lives in [MCP Gap And TODO](/docs/mcp-gap).

That means the correct claim today is broad, tested core compatibility, not
absolute parity for every auth client, reconnect edge case, or experimental
extension.

## Does ZCP Support OAuth?

Yes. The current implementation supports:

- authorization server metadata
- protected resource metadata
- authorization code flow
- PKCE validation
- refresh token exchange
- dynamic client registration
- token revocation
- pluggable providers
- SQLite-backed persistence

If you only need a private internal deployment, bearer auth may still be the
better first step. OAuth should be introduced when delegated authorization,
refresh, or broader client provisioning actually matters.

## Is The OAuth Layer Production-Ready?

It is production-capable for local and single-node deployments and far beyond a
demo-only in-memory flow. It still needs broader interoperability coverage and
more provider options before you should treat it as the final answer for every
enterprise identity environment.

The current strongest production path is:

- OAuth enabled
- SQLite-backed provider or your own provider implementation
- explicit scopes on mutating capabilities

The pragmatic rollout is:

1. bearer auth for internal-only use
2. OAuth metadata plus auth code + PKCE when the client boundary widens
3. persistent provider-backed state before broader external adoption

## What Is The Difference Between Tools And Resources?

Use a tool for an operation.
Use a resource for readable content.

If the client is asking the server to perform work, that is usually a tool. If
the client is reading a server-owned artifact or document, that is usually a
resource.

A useful shortcut:

- action verb: usually a tool
- stable URI or document: usually a resource

## Why Do Prompts Exist If I Already Have Tools?

Prompts solve prompt construction, not execution. They let the server own
reusable message templates. They do not replace validation, side-effecting
operations, or task orchestration.

## When Should I Use Tasks?

Use tasks when:

- execution is long-running
- cancellation matters
- status transitions matter
- a workflow may pause for input or approval
- the final result may be collected later

Do not use tasks for tiny instant operations that add no lifecycle value.

If you are unsure, ask one question:

- would status, cancellation, or later result retrieval make the UX meaningfully better?

If the answer is yes, start with tasks.

If a tool might require approval, take seconds or minutes to finish, or produce
a result that is better fetched later, treat it as task-capable from the start.

## How Should Tasks And Tools Work Together?

Use one of two patterns:

- explicit task kinds with `tasks/create` when the workflow is clearly long-running
- task-augmented `tools/call` when you want a normal tool interface that can
  become asynchronous when needed

The second pattern is often the easiest migration path because clients can keep
thinking in terms of tools while still receiving lifecycle state.

## Does ZCP Only Matter For Python?

No. The implementation in this workspace is Python-first today, but the
protocol and documentation are not conceptually limited to Python.

What is Python-specific right now is the official SDK and test harness, not the
reason the protocol exists.

The current repo split reflects implementation reality, not protocol intent:

- `zero-context-protocol-python` is the official Python SDK
- `zero-context-protocol` is the protocol and docs surface

## Why Are Docs And SDK Code In Separate Repositories Here?

The split keeps ownership clear:

- `zero-context-protocol` owns protocol explanation and docs delivery
- `zero-context-protocol-python` owns implementation and tests

That makes it easier to evolve the docs site and protocol framing without
mixing those changes into the SDK codebase.

## Where Should I Start If I Want To Build Something Real?

Read in this order:

1. [Introduction And Getting Started](/docs/introduction)
2. [Core Concepts: Tools, Resources, Templates, And Prompts](/docs/core-concepts)
3. [Core Concepts: Sampling, Elicitation, Roots, Logging, Progress, And Tasks](/docs/runtime-features)
4. [Transport Guide](/docs/transports)
5. [Authorization Guide](/docs/authorization)
6. [Server Guide](/docs/servers)
7. [Client Guide](/docs/clients)

If your question is specifically about migration, skip directly to
[Examples And Use Cases](/docs/examples) and [Migration Guide](/docs/migration).

## What Is A Realistic First Production Deployment?

For most teams, the sensible first production shape is:

1. one ASGI service
2. `/mcp` enabled for compatibility
3. `/zcp` enabled for internal orchestrators only
4. `/ws` enabled if long-lived sessions or notifications matter
5. bearer auth first, OAuth only when the integration boundary requires it

That keeps operational complexity proportional to the actual rollout stage.
