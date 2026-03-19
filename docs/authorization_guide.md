# Authorization Guide

This document explains how ZCP protects MCP-compatible and native endpoints,
what OAuth-related routes it exposes, and how scope enforcement works in the
runtime.

## Authorization Modes

ZCP currently supports two practical authorization modes:

- static bearer token protection
- OAuth 2.1 style authorization code flow with PKCE, refresh tokens,
  registration, and revocation

Both can protect MCP-facing transports and the native `/zcp` path.

## Why Authorization Is A First-Class Concern

A ZCP or MCP server may expose high-impact operations:

- filesystem access
- tenant data
- administrative actions
- network-connected backends
- long-running workflows

Authorization must be attached to the runtime boundary, not bolted on as
client-side convention.

## Static Bearer Token Mode

For controlled environments, the simplest option is a fixed bearer token.

```python
from zcp import BearerAuthConfig, ZCPServerConfig, create_asgi_app

application = create_asgi_app(
    app,
    config=ZCPServerConfig(
        auth=BearerAuthConfig(token="replace-me"),
    ),
)
```

This mode is useful for:

- local development
- single-tenant internal services
- narrow service-to-service deployments

It is not a substitute for a full identity system in larger environments.

## End-To-End Pattern: Private Internal Service

For an internal service where every caller is already trusted at the network
boundary, bearer auth is often enough.

Typical shape:

1. protect `/zcp`, `/mcp`, and `/ws` with one bearer token
2. keep `/healthz`, `/readyz`, and `/metadata` public only if needed
3. use `required_scopes` anyway for high-impact tools
4. rotate the bearer token with your normal secret-management process

This mode is the best fit for:

- private agent platforms
- internal automation services
- staging environments that need parity with production routes

## OAuth Support

When OAuth is enabled, ZCP can expose:

- authorization server metadata
- protected resource metadata for the MCP resource surface
- authorization endpoint
- token endpoint
- dynamic client registration endpoint
- token revocation endpoint

Relevant configuration is provided by `OAuthConfig` on `ZCPServerConfig`.

## End-To-End OAuth Server Example

This is the smallest realistic server setup if you need durable OAuth state and
scope-protected capabilities.

```python
from zcp import (
    AuthProfile,
    FastZCP,
    OAuthConfig,
    SQLiteOAuthProvider,
    ZCPServerConfig,
    create_asgi_app,
)

app = FastZCP(
    "Protected Weather",
    auth_profile=AuthProfile(
        issuer="https://zcp.example.com",
        authorization_url="https://zcp.example.com/authorize",
        token_url="https://zcp.example.com/token",
        scopes=["weather.read", "weather.admin"],
    ),
)


@app.tool(
    name="weather.lookup",
    description="Read weather data.",
    input_schema={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
    required_scopes=("weather.read",),
)
def weather_lookup(city: str):
    return {"city": city, "temperature": 24}


@app.tool(
    name="weather.rotate_cache",
    description="Administrative cache rotation.",
    input_schema={"type": "object", "properties": {}, "additionalProperties": False},
    output_mode="scalar",
    inline_ok=True,
    required_scopes=("weather.admin",),
)
def rotate_cache():
    return {"status": "rotated"}


application = create_asgi_app(
    app,
    config=ZCPServerConfig(
        oauth=OAuthConfig(enabled=True, issuer="https://zcp.example.com"),
        oauth_provider=SQLiteOAuthProvider("oauth.sqlite3"),
    ),
)
```

This setup gives you:

- discovery metadata
- authorization code plus PKCE
- refresh token support
- dynamic client registration if enabled
- revocation support
- durable token and code state in SQLite

## Authorization Code Flow With PKCE

The current OAuth flow supports:

1. metadata discovery
2. authorization code issuance
3. PKCE verifier/challenge validation
4. access token issuance
5. refresh token issuance
6. refresh token exchange
7. token revocation

This is the correct baseline for browser-adjacent clients and other clients
that need user-authorized access instead of static shared secrets.

## Dynamic Client Registration

Dynamic registration is available when enabled in config. This lets clients
obtain:

- `client_id`
- `client_secret`
- registered redirect URIs

This is useful for:

- development tooling
- test harnesses
- embedded clients that do not want hard-coded provisioning

## Provider Model

OAuth state is not limited to one process memory anymore. The runtime supports:

- `InMemoryOAuthProvider`
- `SQLiteOAuthProvider`
- a provider abstraction for other backing stores

### In-Memory Provider

Use this for:

- tests
- ephemeral local development
- single-process experiments

### SQLite Provider

Use this for:

- persisted local installs
- single-node deployments
- environments that want durable auth state without adding a separate service

Example:

```python
from zcp import OAuthConfig, SQLiteOAuthProvider, ZCPServerConfig, create_asgi_app

application = create_asgi_app(
    app,
    config=ZCPServerConfig(
        oauth=OAuthConfig(enabled=True, issuer="https://zcp.example.com"),
        oauth_provider=SQLiteOAuthProvider("zcp-oauth.db"),
    ),
)
```

## Request Sequence For Authorization Code Plus PKCE

The currently implemented sequence is:

1. `GET /.well-known/oauth-authorization-server`
2. `GET /authorize?...response_type=code&client_id=...&redirect_uri=...&code_challenge=...`
3. receive a redirect containing `code=...`
4. `POST /token` with `grant_type=authorization_code`, `code`, `client_id`,
   `redirect_uri`, and `code_verifier`
5. receive `access_token` and `refresh_token`
6. `POST /token` again with `grant_type=refresh_token` when renewal is needed
7. call `/mcp`, `/ws`, or `/zcp` with the resulting bearer token

That sequence is already exercised in the local test suite. The remaining gap
is broader client-interop coverage, not the basic server route flow itself.

## End-To-End Pattern: Hosted OAuth Deployment

The usual hosted deployment flow looks like this:

1. publish OAuth metadata from the ASGI service
2. register clients dynamically or provision them ahead of time
3. send browser or user-facing clients through auth code + PKCE
4. issue refresh tokens for long-lived sessions
5. persist auth state with `SQLiteOAuthProvider` or another provider
6. enforce scopes on tools, resources, and prompts at runtime

This keeps authorization behavior attached to the server boundary instead of
scattering it across clients.

## Scope Enforcement

Scopes are enforced by the runtime on:

- tools
- resources
- prompts

That means policy lives close to execution rather than depending on client
honesty.

Example server-side scope declaration:

```python
@app.tool(
    name="admin.rotate_key",
    description="Rotate a tenant signing key.",
    input_schema={"type": "object", "properties": {"tenant": {"type": "string"}}, "required": ["tenant"]},
    output_mode="scalar",
    inline_ok=True,
    required_scopes=("admin.keys",),
)
def rotate_key(tenant: str):
    return {"tenant": tenant, "status": "rotated"}
```

A practical scope split usually looks like this:

- read-oriented tools and resources: `*.read`
- high-impact mutations: `*.admin` or `*.write`
- tenant-specific operations: scopes that match the tenant or role boundary

## End-To-End Pattern: Tenant-Scoped Admin Surface

A production pattern that works well is:

1. issue normal read scopes broadly
2. keep admin scopes narrow and auditable
3. attach admin scopes only to a small number of tools or prompts
4. require tasks for risky long-running operations so cancellation stays visible

That gives you a much cleaner security model than embedding tenant and policy
checks ad hoc inside every tool handler.

## Public And Protected Routes

Typical public routes include:

- `/`
- `/docs`
- `/healthz`
- `/readyz`
- `/metadata`
- OAuth discovery and token routes when enabled

Protected routes usually include:

- `/zcp`
- `/mcp`
- `/ws`

Do not assume public or protected behavior from route names alone. It is the
server config that defines the boundary.

## Deployment Guidance

Use static bearer auth when:

- the environment is controlled
- all clients are trusted
- the operational simplicity is worth the tradeoff

Use OAuth when:

- clients need delegated user authorization
- token lifecycle matters
- refresh behavior matters
- the integration boundary is broader than a single trusted process

## Recommended Deployment Patterns

### Internal Single-Tenant Service

- static bearer token is usually enough
- keep OAuth disabled unless delegated user access is a real requirement

### Hosted MCP Service

- enable OAuth
- persist auth state in SQLite or your own provider
- scope every mutating capability explicitly

### Desktop Or Tooling Integration

- start with bearer auth or a local OAuth provider
- only add dynamic registration if the client lifecycle actually needs it

## Rollout Pattern: Bearer First, OAuth Second

If you are still proving the product shape, the pragmatic sequence is:

1. ship bearer auth for internal clients first
2. validate scopes and route protection
3. add OAuth metadata and auth code + PKCE when the integration boundary grows
4. move auth state into a persistent provider before broader external adoption

That rollout keeps auth complexity aligned with real adoption instead of adding
full delegated auth before you have clients that need it.

## Current Production Boundaries

The OAuth layer is much more production-like than a demo-only in-memory flow.
It now includes PKCE, refresh tokens, registration, revocation, and durable
SQLite-backed state.

The remaining work is not basic correctness. It is mostly about deeper
interoperability coverage and broader provider choices. See [MCP Gap And TODO](/docs/mcp-gap)
for the precise remaining items.

## Related Reading

- [Transport Guide](/docs/transports)
- [Server Guide](/docs/servers)
- [Client Guide](/docs/clients)
- [MCP Gap And TODO](/docs/mcp-gap)
