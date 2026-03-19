# Core Concepts: Sampling, Elicitation, Roots, Logging, Progress, And Tasks

These features are where integrations move beyond simple synchronous tool
calling into real runtime orchestration.

## Why These Concepts Matter

A shallow integration can often stop at:

- `tools/list`
- `tools/call`
- `resources/read`

Production systems usually cannot. They need:

- model callbacks
- user input collection
- workspace scoping
- operational logs
- progress reporting
- durable background work

ZCP supports those capabilities while still projecting them into MCP-compatible
method names and notifications where appropriate.

## Sampling

Sampling is the server asking the client runtime to generate a model message.
On the MCP surface, this is `sampling/createMessage`.

Typical request fields include:

- `messages`
- `systemPrompt`
- `modelPreferences`
- `includeContext`
- `temperature`
- `maxTokens`
- `stopSequences`
- `metadata`
- `tools`
- `toolChoice`

### When To Use Sampling

Use sampling when the server or task needs a model decision and the client owns
model execution.

Examples:

- a task asks the model to plan a next step
- a backend asks the host to summarize retrieved context
- a workflow uses a client-owned model to draft output before human review

### Design Guidance

Prefer sampling for bounded, explicit decisions. Do not use it as a vague
"think for a while" escape hatch. The server should still own workflow state
and validation.

## Elicitation

Elicitation is the server asking the client or user for more information. On
the MCP surface, the canonical method is `elicitation/create`. The ZCP client
API also preserves a compatibility alias path in places where older native code
expects it.

Use elicitation for:

- collecting missing arguments
- approval flows
- choosing between execution modes
- redirecting the user to an external action such as OAuth login

### Common Elicitation Patterns

- form-style requests
- simple approval prompts
- URL handoff flows
- interrupted task flows that later resume

### Design Guidance

Use elicitation only when the server genuinely lacks required input. Do not use
it to offload validation or to patch over poor tool schemas.

## Roots

Roots are client-provided top-level scopes that the server may use as context
anchors. On the MCP surface, roots are exposed through `roots/list`.

Roots are useful when the server should operate only within explicit user-owned
or client-owned boundaries.

Examples:

- a workspace folder
- a repository root
- a mount point
- a tenant-specific boundary

### Why Roots Matter

Without roots, a server may need to guess scope or overreach. With roots, the
client can declare what the server is allowed or expected to treat as the top
level of work.

## Logging

Logging lets the server send structured operational messages back to the
client. On the MCP surface, this uses:

- `logging/setLevel`
- `notifications/message`

Logging is useful for:

- warnings
- degraded-mode notices
- troubleshooting integration issues
- explaining why a task paused or failed

### Design Guidance

Keep logs operational. They should help clients and operators understand server
behavior, not duplicate business output that belongs in tool or task results.

## Progress

Progress notifications report incremental work before a final result is ready.
ZCP emits `notifications/progress` and accepts progress tokens from common MCP
metadata paths.

Use progress when:

- work is long enough that silence looks like a hang
- a task has meaningful checkpoints
- the client wants to surface status to users

Examples:

- indexing files
- importing records
- processing a document batch
- waiting on a multi-step workflow

## Tasks

Tasks are the durable abstraction for work that should outlive a single
blocking request/response round trip.

Supported task methods include:

- `tasks/create`
- `tasks/list`
- `tasks/get`
- `tasks/result`
- `tasks/cancel`
- `notifications/tasks/status`

Current task states include:

- `queued`
- `working`
- `input_required`
- `completed`
- `failed`
- `cancelled`

### When To Use Tasks

Use tasks when:

- execution may be slow
- cancellation matters
- a job may pause for input or approval
- the client needs status transitions
- results should be retrieved later

### Task-Augmented Tool Calls

ZCP also supports task-augmented `tools/call`. A tool can declare task support
and still be invoked through the normal tool namespace while the runtime turns
execution into a tracked task.

This pattern is useful when you want:

- one public tool name
- optional background execution
- a clean upgrade path from synchronous to durable execution

### Task Execution Context Example

The task execution context is what lets a task or task-capable tool update its
own status and request client-owned behavior without leaking every intermediate
artifact into prompt-visible output.

```python
import asyncio


@app.task("review.run")
async def run_review(payload):
    task = payload["task"]
    await task.update_status("Collecting context")
    await asyncio.sleep(0.2)

    draft = await task.create_message(
        {
            "messages": [{"role": "user", "content": f"Summarize {payload['topic']} briefly."}],
            "maxTokens": 120,
        }
    )

    approval = await task.elicit({"kind": "approval", "prompt": "Approve sending the draft?"})
    return {"draft": draft, "approval": approval}
```

That is the core runtime pattern behind:

- background work with observable status
- server-requested model turns
- input-gated workflows
- resumable execution without re-encoding everything into one tool response

### Separate Task Handlers

The server can also expose explicit task kinds with `FastZCP.task(kind)`. This
is the better fit when a workflow is naturally task-shaped from the beginning.

### What Tasks Improve In ZCP

Tasks are one of the places where ZCP's runtime architecture matters more than
pure wire compatibility. The runtime can:

- keep status and result state server-side
- avoid forcing every intermediate artifact into prompt context
- bridge synchronous and asynchronous execution modes
- preserve MCP-compatible task methods at the boundary

### Current Limits

Tasks are already useful and async-capable, but the project still tracks
remaining work around broader interoperability coverage, reconnect semantics,
and deeper experimental parity. See [MCP Gap And TODO](/docs/mcp-gap) for the exact remaining
items instead of assuming all experimental behavior is complete.

## Recommended Modeling Rules

- Use sampling when the server needs the client runtime to generate a message.
- Use elicitation when the server needs more user or client input.
- Use roots when scope must be client-declared.
- Use logging for operational messages.
- Use progress for incremental status.
- Use tasks for long-running or interruptible work.

## Related Reading

- [Core Concepts](/docs/core-concepts)
- [Transport Guide](/docs/transports)
- [Authorization Guide](/docs/authorization)
- [Server Guide](/docs/servers)
- [Client Guide](/docs/clients)
