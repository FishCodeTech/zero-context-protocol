import { Locale } from "./i18n";

type LinkItem = { href: string; label: string };

type ReportSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type ReportMetric = {
  label: string;
  value: string;
  note: string;
};

type MechanismStep = {
  title: string;
  body: string;
};

type CodeSnippet = {
  title: string;
  path: string;
  caption: string;
  language: string;
  code: string;
};

type TierInsight = {
  tier: string;
  title: string;
  body: string;
};

type ReportCopy = {
  navLabel: string;
  nav: LinkItem[];
  title: string;
  subtitle: string;
  abstractTitle: string;
  abstract: string[];
  metrics: ReportMetric[];
  sections: ReportSection[];
  mechanismTitle: string;
  mechanismIntro: string;
  mechanismSteps: MechanismStep[];
  codeComparisonTitle: string;
  codeComparisonCaption: string;
  codeComparisonHeaders: string[];
  codeComparisonRows: string[][];
  codeSnippetsTitle: string;
  codeSnippetsIntro: string;
  codeSnippets: CodeSnippet[];
  principleHeaders: string[];
  principleRows: string[][];
  overallHeaders: string[];
  overallRows: string[][];
  tierHeaders: string[];
  tierRows: string[][];
  tierInsightsTitle: string;
  tierInsights: TierInsight[];
  limitsTitle: string;
  limits: string[];
  conclusionTitle: string;
  conclusion: string[];
  figureArchitectureTitle: string;
  figureArchitectureCaption: string;
  figureExecutionTitle: string;
  figureExecutionCaption: string;
  figureLabels: {
    clients: string;
    surfaces: string;
    runtime: string;
    policy: string;
    clientMcp: string;
    clientZcp: string;
    host: string;
    mcpSurface: string;
    nativeSurface: string;
    toolListAll: string;
    semanticSubset: string;
    genericPlanning: string;
    stagedPlanning: string;
    verboseResults: string;
    compactResults: string;
    feedbackLoop: string;
  };
  readNext: LinkItem[];
};

const MCP_TOOL_SCHEMA_SNIPPET = `class Tool(BaseModel):
    fn: Callable[..., Any] = Field(exclude=True)
    name: str = Field(description="Name of the tool")
    parameters: dict[str, Any] = Field(description="JSON schema for tool parameters")
    fn_metadata: FuncMetadata = Field(...)

    @classmethod
    def from_function(cls, fn: Callable[..., Any], ...):
        func_arg_metadata = func_metadata(fn, ...)
        parameters = func_arg_metadata.arg_model.model_json_schema(by_alias=True)
        return cls(
            fn=fn,
            name=func_name,
            parameters=parameters,
            fn_metadata=func_arg_metadata,
        )
`;

const MCP_RESULT_SNIPPET = `async def _handle_call_tool(self, ctx, params) -> CallToolResult:
    result = await self.call_tool(params.name, params.arguments or {}, context)

    if isinstance(result, CallToolResult):
        return result
    if isinstance(result, tuple) and len(result) == 2:
        unstructured_content, structured_content = result
        return CallToolResult(
            content=list(unstructured_content),
            structured_content=structured_content,
        )
    return CallToolResult(content=list(result))
`;

const ZCP_CANONICAL_SNIPPET = `@dataclass
class ToolDefinition:
    tool_id: str
    alias: str
    description_short: str
    input_schema: dict[str, Any]
    output_schema: dict[str, Any] | None = None
    output_mode: Literal["handle", "scalar"] = "handle"
    handle_kind: str = "generic"
    defaults: dict[str, Any] = field(default_factory=dict)
    flags: frozenset[str] = field(default_factory=frozenset)
    metadata: dict[str, Any] = field(default_factory=dict)

@dataclass
class SessionState:
    session_id: str
    registry_hash: str = ""
    tool_subset: tuple[str, ...] = ()
    handles: dict[str, HandleRef] = field(default_factory=dict)
`;

const ZCP_PROFILE_FILTER_SNIPPET = `def _select_tools(app: FastZCP, params: dict[str, Any]) -> list[Any]:
    tools = app.tool_registry.subset().tools
    profile = _effective_tool_profile(app, params)
    include_groups = _normalize_filter_values(params.get("groups"))
    stages = _normalize_filter_values(params.get("stages"))

    if profile == app.semantic_workflow_profile:
        workflow_tools = [tool for tool in tools if app.semantic_group in _tool_groups(tool)]
        if workflow_tools:
            tools = workflow_tools

    if include_groups:
        tools = [tool for tool in tools if _tool_groups(tool) & include_groups]
    if stages:
        tools = [tool for tool in tools if _tool_stages(tool) & stages]
    return tools
`;

const ZCP_SCHEMA_BOUNDARY_SNIPPET = `def compile_openai_tools(self, session: SessionState, *, tool_subset=None, strict_mode=True):
    subset_tuple = tuple(tool_subset or ())
    registry_view = self.registry.subset(list(subset_tuple) if subset_tuple else None, limit=self.tool_limit)
    session.registry_hash = registry_view.hash
    session.tool_subset = subset_tuple

    if key not in self._tool_cache:
        tools = self.compiler.compile_registry(registry_view)
        self._tool_cache[key] = tools
    return self._tool_cache[key]
`;

const ZCP_NATIVE_PROFILE_SNIPPET = `def format_registry(tools: list[ToolDefinition]) -> str:
    entries = []
    for tool in tools:
        params = ",".join(
            f"{name}:{_compact_type(schema)}"
            for name, schema in tool.input_schema.get("properties", {}).items()
        )
        entries.append(f"TOOL @{tool.tool_id} {tool.alias}({params}) -> {tool.output_mode}")
    return "\\n".join(entries)
`;

const ZCP_RESULT_SNIPPET = `if tool.output_mode == "scalar" and (tool.inline_ok or is_scalar_value(value)):
    return CallResult(
        cid=request.cid,
        status="ok",
        scalar=value,
        summary=summary,
        meta=meta,
    )

handle = self.handle_store.create(
    kind=handle_kind,
    data=value,
    summary=summary,
    meta=meta,
)
return CallResult(
    cid=request.cid,
    status="ok",
    handle=handle,
    summary=handle.summary,
    meta=meta,
)
`;

const REPORT_COPY: Record<Locale, ReportCopy> = {
  en: {
    navLabel: "Technical report",
    nav: [
      { href: "/architecture#abstract", label: "Abstract" },
      { href: "/architecture#problem", label: "Problem" },
      { href: "/architecture#token-economy", label: "Token economy" },
      { href: "/architecture#json-schema", label: "JSON Schema" },
      { href: "/architecture#mechanism", label: "Mechanism" },
      { href: "/architecture#code-comparison", label: "Code comparison" },
      { href: "/architecture#code-snippets", label: "Key snippets" },
      { href: "/architecture#benchmarks", label: "Benchmarks" },
      { href: "/architecture#conclusion", label: "Conclusion" },
    ],
    title: "Why ZCP Outperforms MCP",
    subtitle:
      "A code-grounded technical report on token economics, canonical runtime design, and why ZCP de-centers JSON Schema on the model-facing path while MCP keeps it at the center of the tool contract.",
    abstractTitle: "Abstract",
    abstract: [
      "This report makes a narrower claim than generic marketing copy. ZCP does not outperform MCP because it changed the name of the protocol or because it uses a different transport. It outperforms MCP in planning-heavy workloads because it changes what the model has to see, remember, and branch over at each turn.",
      "In the official MCP Python SDK, the default server path is schema-first: functions become Pydantic models, those models become JSON Schema, `tools/list` returns the full schema-bearing tool set, and `CallToolResult` returns prompt-visible content plus optional structured content. That is reasonable for interoperability.",
      "In ZCP, schema validation still exists, but it is no longer the center of the native runtime contract. The core contract becomes `ToolDefinition + SessionState + HandleRef + TaskExecutionContext`. JSON Schema is compiled at the adapter edge when needed, while the native runtime shrinks tool visibility, compacts results, and externalizes long-running state.",
      "That is why the published benchmark result, `8027.9` tokens for native ZCP versus `30723.7` for the MCP surface, is not accidental. The model sees fewer schemas, fewer branches, fewer large result replays, and fewer prompt-visible repair loops.",
    ],
    metrics: [
      {
        label: "Primary claim",
        value: "token cost is a runtime problem",
        note: "MCP solves compatibility well; ZCP optimizes the model-facing execution contract below that boundary.",
      },
      {
        label: "Published result",
        value: "3.83x",
        note: "Overall token advantage in `full_semantic_compare_v5` on the same backend family.",
      },
      {
        label: "Most important shift",
        value: "JSON Schema moves to the edge",
        note: "ZCP retains schema validation but stops treating full JSON Schema as the native planning surface.",
      },
    ],
    sections: [
      {
        id: "problem",
        title: "1. Problem Statement",
        paragraphs: [
          "MCP is an interoperability protocol. Its job is to let tools, resources, prompts, and transports be described in a shared way across hosts and clients. The official Python SDK reflects that goal directly: it builds tool contracts from Python function signatures and serializes them as JSON Schema.",
          "That solves the boundary problem, but it does not solve the model execution problem. The model still pays for every visible tool, every repeated schema field, every prompt-visible result replay, and every loop where runtime state is simulated inside natural language or repeated tool polling.",
          "The right comparison is therefore not 'which protocol can express a tool call?' Both can. The right comparison is 'what does the model need to reason over per turn?' ZCP wins only when the answer to that question becomes smaller.",
        ],
      },
      {
        id: "token-economy",
        title: "2. Why ZCP Uses Fewer Tokens",
        paragraphs: [
          "Token cost comes from four recurring sources. First, the model is shown too many tools. Second, each tool is described with too much schema detail relative to the task at hand. Third, large results are replayed into later turns. Fourth, background or long-running state is not held by the runtime, so the model keeps reconstructing it through repeated calls and explanations.",
          "The MCP default path amplifies those four costs because the public tool contract is also the default model-facing contract. `Tool.from_function(...)` creates `parameters = arg_model.model_json_schema(by_alias=True)`, `list_tools()` returns every registered tool with `input_schema` and `output_schema`, and `_handle_call_tool()` turns outputs back into `CallToolResult(content=..., structured_content=...)`.",
          "ZCP reduces those costs by moving policy into the runtime. Tool discovery can be cut down before the first turn. Result values can be represented as `scalar` or as `handle + summary` rather than replaying full payloads. Task state can live in `TaskManager` instead of being re-encoded into prompt-visible loops. The benchmark does not need mystery once that chain is visible in code.",
        ],
        bullets: [
          "Fewer visible tools means lower branch factor.",
          "Smaller registry subsets mean less repeated schema payload.",
          "Handles keep large artifacts out of subsequent turns.",
          "Tasks keep long-running state out of the prompt.",
        ],
      },
      {
        id: "architecture",
        title: "3. Canonical Runtime And Context Contract",
        paragraphs: [
          "The decisive ZCP move is architectural: the public MCP-compatible surface is not the native runtime. The native runtime is defined around canonical objects such as `ToolDefinition`, `SessionState`, `CallRequest`, `CallResult`, and `HandleRef` in `src/zcp/canonical_protocol.py`.",
          "Those types store information that matters for model execution but is not central in a schema-first design: `output_mode`, `handle_kind`, `defaults`, `flags`, registry hashes, current tool subset, and live handle references. This is not a naming change. It is a different execution contract.",
          "Because the runtime is canonical first, the same backend can be projected outward in two directions. `/mcp` preserves compatibility. `/zcp` preserves the same business logic but changes discovery, calling discipline, result shape, and state handling. That is why ZCP can keep compatibility without forcing native clients to inherit all of the compatibility surface cost.",
        ],
      },
      {
        id: "json-schema",
        title: "4. JSON Schema At The Edge, Not At The Center",
        paragraphs: [
          "ZCP does not literally delete JSON Schema. It still validates arguments and can still compile strict schemas for providers such as OpenAI. The key change is that JSON Schema stops being the primary native planning artifact.",
          "In MCP, schema generation is upstream and central. `func_metadata(...)` builds Pydantic models, `model_json_schema()` becomes the tool contract, and the default `list_tools()` response exposes those schemas directly. In other words, the same rich schema object acts as registration metadata, transport payload, and the model-facing description.",
          "In ZCP, schema becomes one field inside a richer canonical object. `ToolDefinition` still keeps `input_schema`, but the native runtime can reason in terms of tool ids, subsets, handles, and output modes. `OpenAIStrictSchemaCompiler` is then used at the adapter boundary to compile the currently selected `RegistryView` into provider-specific strict function tools only when that provider needs it.",
          "That is the precise meaning of 'de-centering JSON Schema'. The schema is retained for validation and adapters, but it is no longer the sole object around which the whole runtime is organized.",
        ],
      },
      {
        id: "reading",
        title: "5. How To Read The Figures And Tables",
        paragraphs: [
          "Figure 1 is an architecture boundary diagram. It shows where compatibility lives and where optimization lives. The point of that figure is to make clear that ZCP does not fork business logic; it forks the model-facing execution contract.",
          "Figure 2 is a causal token diagram. It traces where token cost is created: full schema exposure, broad planning, and result replay on the MCP-compatible path; filtered discovery, staged planning, and compact result propagation on the native path.",
          "Table 1 is a token-cost source map. It is not a benchmark table. It tells you which mechanism removes which cost. Table 2 is a code-level mapping between official MCP implementation files and ZCP implementation files. Tables 3 and 4 are empirical: they show the benchmark and the tier breakdown that follow from those architectural choices.",
        ],
      },
    ],
    mechanismTitle: "6. Causal Mechanism",
    mechanismIntro:
      "The benchmark only makes sense if the following mechanism chain is true. Each step removes one class of prompt-visible waste.",
    mechanismSteps: [
      {
        title: "Step 1. Discovery is narrowed before planning starts",
        body: "MCP-style servers usually expose a flat tool inventory. ZCP lets the native client request `profile=\"semantic-workflow\"` and also filter by `groups` and `stages`. The model therefore begins planning inside a smaller action space.",
      },
      {
        title: "Step 2. Call policy matches discovery policy",
        body: "A filtered `tools/list` is meaningless if `tools/call` can still invoke the whole registry. ZCP keeps `enforce_tool_visibility_on_call`, so the model cannot silently escape the current exposure policy.",
      },
      {
        title: "Step 3. Schema compilation is delayed and scoped",
        body: "In MCP, JSON Schema is generated at registration time and then travels with every tool definition. In ZCP, the OpenAI adapter compiles strict schemas only for the selected `RegistryView` and only when the provider requires them.",
      },
      {
        title: "Step 4. Results stop replaying whole artifacts",
        body: "The canonical runtime checks `output_mode`, `inline_ok`, and value size. Small values remain `scalar`; larger values become `HandleRef + summary`. That changes the next prompt turn from 'repeat the full object' to 'continue from a compact reference'.",
      },
      {
        title: "Step 5. Long-running state leaves the prompt loop",
        body: "Tasks, handles, progress, and status updates become runtime state. The model no longer needs to keep reconstructing partially completed work by re-reading large tool outputs or repeatedly polling generic tools.",
      },
      {
        title: "Step 6. Semantic tools compress primitive plans",
        body: "Once a server also offers workflow-level tools, the model no longer has to plan at the lowest possible mutation granularity. That is why the biggest gains appear in Tier B, C, and D rather than in one-shot Tier A calls.",
      },
    ],
    codeComparisonTitle: "7. Code-Level Comparison",
    codeComparisonCaption:
      "This table compares the official MCP Python SDK implementation style with the local ZCP runtime implementation. The point is not rhetoric; it is where each design places state, schemas, and planning constraints.",
    codeComparisonHeaders: ["Concern", "MCP implementation", "ZCP implementation", "Token consequence"],
    codeComparisonRows: [
      [
        "Primary contract object",
        "`src/mcp/types/_types.py::Tool` centers the public contract on `input_schema`, `output_schema`, and `CallToolResult(content, structured_content)`.",
        "`src/zcp/canonical_protocol.py::ToolDefinition` and `SessionState` center the runtime on tool ids, subset hashes, output modes, handles, defaults, flags, and metadata.",
        "More state is held by the runtime instead of being reconstructed by the model every turn.",
      ],
      [
        "Schema generation",
        "`src/mcp/server/mcpserver/tools/base.py::Tool.from_function` calls `arg_model.model_json_schema(by_alias=True)` at registration time.",
        "`src/zcp/adapters/openai.py::compile_openai_tools` compiles strict schemas only for the selected `RegistryView`, and only when the adapter needs them.",
        "The model is not forced to see the whole schema-bearing registry on every native turn.",
      ],
      [
        "Discovery",
        "`src/mcp/server/mcpserver/tool_manager.py::list_tools()` returns the whole tool map; `src/mcp/server/mcpserver/server.py::list_tools()` serializes all tools with schemas.",
        "`src/zcp/server.py::_select_tools(...)` filters by profile, groups, excludeGroups, and stages before returning the list.",
        "Branch factor falls before planning begins.",
      ],
      [
        "Call discipline",
        "`ToolManager.call_tool(...)` checks only that the name exists and then runs it.",
        "`src/zcp/server.py::_tool_is_exposed(...)` plus `enforce_tool_visibility_on_call` keeps calls inside the active subset.",
        "Filtered discovery does not widen back into a broad execution surface.",
      ],
      [
        "Result shape",
        "`src/mcp/server/mcpserver/server.py::_handle_call_tool()` wraps outputs into `CallToolResult(content, structured_content)` and keeps those payloads prompt-visible.",
        "`src/zcp/canonical_runtime.py::_build_result()` chooses `scalar` or `handle + summary` via `HandleStore`.",
        "Later turns replay less payload.",
      ],
      [
        "Native model grammar",
        "The public contract is schema-bearing JSON objects and content blocks.",
        "`src/zcp/profiles/native.py::format_registry()` emits compact `TOOL @id alias(param:type) -> output_mode` lines.",
        "Native planners can operate over compact signatures instead of full JSON Schema trees.",
      ],
      [
        "Long-running state",
        "Tasks exist, but the generic tool surface still naturally gravitates toward prompt-visible `CallToolResult` loops.",
        "`TaskManager`, `TaskExecutionContext`, progress notifications, and handle refs keep state durable and out of the prompt by default.",
        "Repair loops and polling loops become smaller and less repetitive.",
      ],
    ],
    codeSnippetsTitle: "8. Key Code Snippets",
    codeSnippetsIntro:
      "These snippets are the shortest path to the real argument. They compare the official MCP code path to the local ZCP code path without relying on the Excel benchmark implementation itself.",
    codeSnippets: [
      {
        title: "MCP tool registration is schema-first",
        path: "modelcontextprotocol/python-sdk/src/mcp/server/mcpserver/tools/base.py",
        caption:
          "The official MCP server path converts Python function metadata into a Pydantic model and immediately serializes it to JSON Schema. That schema becomes the tool contract.",
        language: "python",
        code: MCP_TOOL_SCHEMA_SNIPPET,
      },
      {
        title: "MCP returns prompt-visible content objects",
        path: "modelcontextprotocol/python-sdk/src/mcp/server/mcpserver/server.py",
        caption:
          "The default call path converts results into `CallToolResult(content, structured_content)`. This is correct for compatibility, but it keeps large results close to the prompt loop.",
        language: "python",
        code: MCP_RESULT_SNIPPET,
      },
      {
        title: "ZCP canonical contract carries runtime state explicitly",
        path: "zero-context-protocol-python/src/zcp/canonical_protocol.py",
        caption:
          "ZCP does not make schema disappear. It makes schema one field inside a richer runtime contract that also tracks subsets, handles, defaults, and output modes.",
        language: "python",
        code: ZCP_CANONICAL_SNIPPET,
      },
      {
        title: "ZCP narrows discovery before the first turn",
        path: "zero-context-protocol-python/src/zcp/server.py",
        caption:
          "Profile and stage filtering are runtime rules, not prompt conventions. The subset is enforced before the model plans.",
        language: "python",
        code: ZCP_PROFILE_FILTER_SNIPPET,
      },
      {
        title: "ZCP keeps JSON Schema at the adapter boundary",
        path: "zero-context-protocol-python/src/zcp/adapters/openai.py",
        caption:
          "Strict JSON Schema is still available, but it is compiled from the current `RegistryView`, not treated as the permanent native planning surface.",
        language: "python",
        code: ZCP_SCHEMA_BOUNDARY_SNIPPET,
      },
      {
        title: "ZCP can present a compact native registry grammar",
        path: "zero-context-protocol-python/src/zcp/profiles/native.py",
        caption:
          "The native profile compresses each tool to `id + alias + compact param types + output mode`. This is the clearest expression of schema de-centering.",
        language: "python",
        code: ZCP_NATIVE_PROFILE_SNIPPET,
      },
      {
        title: "ZCP compacts results into scalar or handle",
        path: "zero-context-protocol-python/src/zcp/canonical_runtime.py",
        caption:
          "This is the second major token-saving mechanism after filtered discovery. Big results stop re-entering every subsequent turn.",
        language: "python",
        code: ZCP_RESULT_SNIPPET,
      },
    ],
    principleHeaders: ["Token cost source", "MCP default shape", "ZCP countermeasure", "Why it matters"],
    principleRows: [
      [
        "Repeated tool-schema exposure",
        "A broad `tools/list` returns full JSON Schema-bearing tool definitions.",
        "Native discovery can return only the active profile/stage subset.",
        "Fewer visible schemas means fewer prompt tokens and less planning entropy.",
      ],
      [
        "Schema as the planning surface",
        "JSON Schema stays central from registration through transport.",
        "JSON Schema is compiled only at the adapter edge from a selected registry view.",
        "The runtime stops forcing the model to reason over the whole schema object graph.",
      ],
      [
        "Large result replay",
        "Tool results commonly re-enter the next turn as content or structured content.",
        "Large values become handles plus short summaries.",
        "The next turn carries references instead of full artifacts.",
      ],
      [
        "Prompt-visible background state",
        "Intermediate state tends to leak back into tool loops and explanations.",
        "Tasks, handles, progress, and session state live in the runtime.",
        "Long-running workflows stay smaller and more stable.",
      ],
      [
        "Discovery / execution mismatch",
        "A model may list one surface and still wander to any registered tool.",
        "Call visibility is checked against the active exposure policy.",
        "The action space remains narrow after the first decision.",
      ],
    ],
    overallHeaders: ["Path", "Answer", "Workbook", "Tool", "Avg total tokens", "Avg turns"],
    overallRows: [
      ["`zcp_client_to_native_zcp`", "100.0%", "97.3%", "100.0%", "8027.9", "2.8"],
      ["`mcp_client_to_zcp_mcp_surface`", "97.3%", "91.9%", "73.0%", "30723.7", "4.1"],
    ],
    tierHeaders: ["Tier", "What changed structurally", "Native ZCP", "MCP surface", "Advantage"],
    tierRows: [
      ["A", "Little room for planning policy to help", "15979.4", "17613.2", "1.10x"],
      ["B", "Short chains collapse into semantic chain tools", "1826.6", "29239.4", "16.01x"],
      ["C", "Workflow tools remove long primitive plans", "2091.1", "72113.9", "34.49x"],
      ["D", "Autonomous planning gets the smallest search space", "2018.3", "19375.7", "9.60x"],
    ],
    tierInsightsTitle: "9. Why The Tier Results Look Like This",
    tierInsights: [
      {
        tier: "Tier A",
        title: "Small gain is expected",
        body: "One-shot tool calls do not contain much planning waste. They are useful as a sanity check, but they should not be the headline for a runtime-efficiency claim.",
      },
      {
        tier: "Tier B",
        title: "Semantic chains begin to matter",
        body: "The first large jump appears when the model would otherwise need to plan across several tightly coupled primitive calls. Narrower discovery plus semantic chain tools reduce internal branching sharply.",
      },
      {
        tier: "Tier C",
        title: "Workflow compression dominates",
        body: "This tier proves the gain is not mostly wire-format trivia. The model is no longer planning every low-level mutation, so the savings become structural rather than incremental.",
      },
      {
        tier: "Tier D",
        title: "Autonomous planning is the real stress test",
        body: "Tier D is where broad surfaces typically explode into repair loops, repeated reads, and status churn. ZCP wins because the runtime constrains the search space and keeps state outside the prompt before those loops expand.",
      },
    ],
    limitsTitle: "10. Limits And Scope",
    limits: [
      "The `3.83x` headline is a published result on the current Excel workflow benchmark, not a universal theorem for every domain or model.",
      "ZCP's largest gains depend on using the native runtime features that make schemas peripheral rather than central: profile-based discovery, handles, tasks, and semantic tools.",
      "This report argues that ZCP has a stronger architectural position for model execution. It does not argue that MCP becomes useless for ecosystem interoperability.",
      "The fairest formulation is therefore: MCP remains the compatibility contract; ZCP becomes the more efficient execution contract.",
    ],
    conclusionTitle: "11. Conclusion",
    conclusion: [
      "ZCP is stronger than MCP on planning-heavy workloads because it changes the model-facing execution contract, not because it changed the transport or rewrote the backend business logic.",
      "The official MCP code path is schema-first and compatibility-first. The ZCP code path is canonical-runtime-first: schemas remain available, but they are compiled at the edge, while the native runtime is organized around subsets, handles, output modes, and task state.",
      "That design directly explains the benchmark. Fewer tools are visible, less schema text is repeated, large payloads stop replaying into later turns, and long-running state stops leaking back into prompt-visible loops. The result is lower token use and lower planning entropy for the same backend logic.",
    ],
    figureArchitectureTitle: "Figure 1. Boundary Protocol Versus Native Runtime",
    figureArchitectureCaption:
      "The architecture is intentionally split. MCP remains the outer compatibility contract; ZCP changes the native execution contract inside the same backend.",
    figureExecutionTitle: "Figure 2. Where The Token Savings Come From",
    figureExecutionCaption:
      "The token gain is causal: smaller registry subset, tighter calling discipline, compact result propagation, and runtime-held state.",
    figureLabels: {
      clients: "clients and hosts",
      surfaces: "model-facing surface",
      runtime: "runtime core",
      policy: "canonical registry + handle store + task state",
      clientMcp: "MCP hosts / MCP clients",
      clientZcp: "Native ZCP clients",
      host: "shared business logic, tools, resources, prompts",
      mcpSurface: "MCP schema-first surface",
      nativeSurface: "ZCP canonical surface",
      toolListAll: "full tool list + full JSON Schema",
      semanticSubset: "profile-filtered subset + compact contract",
      genericPlanning: "broad planning over many branches",
      stagedPlanning: "planning inside a constrained subset",
      verboseResults: "content / structured_content replay into later turns",
      compactResults: "scalar inline, large values behind handles and task state",
      feedbackLoop: "smaller next-turn context and fewer repair loops",
    },
    readNext: [
      { href: "/docs/semantic-workflow-profile", label: "Semantic Workflow Profile" },
      { href: "/docs/benchmark-methodology", label: "Benchmark Methodology" },
      { href: "/docs/capability-matrix", label: "Capability Matrix" },
    ],
  },
  zh: {
    navLabel: "技术报告",
    nav: [
      { href: "/architecture#abstract", label: "摘要" },
      { href: "/architecture#problem", label: "问题定义" },
      { href: "/architecture#token-economy", label: "Token 原理" },
      { href: "/architecture#json-schema", label: "JSON Schema" },
      { href: "/architecture#mechanism", label: "机制链条" },
      { href: "/architecture#code-comparison", label: "代码对照" },
      { href: "/architecture#code-snippets", label: "关键代码" },
      { href: "/architecture#benchmarks", label: "基准结果" },
      { href: "/architecture#conclusion", label: "结论" },
    ],
    title: "为什么 ZCP 比 MCP 更强",
    subtitle:
      "一份基于代码实现的技术报告：它解释 ZCP 为什么更省 token、canonical runtime 是如何组织上下文的、为什么 JSON Schema 在原生路径里被去中心化，以及这些设计如何体现在代码和 benchmark 上。",
    abstractTitle: "摘要",
    abstract: [
      "这份报告要论证的不是泛泛的“ZCP 更先进”，而是一个更窄也更硬的命题：在模型主导、多轮、规划密集的工作负载下，ZCP 通过改变模型看到的执行合同，系统性地降低了 token 消耗和规划熵。",
      "官方 MCP Python SDK 的默认路径是 schema-first 的：Python 函数先变成 Pydantic 模型，再变成 JSON Schema，`tools/list` 返回带完整 schema 的工具集合，`CallToolResult` 则把 `content` 和可选的 `structured_content` 继续暴露给调用方。这对互操作是合理的。",
      "ZCP 的关键变化不是删掉 schema，而是让 schema 退出原生 runtime 的中心位置。原生 runtime 的核心对象变成 `ToolDefinition`、`SessionState`、`HandleRef`、`TaskExecutionContext`。JSON Schema 仍然保留，但只在校验和 provider adapter 边界上编译和使用。",
      "因此，`8027.9` 对 `30723.7` 这个公开 benchmark 结果，并不是文案产物。它来自更小的工具可见集、更少的 schema 重复、更少的大结果重放，以及更少进入 prompt 的中间状态。",
    ],
    metrics: [
      {
        label: "核心命题",
        value: "token 成本本质上是 runtime 问题",
        note: "MCP 很擅长解决兼容边界；ZCP 优化的是这个边界之下的模型执行合同。",
      },
      {
        label: "公开结果",
        value: "3.83x",
        note: "`full_semantic_compare_v5` 中，native ZCP 对 MCP surface 的总体 token 优势。",
      },
      {
        label: "最关键变化",
        value: "JSON Schema 退到边界层",
        note: "ZCP 保留 schema 校验，但不再让完整 JSON Schema 成为原生规划 surface 的中心。",
      },
    ],
    sections: [
      {
        id: "problem",
        title: "1. 问题定义",
        paragraphs: [
          "MCP 的目标是互操作协议。它要解决的是 host 和 client 之间如何共享地描述 tools、resources、prompts 和 transport。官方 Python SDK 的代码也完全围绕这个目标展开：函数签名变成 schema，schema 变成工具合同。",
          "但模型执行成本不发生在“协议名字”这一层，而发生在模型每一轮到底要面对多少工具、多少 schema 文本、多少结果回放、多少中间状态。如果这些东西都持续暴露在 prompt 周围，模型就会持续为它们付 token。",
          "因此，公平的比较方式不是问“二者能不能都表达 tool 调用”，而是问“模型每一轮到底需要对什么做规划”。只要问题换成这个角度，ZCP 的优势就不再抽象。",
        ],
      },
      {
        id: "token-economy",
        title: "2. 为什么 ZCP 更省 Token",
        paragraphs: [
          "token 开销主要来自四类来源：第一，模型看到的工具太多；第二，每个工具附带的 schema 文本太大；第三，大结果不断回到后续 prompt；第四，后台或长任务状态没有被 runtime 保存，只能靠模型通过多轮调用和说明不断重建。",
          "MCP 默认路径会自然放大这四项成本。`Tool.from_function(...)` 在注册阶段就生成 `model_json_schema(...)`，`list_tools()` 默认返回全部工具及其 `input_schema / output_schema`，而 `_handle_call_tool()` 再把结果包装回 `CallToolResult(content, structured_content)`。",
          "ZCP 的做法不是写更短的文案，而是把策略下沉进 runtime：发现阶段先缩小工具集；结果阶段优先内联 scalar，大对象转成 `handle + summary`；长工作流则由 `TaskManager` 保持状态。token 因此下降，不需要靠口头解释。",
        ],
        bullets: [
          "可见工具更少，规划分支更少。",
          "schema 只对当前子集编译，重复文本更少。",
          "大结果不再每轮原样重放。",
          "中间状态和进度进入 runtime，而不是进入 prompt。",
        ],
      },
      {
        id: "architecture",
        title: "3. Canonical Runtime 与上下文合同",
        paragraphs: [
          "ZCP 的决定性变化是架构性的：MCP-compatible surface 不是原生 runtime 本身。原生 runtime 的核心定义在 `src/zcp/canonical_protocol.py`，围绕的是 `ToolDefinition`、`SessionState`、`CallRequest`、`CallResult`、`HandleRef` 这些对象。",
          "这些对象保存了 schema-first 设计里不居中的信息：`output_mode`、`handle_kind`、`defaults`、`flags`、当前 `tool_subset`、`registry_hash`、已存在的 handles 等等。这些字段决定了模型后续每一轮到底看到多少东西。",
          "因为 runtime 先是 canonical 的，所以它可以向外投影成两条路径：`/mcp` 保持生态兼容，`/zcp` 改变模型看到的 discovery、calling、result 和 task state。兼容和优化因此可以同时成立，而不是二选一。",
        ],
      },
      {
        id: "json-schema",
        title: "4. 为什么 ZCP 要让 JSON Schema 退出中心位置",
        paragraphs: [
          "这里必须说清楚：ZCP 不是彻底抛弃 JSON Schema。它仍然需要 schema 来做参数校验，也仍然可以为 OpenAI 之类的 provider 编译 strict schema。真正被放弃的，是“让完整 JSON Schema 充当原生 runtime 的核心执行合同”这一做法。",
          "在 MCP 中，schema 生成是上游且中心化的：`func_metadata(...)` 先构建 Pydantic 模型，`model_json_schema()` 生成 schema，`list_tools()` 再把这些 schema 直接作为对外工具定义返回。也就是说，同一个 schema 对象同时承担了注册元数据、transport 负载和模型可见描述三重角色。",
          "在 ZCP 中，schema 只是 canonical contract 里的一个字段。`ToolDefinition` 依然有 `input_schema`，但原生 runtime 可以围绕工具 id、子集、handles、output mode、task state 组织执行。`OpenAIStrictSchemaCompiler` 只在 adapter 边界上，把当前选中的 `RegistryView` 编译成 provider 需要的 strict function tools。",
          "这就是“去中心化 JSON Schema”的精确定义：schema 保留，但它不再主导原生规划 surface，也不再默认决定模型每一轮要吞下多少文本。",
        ],
      },
      {
        id: "reading",
        title: "5. 图表应该怎么读",
        paragraphs: [
          "图 1 是架构边界图。它说明兼容层和优化层分别放在哪里。重点不是 ZCP 另起了一套业务逻辑，而是同一套 backend 在边界层上继续兼容，在原生层上收紧模型面对的执行合同。",
          "图 2 是 token 因果图。它解释 token 是如何在 MCP-compatible 路径上被制造出来的：全量工具和全量 schema、宽规划、结果重放；以及在 native ZCP 路径上被削减的：子集发现、分阶段规划、scalar/handle、runtime 持久状态。",
          "表 1 不是 benchmark 表，而是 token 成本来源映射表。表 2 则是 MCP 代码与 ZCP 代码的逐项对照。表 3 和表 4 才是实证表，分别给出总体 benchmark 和 Tier 拆解。这样读，结构才不会散。",
        ],
      },
    ],
    mechanismTitle: "6. 因果机制链条",
    mechanismIntro:
      "benchmark 数字只有放回这条机制链中才有解释力。每一个步骤都对应一类 prompt-visible 浪费的消除。",
    mechanismSteps: [
      {
        title: "步骤 1：发现阶段先缩小搜索空间",
        body: "MCP 风格的服务通常先返回一整套平铺工具。ZCP 则允许原生 client 使用 `profile=\"semantic-workflow\"`，并继续按 `groups / stages` 过滤，让模型在第一轮之前就进入更小的候选集。",
      },
      {
        title: "步骤 2：调用阶段继续执行同一策略",
        body: "如果 `tools/list` 收窄了，但 `tools/call` 仍然能调用任何工具，那么收窄没有意义。ZCP 用 `enforce_tool_visibility_on_call` 保证 discovery surface 和 call surface 是一致的。",
      },
      {
        title: "步骤 3：schema 编译被延迟且被限域",
        body: "MCP 在注册时就生成 schema，并让它天然贯穿 transport。ZCP 则只在 adapter 需要时，从当前 `RegistryView` 编译 strict schema。模型不必默认面对整个 registry 的 schema 树。",
      },
      {
        title: "步骤 4：结果通过 scalar 或 handle 被压缩",
        body: "canonical runtime 会检查 `output_mode`、值类型和大小。小值直接作为 `scalar` 返回，大值进入 `HandleStore`，只返回 `handle + summary`。下一轮上下文因此显著缩小。",
      },
      {
        title: "步骤 5：长任务状态离开 prompt 回合",
        body: "tasks、handles、progress 和 session state 都由 runtime 保存。模型不需要再通过多轮读写和自然语言说明去重建一个已经存在的中间执行状态。",
      },
      {
        title: "步骤 6：语义工具压缩 primitive 计划",
        body: "一旦服务端提供 workflow-level 工具，模型就不必在最低原语粒度上规划。Tier B、C、D 的优势，本质上都来自这个压缩过程，而不是某种 wire format 小技巧。",
      },
    ],
    codeComparisonTitle: "7. 代码级对照",
    codeComparisonCaption:
      "这里对比的是官方 MCP Python SDK 与本地 ZCP runtime 的实现策略，不是 Excel benchmark 本身。真正的问题是：状态、schema 和策略分别被放在了哪里。",
    codeComparisonHeaders: ["关注点", "MCP 实现", "ZCP 实现", "token 后果"],
    codeComparisonRows: [
      [
        "核心合同对象",
        "`src/mcp/types/_types.py::Tool` 把公共合同中心放在 `input_schema`、`output_schema` 和 `CallToolResult(content, structured_content)` 上。",
        "`src/zcp/canonical_protocol.py::ToolDefinition` 与 `SessionState` 则把 runtime 组织到工具 id、子集哈希、output mode、handles、defaults、flags 和 metadata 上。",
        "更多状态由 runtime 保存，而不是让模型每轮重新推断。",
      ],
      [
        "Schema 生成",
        "`src/mcp/server/mcpserver/tools/base.py::Tool.from_function` 在注册时就调用 `arg_model.model_json_schema(by_alias=True)`。",
        "`src/zcp/adapters/openai.py::compile_openai_tools` 只对选中的 `RegistryView` 编译 strict schema，而且只在 adapter 需要时才编译。",
        "原生路径不会默认把整套 schema-bearing registry 暴露给模型。",
      ],
      [
        "发现逻辑",
        "`ToolManager.list_tools()` 返回全部工具；`server.py::list_tools()` 序列化所有带 schema 的工具定义。",
        "`src/zcp/server.py::_select_tools(...)` 在 discovery 前就按 profile、groups、stages 切子集。",
        "第一次规划前的分支因子就下降。",
      ],
      [
        "调用纪律",
        "`ToolManager.call_tool(...)` 只检查名字是否存在，然后执行。",
        "`src/zcp/server.py::_tool_is_exposed(...)` 配合 `enforce_tool_visibility_on_call`，只允许调用当前暴露子集中的工具。",
        "discovery 的收窄不会在调用时失效。",
      ],
      [
        "结果形态",
        "`src/mcp/server/mcpserver/server.py::_handle_call_tool()` 把结果包装回 `CallToolResult(content, structured_content)`。",
        "`src/zcp/canonical_runtime.py::_build_result()` 在 `scalar` 和 `handle + summary` 之间自动选择。",
        "大结果不再把后续每一轮 prompt 撑大。",
      ],
      [
        "原生模型语法",
        "工具合同主要体现为带完整 schema 的 JSON 对象和 content blocks。",
        "`src/zcp/profiles/native.py::format_registry()` 可把工具压缩成 `TOOL @id alias(param:type) -> output_mode` 这种紧凑语法。",
        "原生 planner 可以围绕紧凑签名工作，而不是围绕完整 schema 树工作。",
      ],
      [
        "长任务状态",
        "任务能力存在，但通用 surface 仍容易自然滑向 prompt-visible 的 `CallToolResult` 循环。",
        "`TaskManager`、`TaskExecutionContext`、progress 通知和 handles 让状态成为 runtime 一等公民。",
        "轮询和 repair loop 变小，尤其利好 Tier D。",
      ],
    ],
    codeSnippetsTitle: "8. 关键代码片段",
    codeSnippetsIntro:
      "下面这些片段直接来自官方 MCP Python SDK 和本地 ZCP 实现。它们比任何概念性描述都更能说明为什么 ZCP 的原生路径会更省 token。",
    codeSnippets: [
      {
        title: "MCP 的工具注册以 schema 为中心",
        path: "modelcontextprotocol/python-sdk/src/mcp/server/mcpserver/tools/base.py",
        caption:
          "官方 MCP server 路径会先把函数元数据变成 Pydantic 模型，再变成 JSON Schema，这个 schema 之后自然成为工具合同的一部分。",
        language: "python",
        code: MCP_TOOL_SCHEMA_SNIPPET,
      },
      {
        title: "MCP 的结果默认继续 prompt-visible",
        path: "modelcontextprotocol/python-sdk/src/mcp/server/mcpserver/server.py",
        caption:
          "默认调用路径把结果包装进 `CallToolResult(content, structured_content)`。这对兼容很自然，但也意味着大结果更容易继续进入后续 prompt。",
        language: "python",
        code: MCP_RESULT_SNIPPET,
      },
      {
        title: "ZCP 的 canonical contract 显式携带 runtime 状态",
        path: "zero-context-protocol-python/src/zcp/canonical_protocol.py",
        caption:
          "ZCP 没有让 schema 消失，而是让 schema 变成更大 runtime contract 里的一个字段。真正居中的，是子集、handles、output mode 和 session state。",
        language: "python",
        code: ZCP_CANONICAL_SNIPPET,
      },
      {
        title: "ZCP 在 discovery 层先裁掉无关工具",
        path: "zero-context-protocol-python/src/zcp/server.py",
        caption:
          "profile 和 stage 过滤是 runtime 规则，不是 prompt 工程；模型在第一轮之前就被限制在更小搜索空间里。",
        language: "python",
        code: ZCP_PROFILE_FILTER_SNIPPET,
      },
      {
        title: "ZCP 只在 adapter 边界编译 strict schema",
        path: "zero-context-protocol-python/src/zcp/adapters/openai.py",
        caption:
          "strict JSON Schema 仍然保留，但它是从当前 `RegistryView` 现编出来的 provider artifact，而不是 runtime 的中心对象。",
        language: "python",
        code: ZCP_SCHEMA_BOUNDARY_SNIPPET,
      },
      {
        title: "ZCP 的原生工具注册表可以非常紧凑",
        path: "zero-context-protocol-python/src/zcp/profiles/native.py",
        caption:
          "这段代码最直接地体现了“去中心化 JSON Schema”：原生 planner 只需要工具 id、别名、紧凑类型和 output mode。",
        language: "python",
        code: ZCP_NATIVE_PROFILE_SNIPPET,
      },
      {
        title: "ZCP 用 scalar 或 handle 压缩结果",
        path: "zero-context-protocol-python/src/zcp/canonical_runtime.py",
        caption:
          "这是 discovery 之后第二重要的 token 节约机制。大对象不再每轮原样回到 prompt，而是通过 handle 延迟展开。",
        language: "python",
        code: ZCP_RESULT_SNIPPET,
      },
    ],
    principleHeaders: ["token 成本来源", "MCP 默认形态", "ZCP 对应机制", "为什么会影响模型"],
    principleRows: [
      [
        "重复的工具 schema 暴露",
        "宽泛 `tools/list` 会返回完整 schema-bearing tool definitions。",
        "native discovery 只返回当前 profile / stage 的工具子集。",
        "可见 schema 更少，prompt token 和规划熵都更低。",
      ],
      [
        "schema 直接充当规划 surface",
        "JSON Schema 从注册到 transport 一直处于中心位置。",
        "JSON Schema 只在 adapter 边界上，从选中的 registry view 里编译。",
        "runtime 不再迫使模型围绕整棵 schema 树去规划。",
      ],
      [
        "大结果反复回放",
        "tool 结果容易作为 content 或 structured_content 进入后续回合。",
        "大值转为 handle，小值转为 scalar。",
        "下一轮携带的是引用和摘要，而不是完整工件。",
      ],
      [
        "后台状态 prompt-visible",
        "中间状态容易泄漏回 tool loop 和说明文本。",
        "tasks、handles、progress、session state 由 runtime 保存。",
        "长工作流更稳定，轮询更少。",
      ],
      [
        "发现和执行不一致",
        "模型列出了某个 surface，但执行时仍可能乱跳到整个 registry。",
        "调用也受当前可见性策略约束。",
        "第一轮收窄的动作空间不会在执行时重新膨胀。",
      ],
    ],
    overallHeaders: ["路径", "Answer", "Workbook", "Tool", "平均总 token", "平均轮次"],
    overallRows: [
      ["`zcp_client_to_native_zcp`", "100.0%", "97.3%", "100.0%", "8027.9", "2.8"],
      ["`mcp_client_to_zcp_mcp_surface`", "97.3%", "91.9%", "73.0%", "30723.7", "4.1"],
    ],
    tierHeaders: ["Tier", "结构上发生了什么", "Native ZCP", "MCP Surface", "优势倍数"],
    tierRows: [
      ["A", "几乎没有多少规划浪费可以消除", "15979.4", "17613.2", "1.10x"],
      ["B", "短链路被 semantic chain tools 压缩", "1826.6", "29239.4", "16.01x"],
      ["C", "workflow tools 移除了长 primitive 计划", "2091.1", "72113.9", "34.49x"],
      ["D", "自主规划获得了最小搜索空间", "2018.3", "19375.7", "9.60x"],
    ],
    tierInsightsTitle: "9. 为什么 Tier 结果会长这样",
    tierInsights: [
      {
        tier: "Tier A",
        title: "小优势是预期内的",
        body: "单次工具调用本来就没有多少规划浪费可以削掉，所以这个 tier 只能证明 ZCP 没有退化，不应该承担 headline。",
      },
      {
        tier: "Tier B",
        title: "语义链路开始起作用",
        body: "当模型本来需要在多个强耦合 primitive 调用之间规划时，semantic chain tools 和 discovery 收窄会立刻降低内部决策点数量。",
      },
      {
        tier: "Tier C",
        title: "workflow 压缩开始主导结果",
        body: "这说明优势不是 wire format 的小修小补，而是模型不再被迫规划每一个底层单步操作，token 下降因此是结构性的。",
      },
      {
        tier: "Tier D",
        title: "自主规划才是真压力测试",
        body: "Tier D 最容易出现 repair loop、重复 readback 和状态噪声。native ZCP 能赢，是因为 runtime 在这些噪声进入 prompt 之前就先把它们压住了。",
      },
    ],
    limitsTitle: "10. 边界与限制",
    limits: [
      "`3.83x` 是当前公开 Excel workflow benchmark 上的结果，不是所有领域、所有模型上的数学定理。",
      "ZCP 的最大收益依赖它真的启用了原生 runtime 特性：profile-based discovery、handles、tasks 和 semantic tools。",
      "这份报告要表达的是：ZCP 在模型执行效率上具有更强的架构位置，而不是说 MCP 在生态互操作层已经没有价值。",
      "最准确的表述仍然是：MCP 继续承担兼容合同，ZCP 则承担更高效的执行合同。",
    ],
    conclusionTitle: "11. 结论",
    conclusion: [
      "ZCP 比 MCP 更强，不是因为它改了 transport，也不是因为它把业务逻辑重写了一遍，而是因为它改变了模型真正面对的执行合同。",
      "官方 MCP 代码路径是 schema-first、compatibility-first 的；ZCP 代码路径则是 canonical-runtime-first 的：schema 仍然保留，但它退到 adapter 边界，原生 runtime 则围绕工具子集、handles、output mode 和 task state 来组织。",
      "这套设计会直接产生 benchmark：工具更少可见、schema 更少重复、大 payload 不再不断重放、中间状态不再泄漏进 prompt。因此，对于规划密集和多轮工作负载，ZCP 的 token 成本和规划熵都会更低。",
    ],
    figureArchitectureTitle: "图 1. 边界协议与原生 Runtime 的分离",
    figureArchitectureCaption:
      "这里强调的是分层：MCP 继续是外层兼容合同，ZCP 改变的是内部原生执行合同，而不是重写业务逻辑。",
    figureExecutionTitle: "图 2. token 节省到底从哪里来",
    figureExecutionCaption:
      "token 优势是一条因果链：更小的 registry subset、更严格的调用纪律、更紧凑的结果传播，以及由 runtime 持有的状态。",
    figureLabels: {
      clients: "客户端与宿主",
      surfaces: "模型可见 surface",
      runtime: "runtime 核心",
      policy: "canonical registry + handle store + task state",
      clientMcp: "MCP hosts / MCP clients",
      clientZcp: "Native ZCP clients",
      host: "共享的业务逻辑、tools、resources、prompts",
      mcpSurface: "MCP schema-first surface",
      nativeSurface: "ZCP canonical surface",
      toolListAll: "全量工具 + 全量 JSON Schema",
      semanticSubset: "按 profile 过滤的子集 + 紧凑合同",
      genericPlanning: "在宽分支空间里做通用规划",
      stagedPlanning: "在受约束子集里做规划",
      verboseResults: "content / structured_content 持续回到后续 prompt",
      compactResults: "小值 inline，大值走 handle 和 task state",
      feedbackLoop: "下一轮上下文更小，repair loop 更少",
    },
    readNext: [
      { href: "/docs/semantic-workflow-profile", label: "语义工作流 Profile" },
      { href: "/docs/benchmark-methodology", label: "基准方法论" },
      { href: "/docs/capability-matrix", label: "能力矩阵" },
    ],
  },
};

export function getTechnicalReportCopy(locale: Locale): ReportCopy {
  return REPORT_COPY[locale];
}
