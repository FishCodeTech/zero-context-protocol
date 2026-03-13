# ZCP MCP Compatibility Matrix

ZCP now exposes one runtime with two protocol surfaces:

- `MCP-compatible server surface`
  Meant for existing MCP clients and hosts, including stdio-style `mcp.json` launches.
- `ZCP native surface`
  Meant for lower token overhead, handle-aware results, and longer multi-turn sessions.

The table below tracks MCP-facing parity from the server side. Repo-level alpha
guarantees apply only to the core compatibility rows; partial and experimental
rows are intentionally not presented as full parity claims yet.

| MCP Feature | Official MCP Surface | ZCP MCP-Compatible Surface | ZCP Native Surface | Verification |
| --- | --- | --- | --- | --- |
| Lifecycle | `initialize`, `initialized`, `ping` | Yes | Yes | Official MCP Python SDK stdio contract test in `tests/test_mcp_stdio_contract.py`; HTTP `/mcp` smoke coverage in `tests/test_zcp_http.py` |
| Tools | list / call / changed | Yes | Yes | Official MCP client contract for list/call over stdio; HTTP `/mcp` shape checks |
| Resources | list / read / subscribe / templates | Yes | Yes | Official MCP client contract covers list/read over stdio |
| Prompts | list / get / changed | Yes | Yes | Official MCP client contract covers list/get over stdio |
| Completions | `completions/complete` | Yes | Yes | Gateway implemented; native runtime covered in existing session tests |
| Logging | set level / notifications | Partial | Yes | Structured notification channel exists; full MCP logging parity is not yet contract-tested |
| Roots | list / changed | Yes | Yes | Implemented in runtime and gateway |
| Sampling | `sampling/createMessage` | Partial | Yes | Implemented in runtime and gateway, but not part of the repo-level alpha compatibility guarantee |
| Elicitation | form / basic / url request | Partial | Yes | Implemented in runtime and gateway, but not part of the repo-level alpha compatibility guarantee |
| Tasks | create / list / get / cancel | Experimental | Yes | Native-first feature, exposed through gateway as experimental |
| Authorization profile | OAuth 2.1 / PKCE metadata | Partial | Profile metadata | Runtime exposes auth/profile metadata; full OAuth flow is not implemented here |
| Transports | stdio / streamable HTTP | stdio contract-tested, HTTP JSON-RPC surface available at `/mcp` | Native stdio / HTTP helpers | The Python SDK repo provides the MCP stdio entrypoint plus HTTP `/mcp` ASGI support |
| OpenAI-compatible adapter | N/A | N/A | `zcp.profiles.oai` | Implemented under the `zcp` package |

## Notes

- The compatibility layer is a formal server surface now, not a demo-only gateway.
- `zero-context-protocol-python` provides the minimal MCP-compatible stdio entrypoint for host-spawned clients.
- Native ZCP remains the optimization path: more compact registry exchange, handle-aware results, and lower model-visible token cost.
- This repository presents the matrix; the Python SDK repository remains the behavior source of truth.
