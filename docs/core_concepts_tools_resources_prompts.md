# Core Concepts: Tools, Resources, Templates, And Prompts

This document explains the server-owned objects that make up most ZCP and MCP
integrations.

## Overview

Most application design questions reduce to one choice:

- is this an operation
- is this content
- is this prompt scaffolding

In ZCP and MCP terms, that means choosing between:

- tools
- resources and resource templates
- prompts

Making that choice correctly matters for token efficiency, client discovery,
auth boundaries, and long-term API stability.

## Tools

Tools are callable server-side operations. They are the right fit when the
client needs to ask the server to do something, not just read something.

Typical tool metadata includes:

- `name`
- `title`
- `description`
- `inputSchema`
- `outputSchema`
- `annotations`
- `icons`
- `execution`
- `_meta`

In the Python SDK, tools are usually registered with `FastZCP.tool(...)`.

```python
from zcp import FastZCP

app = FastZCP("Operations Backend")


@app.tool(
    name="incident.create",
    description="Create an incident ticket.",
    input_schema={
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "severity": {"type": "string", "enum": ["sev1", "sev2", "sev3"]},
        },
        "required": ["title", "severity"],
        "additionalProperties": False,
    },
    output_schema={
        "type": "object",
        "properties": {
            "incidentId": {"type": "string"},
            "url": {"type": "string"},
        },
        "required": ["incidentId", "url"],
    },
    output_mode="scalar",
    inline_ok=True,
)
def create_incident(title: str, severity: str, ctx=None):
    return {"incidentId": "INC-123", "url": "https://ops.example.com/INC-123"}
```

### When To Use A Tool

Use a tool when the server is expected to:

- perform a query with arguments
- cause a side effect
- execute a workflow
- validate structured input
- enforce policy before work happens

Examples:

- search a ticketing system
- send an email
- start a deployment
- fetch a scoped record from a backend API

### Tool Output Modes

ZCP supports both MCP-facing structured outputs and native runtime-oriented
optimizations.

Use inline structured output when:

- results are small
- the client or model needs them immediately
- output schema validation matters

Prefer handle-oriented or off-context storage when:

- results are large
- the full payload should not be repeated into prompt context
- clients can retrieve or reference the artifact later

This is one of the main places where native ZCP can be more token efficient
than plain MCP-style usage.

### Execution Metadata

Tool `execution` metadata is where runtime behavior becomes explicit. Common
examples include:

- task support
- approval requirements
- scheduling hints
- other implementation-specific runtime metadata

If a tool can run as a task, document that. Do not force clients to infer it.

### Tool Design Guidance

Prefer:

- stable names such as `domain.action`
- narrow JSON schemas
- explicit descriptions of side effects
- output schemas when structured content matters
- one tool per clear business operation

Avoid:

- giant "do everything" tools
- weakly typed argument bags
- descriptions that contain policy hidden in prose
- pushing static reference data through tool calls

## Resources

Resources are readable server-owned content addressed by a URI.

Examples:

- `weather://cities`
- `file:///workspace/README.md`
- `db://schemas/public/users`
- `tenant://acme/config`

In the Python SDK, resources are registered with `FastZCP.resource(...)`.

```python
@app.resource(
    "tenant://acme/config",
    name="Tenant Config",
    mime_type="application/json",
)
def tenant_config():
    return {"region": "us-east-1", "features": ["alerts", "audit"]}
```

### When To Use A Resource

Use a resource when the primary action is:

- read
- inspect
- browse
- subscribe to updates

Examples:

- generated reports
- source files
- schemas
- tenant settings
- inventories

### Resource Content Shapes

The runtime can project different handler outputs into MCP-compatible content:

- text-like output becomes text content
- JSON-like output becomes structured or serialized content
- binary output becomes blob content

This lets one resource model cover both simple and rich content.

### Subscriptions

If a resource can change and clients care about updates, make that explicit
with subscriptions and `notifications/resources/updated`. Use subscriptions for
content that behaves like data, not for workflows that should really be tasks.

## Resource Templates

A resource template advertises a parameterized family of URIs without listing
every concrete instance.

Example:

```python
@app.resource_template(
    "repo://{owner}/{name}/issues/{id}",
    name="Repository Issue",
    mime_type="application/json",
)
def repo_issue(uri: str):
    return {"uri": uri}
```

Use templates when:

- the URI space is large
- instances are predictable
- discovery matters more than pre-enumeration

Templates are especially useful for file-like and entity-like data where a
client can fill in parameters after discovery.

## Prompts

Prompts are server-owned prompt templates that return messages, not executable
logic. They centralize prompt construction so clients do not have to rebuild the
same structure themselves.

In the Python SDK, prompts are registered with `FastZCP.prompt(...)`.

```python
from zcp import PromptArgument


@app.prompt(
    name="incident.summary",
    description="Build a handoff prompt for an on-call engineer.",
    arguments=[
        PromptArgument(name="incident_id", required=True),
        PromptArgument(name="audience"),
    ],
)
def incident_summary_prompt(incident_id: str, audience: str | None = None):
    return [
        {"role": "system", "content": "You write concise incident summaries."},
        {
            "role": "user",
            "content": f"Summarize incident {incident_id} for {audience or 'an engineer'}.",
        },
    ]
```

### When To Use A Prompt

Use a prompt when:

- prompt construction should be owned by the backend
- many clients need the same template
- arguments should be discoverable
- prompt structure is part of the product surface

Examples:

- report summarization
- code review scaffolding
- incident handoff prompts
- domain-specific investigation templates

### Prompts Are Not Tools

A prompt should not be used to smuggle executable logic or validation rules.

Tools do work.
Resources expose content.
Prompts define reusable prompt scaffolding.

If the output must be validated or executed, the prompt probably should not be
the primary abstraction.

## Choosing The Right Primitive

Use this rule:

- choose a tool for an operation
- choose a resource for readable content
- choose a prompt for reusable prompt assembly

When in doubt, ask what a client is trying to do:

- "run something" means tool
- "read something" means resource
- "build messages" means prompt

## ZCP-Specific Advantage

The MCP projection intentionally looks familiar. The underlying runtime is not
limited to the same prompt-visible overhead.

ZCP can:

- keep canonical validation out of prompt context
- avoid repeatedly resending large registries in native flows
- store large outputs behind handles or runtime state
- preserve official MCP response shapes at the compatibility boundary

That is the practical reason this distinction matters in ZCP instead of being
just an abstract taxonomy exercise.

## Related Reading

- [Runtime Features](/docs/runtime-features)
- [Server Guide](/docs/servers)
- [Client Guide](/docs/clients)
- [Protocol Reference](/docs/protocol)
