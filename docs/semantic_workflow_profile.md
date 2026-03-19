# Semantic Workflow Profile

This page explains what the built-in `semantic-workflow` profile is, why it
exists, and when you should use it.

## What It Is

`semantic-workflow` is a **tool discovery profile** for native ZCP clients.

Instead of always returning the full primitive tool registry, a client can ask
the server for a smaller registry that contains only workflow-level tools:

```python
from zcp import SemanticWorkflowProfile

profile = SemanticWorkflowProfile()
tools = await client.list_tools(**profile.as_list_tools_params())
```

In raw form, this is the same as:

```python
tools = await client.list_tools(profile="semantic-workflow")
```

When the server publishes tools tagged with `_meta.groups` that include
`workflow`, the returned registry is narrowed to that workflow subset.

## Why It Exists

MCP-compatible primitive tools are good for interoperability, but they are not
always good planning units for model-driven execution.

For example, a spreadsheet server may expose primitive tools such as:

- `write_data_to_excel`
- `format_range`
- `merge_cells`
- `read_data_from_excel`

Those are fine for compatibility, but a native client planning a larger task
often does better when it sees higher-level tools such as:

- `build_sales_report_workflow`
- `repair_board_packet_workflow`
- `close_month_end_workflow`

The `semantic-workflow` profile exists to let one server keep both surfaces:

- a broad MCP-compatible primitive tool surface
- a narrower native planning surface

## What The Profile Actually Does

The profile does **not** change the protocol.

It changes which tools are returned by `tools/list`.

The server checks the current tool registry and, when workflow-tagged tools are
present, returns only that subset for clients asking for
`profile="semantic-workflow"`.

That means:

- MCP compatibility remains available
- native ZCP clients get a smaller registry
- model planning sees fewer low-level operations
- token usage usually drops because the model needs fewer tool descriptions and
  fewer planning turns

## How The Server Marks Workflow Tools

Workflow tools are ordinary tools with workflow metadata.

Typical pattern:

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

The key part is:

- `_meta.groups` includes `workflow`

The built-in profile uses that convention as the discovery filter.

## Server Configuration

You can expose the profile by convention and make it the native default:

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

Important fields:

- `FastZCP(default_tool_profile="semantic-workflow")`
- `ToolExposureConfig(default_profile="semantic-workflow")`
- `ToolExposureConfig.semantic_group`
- `ToolExposureConfig.enforce_call_visibility`

The first two define the preferred discovery path. The latter two define how
strictly the runtime maps profile visibility to callable tools.

## Client Configuration

The explicit client-side form is:

```python
tools = await client.list_tools(profile="semantic-workflow")
```

The convenience wrapper is:

```python
from zcp import SemanticWorkflowProfile

profile = SemanticWorkflowProfile()
tools = await client.list_tools(**profile.as_list_tools_params())
```

Use the explicit form when you are wiring a custom planner. Use the wrapper
when you want the built-in native profile object.

## Relationship To MCP

`semantic-workflow` is a **ZCP-native discovery contract**, not an MCP feature.

That means:

- MCP clients do not need to know about it
- MCP-compatible endpoints can still expose the primitive registry
- native ZCP clients can ask for the workflow subset on the same runtime

So the design is:

- **downward compatible** with MCP
- **more opinionated** for native ZCP planning

## When You Should Use It

Use `semantic-workflow` when all of these are true:

- the server exposes both primitive and higher-level workflow tools
- the native client is model-driven
- token efficiency matters
- you want fewer, more semantic planning steps

Do not rely on it when:

- the server only exposes primitive tools
- you need exact low-level control of every operation
- your client is an MCP host that expects the full primitive surface

## How It Differs From Simple Group Filters

ZCP also supports direct filtering parameters such as:

- `groups`
- `excludeGroups`
- `stages`

Those are generic filters.

`semantic-workflow` is different because it is a named profile with a stable
meaning:

- workflow tools first
- native planning path
- smaller registry by default

Use raw group filters when you need one-off selection logic. Use the profile
when you want a consistent native discovery contract.

## Current Runtime Shape

The current built-in implementation lives in the Python SDK:

- [`SemanticWorkflowProfile`](/docs/sdk-api)
- [`ToolExposureConfig`](/docs/sdk-api)
- [`FastZCP`](/docs/servers)
- [`ZCPClientSession.list_tools`](/docs/clients)

The profile name today is:

- `semantic-workflow`

The default semantic group today is:

- `workflow`

Those are conventions, but the server-side config lets you override the group
name if you need a different internal taxonomy.

## Practical Outcome

In the Excel benchmark suite, this profile is part of the reason native ZCP can
use semantic workflow tools instead of exposing only MCP-style primitives.

That is what allows the runtime to preserve MCP compatibility while still
reducing planning turns and token cost for native ZCP clients.

For the benchmark context and current published results, see:

- [Benchmark Methodology](/docs/benchmark-methodology)
- [Capability Matrix](/docs/capability-matrix)
- [Client Guide](/docs/clients)
- [Server Guide](/docs/servers)
