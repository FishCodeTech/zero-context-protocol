# 核心概念：Tools、Resources、Templates 与 Prompts

这篇文档解释了 ZCP 和 MCP 集成中最常见、也是由服务端拥有的对象模型。

## 总览

大多数应用设计问题最终都会落到一个选择上：

- 这是一个操作吗
- 这是一个内容对象吗
- 这是一个 prompt 脚手架吗

在 ZCP 和 MCP 语境里，这意味着要在以下对象之间做选择：

- tools
- resources 和 resource templates
- prompts

这个选择是否正确，会直接影响 token 效率、客户端发现能力、认证边界，以及长期 API 稳定性。

## Tools

Tool 是可调用的服务端操作。当客户端需要“让服务端做点什么”，而不只是“读点什么”时，它就是正确的抽象。

典型的 tool 元数据包括：

- `name`
- `title`
- `description`
- `inputSchema`
- `outputSchema`
- `annotations`
- `icons`
- `execution`
- `_meta`

在 Python SDK 中，tool 通常通过 `FastZCP.tool(...)` 注册。

```python
from zcp import FastZCP

app = FastZCP("Operations Backend")


@app.tool(
    name="incident.create",
    description="Create an incident ticket.",
    input_schema={
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "severity": {"type": "string", "enum": ["sev1", "sev2", "sev3"]},
        },
        "required": ["title", "severity"],
        "additionalProperties": False,
    },
    output_schema={
        "type": "object",
        "properties": {
            "incidentId": {"type": "string"},
            "url": {"type": "string"},
        },
        "required": ["incidentId", "url"],
    },
    output_mode="scalar",
    inline_ok=True,
)
def create_incident(title: str, severity: str, ctx=None):
    return {"incidentId": "INC-123", "url": "https://ops.example.com/INC-123"}
```

### 什么时候应该使用 Tool

当服务端预期要做以下事情时，应使用 tool：

- 接收参数后执行查询
- 产生副作用
- 执行工作流
- 校验结构化输入
- 在工作发生前先执行策略检查

示例：

- 检索工单系统
- 发送邮件
- 启动部署
- 从后端 API 中拉取一个带作用域的记录

### Tool 输出模式

ZCP 同时支持面向 MCP 的结构化输出，以及面向原生运行时的优化路径。

以下场景适合使用内联结构化输出：

- 结果很小
- 客户端或模型需要立即消费
- 输出 schema 校验很重要

以下场景更适合使用面向 handle 或脱离上下文的存储：

- 结果较大
- 完整 payload 不应该反复进入 prompt 上下文
- 客户端之后还需要再次获取或引用该产物

这正是原生 ZCP 能比单纯 MCP 风格调用更省 token 的关键位置之一。

### Execution Metadata

Tool 的 `execution` 元数据用于显式声明运行时行为。常见示例包括：

- 是否支持 task
- 是否需要 approval
- 调度提示
- 其他实现相关的运行时元数据

如果一个 tool 可以以 task 方式运行，就应该把这一点写清楚，而不是让客户端自己猜。

### Tool 设计建议

推荐：

- 使用稳定命名，例如 `domain.action`
- 使用收敛、清晰的 JSON schema
- 对副作用进行明确描述
- 当结构化内容重要时提供 output schema
- 一个 tool 只表示一个清晰的业务操作

避免：

- “什么都能做”的巨型 tool
- 类型松散的参数袋
- 把策略藏在描述性文本里
- 把静态参考数据强行通过 tool 调用暴露出去

## Resources

Resource 是通过 URI 访问、可读取的服务端内容。

示例：

- `weather://cities`
- `file:///workspace/README.md`
- `db://schemas/public/users`
- `tenant://acme/config`

在 Python SDK 中，resource 通过 `FastZCP.resource(...)` 注册。

```python
@app.resource(
    "tenant://acme/config",
    name="Tenant Config",
    mime_type="application/json",
)
def tenant_config():
    return {"region": "us-east-1", "features": ["alerts", "audit"]}
```

### 什么时候应该使用 Resource

当主要动作是以下类型时，应使用 resource：

- 读取
- 查看
- 浏览
- 订阅更新

示例：

- 生成后的报告
- 源文件
- schema
- 租户配置
- 清单类数据

### Resource 内容形态

运行时可以把不同 handler 输出投影成 MCP 兼容内容：

- 文本类输出会变成 text content
- JSON 类输出会变成 structured content 或序列化内容
- 二进制输出会变成 blob content

这使得同一个 resource 模型既能表达简单内容，也能表达更丰富的内容。

### 订阅

如果某个 resource 会变化，并且客户端关心这些变化，就应该通过订阅和 `notifications/resources/updated` 把这一点显式表达出来。订阅适用于“像数据一样变化的内容”，而不是那些本质上更应该建模成 task 的工作流。

## Resource Templates

Resource template 用来声明一组参数化 URI，而不需要提前列出每个具体实例。

示例：

```python
@app.resource_template(
    "repo://{owner}/{name}/issues/{id}",
    name="Repository Issue",
    mime_type="application/json",
)
def repo_issue(uri: str):
    return {"uri": uri}
```

以下场景适合使用 template：

- URI 空间很大
- 实例命名规律明确
- 相比预先枚举，模式发现更重要

Template 对文件类、实体类数据尤其有用，因为客户端可以在发现模式后自行补全参数。

## Prompts

Prompt 是由服务端拥有的 prompt 模板，返回的是 message，而不是可执行逻辑。它把 prompt 构建过程集中放在服务端，避免客户端重复拼装同样的结构。

在 Python SDK 中，prompt 通过 `FastZCP.prompt(...)` 注册。

```python
from zcp import PromptArgument


@app.prompt(
    name="incident.summary",
    description="Build a handoff prompt for an on-call engineer.",
    arguments=[
        PromptArgument(name="incident_id", required=True),
        PromptArgument(name="audience"),
    ],
)
def incident_summary_prompt(incident_id: str, audience: str | None = None):
    return [
        {"role": "system", "content": "You write concise incident summaries."},
        {
            "role": "user",
            "content": f"Summarize incident {incident_id} for {audience or 'an engineer'}.",
        },
    ]
```

### 什么时候应该使用 Prompt

当满足以下条件时，应使用 prompt：

- prompt 构建应该由后端统一拥有
- 多个客户端都需要同一套模板
- 参数应该具备可发现性
- prompt 结构本身就是产品接口的一部分

示例：

- 报告总结模板
- 代码评审脚手架
- 事故交接 prompt
- 某个领域专用的分析模板

### Prompt 不是 Tool

Prompt 不应该被用来偷偷塞入可执行逻辑或校验规则。

Tool 负责执行工作。
Resource 负责暴露内容。
Prompt 负责定义可复用的 prompt 脚手架。

如果一个输出必须被校验，或者必须被执行，那么 prompt 大概率就不应该是它的主要抽象。

## 如何选择正确的抽象

可以用下面这条规则：

- 需要一个操作时，选 tool
- 需要一个可读内容对象时，选 resource
- 需要一个可复用的 prompt 组装模板时，选 prompt

如果拿不准，就问客户端到底想做什么：

- “运行某个东西”通常是 tool
- “读取某个东西”通常是 resource
- “构造消息”通常是 prompt

## ZCP 特有的优势

MCP 投影层看起来故意很熟悉，但其背后的运行时并不受限于同样的 prompt 可见开销。

ZCP 可以：

- 把规范化校验留在 prompt 上下文之外
- 在原生流程中避免重复发送大型 registry
- 通过 handle 或运行时状态保存大结果
- 在兼容边界上仍然保持官方 MCP 响应 shape

这也是为什么这些抽象在 ZCP 里不只是理论分类，而是实际影响运行成本的设计选择。

## 相关阅读

- [Runtime Features](/docs/runtime-features)
- [Server Guide](/docs/servers)
- [Client Guide](/docs/clients)
- [Protocol Reference](/docs/protocol)
