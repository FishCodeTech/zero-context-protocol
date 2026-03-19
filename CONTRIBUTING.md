# Contributing

## Local Setup

The docs site lives in [`docs/web`](docs/web).

```bash
cd docs/web
npm ci
npm run dev
```

## Before Opening A Pull Request

Run the docs build locally:

```bash
cd docs/web
npm ci
npm run build
```

When editing protocol claims or benchmark positioning, update the matching
source documents together:

- `README.md`
- `docs/mcp_capability_matrix.md`
- `docs/benchmark_methodology.md`
- `docs/mcp_gap_todo.md`

## Contribution Scope

Typical contributions include:

- protocol docs
- migration guides
- examples and cookbook content
- docs site UX improvements
- benchmark presentation updates

Do not update published benchmark claims without updating the methodology page
and linking the artifact source.
