# Benchmark Methodology

ZCP's benchmark claims should be reproducible from the Python SDK repository,
not maintained manually in the docs site.

## Source Of Truth

Use only the benchmark harness in `zero-context-protocol-python`:

- script: `examples/compare_zcp_mcp_tool_call_benchmark.py`
- script (Excel semantic suite): `examples/compare_excel_client_protocol_benchmark.py`
- harness: `tools/benchmarking.py`
- harness (Excel semantic suite): `tools/excel_llm_benchmarking.py`
- report outputs:
  - `benchmark_reports/zcp_mcp_tool_call_benchmark.json`
  - `benchmark_reports/zcp_mcp_tool_call_benchmark.md`
  - `benchmark_reports/full_semantic_compare_v5/excel_llm_token_benchmark.json`
  - `benchmark_reports/full_semantic_compare_v5/excel_llm_token_benchmark.md`
  - `benchmark_reports/full_semantic_compare_v5/semantic_benchmark_summary.md`

The docs site should consume generated artifacts. It should not reimplement the
runner logic.

## Required Reporting Fields

Every benchmark statement should include:

- run date
- model and provider
- repeat count
- task set description
- prompt construction rules
- whether full MCP schema injection was included
- token accounting source
- failure handling rules

## Reproduction

From `zero-context-protocol-python`:

```bash
python3 examples/compare_zcp_mcp_tool_call_benchmark.py --repeats 2
```

For the current published Excel semantic comparison (`full_semantic_compare_v5`):

```bash
python3 examples/compare_excel_client_protocol_benchmark.py \
  --model deepseek-chat \
  --repeats 1 \
  --tiers A,B,C,D \
  --backends zcp_client_to_native_zcp,mcp_client_to_zcp_mcp_surface \
  --output-dir benchmark_reports/full_semantic_compare_v5
```

## Interpretation Rules

- compare protocol overhead, not general model intelligence
- keep the model, provider, and run date explicit because benchmark numbers
  drift over time
- use the generated JSON and markdown reports as the publishable evidence
- treat docs-site charts and tables as presentation only

## Why ZCP Can Win

The intended efficiency gains come from:

- compact registry exchange
- schema-out-of-band design
- handle-based large result storage
- incremental disclosure of constraints instead of repeated full schemas
- task-oriented runtime state that stays outside the transcript

Every claim about token savings should be paired with the exact generated
benchmark artifact used for that comparison.

## Latest Published Results (full_semantic_compare_v5)

Publish metadata:

- run date: `2026-03-17`
- model/provider: `deepseek-chat` on `https://api.deepseek.com`
- repeats: `1`
- case count: `37`
- backend pair:
  - native: `zcp_client_to_native_zcp`
  - MCP surface: `mcp_client_to_zcp_mcp_surface`

| Scope | Native ZCP Avg Total | MCP Surface Avg Total | Token Delta (MCP - Native) | Ratio |
| --- | ---: | ---: | ---: | ---: |
| Overall | 8027.9 | 30723.7 | 22695.8 | 3.83x |
| Tier A | 15979.4 | 17613.2 | 1633.8 | 1.10x |
| Tier B | 1826.6 | 29239.4 | 27412.8 | 16.01x |
| Tier C | 2091.1 | 72113.9 | 70022.7 | 34.49x |
| Tier D | 2018.3 | 19375.7 | 17357.3 | 9.60x |

Quality summary for native ZCP in this run:

- answer accuracy: `100.0%`
- workbook accuracy: `97.3%`
- tool compliance: `100.0%`

Boundary notes:

- this report is a single-run (`repeats=1`) snapshot, not a variance study
- `25/37` cases favor native ZCP on tokens; the `12` non-winning cases are all Tier A primitive operations
