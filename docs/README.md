# Docs Repository Notes

This repository now owns the docs surface of Zero Context Protocol.

## Ownership

- `docs/web`: the primary docs app
- `docs/mcp_capability_matrix.md`: MCP compatibility framing
- `benchmark_reports`: benchmark artifacts for presentation

## Non-Ownership

- `src/zcp`
- `tests`
- Python benchmark runners
- installable SDK source code

Those now belong to `zero-context-protocol-python`.

## Source of Truth Rules

- API behavior, tests, and benchmark generation belong to the Python SDK repo
- docs pages, protocol explanation, and benchmark presentation belong here
- benchmark display should consume generated artifacts from
  `benchmark_reports/`, not reimplement the benchmark logic
