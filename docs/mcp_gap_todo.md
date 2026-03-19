# ZCP MCP Gap And TODO

This document tracks the remaining gap between the current ZCP implementation
and the current official MCP repositories:

- spec/docs: `modelcontextprotocol/modelcontextprotocol`
- SDK reference: `modelcontextprotocol/python-sdk`

It is intentionally stricter than product copy. If an item is not fully matched
or not fully covered, it should stay here.

## Current Position

ZCP already covers a substantial MCP-compatible server surface:

- lifecycle: `initialize`, `initialized`, `ping`
- tools: `tools/list`, `tools/call`
- resources: `resources/list`, `resources/read`, `resources/subscribe`, `resources/unsubscribe`
- resource templates: `resources/templates/list`
- prompts: `prompts/list`, `prompts/get`
- completion: `completion/complete`
- logging: `logging/setLevel`, `notifications/message`
- roots: `roots/list`, `notifications/roots/list_changed`
- progress notifications
- stdio transport
- streamable HTTP on `/mcp`
- websocket transport
- task methods and task-augmented tool calls
- OAuth metadata plus auth code + PKCE + refresh + registration + revocation

Official MCP Python SDK contract coverage in this workspace already includes:

- stdio
- streamable HTTP
- websocket

## Remaining Gaps

### 1. Official Auth-Client End-To-End Interop Coverage

Current state:

- auth metadata routes exist
- auth code + PKCE exists
- refresh token exchange exists
- registration and revocation exist
- provider-backed state exists

Missing:

- official auth-client end-to-end interop coverage
- richer client authentication method coverage

Impact:

- auth features are real and usable
- full end-to-end compatibility confidence is still not at the same level as
  stdio, streamable HTTP, and websocket

### 2. Experimental Task Coverage Is Still Behind Core MCP Features

Current state:

- `tasks/create`
- `tasks/list`
- `tasks/get`
- `tasks/result`
- `tasks/cancel`
- `notifications/tasks/status`
- asynchronous state transitions
- task-augmented `tools/call`

Missing:

- broader official-client contract coverage for task workflows
- reconnect and recovery semantics across longer-lived flows
- distributed or store-backed task orchestration

Impact:

- task basics are implemented
- confidence is lower than for tools, resources, prompts, and lifecycle

### 3. Sampling, Elicitation, And Progress Need More End-To-End Coverage

Current state:

- request normalization exists
- runtime hooks exist
- progress notifications exist

Missing:

- more official client/session coverage
- broader multimodal and edge-shape coverage
- more end-to-end progress scenarios on MCP surfaces

Impact:

- implementation exists
- confidence is still below the core resource and tool surfaces

### 4. Output Validation Parity Is Improved But Not Exhaustive

Current state:

- tool metadata returns `outputSchema`
- scalar structured output paths exist

Missing:

- richer invalid-output tests
- more exhaustive client-side output-shape coverage
- edge behavior around complex structured output

Impact:

- core metadata is present
- output-validation confidence is not yet exhaustive

### 5. Websocket And Streamable HTTP Need More Long-Run Soak Coverage

Current state:

- official MCP Python SDK client interop exists for both transports
- basic request and response behavior is covered

Missing:

- longer reconnect and replay scenarios
- richer notification-heavy soak tests

Impact:

- transport parity exists in the mainline path
- operational confidence for long-running sessions still needs more coverage

### 6. Guide Depth Still Needs More End-To-End Examples

Current state:

- the markdown corpus is now broad and category-based
- docs markdown is rendered inside `docs/web`
- grouped docs navigation and a docs index now exist
- older entry pages now point into the same docs IA instead of carrying stale copy

Missing:

- more full end-to-end code examples inside each guide
- deeper scenario walkthroughs for auth, tasks, and multi-service deployments

Impact:

- the docs system is now structurally real and navigable
- the remaining gap is depth, not structure

## Recommended Next Implementation Order

### Phase 1. Raise Interop Confidence

- add official auth-client end-to-end coverage
- add broader official-client task coverage
- add official-client progress coverage

### Phase 2. Raise Long-Running Runtime Confidence

- expand websocket reconnect and soak tests
- expand streamable HTTP replay and reconnect tests
- add more task recovery scenarios

### Phase 3. Raise Output And Content-Block Confidence

- add richer structured output validation tests
- add more sampling and elicitation shape coverage

### Phase 4. Deepen Docs And Examples

- add more complete end-to-end code examples to the guide pages
- keep examples and migration docs aligned with tested reality

## Concrete TODO Checklist

- [ ] Add official auth-client end-to-end coverage
- [ ] Add official-client tests for task polling and `tasks/result`
- [ ] Add official-client tests for `notifications/progress`
- [ ] Add broader official-client coverage for sampling and elicitation
- [ ] Add invalid structured output tests on the MCP surface
- [ ] Add websocket reconnect and notification soak tests
- [ ] Add streamable HTTP replay and reconnect edge-case tests
- [ ] Add more complex task recovery and resume tests
- [ ] Add deeper end-to-end code examples across the guide pages

## Claim Boundary

The correct current external claim is:

- `ZCP provides broad MCP-compatible core server functionality with official-client coverage for stdio, streamable HTTP, and websocket`

The incorrect claim would be:

- `ZCP already has complete MCP parity in every extension, auth flow, and operational edge case`

This file should be updated whenever parity claims change.
