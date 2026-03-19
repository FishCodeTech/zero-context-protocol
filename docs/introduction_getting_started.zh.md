# 简介与快速开始

如果你已经在概念上了解 MCP，但刚接触 Zero Context Protocol，那么这篇文档是最合适的起点。

## 什么是 ZCP

Zero Context Protocol，简称 ZCP，是一个面向工具增强型 LLM 系统的协议运行时和 SDK 接口层，同时追求两个目标：

1. 在集成边界上保持与 MCP 生态兼容
2. 在通信双方都能使用原生 ZCP 时，减少 prompt 和 token 开销

这个项目并不是要取代 MCP 在生态中的位置，而是希望让同一个后端同时服务两类场景：

- 为 MCP host 和 SDK 提供 `/mcp`、stdio 和 websocket
- 为更紧凑的原生会话提供 `/zcp`，把更多编排状态保留在模型可见路径之外

## 为什么需要 ZCP

很多真实部署场景会产生不必要的上下文成本，因为它们在每一轮都不断把相同的信息送入模型路径中：

- 很大的工具 schema
- 重复的注册表列表
- 冗长的传输 envelope
- 本应留在服务端的完整原始输出
- 对能力元数据的重复描述

ZCP 会尽可能把校验、状态、结果存储、任务跟踪和传输编排放进运行时内部处理。同时，它依然在边界上保留 MCP 兼容性。

## ZCP 与 MCP 的关系

可以这样理解二者的关系：

- MCP 是互操作契约
- ZCP 是运行时架构与原生优化路径

当客户端通过 stdio、`/mcp` 或 `/ws` 连接时，ZCP 会把运行时投影为 MCP 形态的请求、通知和结果。当一个受控运行时通过 `/zcp` 连接时，后端就可以避免一部分 MCP 兼容客户端仍然需要承担的上下文和注册表成本。

## 当前工作区中的仓库结构

当前工作区中有两个关键仓库：

- `zero-context-protocol`
  - 协议文档
  - docs 站点
  - 能力矩阵
  - 迁移与 benchmark 说明
- `zero-context-protocol-python`
  - Python SDK
  - 运行时实现
  - MCP 兼容接口层
  - 测试与示例

本目录下的文档描述的是 SDK 当前实际暴露出来的能力，因此它们应始终与 `zero-context-protocol-python` 保持一致。

## 选择你的起始路径

### 路径 1：已有 MCP Host 集成

如果你已经有 MCP host，或者希望用最快速度获得互操作性，就选择这条路径。

使用：

- 通过 `run_mcp_stdio_server_sync` 暴露 stdio
- 在 `/mcp` 上暴露 streamable HTTP
- 在 `/ws` 上暴露 websocket

这是以兼容优先进行上线的正确路径。

### 路径 2：原生 ZCP 运行时

如果你同时控制运行时两端，并且希望模型可见开销尽可能小，就选择这条路径。

使用：

- 在 `/zcp` 上暴露原生 JSON-RPC
- 面向 handle 的结果
- 用运行时管理状态，而不是反复暴露 schema

这是长会话、有状态、对 token 成本敏感系统的正确路径。

## 快速开始

### 运行一个最小的 MCP 兼容 stdio 服务器

在 `zero-context-protocol-python` 中运行：

```bash
python3 examples/run_zcp_mcp_stdio_server.py
```

这个示例会暴露：

- `initialize`
- `tools/list`
- `tools/call`
- `resources/list`
- `resources/read`
- `prompts/list`
- `prompts/get`
- `completion/complete`

### 运行 ASGI Host

在 `zero-context-protocol-python` 中运行：

```bash
python3 examples/run_zcp_api_server.py
```

默认 host 会暴露：

- `/zcp`，用于原生 ZCP JSON-RPC
- `/mcp`，用于 MCP streamable HTTP
- `/ws`，用于 MCP 兼容 websocket 通信
- `/healthz`
- `/readyz`
- `/metadata`

### 编写你自己的服务器

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

## 第一个生产级决策

在你继续实现之前，应该先明确做出以下三个决策：

1. 互操作接口层
   - stdio
   - `/mcp`
   - `/ws`
   - `/zcp`
2. 认证模型
   - 无认证
   - 静态 bearer token
   - 带 PKCE 的 OAuth 2.1 风格流程
3. 执行模型
   - 同步 `tools/call`
   - task-augmented `tools/call`
   - 显式 `tasks/create`

这些选择对文档、测试和运维行为的影响，通常远比第一个 demo 显示出来的更大。

## 实际上“兼容”意味着什么

在这个项目里，MCP 兼容并不只是方法名一致。它还包括：

- 官方请求与结果 shape
- `/mcp` 上的 streamable HTTP 行为
- websocket 互操作性
- capability discovery
- auth metadata 暴露
- 与官方 MCP Python SDK client 的兼容性测试

兼容并不意味着 ZCP 放弃原生优化路径，而是意味着运行时能够在边界上正确投影为 MCP。

## 推荐下一步

1. 阅读 [Core Concepts: Tools, Resources, Templates, And Prompts](/docs/core-concepts)，先把你的接口面建模清楚。
2. 在设计长运行工作流之前，先阅读 [Core Concepts: Sampling, Elicitation, Roots, Logging, Progress, And Tasks](/docs/runtime-features)。
3. 在部署之前阅读 [Transport Guide](/docs/transports) 和 [Authorization Guide](/docs/authorization)。
4. 在实现过程中配合阅读 [Server Guide](/docs/servers) 和 [Client Guide](/docs/clients)。
