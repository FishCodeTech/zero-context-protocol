# Client Guide

This guide explains how to talk to ZCP from the Python SDK client side and how
to think about MCP-compatible clients more generally.

## Client Model

The main Python client type is `ZCPClientSession`. For multi-backend flows, the
SDK also provides `ZCPSessionGroup`.

Related helpers include:

- `stdio_client`
- `streamable_http_client`
- `websocket_client`
- `sse_client`
- `MCPGatewayClient`

## Basic Session Lifecycle

A typical session looks like this:

1. initialize
2. discover tools, resources, and prompts
3. invoke tools or read resources
4. react to notifications, progress, logs, and tasks
5. close or reuse the session

## Local Client Example

This example uses the in-process transport helpers to exercise a server without
running a real external host.

```python
import asyncio

from zcp import FastZCP, stdio_client, stdio_server

app = FastZCP("Demo")


@app.tool(
    name="math.add",
    description="Add two integers.",
    input_schema={
        "type": "object",
        "properties": {"a": {"type": "integer"}, "b": {"type": "integer"}},
        "required": ["a", "b"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
)
def add(a: int, b: int):
    return {"sum": a + b}


async def main():
    server = stdio_server(app)
    client = stdio_client(server)
    await client.initialize()
    await client.initialized()
    tools = await client.list_tools()
    result = await client.call_tool("math.add", {"a": 2, "b": 3})
    print(tools)
    print(result)


asyncio.run(main())
```

## Semantic Tool Discovery

Native ZCP clients can ask the runtime for a filtered tool view instead of
always discovering the full primitive tool set.

```python
from zcp import SemanticWorkflowProfile, stdio_client, stdio_server

profile = SemanticWorkflowProfile()
client = stdio_client(stdio_server(app))

await client.initialize()
await client.initialized()

semantic_tools = await client.list_tools(**profile.as_list_tools_params())
all_tools = await client.list_tools()
```

Use this when the server publishes both:

- primitive MCP-compatible tools
- higher-level workflow tools meant for native planning

The current built-in profile is `semantic-workflow`. When the server has tools
tagged with `_meta.groups = ["workflow", ...]`, the profile returns only that
workflow subset.

For the dedicated explanation of what this profile is and why it exists, see
[Semantic Workflow Profile](/docs/semantic-workflow-profile).

## Task-Aware Client Example

Do not wait until later to decide how your client handles tasks. If a tool may
become long-running, model that explicitly in the client from day one.

```python
import asyncio

from zcp import FastZCP, stdio_client, stdio_server

app = FastZCP("Task Demo")


@app.tool(
    name="weather.refresh",
    description="Refresh weather data.",
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
async def refresh(city: str, task=None, ctx=None):
    if task is not None:
        await task.update_status(f"Refreshing {city}")
    await asyncio.sleep(0.2)
    return {"city": city, "status": "done"}


async def main():
    server = stdio_server(app)
    client = stdio_client(server)
    await client.initialize()
    await client.initialized()

    created = await client.call_tool_as_task("weather.refresh", {"city": "Hangzhou"}, ttl=30000, poll_interval=250)
    task_id = created["task"]["taskId"]

    while True:
        current = await client.get_task(task_id)
        if current["task"]["status"] in {"completed", "failed", "cancelled"}:
            break
        await asyncio.sleep(0.05)

    result = await client.get_task_result(task_id)
    print(result)


asyncio.run(main())
```

That pattern gives you one stable client architecture for:

- immediate completion
- background execution
- status-aware UX
- cancellation and retry logic

## End-To-End Example: Task-Aware Native Client

This example keeps everything in one process but exercises the same task-aware
client flow you would use against a real server.

```python
import asyncio

from zcp import FastZCP, streamable_http_client, streamable_http_server

app = FastZCP("Task Demo")


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
)
async def refresh_cache(city: str, task=None):
    if task is not None:
        await task.update_status(f"Refreshing {city}")
    await asyncio.sleep(0.05)
    return {"city": city, "status": "refreshed"}


async def main():
    server = streamable_http_server(app, endpoint="http://127.0.0.1:8000/zcp")
    client = streamable_http_client(server)
    await client.initialize()
    await client.initialized()

    created = await client.call_tool_as_task("weather.refresh_cache", {"city": "Hangzhou"})
    task_id = created["task"]["taskId"]

    while True:
        task = await client.get_task(task_id)
        if task["task"]["status"] in {"completed", "failed", "cancelled"}:
            break
        await asyncio.sleep(0.01)

    result = await client.get_task_result(task_id)
    print(result)


asyncio.run(main())
```

This is the right pattern when:

- work may outlive one request
- you want cancellation or progress
- the final payload may be larger than you want inline

## Complete File Example: Multi-Backend Orchestrator

This is the file-level pattern to use when one orchestrator process needs to
merge several native sessions without introducing a separate gateway service.

```python
import asyncio

from zcp import FastZCP, ZCPSessionGroup, stdio_client, stdio_server

weather_app = FastZCP("Weather")
docs_app = FastZCP("Docs")


@weather_app.tool(
    name="weather.lookup",
    description="Lookup city weather.",
    input_schema={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
)
def weather_lookup(city: str):
    return {"city": city, "temperature": 24}


@docs_app.resource("docs://faq", name="FAQ", mime_type="text/plain")
def faq():
    return "ZCP keeps MCP compatibility and adds a native compact path."


async def main():
    weather_client = stdio_client(stdio_server(weather_app))
    docs_client = stdio_client(stdio_server(docs_app))

    await weather_client.initialize()
    await weather_client.initialized()
    await docs_client.initialize()
    await docs_client.initialized()

    group = ZCPSessionGroup([weather_client, docs_client])
    print(await group.list_tools())
    print(await group.list_resources())


asyncio.run(main())
```

Use this pattern when:

- your runtime already owns all participating services
- you want merged discovery without a separate network hop
- transport provenance still matters on each returned object

## Core Client Methods

Common `ZCPClientSession` methods include:

- `initialize()`
- `initialized()`
- `ping()`
- `list_tools(cursor=..., profile=..., groups=..., exclude_groups=..., stages=...)`
- `call_tool(name, arguments, meta=..., task=...)`
- `call_tool_as_task(name, arguments, ttl=..., poll_interval=..., meta=...)`
- `list_resources(cursor=...)`
- `list_resource_templates(cursor=...)`
- `read_resource(uri, arguments=...)`
- `subscribe_resource(uri)`
- `unsubscribe_resource(uri)`
- `list_prompts(cursor=...)`
- `get_prompt(name, arguments=...)`
- `complete(...)`
- `set_logging_level(level)`
- `list_roots()`
- `create_message(messages, **kwargs)`
- `elicit(kind, prompt, **kwargs)`
- `create_task(kind, input, task=...)`
- `list_tasks(cursor=...)`
- `get_task(task_id)`
- `get_task_result(task_id)`
- `cancel_task(task_id)`

## Working With Tasks

If your workflows can run longer than a single request, clients should be
task-aware from the beginning.

Typical client task flow:

1. call a tool with `task=...` or use `call_tool_as_task(...)`
2. receive a task object
3. poll with `get_task(...)` or `list_tasks(...)`
4. fetch final payload with `get_task_result(...)`
5. cancel if the workflow should stop

Clients should also be prepared for `input_required` and status notifications.

## Notifications

A session can receive notifications for:

- logs
- progress
- resource updates
- task status updates

Do not design clients under the assumption that only request/response traffic
matters. In real systems, notifications are often how operators and users
understand what the server is doing.

## Roots, Sampling, And Elicitation Hooks

`ZCPClientSession` can attach:

- a roots provider
- a sampling handler
- an elicitation handler
- a log handler

This matters when the server needs the client to provide roots, generate a
model message, collect user input, or capture logs in a custom way.

### Hooked Client Example

```python
import asyncio

from zcp import FastZCP, stdio_client, stdio_server

app = FastZCP("Hook Demo")


@app.task("review.summary")
async def review_summary(payload):
    task = payload["task"]
    draft = await task.create_message(
        {
            "messages": [{"role": "user", "content": f"Summarize {payload['topic']} in one sentence."}],
            "maxTokens": 120,
        }
    )
    approval = await task.elicit({"kind": "approval", "prompt": "Approve sending the summary?"})
    return {"draft": draft, "approval": approval}


async def sampling_handler(request):
    return {"role": "assistant", "content": "Short summary draft."}


async def elicitation_handler(request):
    return {"accepted": True, "fields": request}


async def main():
    server = stdio_server(app)
    client = stdio_client(
        server,
        roots_provider=lambda: [{"uri": "file:///workspace", "name": "workspace"}],
        sampling_handler=sampling_handler,
        elicitation_handler=elicitation_handler,
        log_handler=lambda message: print("log:", message),
    )
    await client.initialize()
    await client.initialized()
    created = await client.create_task("review.summary", {"topic": "ZCP transport parity"})
    print(created)


asyncio.run(main())
```

Use hooks when the server needs the client runtime to do work it alone cannot
do, such as model execution or user approval.

Attach hooks explicitly when the server expects more than plain tool calls:

```python
client = streamable_http_client(
    server,
    roots_provider=lambda: [{"uri": "file:///workspace", "name": "workspace"}],
    sampling_handler=lambda request: {"role": "assistant", "content": "Sampled reply"},
    elicitation_handler=lambda request: {"accepted": True, "data": {"city": "Hangzhou"}},
    log_handler=lambda entry: print("LOG", entry),
)
```

Treat these hooks as part of the client contract. If the server design assumes
sampling, elicitation, or roots support, your client implementation has to make
that explicit from day one.

## Session Groups

`ZCPSessionGroup` lets one process aggregate several sessions.

This is useful when:

- a client needs multiple backend services
- tools from several servers must be listed together
- resources and prompts should be merged behind one orchestrator

Aggregation is not free. Keep transport identity visible so tooling can still
understand which backend served which object.

### Session Group Example

```python
weather_group = ZCPSessionGroup([weather_session, docs_session, approval_session])
tools = await weather_group.list_tools()
resources = await weather_group.list_resources()
prompts = await weather_group.list_prompts()
```

Use this when you need a thin orchestration layer without standing up a
separate gateway service.

## MCP-Compatible Clients

You may not need a custom ZCP client at all if your goal is interoperability.
Existing MCP clients can talk to ZCP through:

- stdio
- streamable HTTP on `/mcp`
- websocket on `/ws`

That is the reason the compatibility surface is treated as a product surface,
not as a loose compatibility shim.

## Client Design Guidance

Prefer:

- retry-safe request design
- explicit task handling
- log and progress awareness
- auth refresh handling
- transport-specific testing

Avoid:

- assuming every tool call is synchronous
- ignoring `input_required`
- binding your client architecture to one transport too early
- treating prompts as executable server logic

## Recommended Client Rollout

1. implement one local in-process client test first
2. decide whether tasks are first-class in the UX
3. add auth refresh and notification handling before network rollout
4. validate the exact transport your users will actually run

## Rollout Pattern: MCP Clients Outside, Native Clients Inside

A practical rollout pattern is:

1. keep third-party or host-provided clients on stdio, `/mcp`, or `/ws`
2. use native `ZCPClientSession` only for the internal orchestrators you control
3. make task awareness mandatory for those internal clients
4. keep the same backend runtime behind both surfaces

That split lets you adopt ZCP's lower-overhead runtime behavior without forcing
all downstream consumers to migrate at once.

## Related Reading

- [Server Guide](/docs/servers)
- [Transport Guide](/docs/transports)
- [Authorization Guide](/docs/authorization)
- [SDK API Reference](/docs/sdk-api)
