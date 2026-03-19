# 常见问题

## ZCP 是想取代 MCP 吗？

不是。ZCP 将对 MCP 的兼容性视为一个明确的产品边界。它的目标是在保持与现有 MCP host 和 SDK 互操作的同时，在通信两端都由你控制时，提供一条效率更高的原生运行时路径。

## 为什么不直接在所有地方都使用 MCP？

在某些环境里，这确实是正确答案。ZCP 存在的原因是，有些系统因为注册表暴露、大型 schema 和冗长 payload，付出了过高的重复 token 成本。原生 ZCP 的目标是在不放弃 MCP 兼容性的前提下，降低这部分开销。

## ZCP 会破坏现有 MCP 客户端吗？

只要你正确使用兼容层，就不会。ZCP 通过 stdio、`/mcp` 和 `/ws` 暴露面向 MCP 的传输层，而且项目中已经包含针对官方 MCP Python SDK client 的兼容性测试。

实践中的规则是：

- 如果客户端已经会说 MCP，就继续让它走兼容层
- 如果两端都由你掌控，再单独评估 `/zcp` 是否值得使用

实践中的迁移规则是：

1. 让现有 MCP 客户端继续停留在兼容层
2. 按它们当前实际使用的传输方式逐一验证
3. 只有对你直接控制的运行时，才引入 `/zcp`

## 什么时候应该使用原生 `/zcp`，而不是 `/mcp`？

以下情况使用 `/zcp`：

- 你掌控通信两端
- token 成本很重要
- 会话是长连接或有状态的
- 大结果应尽量保留在 prompt 上下文之外

以下情况使用 `/mcp`：

- 互操作性是首要目标
- 你在服务标准 MCP 客户端
- 外部工具依赖 MCP 的方法和传输行为

以下情况使用 `/ws`：

- MCP 客户端能从长生命周期的双向状态中受益
- 任务更新和通知需要以更低延迟到达

常见的生产形态是两者同时保留：

- `/mcp` 用于面向生态的兼容性
- `/zcp` 用于你自己的内部编排器

## 目前 MCP 兼容性完成到什么程度了？

核心生命周期、tools、resources、prompts、completion、logging、roots、streamable HTTP、websocket 以及核心 auth metadata 都已经实现。剩余工作主要集中在更深入的边界情况覆盖，以及更广泛的实验性特性互操作性，而不是基础能力缺失。严格的清单见 [MCP Gap And TODO](/docs/mcp-gap)。

这意味着当前更准确的说法是：核心兼容能力已经比较完整且经过测试，但还不能宣称对所有 auth client、重连边界情况或实验性扩展都做到绝对完全对等。

## ZCP 支持 OAuth 吗？

支持。当前实现支持：

- authorization server metadata
- protected resource metadata
- authorization code flow
- PKCE validation
- refresh token exchange
- dynamic client registration
- token revocation
- pluggable providers
- SQLite-backed persistence

如果你只需要私有的内部部署，bearer auth 依然可能是更合适的第一步。只有当委托授权、refresh 或更广泛的 client provisioning 真正变得重要时，才应引入 OAuth。

## OAuth 层已经达到生产可用了吗？

对于本地部署和单节点部署，它已经具备生产可用能力，也远远超出了仅供演示的内存态流程。但如果你要把它作为适配所有企业级身份环境的最终答案，它仍然需要更广泛的互操作性覆盖和更多 provider 选项。

当前最稳妥的生产路径是：

- 启用 OAuth
- 使用 SQLite-backed provider，或你自己的 provider 实现
- 对有副作用的能力显式声明 scope

更务实的 rollout 顺序是：

1. 内部场景先用 bearer auth
2. 当客户端边界扩大时，再加入 OAuth metadata 和 auth code + PKCE
3. 在更广泛的外部接入前，先切换到持久化 provider-backed state

## Tools 和 Resources 的区别是什么？

对一个操作使用 tool。
对可读取的内容使用 resource。

如果客户端是在请求服务端执行工作，那通常应建模为 tool。如果客户端是在读取一个服务端拥有的产物或文档，那通常应建模为 resource。

一个实用的判断捷径：

- 动作型动词：通常是 tool
- 稳定 URI 或文档：通常是 resource

## 既然已经有 Tools，为什么还需要 Prompts？

Prompts 解决的是 prompt 构造问题，而不是执行问题。它让服务端拥有可复用的消息模板。它不能替代校验、带副作用的操作，或任务编排。

## 什么时候应该使用 Tasks？

以下情况使用 tasks：

- 执行时间较长
- 取消能力很重要
- 状态流转很重要
- 工作流可能会因等待输入或审批而暂停
- 最终结果可能需要稍后再获取

对于几乎瞬时完成、且不会带来任何生命周期价值的小操作，不要使用 tasks。

如果你拿不准，只问一个问题：

- 状态展示、取消能力或延后获取结果，是否会明显改善 UX？

如果答案是肯定的，就从 tasks 开始设计。

如果一个 tool 可能需要审批、可能要花几秒或几分钟才能完成，或者它产生的结果更适合稍后获取，那么一开始就应把它设计成 task-capable。

## Tasks 和 Tools 应该如何配合？

通常有两种模式：

- 当工作流天然就是长时任务时，使用显式 task kind 加 `tasks/create`
- 当你希望保留普通 tool 接口，但在需要时可以转为异步时，使用 task-augmented `tools/call`

第二种模式通常是最容易迁移的路径，因为客户端仍然可以按 tool 的方式思考，同时又能获得完整的生命周期状态。

## ZCP 只对 Python 有意义吗？

不是。这个工作区里的实现当前以 Python 为主，但协议和文档在概念上并不局限于 Python。

当前带有 Python 特征的是官方 SDK 和测试 harness，而不是协议存在的理由。

当前的仓库拆分反映的是实现现实，而不是协议意图：

- `zero-context-protocol-python` 是官方 Python SDK
- `zero-context-protocol` 是协议和文档层

## 为什么这里的 Docs 和 SDK 代码在不同仓库？

这种拆分让职责边界更清晰：

- `zero-context-protocol` 负责协议说明和文档交付
- `zero-context-protocol-python` 负责实现和测试

这样可以更容易演进文档站和协议表述，而不用把这些改动混进 SDK 代码库。

## 如果我想真正做点东西，应该从哪里开始？

建议按这个顺序阅读：

1. [Introduction And Getting Started](/docs/introduction)
2. [Core Concepts: Tools, Resources, Templates, And Prompts](/docs/core-concepts)
3. [Core Concepts: Sampling, Elicitation, Roots, Logging, Progress, And Tasks](/docs/runtime-features)
4. [Transport Guide](/docs/transports)
5. [Authorization Guide](/docs/authorization)
6. [Server Guide](/docs/servers)
7. [Client Guide](/docs/clients)

如果你的问题主要是迁移，直接跳到 [Examples And Use Cases](/docs/examples) 和 [Migration Guide](/docs/migration) 会更合适。

## 一个现实可行的首个生产部署形态是什么？

对大多数团队来说，更合理的首个生产形态是：

1. 一个 ASGI service
2. 打开 `/mcp` 用于兼容性
3. 只为内部 orchestrator 打开 `/zcp`
4. 如果长连接会话或通知很重要，再打开 `/ws`
5. 先用 bearer auth，只有在集成边界真的需要时才引入 OAuth

这样可以让运维复杂度与实际 rollout 阶段保持匹配。
