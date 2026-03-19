# ZCP Python SDK API Reference

The Python package name is `zcp`.

```python
import zcp
```

This document lists the primary exported APIs and how they are grouped. For
usage patterns, prefer the guides. Use this file when you already know the
concept and need the symbol name.

## Server Construction

Primary server-facing exports:

- `FastZCP`
- `ZCPServerSession`
- `create_asgi_app`
- `ZCPASGIApp`
- `run_mcp_stdio_server`
- `run_mcp_stdio_server_sync`

## Registration APIs On `FastZCP`

Registration methods:

- `FastZCP.tool(...)`
- `FastZCP.resource(...)`
- `FastZCP.resource_template(...)`
- `FastZCP.prompt(...)`
- `FastZCP.completion(ref)`
- `FastZCP.task(kind)`

These methods define the public object model exposed through the runtime.

## Client And Session APIs

Primary client-facing exports:

- `ZCPClientSession`
- `ZCPSessionGroup`
- `MCPGatewayClient`
- `MCPGatewayServer`

Important `ZCPClientSession` methods:

- `initialize(capabilities=None)`
- `initialized()`
- `ping()`
- `list_tools(cursor=None, profile=None, groups=None, exclude_groups=None, stages=None)`
- `call_tool(name, arguments, meta=None, task=None)`
- `call_tool_as_task(name, arguments, ttl=60000, poll_interval=None, meta=None)`
- `list_resources(cursor=None)`
- `list_resource_templates(cursor=None)`
- `read_resource(uri, arguments=None)`
- `subscribe_resource(uri)`
- `unsubscribe_resource(uri)`
- `list_prompts(cursor=None)`
- `get_prompt(name, arguments=None)`
- `complete(ref, argument, value=None, context=None, context_arguments=None, method="completion/complete")`
- `set_logging_level(level)`
- `list_roots()`
- `create_message(messages, **kwargs)`
- `elicit(kind, prompt, **kwargs)`
- `create_task(kind, input, task=None)`
- `list_tasks(cursor=None)`
- `get_task(task_id)`
- `get_task_result(task_id)`
- `cancel_task(task_id)`

`ZCPSessionGroup` helpers:

- `list_tools(**kwargs)`
- `list_resources()`
- `list_prompts()`

Tool exposure and native profiles:

- `ToolExposureConfig`
- `SemanticWorkflowProfile`

The most important built-in native profile is `semantic-workflow`. It is used
with `list_tools(profile="semantic-workflow")` and returns only tools tagged
with `_meta.groups` that include `workflow` when such tools exist.

## Runtime And Schema Types

Selected exported runtime types:

- `ToolDefinition`
- `ToolRegistry`
- `PromptDescriptor`
- `PromptArgument`
- `ResourceDescriptor`
- `ResourceTemplate`
- `TaskDescriptor`
- `TaskExecutionContext`
- `SessionState`
- `HandleStore`
- `RuntimeExecutor`
- `CanonicalValidator`
- `ValidationFailure`

Request and result models:

- `CompletionRequest`
- `CompletionResult`
- `SamplingRequest`
- `SamplingResult`
- `ElicitationRequest`
- `ElicitationResult`
- `InitializeParams`
- `InitializeResult`

Protocol and schema helpers:

- `CallRequest`
- `CallResult`
- `CallError`
- `HandleRef`
- `RegistryView`
- `OpenAIStrictSchemaCompiler`
- `encode_tool_output`
- `decode_tool_output`

## Transport Helpers

Transport server helpers:

- `stdio_server`
- `sse_server`
- `streamable_http_server`
- `websocket_server`

Transport client helpers:

- `stdio_client`
- `sse_client`
- `streamable_http_client`
- `websocket_client`

These helpers are especially useful for tests and local orchestration code.

## Profiles And Adapters

Exports for model/runtime adapter flows:

- `AgentLoop`
- `MCPProfile`
- `OpenAIAdapter`
- `OpenAIResponsesAdapter`
- `TurnResult`
- `compile_openai_tools`
- `format_call`
- `format_registry`
- `format_result`
- `run_responses_turn`
- `stream_responses_turn`
- `submit_tool_results`

## Auth And Capability Types

Auth-related exports:

- `AuthContext`
- `AuthProfile`
- `OAuthConfig`
- `OAuthProvider`
- `OAuthClient`
- `AuthorizationCode`
- `AccessToken`
- `RefreshToken`
- `InMemoryOAuthProvider`
- `SQLiteOAuthProvider`
- `BearerAuthConfig`

Capability-related exports:

- `Capabilities`
- `PROTOCOL_VERSION`
- `ProgressToken`

## Server Configuration Types

Configuration exports:

- `ZCPServerConfig`
- `HTTPConfig`
- `SSEConfig`
- `StreamableHTTPConfig`
- `WebSocketConfig`
- `RateLimitConfig`

These determine transport routes, auth behavior, replay behavior, websocket
availability, and coarse request limits.

## Notes

- MCP compatibility is exposed on top of the same runtime core.
- Native ZCP remains the optimization path for token-sensitive workloads.
- Use `server_guide.md` and `client_guide.md` for workflow-level explanation.
