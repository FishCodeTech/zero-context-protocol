# 传输指南

这篇文档解释了 ZCP 如何通过 stdio、HTTP 和 websocket 暴露运行时，以及这些传输方式如何映射到 MCP 的预期。

## 传输总览

ZCP 当前暴露了四种关键传输接口：

- 面向 host 启动型 MCP 集成的 stdio
- 位于 `/mcp` 的 streamable HTTP
- 位于 `/ws` 的 websocket
- 位于 `/zcp` 的原生 JSON-RPC

前三种是面向兼容性的接口层，最后一种是原生 ZCP 路径。

## Stdio

当 host 进程负责启动服务端时，stdio 是标准传输方式。

以下场景适合使用 stdio：

- host 管理进程生命周期
- 本地桌面集成很重要
- 你需要最简单的 MCP 兼容启动路径

服务端入口示例：

```python
from zcp import FastZCP, run_mcp_stdio_server_sync

app = FastZCP("Desktop Integration")
run_mcp_stdio_server_sync(app)
```

stdio 依然重要的原因：

- 许多 MCP host 首先就是从这里接入
- 认证通常依赖进程信任，而不是网络认证
- 它是本地兼容性测试最快的路径

## `/mcp` 上的 Streamable HTTP

ZCP 的 MCP HTTP 接口面在 `/mcp` 上实现了 streamable HTTP 语义。

支持的 HTTP 方法：

- `GET /mcp`
- `POST /mcp`
- `DELETE /mcp`

### `GET /mcp`

用于 SSE 流式传输和基于 replay 的事件投递。

关键行为包括：

- 发出 SSE event ID
- 支持基于有界 replay buffer 的 `Last-Event-ID`
- 发出 retry hint
- 通过 header 保持 session 身份

### `POST /mcp`

用于 MCP JSON-RPC 请求。根据请求形态和 session 状态，响应可能是：

- 普通 JSON 响应
- 流式 SSE 响应
- 对仅通知类情况返回 `202 Accepted`

### `DELETE /mcp`

用于显式终止服务端会话状态。

### Session Headers

在 HTTP 流程中，ZCP 支持通过以下 header 跟踪 session：

- `mcp-session-id`
- 配置中的原生 session header，默认是 `x-zcp-session`

正是这种 session 跟踪能力，使 replay、订阅与 task 生命周期能够在多次请求之间保持一致。

### 最小 HTTP RPC 示例

在兼容性测试中，一次 initialize 调用就足以验证接口面和 header 是否已经正确连通。

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

同一 session 上的典型后续请求包括：

- `tools/list`
- `tools/call`
- `resources/read`
- `prompts/get`
- `completion/complete`

### 什么时候优先选择 `/mcp` 而不是 `/zcp`

以下情况更适合使用 `/mcp`：

- 调用方是现成的 MCP client
- 你优先追求官方 client 互操作，而不是自定义运行时效率
- 你需要 streamable HTTP 语义，例如 SSE replay 行为

## 端到端模式：托管式 MCP 服务

当你需要面向网络提供 MCP 兼容能力，同时又不想放弃原生 `/zcp` 路径时，应使用 `/mcp`。

典型布局如下：

1. 运行一个 ASGI 服务
2. 对 MCP 兼容客户端暴露 `/mcp`
3. 对内部编排器暴露 `/zcp`
4. 保留 `/ws` 给需要长连接双向通信的客户端
5. 在所有受保护路由上使用同一套认证策略

除非你确实需要运维隔离，否则这种方式通常比“分别运行一个兼容服务和一个原生服务”更合理。

## `/ws` 上的 WebSocket

ZCP 也在 `/ws` 上暴露 websocket 传输。

以下场景适合使用 websocket：

- 你需要长期存在的双向连接
- 低延迟的请求/通知流很重要
- 你的基础设施能够可靠地维护 socket 生命周期

当前 websocket 已经足以与官方 MCP Python SDK client 完成本地互操作。剩余工作主要是更长时间的 soak 覆盖和更复杂的重连场景，而不是基础能力缺失。

### Websocket 部署建议

以下情况更适合优先使用 `/ws`：

- 客户端维持一个长时间存在的操作员或 agent 会话
- notification 和 task update 需要低延迟到达
- 你的基础设施已经适应 socket 生命周期管理

以下情况则更适合继续使用 `/mcp`：

- HTTP ingress 和认证设施已经标准化
- 客户端可以接受请求/响应语义
- SSE replay 比 socket 重连状态更容易运维

## 端到端模式：高通知密度会话

当客户端高度依赖以下能力时，应选择 `/ws`：

- task 状态更新
- resource 更新通知
- 更低延迟的 progress 事件
- 长时间存续的交互式会话

在实际工程里，`/ws` 很适合 dashboard、运维控制台，以及不想承担大量 HTTP 请求重连与 replay 成本的 agent runtime。

## `/zcp` 上的原生 JSON-RPC

`/zcp` 是原生 ZCP 传输路径，而不是 MCP 兼容路径。

以下情况适合使用它：

- 通信双方都理解 ZCP
- 你希望更强地控制运行时状态
- 你关心长会话中的 token 效率

原生路径使 ZCP 可以避免 MCP 兼容接口层为了互操作而必须承担的部分重复 schema 和 registry 暴露成本。

## 一个服务，两类客户端

一种很实用的部署模式是：

1. 对生态侧客户端暴露 `/mcp` 和 `/ws`
2. 对内部 agent 流量保留 `/zcp`
3. 让同一个后端运行时同时服务这两类请求

这样可以获得：

- 无需额外 gateway 进程的兼容性
- 在你控制两端时使用更低开销的原生流量
- 用一个服务端实现替代并行维护两套 MCP / 非 MCP 栈

## 传输选择

应根据所有权和部署形态选择传输方式：

- stdio
  - 最适合 host 启动的本地集成
- `/mcp`
  - 最适合面向网络的 MCP client，以及浏览器/服务端集成
- `/ws`
  - 最适合 MCP 兼容的长连接双向会话
- `/zcp`
  - 最适合受控的原生运行时集成

## 部署模式

下面四种可重复模式覆盖了大多数真实部署场景：

### 1. 桌面或 Host 启动型集成

- 只暴露 stdio
- 让认证尽量简单，或直接委托给 host
- 优先验证启动、初始化和 tool discovery

### 2. 托管 MCP API

- 暴露 `/mcp`
- 如果客户端需要长连接，就保留 `/ws`
- 在 ASGI 边界上增加 OAuth 或 bearer auth

### 3. 内部 Agent Runtime

- 暴露 `/zcp`
- 如果仍需支持外部 MCP client，则继续保留 `/mcp`
- 把大结果和长运行状态移出上下文

### 4. 混合兼容与原生部署

- 在同一个服务中同时暴露 `/mcp`、`/ws` 和 `/zcp`
- 明确区分客户端所有权边界
- 在强制迁移前，先 benchmark 原生路径

## 请求流程检查清单

对每一种传输方式，都应验证以下高价值行为：

1. 初始化与 capability discovery
2. tool 调用
3. resource 读取与订阅（如果使用）
4. task 创建、轮询与取消
5. 认证失败与 token refresh（如果相关）
6. 长连接会话下的重连行为
