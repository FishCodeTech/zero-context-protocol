# Zero Context Protocol

This repository is the documentation and protocol presentation side of Zero
Context Protocol.

The Python SDK now lives separately in:

- `https://github.com/jiayuqi7813/zero-context-protocol-python`

The SDK repository keeps the public Python surface stable:

- package name: `zcp`
- import path: `import zcp`

## What This Repository Owns

- `docs/web`: the Next.js docs app
- `docs/mcp_capability_matrix.md`: the compatibility matrix
- `benchmark_reports`: generated benchmark artifacts for presentation
- docs-site copy and protocol positioning

## What This Repository Does Not Own

- Python SDK source code
- runtime tests
- benchmark runners
- installable package metadata

Those belong to `zero-context-protocol-python`.

## Run The Docs App

```bash
cd docs/web
npm install
npm run dev
```

Build the docs app:

```bash
cd docs/web
npm run build
```

## Benchmarks

This repository presents benchmark artifacts produced by the Python SDK
repository. The source benchmark logic does not live here.

Current benchmark artifacts are expected in:

- `benchmark_reports/zcp_mcp_tool_call_benchmark.json`
- `benchmark_reports/zcp_mcp_tool_call_benchmark.md`

## Source Of Truth

- Protocol/runtime behavior: `zero-context-protocol-python`
- SDK examples and tests: `zero-context-protocol-python`
- Docs UX, protocol explanation, and benchmark presentation: this repository
