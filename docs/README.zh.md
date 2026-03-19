# Zero Context Protocol 文档

这个目录是 ZCP 文档站的权威 markdown 文档语料。它的组织方式刻意贴近
官方 MCP 文档结构：先阅读介绍，理解核心概念，选择传输层与认证模型，
再进入 server/client 指南、示例和参考材料。

每个主要页面现在都配有 `*.zh.md` 中文 companion 文件，文档站也在所有
页面上提供中英文切换。

ZCP 在同一个运行时上暴露两个面向：

- 面向互操作的 MCP 兼容接口
- 面向更低 token 开销和更强运行时控制的原生 ZCP 接口

下面这些文档会显式说明这一区分，而不是把它隐藏起来。

## 如何阅读这些文档

如果你刚接触这个项目，建议按下面顺序阅读：

1. `introduction_getting_started.md`
2. `core_concepts_tools_resources_prompts.md`
3. `core_concepts_sampling_elicitation_roots_logging_tasks.md`
4. `transports_guide.md`
5. `authorization_guide.md`
6. `server_guide.md`
7. `client_guide.md`
8. `examples_and_use_cases.md`
9. `faq.md`

之后再按需查阅参考文档：

- `mcp_protocol_reference.md`
- `sdk_api_reference.md`
- `mcp_capability_matrix.md`
- `mcp_migration.md`
- `benchmark_methodology.md`
- `mcp_gap_todo.md`

## 文档分类

### 介绍

- `introduction_getting_started.md`
  - ZCP 是什么
  - 它与 MCP 的关系
  - 本地 server 和 client 的第一条路径

### 核心概念

- `core_concepts_tools_resources_prompts.md`
  - tools
  - resources
  - resource templates
  - prompts
- `core_concepts_sampling_elicitation_roots_logging_tasks.md`
  - sampling
  - elicitation
  - roots
  - logging
  - progress
  - tasks

### 指南

- `transports_guide.md`
- `authorization_guide.md`
- `server_guide.md`
- `client_guide.md`

### 通过示例学习

- `examples_and_use_cases.md`
- `faq.md`

### 参考与兼容性

- `mcp_protocol_reference.md`
- `sdk_api_reference.md`
- `mcp_capability_matrix.md`
- `mcp_migration.md`
- `benchmark_methodology.md`
- `mcp_gap_todo.md`

## 仓库职责边界

这个仓库负责：

- 协议说明和概念文档
- 兼容性与迁移说明
- benchmark 方法论和文档文案
- `docs/web` 渲染使用的 markdown

这个仓库不负责：

- `zero-context-protocol-python/src/zcp` 中的 Python 运行时与 SDK
- `zero-context-protocol-python/tests` 中的 Python 测试
- `zero-context-protocol-python/examples` 中的 benchmark 示例脚本

如果这些文档中的行为描述与运行时实际行为冲突，以 Python SDK 的实现和
测试为准。应更新 markdown 以匹配代码。
