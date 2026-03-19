# ZCP MCP Capability Matrix

This matrix tracks parity against the official MCP specification repository and
the official MCP Python SDK from the perspective of this workspace.

ZCP serves two surfaces from one runtime:

- the MCP-compatible surface for interoperability
- the native ZCP surface for lower token usage and tighter orchestration

The table separates three questions:

- is the feature implemented
- is there compatibility coverage here
- what does the native ZCP path improve

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

## How To Read This Matrix

- `Yes` in implementation means the feature is present in the current runtime.
- `Yes` in compatibility coverage means this repository has concrete validation
  for the feature or transport against the current implementation.
- `Partial` means the feature exists and works in core scenarios, but broader
  interoperability or edge-case coverage is still being tracked.

## Current Position

The current implementation now includes:

- stdio interoperability
- streamable HTTP interoperability on `/mcp`
- websocket interoperability on `/ws`
- OAuth metadata and protected resource metadata
- OAuth authorization code flow with PKCE
- refresh token exchange
- dynamic registration and revocation
- task-augmented tool calls
- async task lifecycle states

The strict remaining work is mostly:

- broader compatibility coverage for progress, sampling, elicitation, and tasks
- deeper reconnect and soak coverage for long-lived transports
- broader auth interoperability coverage beyond the current validated flows

For the precise remaining list, use `mcp_gap_todo.md`.

## Verified Performance Snapshot (Excel Semantic Suite v5)

Run metadata:

- date: `2026-03-17`
- model: `deepseek-chat` (`https://api.deepseek.com`)
- repeats: `1`
- cases: `37` (`Tier A/B/C/D`)
- compared backends:
  - `zcp_client_to_native_zcp`
  - `mcp_client_to_zcp_mcp_surface`
- artifacts:
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

Interpretation notes:

- native ZCP wins average token usage in every tier for this run
- native ZCP is lower-token in `25/37` cases; the remaining `12` are all Tier A primitive cases
- quality gaps are largest in complex tiers on the MCP surface path:
  - Tier C tool compliance: `57.1%` vs native `100.0%`
  - Tier D tool compliance: `16.7%` vs native `100.0%`
