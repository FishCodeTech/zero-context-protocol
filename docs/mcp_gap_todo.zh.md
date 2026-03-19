# ZCP 与 MCP 的差距和 TODO

本文档用于跟踪当前 ZCP 实现与当前官方 MCP 仓库之间仍然存在的差距：

- 规范与文档：`modelcontextprotocol/modelcontextprotocol`
- SDK 参考实现：`modelcontextprotocol/python-sdk`

它刻意比产品文案更严格。只要某一项还没有完全对齐，或者还没有被充分覆盖，
它就应该保留在这里。

## 当前状态

ZCP 已经覆盖了相当可观的 MCP 兼容服务端能力：

- lifecycle：`initialize`、`initialized`、`ping`
- tools：`tools/list`、`tools/call`
- resources：`resources/list`、`resources/read`、`resources/subscribe`、`resources/unsubscribe`
- resource templates：`resources/templates/list`
- prompts：`prompts/list`、`prompts/get`
- completion：`completion/complete`
- logging：`logging/setLevel`、`notifications/message`
- roots：`roots/list`、`notifications/roots/list_changed`
- progress notifications
- stdio transport
- `/mcp` 上的 streamable HTTP
- websocket transport
- task methods 和 task-augmented tool calls
- OAuth metadata，以及 auth code + PKCE + refresh + registration + revocation

本工作区中对官方 MCP Python SDK 的契约覆盖目前已经包括：

- stdio
- streamable HTTP
- websocket

## 剩余差距

### 1. 官方 Auth Client 端到端互操作覆盖仍然不足

当前状态：

- auth metadata 路由已经存在
- auth code + PKCE 已实现
- refresh token exchange 已实现
- registration 和 revocation 已实现
- provider-backed state 已存在

缺失项：

- 官方 auth client 的端到端互操作覆盖
- 更丰富的 client authentication method 覆盖

影响：

- auth 功能已经真实可用
- 但端到端兼容性的信心，仍未达到 stdio、streamable HTTP 和 websocket 的同等水平

### 2. 实验性的 Task 覆盖仍落后于核心 MCP 功能

当前状态：

- `tasks/create`
- `tasks/list`
- `tasks/get`
- `tasks/result`
- `tasks/cancel`
- `notifications/tasks/status`
- 异步状态转换
- task-augmented `tools/call`

缺失项：

- 面向 task 工作流的更广泛官方 client 契约覆盖
- 更长生命周期流程中的重连与恢复语义
- 分布式或 store-backed 的 task 编排

影响：

- task 基础能力已经实现
- 但信心程度仍低于 tools、resources、prompts 和 lifecycle

### 3. Sampling、Elicitation 和 Progress 还需要更多端到端覆盖

当前状态：

- request normalization 已存在
- runtime hooks 已存在
- progress notifications 已存在

缺失项：

- 更多官方 client/session 覆盖
- 更广泛的多模态和边界形状覆盖
- MCP 接口上的更多端到端 progress 场景

影响：

- 实现已经存在
- 但信心仍低于核心 resource 和 tool 接口

### 4. Output Validation 的对齐度已有提升，但还不够彻底

当前状态：

- tool metadata 会返回 `outputSchema`
- 标量 structured output 路径已经存在

缺失项：

- 更丰富的 invalid-output 测试
- 更穷尽的 client-side output shape 覆盖
- 围绕复杂 structured output 的边界行为

影响：

- 核心 metadata 已具备
- 但 output validation 的信心还不够彻底

### 5. Websocket 和 Streamable HTTP 还需要更多长时间 soak 覆盖

当前状态：

- 已具备对这两种传输层的官方 MCP Python SDK client 互操作
- 基础请求与响应行为已经覆盖

缺失项：

- 更长时间的重连与 replay 场景
- 更丰富、通知密集型的 soak 测试

影响：

- 主路径上的传输层对齐已经存在
- 但对长生命周期会话的运行信心仍需更多覆盖

### 6. Guide 深度仍需要更多端到端示例

当前状态：

- markdown 文档语料已经较完整，并按类别组织
- docs markdown 已在 `docs/web` 中渲染
- 分组文档导航和 docs index 已存在
- 旧入口页已统一指向同一套 docs IA，而不是继续保留过期文案

缺失项：

- 每份 guide 中还需要更多完整的端到端代码示例
- 还需要更深入的 auth、tasks 和多服务部署场景 walkthrough

影响：

- 文档系统在结构上已经真实可用且可导航
- 剩余差距在于深度，而不是结构

## 推荐的下一步实现顺序

### 阶段 1：提高互操作信心

- 增加官方 auth client 端到端覆盖
- 增加更广泛的官方 client task 覆盖
- 增加官方 client progress 覆盖

### 阶段 2：提高长生命周期运行时信心

- 扩展 websocket 重连和 soak 测试
- 扩展 streamable HTTP replay 和重连测试
- 增加更多 task 恢复场景

### 阶段 3：提高 Output 和 Content Block 信心

- 增加更丰富的 structured output validation 测试
- 增加更多 sampling 和 elicitation 形状覆盖

### 阶段 4：加深文档和示例

- 为 guide 页面增加更多完整的端到端代码示例
- 持续让示例和 migration 文档与已验证现实保持一致

## 具体 TODO 清单

- [ ] 增加官方 auth client 端到端覆盖
- [ ] 为 task polling 和 `tasks/result` 增加官方 client 测试
- [ ] 为 `notifications/progress` 增加官方 client 测试
- [ ] 为 sampling 和 elicitation 增加更广泛的官方 client 覆盖
- [ ] 在 MCP 接口上增加 invalid structured output 测试
- [ ] 增加 websocket 重连和通知 soak 测试
- [ ] 增加 streamable HTTP replay 和重连边界测试
- [ ] 增加更复杂的 task recovery 和 resume 测试
- [ ] 在各个 guide 页面中增加更深入的端到端代码示例

## 对外宣称边界

当前正确的对外表述是：

- `ZCP 提供了广泛的 MCP 兼容核心服务端功能，并已具备对 stdio、streamable HTTP 和 websocket 的官方 client 覆盖`

错误的表述则是：

- `ZCP 已经在每个扩展、auth 流程和运行边界场景上都完全实现了 MCP 对等`

只要对等性结论发生变化，就应更新本文件。
