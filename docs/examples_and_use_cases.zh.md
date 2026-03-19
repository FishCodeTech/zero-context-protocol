# 示例与使用场景

本文聚焦于实际部署模式，而不仅仅是罗列 API 能力面。

## 示例 1：可直接替换的 MCP 后端

场景：

- 你已经有现成的 MCP host 配置
- 你暂时不想先重写客户端

做法：

- 保持 host 继续说 MCP
- 用 ZCP 服务器替换后端实现
- 暴露 stdio 或 `/mcp`

为什么这样有效：

- 迁移风险最低
- 更容易做契约测试
- 可以在保留现有 host 启动约定的同时改进后端

典型下一步：

- 在兼容性验证通过后，把内部编排迁移到 `/zcp`

### 最小替换模式

```python
from zcp import FastZCP
from zcp.mcp_stdio import run_mcp_stdio_server_sync

app = FastZCP("Filesystem Service")


@app.tool(
    name="fs.read_file",
    description="Read a file from an approved path.",
    input_schema={
        "type": "object",
        "properties": {"path": {"type": "string"}},
        "required": ["path"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
)
def read_file(path: str, ctx=None):
    with open(path, "r", encoding="utf-8") as handle:
        return {"path": path, "text": handle.read()}


run_mcp_stdio_server_sync(app)
```

当 host 契约已经稳定，而你想优先改进后端实现时，这就是正确的迁移形态。

端到端 rollout：

1. 从 `zero-context-protocol-python/examples/run_zcp_mcp_stdio_server.py` 开始
2. 保持 host 侧启动契约不变
3. 验证 `initialize`、`tools/list`、`tools/call`、`resources/list` 和 `prompts/get`
4. 只有在兼容性验证完成后，再决定是否需要 `/mcp`、`/ws` 或 `/zcp`

对于桌面 host 和现有 MCP 集成，这是最合适的第一步，因为它把迁移限制在后端实现层。

## 示例 2：对 Token 成本敏感的原生 Agent Runtime

场景：

- 你同时控制 agent runtime 和后端
- 会话很长
- 重复暴露 schema 的成本太高

做法：

- 保留 `/mcp` 以维持互操作性
- 把受控运行时流量迁移到 `/zcp`
- 对大结果使用运行时管理状态与 handles

为什么这样有效：

- 后端可以避免把同样的重型元数据反复塞进 prompt 上下文
- 任务和结果状态可以留在服务端
- 对外工具仍保有兼容性

### 原生运行时拆分方式

一个常见的生产拆分是：

1. 外部用户继续访问 `/mcp`
2. 内部 agent worker 切到 `/zcp`
3. 大结果流转改为 handle-backed 的原生行为
4. 长时间运行的工作改为 tasks，而不是反复产出暴露给 prompt 的输出

这是在不要求所有下游客户端同时迁移的前提下，最容易获得 token 节省收益的位置。

具体布局：

1. 保留一个同时暴露 `/mcp`、`/ws` 和 `/zcp` 的托管服务
2. 让第三方客户端或 host 持有的客户端继续走 `/mcp`
3. 只把你自己的内部 agent runtime 切到 `/zcp`
4. 在内部使用 handle-backed 输出和任务感知流程
5. 在推动更广泛迁移前，先对真实工作负载做 benchmark

相关示例文件：

- `zero-context-protocol-python/examples/zcp_weather_server.py`
- `zero-context-protocol-python/examples/compare_zcp_mcp_tool_call_benchmark.py`

## 示例 3：人工审批工作流

场景：

- 某个流程可能触发高影响操作
- 在继续执行前必须完成审批

做法：

- 将该操作暴露为支持任务的工具
- 通过任务元数据或显式 task kind 启动
- 在需要审批时使用 elicitation
- 把任务切换到 `input_required`
- 在输入到达后恢复或完成任务

为什么这样有效：

- 执行状态被显式建模
- 客户端可以展示状态，而不是靠猜测
- 整个流程仍然兼容工具中心化的接口

### 审批流程草图

```python
@app.tool(
    name="billing.issue_refund",
    description="Issue a refund after approval.",
    input_schema={...},
    execution={"taskSupport": "optional"},
)
async def issue_refund(invoice_id: str, amount: int, task=None, ctx=None):
    approval = await task.elicit({"kind": "approval", "prompt": f"Approve refund for {invoice_id}?"})
    if not approval.get("accepted"):
        await task.fail("refund rejected")
        return {"status": "rejected"}
    await task.update_status("Submitting refund")
    return {"invoiceId": invoice_id, "amount": amount, "status": "submitted"}
```

客户端模式：

1. 发起支持任务的工具调用
2. 监听 `input_required`
3. 向用户展示审批请求
4. 持续轮询直到拿到最终结果

具体实现模式：

1. 用 `execution={"taskSupport": "optional"}` 暴露该操作
2. 客户端带着 task 元数据发起调用
3. 在需要人工审批时切换到 `input_required`
4. 通过 elicitation 或你自己的站外 UI 收集审批
5. 显式完成或取消任务

这种方式优于做一个同步式的“立刻审批”工具，因为它能让运行时和操作员都清楚看到生命周期状态。

## 示例 4：通过 HTTP 与 WebSocket 托管 MCP 服务

场景：

- 服务器是网络暴露的
- 一部分客户端偏好 HTTP
- 另一部分客户端需要长连接

做法：

- 运行 ASGI host
- 暴露 `/mcp`、`/ws` 和 `/metadata`
- 使用 Bearer 鉴权或 OAuth 保护服务

为什么这样有效：

- 一个后端支持多种接入方式
- 传输层选择可以交给客户端部署需求决定
- MCP 互操作性仍然存在

### 托管服务基线

```bash
cd zero-context-protocol-python
python3 examples/run_zcp_api_server.py
```

从运维角度看，最常见的首个托管形态是：

- `/mcp` 供 MCP HTTP 客户端使用
- `/ws` 供长连接的 MCP 兼容会话使用
- `/zcp` 供内部原生流量使用
- `/metadata`、`/healthz`、`/readyz` 供运维使用

典型托管部署：

1. 运行 `zero-context-protocol-python/examples/run_zcp_api_server.py`
2. 对 streamable HTTP 客户端暴露 `/mcp`
3. 对通知密集或长会话客户端暴露 `/ws`
4. 对内部紧凑运行时流量暴露 `/zcp`
5. 用 Bearer 鉴权或 OAuth 保护所有受保护路由

对于 SaaS 类部署，这通常是最好的形态，因为除非你真的需要运维隔离，否则没有必要再单独拆一个兼容服务和一个原生服务。

## 示例 5：租户隔离的企业工具面

场景：

- 多个租户共享一个后端
- 数据边界必须清晰

做法：

- 给工具、资源和提示词定义 scope
- 让资源以租户为边界，并保持可读
- 让有副作用的工具保持狭窄且可审计
- 在需要显式体现边界时，使用 roots 或租户化 URI

为什么这样有效：

- 策略附着在运行时对象上
- 比“一个全能工具”更容易测试
- 授权边界与内容边界能够保持一致

### 租户边界模式

一个实用的拆分方式是：

- 资源暴露租户拥有的可读工件
- 工具负责狭窄的变更操作
- scope 用于守住高影响方法
- roots 或 URI 用于让客户端看见租户边界

相比一个包含大量隐藏分支的 `tenant.execute` 大工具，这种方式通常更安全。

具体 rollout 模式：

1. 让读权限 scope 足够宽，以满足正常使用
2. 只把写或管理类 scope 挂到狭窄工具上
3. 用资源或资源模板暴露租户拥有的工件
4. 用提示词提供可复用的分析或操作员指导
5. 对高风险长任务要求走 tasks，这样取消状态可以保持可见

这种设计能比“一整个巨型多用途工具命名空间”更容易通过审计并保持租户隔离。

## 示例 6：文档与工件工作流

场景：

- 用户的主要动作是读取报告、文件或生成后的工件
- 服务器只偶尔执行修改操作

做法：

- 将工件暴露为资源或资源模板
- 用提示词提供分析或摘要 scaffold
- 把真正的操作类行为留给工具，例如生成、刷新或发布

为什么这样有效：

- 客户端可以清晰发现可读工件
- 提示词模板保持可复用
- 操作与内容保持分离

### 工件模式

当服务器主要产出文档时，推荐这样的结构：

- `reports://monthly/{tenant}` 作为资源模板
- `reports.generate_monthly` 作为支持任务的工具
- `reports.summary` 作为提示词

这样生成、读取和摘要就被清晰分开。

端到端示例：

1. 一个 `generate_report` 工具异步生成报告
2. 任务完成后返回一个稳定 URI 或 handle
3. 通过资源或资源模板提供该报告
4. 用提示词模板提供审阅或摘要 scaffold
5. 后续的发布或刷新动作仍然保持为工具

这比把报告生成、读取和摘要 prompt 构造全部塞进一个巨型工具调用要合理得多。

## 示例 7：从 MCP 渐进迁移到 ZCP

场景：

- 你现有的体系已经围绕 MCP 构建
- 你想降低 token 成本，但又不能破坏兼容性

做法：

1. 保持所有现有 MCP 客户端不变
2. 把它们指向 ZCP 的兼容表面
3. 验证工具、资源、提示词与传输层的兼容性
4. 将内部高流量调用迁移到 `/zcp`
5. 继续对外保留 `/mcp`

为什么这样有效：

- rollout 风险可控
- 外部用户接口不变
- token 与编排层收益能够优先在最有价值的位置体现

### 迁移检查清单

1. 用 `FastZCP` 重写后端实现
2. 先保持 stdio 或 `/mcp` 稳定
3. 针对真实传输方式运行兼容性测试
4. 把重流量内部路径迁到 `/zcp`
5. 然后再去优化 schema、handles 和任务流以获得 token 节省

建议验证清单：

1. 官方 MCP 客户端在 stdio、`/mcp` 或 `/ws` 上的连通性
2. 如果部署用了鉴权，则验证 scope 失败路径与 token 刷新流程
3. 任务轮询、取消与重连行为
4. 在宣称 token 节省前，先拿到 benchmark 证据
5. 给所有仍将保持 MCP-only 的客户端群体准备迁移说明

## 基于 Benchmark 的使用场景快照（full_semantic_compare_v5）

当前工作区已经提供了一个完整的 Excel 语义 benchmark，且与 Tier A/B/C/D 使用场景一一对应。

运行元数据：

- 日期：`2026-03-17`
- 模型：`deepseek-chat`
- repeats：`1`
- 证据产物：
  - `zero-context-protocol-python/benchmark_reports/full_semantic_compare_v5/excel_llm_token_benchmark.json`
  - `zero-context-protocol-python/benchmark_reports/full_semantic_compare_v5/excel_llm_token_benchmark.md`
  - `zero-context-protocol-python/benchmark_reports/full_semantic_compare_v5/semantic_benchmark_summary.md`

| Tier | 对应场景形态 | Native ZCP Avg Total | MCP Surface Avg Total | MCP/Native Ratio | Native Quality (Answer/Workbook/Tool) |
| --- | --- | ---: | ---: | ---: | --- |
| A | 原子级 sheet/range 操作 | 15979.4 | 17613.2 | 1.10x | 100.0% / 93.8% / 100.0% |
| B | tool-chain 串联流程（布局/行列/表格） | 1826.6 | 29239.4 | 16.01x | 100.0% / 100.0% / 100.0% |
| C | complex workflow（规划 + 变换） | 2091.1 | 72113.9 | 34.49x | 100.0% / 100.0% / 100.0% |
| D | autonomous goal 驱动的修复/编排 | 2018.3 | 19375.7 | 9.60x | 100.0% / 100.0% / 100.0% |

同一轮运行中的 case 级代表结果：

- `finance_close_summary`: `2086` vs `118913`（`57.01x`）
- `headcount_plan_restructure`: `2067` vs `104899`（`50.75x`）
- `tier_b_layout_flow_chain`: `1796` vs `45589`（`25.38x`）
- `staging_cleanup_goal`: `2109` vs `45000`（`21.34x`）

边界与落地说明：

- 这次运行中，native ZCP 在 `37` 个 case 的 `25` 个里 token 更低
- 其余 `12` 个非优势 case 全部是 Tier A 原子操作
- 想最大化原生优势时，应优先在 Tier B/C/D 暴露语义 workflow tools

## 本工作区中的示例文件

有价值的示例入口包括：

- `zero-context-protocol-python/examples/run_zcp_mcp_stdio_server.py`
- `zero-context-protocol-python/examples/run_zcp_api_server.py`
- `zero-context-protocol-python/examples/zcp_server_template.py`
- `zero-context-protocol-python/examples/compare_zcp_mcp_tool_call_benchmark.py`

## Cookbook 索引

如果你想看文件级示例，而不是只看模式描述，可以从这里开始：

- 托管双表面服务：
  [服务器指南](/docs/servers)
- 任务感知原生客户端与多后端编排器：
  [客户端指南](/docs/clients)
- 按传输层分类的部署选择：
  [传输指南](/docs/transports)
- 带 OAuth 与 scope 保护的托管服务：
  [授权指南](/docs/authorization)

按场景推荐的阅读路径：

- host replacement
  - `run_zcp_mcp_stdio_server.py`
- hosted service
  - `run_zcp_api_server.py`
- backend template
  - `zcp_server_template.py`
- token benchmark
  - `compare_zcp_mcp_tool_call_benchmark.py`

## 使用场景判断规则

如果你的主要需求是互操作性：

- 从 stdio 或 `/mcp` 开始

如果你的主要需求是 token 效率：

- 保留 `/mcp`
- 把受控流量迁到 `/zcp`

如果你的主要需求是长时间运行的编排：

- 先设计 tasks
- 然后再决定公开接口是 task-native 还是 task-augmented tools

如果你的主要需求是委托式用户授权：

- 提前规划 OAuth 与 scopes
- 不要等到工具名和资源 URI 已经公开后再“补”鉴权

如果你的主要需求是最低风险迁移：

- 先保留 MCP 表面
- 在你掌控调用运行时之前，不要急着推广 `/zcp`

## 相关阅读

- [迁移指南](/docs/migration)
- [服务器指南](/docs/servers)
- [客户端指南](/docs/clients)
- [Benchmark 方法论](/docs/benchmark-methodology)
