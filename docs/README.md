# Zero Context Protocol Docs

This directory is the source-of-truth markdown corpus for the ZCP docs site.
It is organized to feel closer to the official MCP docs structure: start with
an introduction, learn the core concepts, choose a transport and auth model,
then move into server/client guides, examples, and reference material.

Every primary page now has a Chinese companion file named `*.zh.md`, and the
docs site exposes an English / Chinese language switch on every page.

ZCP exposes two surfaces from one runtime:

- an MCP-compatible surface for interoperability
- a native ZCP surface for lower token overhead and tighter runtime control

The docs below are written to make that split explicit instead of hiding it.

## How To Read These Docs

If you are new to the project, use this order:

1. `introduction_getting_started.md`
2. `core_concepts_tools_resources_prompts.md`
3. `core_concepts_sampling_elicitation_roots_logging_tasks.md`
4. `transports_guide.md`
5. `authorization_guide.md`
6. `server_guide.md`
7. `client_guide.md`
8. `examples_and_use_cases.md`
9. `faq.md`

After that, use the reference documents as needed:

- `mcp_protocol_reference.md`
- `sdk_api_reference.md`
- `mcp_capability_matrix.md`
- `mcp_migration.md`
- `benchmark_methodology.md`
- `mcp_gap_todo.md`

## Document Categories

### Introduction

- `introduction_getting_started.md`
  - what ZCP is
  - how it relates to MCP
  - first local server and client paths

### Core Concepts

- `core_concepts_tools_resources_prompts.md`
  - tools
  - resources
  - resource templates
  - prompts
- `core_concepts_sampling_elicitation_roots_logging_tasks.md`
  - sampling
  - elicitation
  - roots
  - logging
  - progress
  - tasks

### Guides

- `transports_guide.md`
- `authorization_guide.md`
- `server_guide.md`
- `client_guide.md`

### Learning By Example

- `examples_and_use_cases.md`
- `faq.md`

### Reference And Compatibility

- `mcp_protocol_reference.md`
- `sdk_api_reference.md`
- `mcp_capability_matrix.md`
- `mcp_migration.md`
- `benchmark_methodology.md`
- `mcp_gap_todo.md`

## Repository Ownership

This repository owns:

- protocol explanation and conceptual docs
- compatibility and migration framing
- benchmark methodology and documentation copy
- the markdown rendered by `docs/web`

This repository does not own:

- the Python runtime and SDK in `zero-context-protocol-python/src/zcp`
- the Python tests in `zero-context-protocol-python/tests`
- example benchmark scripts in `zero-context-protocol-python/examples`

If a behavior claim in these docs conflicts with runtime behavior, the Python
SDK implementation and tests win. Update the markdown to match the code.
