# 客户端指南

本文说明如何从 Python SDK 客户端侧访问 ZCP，以及更一般地如何理解兼容 MCP 的客户端。

## 客户端模型

主要的 Python 客户端类型是 `ZCPClientSession`。对于多后端流程，SDK 还提供了 `ZCPSessionGroup`。

相关辅助工具包括：

- `stdio_client`
- `streamable_http_client`
- `websocket_client`
- `sse_client`
- `MCPGatewayClient`

## 基本会话生命周期

一个典型会话通常如下：

1. initialize
2. 发现工具、资源和提示词
3. 调用工具或读取资源
4. 响应通知、进度、日志和任务状态
5. 关闭或复用会话

## 本地客户端示例

这个示例使用进程内传输辅助器来驱动一个服务器，而不需要真正启动外部 host。

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

## 语义工作流工具发现

原生 ZCP 客户端可以请求一个过滤后的工具视图，而不是每次都先发现完整的 primitive 工具集合。

```python
from zcp import SemanticWorkflowProfile, stdio_client, stdio_server

profile = SemanticWorkflowProfile()
client = stdio_client(stdio_server(app))

await client.initialize()
await client.initialized()

semantic_tools = await client.list_tools(**profile.as_list_tools_params())
all_tools = await client.list_tools()
```

这个模式适合服务端同时发布两类工具：

- 面向 MCP 兼容面的 primitive 工具
- 面向原生规划路径的高层 workflow 工具

当前内置 profile 是 `semantic-workflow`。当服务端存在
`_meta.groups = ["workflow", ...]` 的工具时，该 profile 只返回这组工作流工具。

## 任务感知客户端示例

不要等到以后才决定客户端如何处理任务。如果一个工具未来可能演化成长任务，就应该从第一天开始在客户端中显式建模。

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

这种模式会给你一套稳定的客户端架构，统一处理：

- 立即完成
- 后台执行
- 可见的状态驱动 UX
- 取消与重试逻辑

## 端到端示例：任务感知的原生客户端

这个示例把客户端和服务端都放在一个进程里，但演示的是你连接真实服务器时也会采用的任务感知流程。

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

在以下情况下，这是正确的客户端模式：

- 工作可能超过一个请求周期
- 你需要取消或进度感知
- 最终结果可能不适合直接内联返回

## 完整文件示例：多后端编排器

当一个编排进程需要聚合多个原生会话，而又不想额外引入独立 gateway 服务时，这是推荐的文件级模式。

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

适用场景：

- 你的运行时已经掌控所有参与服务
- 你想在不增加一次额外网络跳转的情况下完成聚合发现
- 你仍然希望每个返回对象都保留传输来源信息

## 核心客户端方法

常用的 `ZCPClientSession` 方法包括：

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

## 处理任务

如果你的工作流可能超过一次请求周期，客户端从设计之初就应该具备任务意识。

典型的客户端任务流：

1. 通过 `task=...` 调用工具，或使用 `call_tool_as_task(...)`
2. 收到一个 task 对象
3. 用 `get_task(...)` 或 `list_tasks(...)` 轮询
4. 使用 `get_task_result(...)` 拉取最终结果
5. 如果需要停止工作，则执行取消

客户端还应准备好处理 `input_required` 与状态通知。

## 通知

一个会话可能收到以下通知：

- 日志
- 进度
- 资源更新
- 任务状态更新

不要把客户端设计建立在“只有请求-响应流量才重要”的前提上。在真实系统里，通知往往才是操作员和用户理解服务器正在做什么的主要方式。

## Roots、Sampling 与 Elicitation Hooks

`ZCPClientSession` 可以附加：

- roots provider
- sampling handler
- elicitation handler
- log handler

当服务器需要客户端提供 roots、生成模型消息、收集用户输入或以自定义方式处理日志时，这一点尤为重要。

### 带 Hook 的客户端示例

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

当服务器要求客户端运行时执行它自己无法完成的工作，例如模型执行或用户审批时，就应使用这些 hook。

如果服务器预期的已经不仅仅是普通工具调用，应显式挂载这些 hook：

```python
client = streamable_http_client(
    server,
    roots_provider=lambda: [{"uri": "file:///workspace", "name": "workspace"}],
    sampling_handler=lambda request: {"role": "assistant", "content": "Sampled reply"},
    elicitation_handler=lambda request: {"accepted": True, "data": {"city": "Hangzhou"}},
    log_handler=lambda entry: print("LOG", entry),
)
```

把这些 hook 视为客户端契约的一部分。如果服务器设计依赖 sampling、elicitation 或 roots 支持，那么客户端实现从第一天起就必须把它明确下来。

## Session Groups

`ZCPSessionGroup` 允许一个进程聚合多个会话。

适用场景：

- 一个客户端需要访问多个后端服务
- 需要把多个服务器的工具统一列出来
- 希望在一个编排层之下合并资源和提示词

聚合不是没有代价的。应保留传输来源信息，以便工具链仍能识别每个对象来自哪个后端。

### Session Group 示例

```python
weather_group = ZCPSessionGroup([weather_session, docs_session, approval_session])
tools = await weather_group.list_tools()
resources = await weather_group.list_resources()
prompts = await weather_group.list_prompts()
```

当你需要一个轻量编排层、但又不想额外搭一个 gateway 服务时，这种模式很合适。

## MCP 兼容客户端

如果你的目标是互操作，实际上你可能根本不需要自定义 ZCP 客户端。现有 MCP 客户端可以通过以下方式连接到 ZCP：

- stdio
- `/mcp` 上的 streamable HTTP
- `/ws` 上的 websocket

这正是为什么兼容表面被视为正式产品面，而不是一个松散兼容层。

## 客户端设计建议

优先做到：

- 请求设计可安全重试
- 显式处理任务
- 感知日志与进度
- 处理鉴权刷新
- 按传输层做专项测试

避免：

- 假设每次工具调用都是同步的
- 忽略 `input_required`
- 过早把客户端架构绑死在某一种传输上
- 把提示词当成可执行的服务端逻辑

## 推荐的客户端推进顺序

1. 先实现一个本地进程内客户端测试
2. 明确 tasks 是否是 UX 中的一等对象
3. 在网络 rollout 之前补上鉴权刷新与通知处理
4. 针对用户真正会运行的那种传输做验证

## 推进模式：外部走 MCP，内部走原生

一个很实际的 rollout 方式是：

1. 让第三方客户端或 host 提供的客户端继续使用 stdio、`/mcp` 或 `/ws`
2. 只对你自己掌控的内部编排器使用原生 `ZCPClientSession`
3. 把任务感知作为这些内部客户端的必选能力
4. 让两类客户端共用同一套后端运行时

这样你可以获得 ZCP 更低开销的运行时行为，而不必强迫所有下游消费者同时迁移。

## 相关阅读

- [服务器指南](/docs/servers)
- [传输指南](/docs/transports)
- [授权指南](/docs/authorization)
- [SDK API 参考](/docs/sdk-api)
