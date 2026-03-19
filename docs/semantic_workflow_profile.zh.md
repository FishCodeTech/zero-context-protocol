# Semantic Workflow Profile

这一页专门解释内置 `semantic-workflow` profile 是什么、为什么存在，以及
应该在什么场景下使用它。

## 它是什么

`semantic-workflow` 是一个面向原生 ZCP 客户端的**工具发现 profile**。

它的作用不是总把完整的 primitive tool registry 暴露给客户端，而是允许
客户端请求一个更小的、只包含工作流级语义工具的工具视图：

```python
from zcp import SemanticWorkflowProfile

profile = SemanticWorkflowProfile()
tools = await client.list_tools(**profile.as_list_tools_params())
```

写成原始调用形式就是：

```python
tools = await client.list_tools(profile="semantic-workflow")
```

当服务端存在 `_meta.groups` 包含 `workflow` 的工具时，返回结果会收敛到
这个 workflow 子集。

## 为什么需要它

MCP 兼容的 primitive tools 适合互操作，但并不总是适合模型规划。

例如，一个表格服务可能会暴露这些 primitive tools：

- `write_data_to_excel`
- `format_range`
- `merge_cells`
- `read_data_from_excel`

这些工具对兼容性很好，但当原生客户端要完成一个更大的任务时，模型通常更
适合看到更高层的语义工具，例如：

- `build_sales_report_workflow`
- `repair_board_packet_workflow`
- `close_month_end_workflow`

`semantic-workflow` 的目标，就是让同一个服务同时保留两套 surface：

- 一套面向 MCP 兼容的 primitive tool surface
- 一套面向原生规划的更窄语义工具 surface

## 它实际做了什么

这个 profile **不会改变协议本身**。

它改变的是 `tools/list` 返回的工具集合。

当客户端请求 `profile="semantic-workflow"` 时，服务端会检查当前工具注册
表；如果存在 workflow-tagged tools，就只返回这一组工具。

这意味着：

- MCP 兼容面仍然保留
- 原生 ZCP 客户端拿到更小的 registry
- 模型规划时看到的低层操作更少
- token 往往会下降，因为工具描述更少、规划轮次也更少

## 服务端如何标记 Workflow Tools

Workflow tools 本质上仍然是普通 tools，只是附带了 workflow metadata。

典型写法：

```python
@app.tool(
    name="build_sales_report_workflow",
    description="Create a sales summary workbook from raw inputs.",
    input_schema={
        "type": "object",
        "properties": {
            "workbook_path": {"type": "string"},
            "rows": {"type": "array"},
        },
        "required": ["workbook_path", "rows"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
    metadata={
        "_meta": {
            "groups": ["workflow", "reporting"],
            "stages": ["build", "verify"],
        }
    },
)
async def build_sales_report_workflow(workbook_path: str, rows: list[dict]):
    ...
```

关键点在于：

- `_meta.groups` 里包含 `workflow`

内置 profile 就是按这个约定来做发现过滤的。

## 服务端配置方式

你可以把这个 profile 作为原生默认暴露路径：

```python
from zcp import FastZCP, ToolExposureConfig, ZCPServerConfig

app = FastZCP(
    "Excel Native Server",
    default_tool_profile="semantic-workflow",
)

config = ZCPServerConfig(
    tool_exposure=ToolExposureConfig(
        default_profile="semantic-workflow",
    )
)
```

关键配置项有：

- `FastZCP(default_tool_profile="semantic-workflow")`
- `ToolExposureConfig(default_profile="semantic-workflow")`
- `ToolExposureConfig.semantic_group`
- `ToolExposureConfig.enforce_call_visibility`

前两个用于定义推荐的发现路径，后两个用于定义 runtime 如何把 profile
可见性映射到实际可调用工具上。

## 客户端配置方式

客户端显式请求的写法是：

```python
tools = await client.list_tools(profile="semantic-workflow")
```

封装形式是：

```python
from zcp import SemanticWorkflowProfile

profile = SemanticWorkflowProfile()
tools = await client.list_tools(**profile.as_list_tools_params())
```

如果你在写自定义 planner，用显式写法更直接；如果你要复用内置原生 profile
对象，用封装形式更合适。

## 它和 MCP 的关系

`semantic-workflow` 是一个**ZCP 原生的工具发现约定**，不是 MCP 协议特性。

这意味着：

- MCP 客户端不需要了解它
- MCP 兼容 endpoint 仍然可以暴露 primitive registry
- 原生 ZCP 客户端则可以在同一个 runtime 上请求 workflow 子集

所以这套设计是：

- **向下兼容** MCP
- **对原生 ZCP 规划更有主见**

## 应该什么时候用

当下面这些条件同时成立时，就应该使用 `semantic-workflow`：

- 服务端同时暴露 primitive tools 和更高层 workflow tools
- 原生客户端是模型驱动的
- token 效率很重要
- 你希望模型用更少但更语义化的步骤完成规划

下面这些场景则不适合依赖它：

- 服务端只有 primitive tools
- 你需要精确控制每一个低层操作
- 客户端是希望看到完整 primitive surface 的 MCP host

## 它和普通 Group Filters 的区别

ZCP 也支持通用过滤参数，例如：

- `groups`
- `excludeGroups`
- `stages`

这些都是通用筛选条件。

`semantic-workflow` 的不同点在于，它是一个有稳定语义的命名 profile：

- workflow tools first
- native planning path
- smaller registry by default

如果你需要一次性的选择逻辑，用原始 group filters；如果你想定义一个稳定的
原生发现契约，就用这个 profile。

## 当前运行时形态

当前内置实现位于 Python SDK 中：

- [`SemanticWorkflowProfile`](/docs/sdk-api)
- [`ToolExposureConfig`](/docs/sdk-api)
- [`FastZCP`](/docs/servers)
- [`ZCPClientSession.list_tools`](/docs/clients)

当前 profile 名称是：

- `semantic-workflow`

当前默认 semantic group 名称是：

- `workflow`

这些都是约定值；如果你内部工具分类需要不同命名，也可以通过服务端配置覆写。

## 实际效果

在 Excel benchmark 套件里，native ZCP 正是依赖这个 profile，才可以优先暴露
semantic workflow tools，而不是只暴露 MCP 风格的 primitive tools。

这就是为什么同一个 runtime 既能保持 MCP 兼容，又能在原生 ZCP 客户端上减少
规划轮次和 token 开销。

Benchmark 背景和当前已发布结果，参见：

- [Benchmark Methodology](/docs/benchmark-methodology)
- [Capability Matrix](/docs/capability-matrix)
- [Client Guide](/docs/clients)
- [Server Guide](/docs/servers)
