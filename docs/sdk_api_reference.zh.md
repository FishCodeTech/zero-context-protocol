# ZCP Python SDK API 参考

Python 包名是 `zcp`。

```python
import zcp
```

本文档列出主要导出的 API，以及它们的分组方式。关于使用模式，优先参考 guides。当你已经理解概念、只需要查具体 symbol name 时，再使用这个文件。

## 服务端构建

主要的服务端导出：

- `FastZCP`
- `ZCPServerSession`
- `create_asgi_app`
- `ZCPASGIApp`
- `run_mcp_stdio_server`
- `run_mcp_stdio_server_sync`

## `FastZCP` 上的注册 API

注册方法：

- `FastZCP.tool(...)`
- `FastZCP.resource(...)`
- `FastZCP.resource_template(...)`
- `FastZCP.prompt(...)`
- `FastZCP.completion(ref)`
- `FastZCP.task(kind)`

这些方法定义了通过运行时暴露出去的公开对象模型。

## 客户端与会话 API

主要的客户端导出：

- `ZCPClientSession`
- `ZCPSessionGroup`
- `MCPGatewayClient`
- `MCPGatewayServer`

重要的 `ZCPClientSession` 方法：

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

`ZCPSessionGroup` 辅助方法：

- `list_tools(**kwargs)`
- `list_resources()`
- `list_prompts()`

工具暴露与原生 profile：

- `ToolExposureConfig`
- `SemanticWorkflowProfile`

当前最重要的内置原生 profile 是 `semantic-workflow`。它通过
`list_tools(profile="semantic-workflow")` 使用；当服务端存在
`_meta.groups` 包含 `workflow` 的工具时，只返回该工作流子集。

## 运行时与 Schema 类型

部分导出的运行时类型：

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

请求与结果模型：

- `CompletionRequest`
- `CompletionResult`
- `SamplingRequest`
- `SamplingResult`
- `ElicitationRequest`
- `ElicitationResult`
- `InitializeParams`
- `InitializeResult`

协议与 schema 辅助类型：

- `CallRequest`
- `CallResult`
- `CallError`
- `HandleRef`
- `RegistryView`
- `OpenAIStrictSchemaCompiler`
- `encode_tool_output`
- `decode_tool_output`

## 传输辅助工具

传输服务端辅助函数：

- `stdio_server`
- `sse_server`
- `streamable_http_server`
- `websocket_server`

传输客户端辅助函数：

- `stdio_client`
- `sse_client`
- `streamable_http_client`
- `websocket_client`

这些辅助函数对测试和本地编排代码尤其有用。

## Profiles 与 Adapters

用于 model/runtime adapter 流程的导出：

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

## Auth 与 Capability 类型

与 auth 相关的导出：

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

与 capability 相关的导出：

- `Capabilities`
- `PROTOCOL_VERSION`
- `ProgressToken`

## 服务端配置类型

配置相关导出：

- `ZCPServerConfig`
- `HTTPConfig`
- `SSEConfig`
- `StreamableHTTPConfig`
- `WebSocketConfig`
- `RateLimitConfig`

这些类型决定传输路由、auth 行为、replay 行为、websocket 可用性，以及粗粒度请求限制。

## 说明

- MCP 兼容层是构建在同一套运行时核心之上的。
- 原生 ZCP 仍然是面向 token-sensitive workload 的优化路径。
- 关于工作流层面的说明，请参考 `server_guide.md` 和 `client_guide.md`。
