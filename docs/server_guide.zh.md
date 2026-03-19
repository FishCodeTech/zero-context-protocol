# 服务器指南

本文说明如何构建、托管并正确理解一个 ZCP 服务器。

## 服务器模型

核心入口类型是 `FastZCP`。

```python
from zcp import FastZCP

app = FastZCP(
    "Weather Backend",
    version="1.0.0",
    instructions="Weather tools, prompts, resources, and tasks.",
)
```

一个 `FastZCP` 应用可以注册：

- 工具
- 资源
- 资源模板
- 提示词
- completion
- 任务处理器

之后你可以通过以下方式暴露应用：

- stdio
- 在 `/mcp`、`/zcp` 和 `/ws` 上提供 ASGI 服务

## 端到端 ASGI 示例

如果你需要一个同时服务于 MCP 兼容客户端和原生 ZCP 客户端的单体服务，这就是推荐的基础形态。

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

### 语义工作流工具暴露

如果你的服务器同时发布：

- 面向 MCP 兼容面的 primitive 工具
- 面向原生规划路径的高层 workflow 工具

那么应显式声明这件事：

- 给 workflow 工具加上 `_meta.groups = ["workflow", ...]`
- 在主要供原生 ZCP 客户端使用的服务上设置 `FastZCP(default_tool_profile="semantic-workflow")`
- 如果你希望在 HTTP metadata 中也暴露这项约定，可以同步设置 `ToolExposureConfig(default_profile="semantic-workflow")`

客户端随后就可以请求：

```python
tools = await client.list_tools(profile="semantic-workflow")
```

这样既保留了 MCP 兼容面，又能让原生客户端看到更小、更适合规划的工具注册表。

关于这个 profile 合约本身的完整说明，参见
[Semantic Workflow Profile](/docs/semantic-workflow-profile)。

启动方式：

```bash
cd zero-context-protocol-python
uvicorn examples.zcp_server_template:application --host 0.0.0.0 --port 8000
```

或者使用仓库自带启动器：

```bash
cd zero-context-protocol-python
python3 examples/run_zcp_api_server.py
```

这会立即给你：

- `/mcp`，供 MCP 兼容客户端使用
- `/ws`，用于长连接的 MCP 兼容 socket 会话
- `/zcp`，用于原生紧凑流量
- `/metadata`、`/healthz` 和 `/readyz`，用于运维

## 完整文件示例：托管双表面服务

当一个服务必须同时支持 MCP 客户端和原生 ZCP 客户端时，这是推荐的文件级模式。

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
    return "ZCP keeps MCP compatibility and adds a native compact path."


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

运行：

```bash
uvicorn examples.zcp_server_template:application --host 0.0.0.0 --port 8000
```

适用场景：

- 第三方客户端仍然需要 MCP
- 内部工作进程可以从 `/zcp` 获益
- 希望由一个服务统一负责 discovery、auth 与生命周期

## 定义工具

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

工具设计建议：

- 名称保持稳定
- schema 保持收敛
- 明确说明副作用
- 使用 `required_scopes` 管理策略
- 当任务支持或运行时行为重要时，补充 `execution` 元数据

## 定义资源与模板

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

当核心操作是“读取内容”而不是“执行流程”时，应优先使用资源。

## 定义提示词与 Completion

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

提示词用于集中管理 prompt 构造；completion 用于补全提示词或资源参数。

## 定义任务

你可以直接注册任务处理器：

```python
@app.task("weather.refresh")
def refresh_weather(payload):
    return {"status": "refreshed", "city": payload["city"]}
```

你也可以通过工具的 `execution` 元数据声明任务支持，从而允许 task-augmented `tools/call`。这样调用方仍然可以使用 `tools/call`，但在需要时获得任务生命周期行为。

### 支持任务的工具模式

当一个工具最初是同步的，但后续可能需要后台执行，同时又不希望修改其公开名称时，这是最好的桥接方式。

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

适用场景：

- 调用方应继续看到同一个工具名
- 有些调用仍可以直接内联完成
- 长任务需要暴露显式任务状态

### 显式任务处理器模式

当一个操作从一开始就是“作业型”的，就应使用 `@app.task(...)`。

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

适用场景：

- 对外契约天然就是 job-oriented
- 从一开始就需要轮询与取消
- 该操作本来就不适合作为普通工具调用

## 暴露 Stdio 服务器

当客户端或宿主直接拉起你的进程时，使用这种方式。

```python
from zcp import run_mcp_stdio_server_sync

run_mcp_stdio_server_sync(app)
```

## 完整文件示例：MCP 优先的 Stdio 服务

如果你的首个用户是现有 MCP host，并且你希望迁移面尽可能小，这就是正确的文件形态。

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

适用场景：

- host 已经接管了进程生命周期
- 你想先验证 MCP 兼容性
- 网络鉴权和 socket 基础设施尚未进入 rollout

## 暴露 ASGI 服务器

当你需要 HTTP 与 websocket 传输时，使用这种方式。

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

ASGI 服务可以暴露：

- `/zcp`
- `/mcp`
- `/ws`
- `/healthz`
- `/readyz`
- `/metadata`

## MCP 兼容的 Stdio 示例

如果你的首个 rollout 目标是现有 MCP host，那么一开始应先保持服务器简单，只暴露 stdio。

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

这是合适的首个部署形态，因为：

- host 进程已经负责服务器生命周期
- 你想快速验证 MCP 兼容性
- 网络鉴权与 socket 基础设施还不在当前 rollout 范围内

## 端到端示例：一个托管服务，两种表面

最常见的生产形态是：一个后端同时保留面向生态的 MCP 兼容表面，也暴露给内部编排使用的原生 ZCP 表面。

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

在这种布局下：

- MCP hosts 和官方 MCP SDK 客户端使用 `/mcp` 或 stdio
- 需要长连接的浏览器端或服务端客户端使用 `/ws`
- 关注 token 开销的内部编排器使用 `/zcp`

## 推进模式：先保证 Host 兼容

如果你是在替换一个现有 MCP 服务器，最安全的顺序通常是：

1. 用 `FastZCP` 重建服务器
2. 先保持原有的 stdio 或 `/mcp` 表面不变
3. 用你当前依赖的官方 MCP 客户端路径做验证
4. 只有在确定有收益时，再为内部运行时增加 `/zcp`

这种 rollout 可以把兼容性风险限制在本地，同时仍然允许你后续把新的 Agent 编排迁移到原生表面上。
