# ZCP MCP 协议参考

本文档描述 ZCP 实现的面向 MCP 的能力表面。应将它用作 wire reference，而不是作为第一个概念介绍文档。

## 生命周期

支持的生命周期方法：

- `initialize`
- `initialized`
- `ping`

`initialize` 会返回 MCP 形状的数据，包括：

- `protocolVersion`
- `serverInfo`
- `capabilities`

当原生运行时配置了 auth metadata 时，这些信息也会通过已暴露的 metadata surface 反映出来。

## Tools

支持的 tool 方法：

- `tools/list`
- `tools/call`
- `notifications/tools/list_changed`

支持的 tool metadata 投影包括：

- `name`
- `title`
- `description`
- `inputSchema`
- `outputSchema`
- `annotations`
- `icons`
- `execution`
- `_meta`

`tools/call` 可以返回：

- 普通 inline content
- structured content
- 当请求了 task-augmented 调用且该 tool 支持时，返回 task object

## Resources

支持的 resource 方法：

- `resources/list`
- `resources/templates/list`
- `resources/read`
- `resources/subscribe`
- `resources/unsubscribe`
- `notifications/resources/updated`
- `notifications/resources/list_changed`

ZCP 会把文本类、JSON 类和二进制 handler 输出投影为 MCP-compatible resource content。

## Prompts

支持的 prompt 方法：

- `prompts/list`
- `prompts/get`
- `notifications/prompts/list_changed`

Prompt 结果可以返回为：

- plain string content
- `{role, content}` messages
- 更丰富的 content block object

## Completion

支持的 completion 方法：

- 官方 `completion/complete`
- 兼容别名 `completions/complete`

Completion 响应包括：

- `values`
- `total`
- `hasMore`

## Logging

支持的 logging 方法和通知：

- `logging/setLevel`
- `notifications/message`

支持的 level：

- `debug`
- `info`
- `notice`
- `warning`
- `error`
- `critical`
- `alert`
- `emergency`

## Roots

支持的 roots 方法和通知：

- `roots/list`
- `notifications/roots/list_changed`

## Progress

支持的 progress 通知：

- `notifications/progress`

支持从常见 MCP metadata 位置读取 progress token，包括：

- `params.meta.progressToken`
- `params.meta.progress_token`
- `params._meta.progressToken`

## Sampling

支持的方法：

- `sampling/createMessage`

支持的标准化请求字段包括：

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

## Elicitation

支持的 elicitation 方法：

- 官方 `elicitation/create`
- 兼容别名 `elicitation/request`

ZCP 接受 MCP 风格的 form 和 URL 请求，同时为尚未迁移的原生调用方保留向后兼容的别名路径。

## Tasks

支持的 task 方法：

- `tasks/create`
- `tasks/list`
- `tasks/get`
- `tasks/result`
- `tasks/cancel`
- `notifications/tasks/status`

支持的 task 状态包括：

- `queued`
- `working`
- `input_required`
- `completed`
- `failed`
- `cancelled`

对于声明了 task support 的 tool，也支持 task-augmented `tools/call`。

## 传输层

当前面向 MCP 的传输层：

- stdio
- `/mcp` 上的 streamable HTTP
- `/ws` 上的 websocket

当前原生传输层：

- `/zcp` 上的 JSON-RPC

### Streamable HTTP 细节

`/mcp` 支持：

- `GET` 用于 SSE streaming
- `POST` 用于 JSON-RPC 和 streamed response
- `DELETE` 用于显式 session teardown

兼容性行为包括：

- `mcp-session-id`
- 对已配置 native session header 的支持
- SSE `id`
- 基于有界缓冲区的 `Last-Event-ID` replay

## Authorization Metadata

启用 OAuth 时，服务端可以暴露：

- authorization server metadata
- protected resource metadata
- authorization endpoint
- token endpoint
- registration endpoint
- revocation endpoint

有关部署指导，请使用 `authorization_guide.md`；本文档只用于 surface reference。

## 关于对等性的说明

本文档描述的是当前实现已经暴露的内容。它并不声称每一个边界情况或实验性特性都已经完全穷尽覆盖。严格的剩余 gap 清单请查看 `mcp_gap_todo.md`。
