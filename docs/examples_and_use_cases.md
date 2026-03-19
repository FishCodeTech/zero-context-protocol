# Examples And Use Cases

This document focuses on practical deployment patterns instead of only listing
API surfaces.

## Example 1: Drop-In MCP Backend Replacement

Situation:

- you already have an MCP host configuration
- you do not want to rewrite the client side first

Approach:

- keep the host speaking MCP
- replace the backend implementation with a ZCP server
- expose stdio or `/mcp`

Why this works:

- migration risk stays low
- contract testing is easier
- you can preserve existing host launch conventions while improving the backend

Typical next step:

- after compatibility is proven, move internal orchestration to `/zcp`

### Minimal Replacement Pattern

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

This is the correct migration shape when the host contract is already settled
and the backend implementation is what you want to improve first.

End-to-end rollout:

1. start from `zero-context-protocol-python/examples/run_zcp_mcp_stdio_server.py`
2. keep the host-side launch contract unchanged
3. validate `initialize`, `tools/list`, `tools/call`, `resources/list`, and `prompts/get`
4. only after host compatibility is proven, decide whether you need `/mcp`, `/ws`, or `/zcp`

This is the right first move for desktop hosts and existing MCP integrations
because it isolates the migration to the backend implementation.

## Example 2: Token-Sensitive Native Agent Runtime

Situation:

- you control both the agent runtime and the backend
- sessions are long
- repeated schema exposure is expensive

Approach:

- keep `/mcp` enabled for interoperability
- move controlled runtime traffic to `/zcp`
- use runtime-managed state and handles for large results

Why this works:

- the backend can avoid pushing the same heavy metadata into prompt context
- task and result state can stay server-side
- compatibility is preserved for external tooling

### Native Runtime Split

A common production split is:

1. external users keep talking to `/mcp`
2. internal agent workers switch to `/zcp`
3. large result flows move to handle-backed native behavior
4. long-running work moves to tasks instead of repeated prompt-visible output

This is usually the highest-value place to capture token savings without asking
every downstream client to change at once.

Concrete layout:

1. keep one hosted service with `/mcp`, `/ws`, and `/zcp`
2. leave third-party or host-owned clients on `/mcp`
3. move only your internal agent runtime to `/zcp`
4. use handle-backed outputs and task-aware flows internally
5. benchmark the real workload before forcing broader migration

Relevant example files:

- `zero-context-protocol-python/examples/zcp_weather_server.py`
- `zero-context-protocol-python/examples/compare_zcp_mcp_tool_call_benchmark.py`

## Example 3: Human Approval Workflow

Situation:

- a workflow may trigger a high-impact action
- approval must be collected before execution continues

Approach:

- expose the action as a task-capable tool
- start it with task metadata or an explicit task kind
- use elicitation when approval is required
- move the task into `input_required`
- resume or complete after input arrives

Why this works:

- execution state becomes explicit
- clients can show status instead of guessing
- the workflow remains compatible with a tool-centric interface

### Approval Flow Sketch

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

Client pattern:

1. create the task-capable tool call
2. watch for `input_required`
3. surface approval to the user
4. continue polling until final result

Concrete implementation pattern:

1. expose the operation as a tool with `execution={"taskSupport": "optional"}`
2. have the client call it with task metadata
3. move the task to `input_required` when human approval is needed
4. collect approval through elicitation or your own out-of-band UI
5. complete or cancel the task explicitly

This pattern works better than forcing a synchronous "approve now" tool because
it keeps lifecycle state visible to both the runtime and the operator.

## Example 4: Hosted MCP Service Over HTTP And Websocket

Situation:

- the server is network-facing
- some clients prefer HTTP
- others want a long-lived socket

Approach:

- run the ASGI host
- expose `/mcp`, `/ws`, and `/metadata`
- protect the service with bearer auth or OAuth

Why this works:

- one backend supports several integration styles
- transport choice can be left to client deployment needs
- MCP interoperability remains available

### Hosted Service Baseline

```bash
cd zero-context-protocol-python
python3 examples/run_zcp_api_server.py
```

Operationally, this is the usual first hosted shape:

- `/mcp` for MCP HTTP clients
- `/ws` for long-lived MCP-compatible sessions
- `/zcp` for native internal traffic
- `/metadata`, `/healthz`, `/readyz` for operations

Typical hosted deployment:

1. run `zero-context-protocol-python/examples/run_zcp_api_server.py`
2. expose `/mcp` for streamable HTTP clients
3. expose `/ws` for notification-heavy or long-lived clients
4. expose `/zcp` for internal compact runtime traffic
5. protect all protected routes with bearer auth or OAuth

This is usually the best shape for SaaS-like deployments because it avoids
running a dedicated compatibility service and a separate native service unless
you truly need operational isolation.

## Example 5: Tenant-Scoped Enterprise Tools

Situation:

- several tenants share one backend
- data boundaries must be explicit

Approach:

- define scopes on tools, resources, and prompts
- keep resources tenant-shaped and readable
- keep side-effecting tools narrow and auditable
- use roots or tenant-specific URIs where scope must stay visible

Why this works:

- policy is attached to runtime objects
- testing is easier than with vague all-purpose tools
- auth and content boundaries stay aligned

### Tenant Boundary Pattern

A practical design split is:

- resources expose tenant-owned readable artifacts
- tools perform narrow mutations
- scopes gate high-impact methods
- roots or URIs make the tenant boundary visible to the client

This is usually safer than one broad `tenant.execute` tool with many hidden
branches.

Concrete rollout pattern:

1. keep read scopes broad enough for normal usage
2. attach write or admin scopes only to narrow tools
3. expose tenant-owned artifacts as resources or resource templates
4. use prompts for reusable analysis or operator guidance
5. require tasks for risky long-running operations so cancellation stays visible

This layout makes audits and tenant isolation easier than mixing everything into
one giant multi-purpose tool namespace.

## Example 6: Document And Artifact Workflows

Situation:

- the primary user action is reading reports, files, or generated artifacts
- the server only occasionally performs mutations

Approach:

- expose artifacts as resources or resource templates
- expose prompt scaffolding for analysis or summarization
- keep tools for true operations such as generate, refresh, or publish

Why this works:

- clients can discover readable artifacts cleanly
- prompt templates stay reusable
- operations and content stay separate

### Artifact Pattern

Use this shape when your server mostly produces documents:

- `reports://monthly/{tenant}` as a resource template
- `reports.generate_monthly` as a task-capable tool
- `reports.summary` as a prompt

That keeps generation, retrieval, and summarization cleanly separated.

End-to-end example:

1. a `generate_report` tool creates a report asynchronously
2. the task completes with a stable URI or handle
3. the report is served through a resource or resource template
4. a prompt template provides the review or summary scaffold
5. a follow-up publish or refresh action stays a tool

This is a better design than stuffing report generation, reading, and summary
prompt construction into one monolithic tool call.

## Example 7: Incremental Migration From MCP To ZCP

Situation:

- your current estate is already built around MCP
- you want lower token cost but cannot break compatibility

Approach:

1. keep all existing MCP clients unchanged
2. point them to ZCP's compatibility surface
3. verify tool, resource, prompt, and transport parity
4. move internal high-volume traffic to `/zcp`
5. continue exposing `/mcp` for external compatibility

Why this works:

- rollout risk is controlled
- external users keep the same interface
- token and orchestration improvements are captured where they matter most

### Migration Checklist

1. replace the backend implementation with `FastZCP`
2. keep stdio or `/mcp` stable first
3. run compatibility tests for the real transport
4. move heavy internal traffic to `/zcp`
5. only then optimize schemas, handles, and task flows for token savings

Suggested validation checklist:

1. official MCP client connectivity on stdio, `/mcp`, or `/ws`
2. scope failures and auth refresh flows if your deployment uses auth
3. task polling, cancellation, and reconnect behavior
4. benchmark evidence before claiming token savings
5. migration notes for every client group that will remain MCP-only

## Benchmark-Backed Use-Case Snapshot (full_semantic_compare_v5)

This workspace includes a full Excel semantic run that maps directly to the
Tier A/B/C/D use-case structure.

Run metadata:

- date: `2026-03-17`
- model: `deepseek-chat`
- repeats: `1`
- artifacts:
  - `zero-context-protocol-python/benchmark_reports/full_semantic_compare_v5/excel_llm_token_benchmark.json`
  - `zero-context-protocol-python/benchmark_reports/full_semantic_compare_v5/excel_llm_token_benchmark.md`
  - `zero-context-protocol-python/benchmark_reports/full_semantic_compare_v5/semantic_benchmark_summary.md`

| Tier | Practical Use-Case Shape | Native ZCP Avg Total | MCP Surface Avg Total | MCP/Native Ratio | Native Quality (Answer/Workbook/Tool) |
| --- | --- | ---: | ---: | ---: | --- |
| A | primitive sheet and range operations | 15979.4 | 17613.2 | 1.10x | 100.0% / 93.8% / 100.0% |
| B | tool-chain flows (layout/row/column/table chains) | 1826.6 | 29239.4 | 16.01x | 100.0% / 100.0% / 100.0% |
| C | complex multi-step workflows (planning + transforms) | 2091.1 | 72113.9 | 34.49x | 100.0% / 100.0% / 100.0% |
| D | autonomous goal-driven repair/orchestration | 2018.3 | 19375.7 | 9.60x | 100.0% / 100.0% / 100.0% |

Case-level highlights from the same run:

- `finance_close_summary`: `2086` vs `118913` (`57.01x`)
- `headcount_plan_restructure`: `2067` vs `104899` (`50.75x`)
- `tier_b_layout_flow_chain`: `1796` vs `45589` (`25.38x`)
- `staging_cleanup_goal`: `2109` vs `45000` (`21.34x`)

Boundary and rollout notes:

- native ZCP is lower-token in `25/37` cases in this run
- the `12` non-winning cases are all Tier A primitive operations
- use Tier B/C/D semantic workflow tools first to maximize the native advantage

## Example Files In This Workspace

Useful example entry points:

- `zero-context-protocol-python/examples/run_zcp_mcp_stdio_server.py`
- `zero-context-protocol-python/examples/run_zcp_api_server.py`
- `zero-context-protocol-python/examples/zcp_server_template.py`
- `zero-context-protocol-python/examples/compare_zcp_mcp_tool_call_benchmark.py`

## Cookbook Index

If you want file-level examples instead of pattern descriptions, start here:

- hosted dual-surface service:
  [Server Guide](/docs/servers)
- task-aware native client and multi-backend orchestrator:
  [Client Guide](/docs/clients)
- transport-specific deployment choices:
  [Transport Guide](/docs/transports)
- OAuth and scope-protected hosted service:
  [Authorization Guide](/docs/authorization)

Recommended reading path by scenario:

- host replacement
  - `run_zcp_mcp_stdio_server.py`
- hosted service
  - `run_zcp_api_server.py`
- backend template
  - `zcp_server_template.py`
- token benchmark
  - `compare_zcp_mcp_tool_call_benchmark.py`

## Use-Case Heuristics

If your main need is interoperability:

- start with stdio or `/mcp`

If your main need is token efficiency:

- keep `/mcp` available
- move controlled traffic to `/zcp`

If your main need is long-running orchestration:

- design tasks first
- then decide whether the public interface should be task-native or
  task-augmented tools

If your main need is delegated user authorization:

- plan OAuth and scopes early
- avoid retrofitting auth after tool names and resource URIs are already public

If your main need is the lowest-risk migration:

- keep the MCP surface first
- postpone `/zcp` adoption until you control the calling runtime

## Related Reading

- [Migration Guide](/docs/migration)
- [Server Guide](/docs/servers)
- [Client Guide](/docs/clients)
- [Benchmark Methodology](/docs/benchmark-methodology)
