# 核心概念：Sampling、Elicitation、Roots、Logging、Progress 与 Tasks

这些能力标志着一个集成从“简单同步 tool 调用”进入“真正的运行时编排”阶段。

## 为什么这些概念重要

一个浅层集成通常停留在以下能力就能工作：

- `tools/list`
- `tools/call`
- `resources/read`

但生产系统通常不够，它们还需要：

- 模型回调
- 用户输入采集
- 工作区范围控制
- 运行日志
- 进度上报
- 可持续存在的后台工作

ZCP 支持这些能力，并且会在合适的地方把它们投影为 MCP 兼容的方法名和通知。

## Sampling

Sampling 指的是服务端请求客户端运行时生成一条模型消息。在 MCP 接口面上，对应方法是 `sampling/createMessage`。

典型请求字段包括：

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

### 什么时候使用 Sampling

当服务端或 task 需要一个模型决策，而模型执行权掌握在客户端手里时，就应使用 sampling。

示例：

- 某个 task 请求模型规划下一步动作
- 某个后端要求 host 总结已检索到的上下文
- 某个工作流在人工审核前，先用客户端拥有的模型生成草稿

### Sampling 设计建议

更推荐把 sampling 用于边界清晰、目标明确的决策，而不是把它当作模糊的“先想一会儿”逃生口。工作流状态和校验仍然应该由服务端负责。

## Elicitation

Elicitation 指的是服务端向客户端或用户请求更多信息。在 MCP 接口面上，规范方法是 `elicitation/create`。同时，ZCP client API 也保留了兼容 alias，以适配仍依赖旧原生路径的代码。

以下场景适合使用 elicitation：

- 收集缺失参数
- approval 流程
- 在执行模式之间进行选择
- 把用户引导到外部动作，例如 OAuth 登录

### 常见的 Elicitation 形态

- 表单式请求
- 简单 approval 提示
- URL 跳转流程
- 被中断后可恢复的 task 流

### Elicitation 设计建议

只有当服务端确实缺少必要输入时，才应使用 elicitation。不要用它来转移校验责任，也不要用它来掩盖糟糕的 tool schema。

## Roots

Root 是由客户端提供的顶层作用域，服务端可以把它作为上下文锚点。在 MCP 接口面上，roots 通过 `roots/list` 暴露。

当服务端应当只在明确的用户范围或客户端范围内工作时，root 就非常有用。

示例：

- 一个 workspace folder
- 一个 repository root
- 一个 mount point
- 一个租户级边界

### 为什么 Roots 重要

如果没有 roots，服务端就可能只能靠猜，或者作用域越界。有了 roots，客户端就能明确声明：服务端可以、也应该把哪些位置视为工作的顶层边界。

## Logging

Logging 允许服务端把结构化的运行消息回传给客户端。在 MCP 接口面上，这使用：

- `logging/setLevel`
- `notifications/message`

Logging 适合用来传递：

- 警告
- 降级模式提示
- 集成问题排查信息
- 为什么某个 task 被暂停或失败

### Logging 设计建议

日志应保持“运维语义”，它应该帮助客户端和操作者理解服务端行为，而不是重复那些本该属于 tool 或 task 结果里的业务输出。

## Progress

Progress notification 用于在最终结果完成前报告增量进展。ZCP 会发出 `notifications/progress`，并接受来自常见 MCP metadata 路径的 progress token。

以下场景适合使用 progress：

- 工作耗时较长，不发状态看起来就像卡住
- 某个 task 存在有意义的阶段性检查点
- 客户端需要把状态展示给用户

示例：

- 索引文件
- 导入记录
- 处理一批文档
- 等待一个多步骤工作流完成

## Tasks

Task 是用来表达“应该超出单次阻塞式请求/响应周期继续存在的工作”的持久抽象。

支持的 task 方法包括：

- `tasks/create`
- `tasks/list`
- `tasks/get`
- `tasks/result`
- `tasks/cancel`
- `notifications/tasks/status`

当前 task 状态包括：

- `queued`
- `working`
- `input_required`
- `completed`
- `failed`
- `cancelled`

### 什么时候使用 Tasks

当满足以下条件时，应使用 task：

- 执行可能较慢
- 需要取消能力
- 工作可能会因为输入或 approval 暂停
- 客户端需要状态迁移
- 结果应该被稍后再获取

### Task-Augmented Tool Calls

ZCP 还支持 task-augmented `tools/call`。某个 tool 可以声明自己支持 task，然后仍然通过普通 tool 名称被调用，而运行时在内部把它升级为一个可跟踪的 task。

以下场景特别适合这种模式：

- 只想暴露一个公共 tool 名称
- 是否后台执行是可选的
- 希望从同步执行平滑升级到持久执行

### Task Execution Context 示例

Task execution context 让 task 或支持 task 的 tool 可以更新自身状态，并请求由客户端拥有的能力，而不必把所有中间产物都泄漏进模型可见输出中。

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

这就是以下能力背后的核心运行时模式：

- 具备可观察状态的后台工作
- 服务端主动请求模型回合
- 需要输入门控的工作流
- 无需把一切重编码进单次 tool 响应即可恢复执行

### 独立 Task Handler

服务端也可以通过 `FastZCP.task(kind)` 暴露显式 task 类型。如果某个工作流从一开始就天然是 task 形态，那么这种方式更合适。

### Tasks 为 ZCP 带来了什么提升

Task 是最能体现 ZCP 运行时架构价值的能力之一，它的意义已经超出了纯粹的 wire 兼容。

运行时可以：

- 在服务端保存状态和结果
- 避免把所有中间产物都塞进 prompt 上下文
- 在同步和异步执行模式之间搭桥
- 在边界上继续保留 MCP 兼容 task 方法

### 当前限制

Task 已经具备实际价值，也支持异步执行，但项目仍然在持续补充更广泛的互操作覆盖、重连语义和更深的实验性对齐。不要默认所有实验特性都已经完整实现，具体剩余项请参考 [MCP Gap And TODO](/docs/mcp-gap)。

## 建模建议

- 当服务端需要客户端运行时生成消息时，用 sampling。
- 当服务端需要更多用户或客户端输入时，用 elicitation。
- 当作用域必须由客户端声明时，用 roots。
- 当需要运维消息时，用 logging。
- 当需要增量状态时，用 progress。
- 当工作长时间运行或可中断时，用 tasks。

## 相关阅读

- [Core Concepts](/docs/core-concepts)
- [Transport Guide](/docs/transports)
- [Authorization Guide](/docs/authorization)
- [Server Guide](/docs/servers)
- [Client Guide](/docs/clients)
