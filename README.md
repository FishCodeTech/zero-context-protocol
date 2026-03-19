# Zero Context Protocol

`zero-context-protocol` is the public protocol and documentation repository for
Zero Context Protocol (ZCP).

It owns the protocol-facing explanation layer:

- docs content
- docs site UX
- MCP compatibility matrix
- migration guidance
- benchmark methodology and published benchmark presentation

The reference Python SDK and runtime live in
[`zero-context-protocol-python`](https://github.com/FishCodeTech/zero-context-protocol-python).

## What This Repository Owns

- [`docs`](docs): markdown source of truth
- [`docs/web`](docs/web): Next.js docs site
- [`docs/mcp_capability_matrix.md`](docs/mcp_capability_matrix.md): capability and compatibility matrix
- [`docs/mcp_protocol_reference.md`](docs/mcp_protocol_reference.md): protocol reference
- [`docs/mcp_migration.md`](docs/mcp_migration.md): MCP migration guide
- [`docs/benchmark_methodology.md`](docs/benchmark_methodology.md): benchmark methodology
- [`benchmark_reports`](benchmark_reports): published presentation artifacts

## What This Repository Does Not Own

- SDK source code
- transport/runtime implementation
- benchmark runners
- installable package metadata

Those belong to `zero-context-protocol-python`.

## Docs Structure

The documentation is organized in the same broad shape users expect from MCP
official docs:

- introduction
- concepts
- guides
- examples
- reference

Primary entrypoints:

- getting started:
  [`docs/introduction_getting_started.md`](docs/introduction_getting_started.md)
- server guide:
  [`docs/server_guide.md`](docs/server_guide.md)
- client guide:
  [`docs/client_guide.md`](docs/client_guide.md)
- capability matrix:
  [`docs/mcp_capability_matrix.md`](docs/mcp_capability_matrix.md)
- benchmark methodology:
  [`docs/benchmark_methodology.md`](docs/benchmark_methodology.md)

Both English and Chinese source documents are present.

## Current Public Benchmark Position

The latest published benchmark summary points at the Python SDK repository's
`full_semantic_compare_v5` results. The current headline claim documented here
is:

- native ZCP vs MCP surface overall: `8027.9` vs `30723.7` total tokens
- overall advantage: `3.83x`

See:

- [`docs/benchmark_methodology.md`](docs/benchmark_methodology.md)
- [`docs/mcp_capability_matrix.md`](docs/mcp_capability_matrix.md)

## Run The Docs App

```bash
cd docs/web
npm ci
npm run dev
```

Build the docs app:

```bash
cd docs/web
npm run build
```

## Release Readiness Notes

This repository intentionally focuses on protocol positioning and published
guidance. Runtime behavior remains source-of-truth in the SDK repository.

## License

Apache-2.0. See [`LICENSE`](LICENSE).
