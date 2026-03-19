# Migrating From MCP To ZCP

This guide explains how to adopt ZCP without breaking existing MCP consumers.

## Migration Goal

The migration target is usually not "leave MCP behind". The real goal is:

- keep MCP compatibility for hosts, clients, and external integrations
- move controlled runtime traffic to native ZCP where token and orchestration
  efficiency matter

That distinction is what makes a safe migration possible.

## Migration Path 1: Keep Existing MCP Clients Unchanged

This is the default migration path.

Use ZCP's MCP-facing transports:

- stdio
- streamable HTTP on `/mcp`
- websocket on `/ws`

This path is appropriate when you already depend on:

- MCP host launch configurations
- existing MCP SDK clients
- desktop integrations
- external tools that only know MCP

## Migration Path 2: Move Internal Runtime Calls To `/zcp`

After compatibility is stable, move the traffic you control to the native ZCP
surface.

Good candidates:

- internal orchestration loops
- long-running sessions
- high-turn agent workflows
- result-heavy flows where handles and server-side state reduce prompt bloat

## Recommended Rollout Order

1. keep all external clients on MCP-compatible transports
2. verify parity for tools, resources, prompts, completions, and auth
3. benchmark the same flows over `/mcp` and `/zcp`
4. move internal high-volume flows to `/zcp`
5. continue exposing MCP for ecosystem interoperability

## What Changes For The Backend Team

Usually less than expected.

You still model the same backend objects:

- tools
- resources
- prompts
- tasks

The main differences are:

- transport choices are now explicit
- auth can be unified in one runtime
- task and result state can stay server-side
- controlled callers can use the native path to reduce token overhead

## What Does Not Need To Change Immediately

You do not need to:

- rename your domain model around ZCP-specific concepts
- remove MCP transport support
- force all clients onto the native path
- change user-facing prompt or resource semantics on day one

## Migration Checklist

- confirm the set of MCP methods your clients actually use
- verify transport compatibility for the chosen client path
- map existing auth expectations to bearer or OAuth configuration
- identify workflows that should become tasks
- identify large outputs that should stay off-context in native ZCP flows
- run compatibility tests before cutting over production traffic

## Current Compatibility Posture

The project now supports MCP-facing:

- stdio
- streamable HTTP
- websocket
- OAuth metadata and protected resource metadata
- core OAuth token flow pieces

The remaining migration risk is mostly in broader edge-case coverage, not in
the absence of those surfaces. Use `mcp_gap_todo.md` for the strict list of
remaining work before claiming full parity for your exact deployment.

## When Not To Migrate Yet

Pause before migration if your rollout depends on:

- very specific experimental MCP behaviors not yet covered here
- auth interoperability beyond the currently validated flows
- long-lived reconnect semantics that have not yet been tested for your client

That is a testing and gap-analysis question, not a reason to reject the
architecture outright.
