# ZCP MCP 能力矩阵

这个矩阵从当前工作区的视角，跟踪 ZCP 相对于 MCP 官方规范仓库和官方 MCP Python SDK 的对标情况。

ZCP 用同一个运行时同时服务两套表面：

- 用于互操作的 MCP-compatible surface
- 用于更低 token 消耗和更紧凑编排的原生 ZCP surface

这个表格把三个问题拆开来看：

- 这个特性是否已经实现
- 这里是否已经有兼容性覆盖
- 原生 ZCP 路径带来了什么改进

| MCP Feature | Implemented On MCP Surface | Compatibility Coverage Here | ZCP Native Advantage |
| --- | --- | --- | --- |
| Lifecycle: `initialize`, `initialized`, `ping` | Yes | Yes | Smaller native envelopes |
| Tools: `tools/list`, `tools/call` | Yes | Yes | Compact registry, handle-first results, and semantic workflow profiles |
| Tool metadata: `title`, `annotations`, `outputSchema`, `execution`, `_meta` | Yes | Yes | Canonical metadata can stay out of prompt context |
| Resources: `resources/list`, `resources/read`, subscribe/update flow | Yes | Yes for core flows | Large content can stay off-context |
| Resource templates: `resources/templates/list` | Yes | Yes | Compact template discovery |
| Prompts: `prompts/list`, `prompts/get` | Yes | Yes | Expanded prompt artifacts do not need to remain model-visible |
| Completion: `completion/complete` | Yes | Yes | Native refs are smaller |
| Logging: `logging/setLevel`, `notifications/message` | Yes | Yes in SDK/runtime coverage | Operational summaries can stay outside prompt context |
| Roots: `roots/list`, `notifications/roots/list_changed` | Yes | Yes in SDK/runtime coverage | Same semantics with smaller envelopes |
| Progress notifications | Yes | Partial | Native progress payloads are shorter |
| Sampling | Yes | Partial | Less repeated schema/context echo |
| Elicitation | Yes | Partial | Compact accept/decline flow summaries |
| Tasks basic methods and statuses | Yes | Partial | Durable off-context state and result storage |
| Stdio transport | Yes | Yes | Same runtime with shorter native traffic |
| Streamable HTTP on `/mcp` | Yes | Yes | Native `/zcp` remains smaller |
| WebSocket transport on `/ws` | Yes | Yes for core client flow | Native socket traffic can be more compact |
| Authorization metadata | Yes | Partial | Native auth profile metadata stays runtime-owned |
| OAuth code flow, PKCE, refresh, registration, revocation | Yes | Partial | Same provider model can be reused for native surfaces |

## 如何阅读这个矩阵

- 实现列中的 `Yes` 表示这个特性已经存在于当前运行时中。
- 兼容性覆盖列中的 `Yes` 表示这个仓库已经针对当前实现，对该特性或传输层做了具体验证。
- `Partial` 表示这个特性已经存在，核心场景可用，但更广泛的互操作性或边界情况覆盖仍在继续跟踪中。

## 当前状态

当前实现已经包括：

- stdio 互操作
- `/mcp` 上的 streamable HTTP 互操作
- `/ws` 上的 websocket 互操作
- OAuth metadata 和 protected resource metadata
- 带 PKCE 的 OAuth authorization code flow
- refresh token exchange
- dynamic registration 和 revocation
- task-augmented tool call
- 异步 task 生命周期状态

当前严格意义上的剩余工作主要是：

- 为 progress、sampling、elicitation 和 tasks 提供更广泛的兼容性覆盖
- 为长生命周期传输层提供更深入的重连和 soak 覆盖
- 在当前已验证流程之外，扩展更广泛的 auth 互操作性覆盖

需要查看精确的剩余清单时，请使用 `mcp_gap_todo.md`。

## 已验证性能快照（Excel 语义套件 v5）

运行元数据：

- 日期：`2026-03-17`
- 模型：`deepseek-chat`（`https://api.deepseek.com`）
- repeats：`1`
- case 数：`37`（`Tier A/B/C/D`）
- 对比后端：
  - `zcp_client_to_native_zcp`
  - `mcp_client_to_zcp_mcp_surface`
- 证据产物：
  - `zero-context-protocol-python/benchmark_reports/full_semantic_compare_v5/excel_llm_token_benchmark.json`
  - `zero-context-protocol-python/benchmark_reports/full_semantic_compare_v5/excel_llm_token_benchmark.md`
  - `zero-context-protocol-python/benchmark_reports/full_semantic_compare_v5/semantic_benchmark_summary.md`

| Scope | Native ZCP Avg Total | MCP Surface Avg Total | MCP/Native Ratio | Native Quality (Answer/Workbook/Tool) |
| --- | ---: | ---: | ---: | --- |
| Overall | 8027.9 | 30723.7 | 3.83x | 100.0% / 97.3% / 100.0% |
| Tier A | 15979.4 | 17613.2 | 1.10x | 100.0% / 93.8% / 100.0% |
| Tier B | 1826.6 | 29239.4 | 16.01x | 100.0% / 100.0% / 100.0% |
| Tier C | 2091.1 | 72113.9 | 34.49x | 100.0% / 100.0% / 100.0% |
| Tier D | 2018.3 | 19375.7 | 9.60x | 100.0% / 100.0% / 100.0% |

解读说明：

- 在这次运行里，native ZCP 在四个 tier 的平均 token 都更低
- `37` 个 case 中，native ZCP 在 `25` 个 case 更省 token；剩余 `12` 个都属于 Tier A 原子操作场景
- MCP surface 路径在复杂层级的质量差距更明显：
  - Tier C tool compliance：`57.1%`（native 为 `100.0%`）
  - Tier D tool compliance：`16.7%`（native 为 `100.0%`）
