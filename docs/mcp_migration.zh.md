# 从 MCP 迁移到 ZCP

本指南说明如何在不破坏现有 MCP 使用方的前提下采用 ZCP。

## 迁移目标

迁移目标通常不是“彻底抛弃 MCP”。真正的目标是：

- 为 hosts、clients 和外部集成保留 MCP 兼容性
- 将可控的运行时流量迁移到原生 ZCP，以便在 token 和调度效率上获益

正是这一区分，让安全迁移成为可能。

## 迁移路径 1：保持现有 MCP Client 不变

这是默认迁移路径。

使用 ZCP 面向 MCP 的传输层：

- stdio
- `/mcp` 上的 streamable HTTP
- `/ws` 上的 websocket

当你已经依赖以下能力时，这条路径是合适的：

- MCP host 启动配置
- 现有 MCP SDK client
- 桌面集成
- 只认识 MCP 的外部工具

## 迁移路径 2：将内部运行时调用迁移到 `/zcp`

在兼容性稳定后，把你可控的流量迁移到原生 ZCP 接口。

适合优先迁移的场景：

- 内部编排循环
- 长生命周期会话
- 高轮次 agent 工作流
- 结果体积较大、通过 handles 和服务端状态可减少 prompt 膨胀的流程

## 推荐发布顺序

1. 让所有外部 client 继续使用 MCP 兼容传输层
2. 验证 tools、resources、prompts、completions 和 auth 的兼容性
3. 对同一批流程分别在 `/mcp` 和 `/zcp` 上进行 benchmark
4. 将内部高流量流程迁移到 `/zcp`
5. 继续保留 MCP 接口以维持生态互操作

## 对后端团队来说会改变什么

通常比预期更少。

你仍然在建模同一组后端对象：

- tools
- resources
- prompts
- tasks

主要差异在于：

- 传输层选择现在是显式的
- auth 可以统一在同一个运行时中处理
- task 和 result 状态可以保留在服务端
- 可控调用方可以使用原生路径来降低 token 开销

## 哪些东西不需要立刻改变

你不需要：

- 围绕 ZCP 特有概念去重命名领域模型
- 移除 MCP 传输层支持
- 强制所有 client 切换到原生路径
- 在第一天就修改面向用户的 prompt 或 resource 语义

## 迁移检查清单

- 确认你的 clients 实际使用了哪些 MCP methods
- 为选定的 client 路径验证传输层兼容性
- 将现有 auth 预期映射到 bearer 或 OAuth 配置
- 识别哪些工作流应该升级为 tasks
- 识别哪些大输出应在原生 ZCP 流程中保持 off-context
- 在切换生产流量前运行兼容性测试

## 当前兼容性态势

项目目前已经支持以下 MCP 面向能力：

- stdio
- streamable HTTP
- websocket
- OAuth metadata 和 protected resource metadata
- OAuth token 流程的核心组成部分

当前迁移风险主要来自更广泛的边界场景覆盖，而不是这些能力本身缺失。
在你要对特定部署宣称完全对等之前，应查阅 `mcp_gap_todo.md` 中的严格剩余项清单。

## 什么时候还不适合迁移

如果你的发布依赖以下能力，应先暂停迁移：

- 当前这里尚未覆盖的非常具体的 MCP 实验性行为
- 超出当前已验证流程之外的 auth 互操作性
- 尚未针对你的 client 验证的长连接重连语义

这属于测试和 gap 分析问题，而不是直接否定该架构的理由。
