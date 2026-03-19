# ZCP MCP Protocol Reference

This document describes the MCP-facing surface implemented by ZCP. Use it as a
wire reference, not as the first conceptual introduction.

## Lifecycle

Supported lifecycle methods:

- `initialize`
- `initialized`
- `ping`

`initialize` returns MCP-shaped data including:

- `protocolVersion`
- `serverInfo`
- `capabilities`

When auth metadata is configured on the native runtime, that information is
also reflected through the exposed metadata surfaces.

## Tools

Supported tool methods:

- `tools/list`
- `tools/call`
- `notifications/tools/list_changed`

Supported tool metadata projection includes:

- `name`
- `title`
- `description`
- `inputSchema`
- `outputSchema`
- `annotations`
- `icons`
- `execution`
- `_meta`

`tools/call` can return:

- normal inline content
- structured content
- task objects when task-augmented invocation is requested and supported

## Resources

Supported resource methods:

- `resources/list`
- `resources/templates/list`
- `resources/read`
- `resources/subscribe`
- `resources/unsubscribe`
- `notifications/resources/updated`
- `notifications/resources/list_changed`

ZCP projects text-like, JSON-like, and binary handler outputs into
MCP-compatible resource content.

## Prompts

Supported prompt methods:

- `prompts/list`
- `prompts/get`
- `notifications/prompts/list_changed`

Prompt results can be returned as:

- plain string content
- `{role, content}` messages
- richer content block objects

## Completion

Supported completion methods:

- official `completion/complete`
- compatibility alias `completions/complete`

Completion responses include:

- `values`
- `total`
- `hasMore`

## Logging

Supported logging methods and notifications:

- `logging/setLevel`
- `notifications/message`

Supported levels:

- `debug`
- `info`
- `notice`
- `warning`
- `error`
- `critical`
- `alert`
- `emergency`

## Roots

Supported roots methods and notifications:

- `roots/list`
- `notifications/roots/list_changed`

## Progress

Supported progress notification:

- `notifications/progress`

Progress tokens are accepted from common MCP metadata locations, including:

- `params.meta.progressToken`
- `params.meta.progress_token`
- `params._meta.progressToken`

## Sampling

Supported method:

- `sampling/createMessage`

Supported normalized request fields include:

- `messages`
- `systemPrompt`
- `modelPreferences`
- `includeContext`
- `temperature`
- `maxTokens`
- `stopSequences`
- `metadata`
- `tools`
- `toolChoice`

## Elicitation

Supported elicitation methods:

- official `elicitation/create`
- compatibility alias `elicitation/request`

ZCP accepts MCP-style form and URL requests while still preserving a backward
compatible alias path for native callers that have not migrated.

## Tasks

Supported task methods:

- `tasks/create`
- `tasks/list`
- `tasks/get`
- `tasks/result`
- `tasks/cancel`
- `notifications/tasks/status`

Supported task states include:

- `queued`
- `working`
- `input_required`
- `completed`
- `failed`
- `cancelled`

Task-augmented `tools/call` is also supported for tools that declare task
support.

## Transports

Current MCP-facing transports:

- stdio
- streamable HTTP on `/mcp`
- websocket on `/ws`

Current native transport:

- JSON-RPC on `/zcp`

### Streamable HTTP Details

`/mcp` supports:

- `GET` for SSE streaming
- `POST` for JSON-RPC and streamed responses
- `DELETE` for explicit session teardown

Compatibility behavior includes:

- `mcp-session-id`
- support for the configured native session header
- SSE `id`
- `Last-Event-ID` replay against a bounded buffer

## Authorization Metadata

When OAuth is enabled, the server can expose:

- authorization server metadata
- protected resource metadata
- authorization endpoint
- token endpoint
- registration endpoint
- revocation endpoint

Use `authorization_guide.md` for deployment guidance and this document only for
surface reference.

## Notes On Parity

This document describes what the implementation exposes today. It does not
claim that every edge case or experimental feature is fully exhausted. For the
strict remaining gap list, use `mcp_gap_todo.md`.
