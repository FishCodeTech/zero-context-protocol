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

const MCP_SNIPPET = `from mcp.server.fastmcp import FastMCP

mcp = FastMCP("excel-mcp")

@mcp.tool(...)
def format_range(...):
    ...

@mcp.tool(...)
def read_data_from_excel(...):
    ...

@mcp.tool(...)
def insert_columns(...):
    ...
`;

const ZCP_PROFILE_SNIPPET = `app = FastZCP(
    "excel-zcp",
    default_tool_profile="semantic-workflow",
)

app.tool(
    name=func.__name__,
    metadata=_tool_metadata(func.__name__),
)(func)

def _tool_metadata(tool_name):
    return {
        "groups": ["workflow", "tier_c", "layout"],
        "stages": ["workflow", "polish"],
    }
`;

const ZCP_FILTER_SNIPPET = `def _select_tools(app, params):
    tools = app.tool_registry.subset().tools
    profile = _effective_tool_profile(app, params)

    if profile == app.semantic_workflow_profile:
        workflow_tools = [
            tool for tool in tools
            if app.semantic_group in _tool_groups(tool)
        ]
        if workflow_tools:
            tools = workflow_tools

    if stages:
        tools = [
            tool for tool in tools
            if _tool_stages(tool) & stages
        ]
    return tools
`;

const ZCP_RESULT_SNIPPET = `if tool.output_mode == "scalar" and (
    tool.inline_ok or is_scalar_value(value)
):
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
)
return CallResult(
    cid=request.cid,
    status="ok",
    handle=handle,
    summary=handle.summary,
    meta=meta,
)
`;

const ZCP_TASK_SNIPPET = `if method == "tools/call":
    task_meta = params.get("task")
    if task_meta is not None:
        task = await self.app.task_manager.create(
            f"tool:{tool.alias}",
            params.get("arguments", {}),
            handler=self._build_tool_task_handler(tool, request_context),
            on_update=self._notify_task_status,
        )
        return {"task": _task_to_dict(task)}
`;

const REPORT_COPY: Record<Locale, ReportCopy> = {
  en: {
    navLabel: "Technical report",
    nav: [
      { href: "/architecture#abstract", label: "Abstract" },
      { href: "/architecture#problem", label: "Problem" },
      { href: "/architecture#mechanism", label: "Mechanism" },
      { href: "/architecture#code-comparison", label: "Code comparison" },
      { href: "/architecture#code-snippets", label: "Key snippets" },
      { href: "/architecture#benchmarks", label: "Benchmarks" },
      { href: "/architecture#limits", label: "Limits" },
      { href: "/architecture#conclusion", label: "Conclusion" },
    ],
    title: "Why ZCP Outperforms MCP",
    subtitle:
      "A code-level technical report on why ZCP wins in planning-heavy workloads: not by changing the ecosystem boundary, but by changing the runtime contract the model actually sees.",
    abstractTitle: "Abstract",
    abstract: [
      "The current ZCP advantage is not explained well by slogans such as 'more native' or 'more efficient protocol'. The real mechanism is more specific: ZCP keeps MCP compatibility at the edge, then tightens the model-facing runtime inside the same backend.",
      "That tighter runtime changes four things at once: which tools are visible, when they become visible, how results are represented, and whether long-running work stays inside prompt-visible turns or is moved into task state.",
      "The published benchmark result, `8027.9` tokens for native ZCP versus `30723.7` on the MCP surface, is therefore not a marketing accident. It is the expected consequence of a smaller search space, less repeated schema exposure, fewer redundant tool loops, and more compact result propagation.",
    ],
    metrics: [
      { label: "Core thesis", value: "same backend, smaller search space", note: "ZCP wins by constraining the model-facing runtime, not by forking business logic." },
      { label: "Published result", value: "3.83x", note: "Overall token advantage in `full_semantic_compare_v5`." },
      { label: "Most important shift", value: "runtime policy", note: "Tool visibility, result compaction, and task state move from prompt convention into runtime rules." },
    ],
    sections: [
      {
        id: "problem",
        title: "1. Problem Statement",
        paragraphs: [
          "MCP is good at defining a boundary protocol. It gives hosts and clients a shared language for tools, resources, prompts, and transport. That solves interoperability, and that matters.",
          "But model execution cost is created one layer below that boundary. A model does not merely need a legal protocol. It needs a small action space, compact follow-up context, and execution semantics that do not force every long-running step back into the prompt.",
          "The central claim of this report is therefore narrower and more precise than 'ZCP is better than MCP'. The actual claim is: when the workload is model-led and multi-step, ZCP's runtime policy produces fewer prompt-visible branches than a flat MCP-style surface built from the same backend primitives.",
        ],
      },
      {
        id: "architecture",
        title: "2. Architectural Claim",
        paragraphs: [
          "ZCP does not replace MCP at the ecosystem boundary. It keeps an MCP-compatible surface and adds a native surface on top of the same runtime. This means the compatibility cost is paid only where compatibility is required.",
          "The native surface is allowed to be stricter. It can expose a semantic workflow profile by default, reject calls to tools that are outside the active exposure set, return compact scalar results when possible, and escalate work to tasks without pretending everything is a synchronous request-response.",
        ],
        bullets: [
          "One runtime core serves both `/mcp` and `/zcp`.",
          "The MCP surface preserves host/client interoperability.",
          "The native ZCP surface changes discovery, calling rules, and result propagation.",
          "The benchmark difference is therefore architectural, not cosmetic.",
        ],
      },
      {
        id: "compatibility",
        title: "3. Fair Comparison Boundary",
        paragraphs: [
          "This page does not argue that MCP is badly designed. It argues that MCP solves a different problem. A flat tool surface is an acceptable default for interoperability. It is not an optimal default for model planning.",
          "The fair comparison is not 'Can MCP describe tools?' It obviously can. The fair comparison is 'What does the model have to reason over at each turn?' Once that becomes the metric, the native ZCP path is deliberately narrower than the MCP path.",
        ],
      },
    ],
    mechanismTitle: "4. Causal Mechanism",
    mechanismIntro:
      "The ZCP advantage is a causal chain. Each link removes one source of token waste or planning drift. The benchmark only makes sense if this chain is true.",
    mechanismSteps: [
      {
        title: "Step 1. Discovery stops being flat",
        body: "On the MCP-style path, the model commonly receives a broad primitive tool set. On the native ZCP path, `profile=\"semantic-workflow\"` and tool metadata (`groups`, `stages`) reduce discovery to a much smaller set before the first tool call.",
      },
      {
        title: "Step 2. Calling rules enforce the same policy",
        body: "Filtering only helps if the model cannot escape it. ZCP enforces visibility on `tools/call`, so the call surface stays consistent with the discovery surface. That reduces off-profile tool wandering and repeated detours.",
      },
      {
        title: "Step 3. Result payloads stay compact",
        body: "The runtime can inline true scalars and turn larger structures into handles plus summaries. This changes the next turn: the model does not need the whole raw artifact unless it explicitly asks for expansion.",
      },
      {
        title: "Step 4. Long work moves out of prompt turns",
        body: "Task-augmented tool calls let progress, cancellation, and intermediate state live in the runtime instead of being recreated by repeated prompt-visible tool polling. That is especially important for Tier D style autonomous workflows.",
      },
      {
        title: "Step 5. Semantic workflow tools collapse primitive chains",
        body: "In the Excel benchmark, many high-tier gains come from replacing long primitive chains with workflow-level tools. That is not cheating; it is the point of a model-aware runtime. The same backend still exists, but the model is no longer forced to plan at the lowest possible granularity.",
      },
    ],
    codeComparisonTitle: "5. Code-Level Comparison",
    codeComparisonCaption:
      "The right way to read the code is not 'MCP bad, ZCP good'. The right way is to ask where each design puts its complexity budget, and what that means for the model's branch factor.",
    codeComparisonHeaders: ["Concern", "MCP-style code path", "ZCP code path", "Why ZCP wins"],
    codeComparisonRows: [
      [
        "Tool registration",
        "`excel_mcp/server.py`: registers many primitive tools individually with `@mcp.tool(...)`.",
        "`excel_mcp/zcp_server.py`: registers the same primitives plus semantic workflow tools and attaches metadata through `_tool_metadata(...)`.",
        "The native path can select semantic tools first, while the MCP path remains broad and primitive.",
      ],
      [
        "Discovery policy",
        "Flat `tools/list` semantics are acceptable for interoperability, but they do not express staged exposure.",
        "`zcp/server.py::_select_tools(...)` filters by `profile`, `groups`, `excludeGroups`, and `stages`.",
        "The model sees fewer schemas and fewer branches before planning starts.",
      ],
      [
        "Call discipline",
        "Flat tool surfaces usually trust the model not to drift into irrelevant tools after discovery.",
        "`zcp/server.py::_tool_is_exposed(...)` plus `enforce_tool_visibility_on_call` keeps calls inside the active exposure set.",
        "Discovery policy and call policy stay aligned, so branch factor does not silently widen again.",
      ],
      [
        "Result representation",
        "MCP-style tool code often returns text or structured objects directly, so the next model turn sees the whole payload.",
        "`zcp/canonical_runtime.py::_build_result(...)` chooses `scalar` when possible, otherwise stores a handle and returns a summary.",
        "Large artifacts stop inflating every subsequent turn.",
      ],
      [
        "Long-running work",
        "Generic tool calls tend to emulate background work through repeated prompt-visible polling or retries.",
        "`zcp/runtime.py::TaskManager` and `TaskExecutionContext` make task state explicit; `zcp/server.py` supports task-augmented `tools/call`.",
        "Progress and intermediate state move into runtime state instead of reappearing in prompt context.",
      ],
      [
        "Compatibility strategy",
        "A pure MCP server exposes only one public surface.",
        "`zcp/gateway.py` projects the same runtime back into MCP while native clients still use the smaller `/zcp` path.",
        "Teams keep ecosystem compatibility without forcing the native path to inherit the full MCP planning cost.",
      ],
    ],
    codeSnippetsTitle: "6. Key Code Snippets",
    codeSnippetsIntro:
      "These snippets are the shortest path to the real mechanism. The benchmark claims should be read together with these runtime decisions.",
    codeSnippets: [
      {
        title: "MCP-style primitive registration",
        path: "excel-mcp-server/src/excel_mcp/server.py",
        caption: "The primitive MCP surface is wide by default. That is not a bug; it is the expected shape of an interoperability-first server.",
        language: "python",
        code: MCP_SNIPPET,
      },
      {
        title: "ZCP semantic profile and tool metadata",
        path: "excel-mcp-server/src/excel_mcp/zcp_server.py",
        caption: "The native ZCP server opts into `semantic-workflow` and annotates tools with `groups` and `stages`. This is where the smaller discovery surface begins.",
        language: "python",
        code: ZCP_PROFILE_SNIPPET,
      },
      {
        title: "Visibility filtering in `tools/list`",
        path: "zero-context-protocol-python/src/zcp/server.py",
        caption: "Filtering is not a prompt trick. It is a runtime rule applied during discovery.",
        language: "python",
        code: ZCP_FILTER_SNIPPET,
      },
      {
        title: "Scalar-or-handle result compaction",
        path: "zero-context-protocol-python/src/zcp/canonical_runtime.py",
        caption: "This is one of the most important token-saving mechanisms. Small values stay inline; large values become handles plus summaries.",
        language: "python",
        code: ZCP_RESULT_SNIPPET,
      },
      {
        title: "Task-augmented tool invocation",
        path: "zero-context-protocol-python/src/zcp/server.py",
        caption: "Long-running work can leave the prompt loop and become a first-class task without changing the backend business logic.",
        language: "python",
        code: ZCP_TASK_SNIPPET,
      },
    ],
    principleHeaders: ["Layer", "MCP-compatible tendency", "ZCP-native mechanism", "Observed effect"],
    principleRows: [
      ["Search space", "Broad primitive enumeration", "Semantic workflow profile and stage filters", "Lower planning entropy before the first call."],
      ["Policy consistency", "Discovery and calling are often equally broad", "Call visibility matches discovery visibility", "Fewer irrelevant branch attempts and retries."],
      ["Context growth", "Results stay prompt-visible by default", "Scalar inline, larger artifacts through handles", "Next-turn context remains smaller."],
      ["Execution state", "Background work is easy to leak back into prompts", "Task state is held by the runtime", "Less prompt-visible churn in long workflows."],
    ],
    overallHeaders: ["Path", "Answer", "Workbook", "Tool", "Avg total tokens", "Avg turns"],
    overallRows: [
      ["`zcp_client_to_native_zcp`", "100.0%", "97.3%", "100.0%", "8027.9", "2.8"],
      ["`mcp_client_to_zcp_mcp_surface`", "97.3%", "91.9%", "73.0%", "30723.7", "4.1"],
    ],
    tierHeaders: ["Tier", "What changed structurally", "ZCP native", "MCP surface", "Advantage"],
    tierRows: [
      ["A", "Almost no room for planning policy", "15979.4", "17613.2", "1.10x"],
      ["B", "Short chains collapse into semantic chain tools", "1826.6", "29239.4", "16.01x"],
      ["C", "Workflow-level tools remove long primitive sequences", "2091.1", "72113.9", "34.49x"],
      ["D", "Autonomous planning benefits from the smallest search space", "2018.3", "19375.7", "9.60x"],
    ],
    tierInsightsTitle: "7. Why The Tier Results Look Like This",
    tierInsights: [
      {
        tier: "Tier A",
        title: "Small gain is expected",
        body: "A single-tool request has very little branch waste to remove. ZCP still wins slightly because discovery and result shape are tighter, but this tier should never carry the headline.",
      },
      {
        tier: "Tier B",
        title: "Chains are where semantic routing starts to matter",
        body: "Once the task needs several related primitive operations, the semantic chain tools sharply reduce the number of decision points the model must represent internally.",
      },
      {
        tier: "Tier C",
        title: "Workflow-level compression dominates",
        body: "This is the strongest proof that the architecture is doing real work. Complex workflows are not merely faster because of a smaller wire format; they are smaller because the model no longer plans every low-level mutation.",
      },
      {
        tier: "Tier D",
        title: "Autonomous planning is the fairest stress test",
        body: "Tier D is where planning drift, redundant reads, and repair loops usually explode. The native ZCP path wins because the runtime constrains those loops before they become prompt-visible chaos.",
      },
    ],
    limitsTitle: "8. Limits And Scope",
    limits: [
      "The headline `3.83x` is a published benchmark result, not a theorem about every domain or every model.",
      "Some of the largest gains are enabled by semantic workflow tools. That is a deliberate design choice, not a universal property of every possible ZCP server.",
      "This page compares an MCP-compatible broad surface against a native ZCP optimized surface. It does not claim that every MCP server must be broad, only that ZCP currently provides the narrowing policy as a first-class runtime feature.",
      "The strongest claim supported here is architectural: ZCP is better positioned to reduce model-visible planning cost because its runtime exposes policy where MCP-compatible surfaces usually stay generic.",
    ],
    conclusionTitle: "9. Conclusion",
    conclusion: [
      "The core reason ZCP outperforms MCP in these benchmarks is not transport overhead, and it is not branding. It is that ZCP moves model-efficiency policy into the runtime itself.",
      "That policy is visible in code: semantic tool metadata, profile-based discovery, visibility enforcement on call, scalar-or-handle result shaping, and task-aware execution. Each mechanism removes one category of prompt-visible waste.",
      "So the strongest accurate claim is this: MCP remains the right compatibility contract, while ZCP is the stronger execution contract for planning-heavy, model-led workflows.",
    ],
    figureArchitectureTitle: "Figure 1. One Runtime, Two Surfaces",
    figureArchitectureCaption:
      "The compatibility surface and the native surface share the same business runtime. The win comes from changing the model-facing contract, not from rewriting the application twice.",
    figureExecutionTitle: "Figure 2. Where Token Savings Actually Come From",
    figureExecutionCaption:
      "The native path wins because it shrinks the search space, keeps the policy enforced during calls, and prevents large results from reappearing in every follow-up turn.",
    figureLabels: {
      clients: "Clients and hosts",
      surfaces: "Protocol surfaces",
      runtime: "Runtime core",
      policy: "Runtime policy",
      clientMcp: "MCP hosts / clients",
      clientZcp: "Native ZCP clients",
      host: "Shared tools, resources, prompts, tasks",
      mcpSurface: "MCP-compatible surface",
      nativeSurface: "Native ZCP surface",
      toolListAll: "Broad primitive tool list",
      semanticSubset: "Semantic and staged subset",
      genericPlanning: "Generic planning over many branches",
      stagedPlanning: "Planning over a reduced action space",
      verboseResults: "Results stay large and prompt-visible",
      compactResults: "Scalars inline, larger payloads behind handles",
      feedbackLoop: "Smaller next-turn context and fewer repair loops",
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
      { href: "/architecture#mechanism", label: "核心机制" },
      { href: "/architecture#code-comparison", label: "代码对照" },
      { href: "/architecture#code-snippets", label: "关键代码" },
      { href: "/architecture#benchmarks", label: "基准解释" },
      { href: "/architecture#limits", label: "边界" },
      { href: "/architecture#conclusion", label: "结论" },
    ],
    title: "为什么 ZCP 比 MCP 更强",
    subtitle:
      "这不是一篇宣传文案，而是一份代码级技术报告：ZCP 赢在哪里、为什么会赢、以及这些优势分别落在了哪些运行时机制上。",
    abstractTitle: "摘要",
    abstract: [
      "现在这套结果不能用“原生协议更先进”这种空话来解释。真正的原因更具体：ZCP 在生态边界保留 MCP 兼容面，同时在同一套后端 runtime 内部，把模型真正面对的执行合同收紧了。",
      "这种收紧体现在四个层面：模型能看到哪些工具、这些工具何时变得可见、结果是如何表示的、以及长任务是否必须反复回到 prompt 中被重新描述。",
      "因此，公开 benchmark 里 native ZCP 的 `8027.9` token 对比 MCP surface 的 `30723.7` token，并不是偶然跑出来的一次好看结果，而是“小搜索空间 + 更少重复 schema + 更少冗余 tool loop + 更紧凑结果传播”的直接后果。",
    ],
    metrics: [
      { label: "核心论点", value: "同一后端，更小搜索空间", note: "ZCP 赢在 runtime policy，而不是另起一套业务逻辑。" },
      { label: "公开结果", value: "3.83x", note: "来自 `full_semantic_compare_v5` 的 overall token 优势。" },
      { label: "最关键变化", value: "把策略下沉到 runtime", note: "工具暴露、结果压缩、任务状态都不再只是 prompt 约定。" },
    ],
    sections: [
      {
        id: "problem",
        title: "1. 问题定义",
        paragraphs: [
          "MCP 的强项是生态边界协议。它为 host 和 client 提供了一套共享语言，用来描述 tools、resources、prompts 和 transport。这个目标它完成得很好。",
          "但模型执行成本并不主要发生在协议名字这一层，而是发生在它每一轮到底要面对多少可选动作、多少结果内容、多少临时状态。如果一个 surface 很宽，模型虽然能合法调用它，但规划开销会很高。",
          "所以这里真正要论证的不是“ZCP 全面替代 MCP”，而是：在模型主导、多轮、规划密集的工作负载下，ZCP 通过更严格的 runtime policy，实实在在地减少了模型每一轮要处理的分支数。",
        ],
      },
      {
        id: "architecture",
        title: "2. 架构主张",
        paragraphs: [
          "ZCP 不是在生态边界上另起一套 incompatible 协议，而是在同一个 runtime 上同时暴露 `/mcp` 和 `/zcp` 两套 surface。兼容要求高的地方继续走 MCP；追求模型执行效率的地方走原生 ZCP。",
          "这意味着原生路径可以更严格：默认暴露 `semantic-workflow` profile、只允许调用当前可见的工具、能把结果压缩成 scalar 或 handle+summary，并且让长任务变成真正的 task，而不是靠 prompt 去模拟后台执行。",
        ],
        bullets: [
          "同一套业务 runtime 同时服务兼容面和优化面。",
          "MCP surface 负责生态互操作。",
          "Native ZCP surface 负责模型执行效率。",
          "所以 benchmark 差异来自架构，不是文案包装。",
        ],
      },
      {
        id: "compatibility",
        title: "3. 公平比较边界",
        paragraphs: [
          "这份报告并不是在说 MCP 设计得差。它要解决的问题和 ZCP 的优化目标本来就不同。平铺的工具 surface 对互操作是合理默认值，但对模型规划并不是最优默认值。",
          "因此，公平的比较方式不是问“它们能不能都表达 tool 调用”，而是问“模型每一轮到底要面对什么动作空间”。一旦把问题放到这里，native ZCP 就是有意设计得比 MCP surface 更窄。",
        ],
      },
    ],
    mechanismTitle: "4. 因果机制链条",
    mechanismIntro:
      "ZCP 的优势不是一个点，而是一条因果链。只有把这条链讲清楚，benchmark 才不是一堆好看的数字。",
    mechanismSteps: [
      {
        title: "步骤 1：工具发现不再是平铺枚举",
        body: "MCP 风格路径通常让模型先看到一大批 primitive tools。原生 ZCP 则通过 `profile=\"semantic-workflow\"` 以及 `groups / stages` 元数据，在第一次调用前就把候选工具集缩小。",
      },
      {
        title: "步骤 2：调用规则继续执行同一策略",
        body: "如果 discovery 收紧了，但 `tools/call` 仍然可以随便调用别的工具，那收紧就没有意义。ZCP 在调用时也执行可见性校验，所以 discovery surface 和 call surface 是一致的。",
      },
      {
        title: "步骤 3：结果形态变得更紧凑",
        body: "runtime 会优先内联真正的小 scalar，把更大的结构放进 handle store，再只返回 summary。这样下一轮模型不必反复吞下整个原始结果。",
      },
      {
        title: "步骤 4：长任务从 prompt 回合里搬走",
        body: "task-augmented tool call 让 progress、cancel、intermediate state 进入 runtime 的 task state，而不是每次都靠 prompt-visible 的轮询和重试去表达。",
      },
      {
        title: "步骤 5：语义工作流工具压缩 primitive chain",
        body: "在 Excel benchmark 里，Tier B/C/D 的大幅优势很大程度上来自 semantic workflow tools。它们不是绕过问题，而是把模型从底层每一步的原语规划中解放出来，这正是 model-aware runtime 应该做的事。",
      },
    ],
    codeComparisonTitle: "5. 代码级对照",
    codeComparisonCaption:
      "真正要看的不是抽象形容词，而是代码把复杂度花在了哪里，以及这种花法如何改变模型的搜索空间。",
    codeComparisonHeaders: ["关注点", "MCP 风格代码路径", "ZCP 代码路径", "为什么 ZCP 会赢"],
    codeComparisonRows: [
      [
        "工具注册",
        "`excel_mcp/server.py` 里用 `@mcp.tool(...)` 平铺注册大量 primitive tools。",
        "`excel_mcp/zcp_server.py` 在同一套 primitive 之外再注册 semantic workflow tools，并通过 `_tool_metadata(...)` 标注元数据。",
        "原生路径可以优先暴露语义工具，而 MCP path 仍然保持 primitive、宽暴露。",
      ],
      [
        "发现策略",
        "互操作场景下，平铺 `tools/list` 是合理默认值，但它天然不表达 staged exposure。",
        "`zcp/server.py::_select_tools(...)` 支持按 `profile/groups/excludeGroups/stages` 过滤。",
        "模型在第一轮看到的 schema 明显变少，规划熵也随之下降。",
      ],
      [
        "调用纪律",
        "平铺 surface 通常默认 discovery 和 call 一样宽，依赖模型自己别跑偏。",
        "`zcp/server.py::_tool_is_exposed(...)` 配合 `enforce_tool_visibility_on_call`，只允许调用当前暴露出来的工具。",
        "discovery 策略不会在真正执行时失效，模型也更不容易乱跳到无关工具。",
      ],
      [
        "结果表示",
        "MCP 风格 tool 经常直接回 text 或 structured object，下一轮仍然需要完整吸收这个结果。",
        "`zcp/canonical_runtime.py::_build_result(...)` 会在 `scalar` 和 `handle + summary` 之间自动选择。",
        "大结果不再每一轮都进入 prompt，后续上下文因此更小。",
      ],
      [
        "长任务执行",
        "通用 tool call 经常只能用 prompt-visible 的轮询、重试或状态说明去模拟后台工作。",
        "`zcp/runtime.py::TaskManager`、`TaskExecutionContext` 和 `zcp/server.py` 的 task-augmented `tools/call` 把任务状态变成 runtime 一等公民。",
        "progress、cancel 和中间状态从 prompt 中消失，特别利好 Tier D。",
      ],
      [
        "兼容策略",
        "纯 MCP server 只有一条对外 surface。",
        "`zcp/gateway.py` 把同一 runtime 投影回 MCP，同时保留更窄的 `/zcp` 原生路径。",
        "团队可以保住 MCP 生态接入，而不必让原生流量承担全部兼容成本。",
      ],
    ],
    codeSnippetsTitle: "6. 关键代码片段",
    codeSnippetsIntro:
      "下面这些片段就是这套优势的最短证明链。看完它们，benchmark 的数字就不再像空中楼阁。",
    codeSnippets: [
      {
        title: "MCP 风格的 primitive tool 注册",
        path: "excel-mcp-server/src/excel_mcp/server.py",
        caption: "兼容优先的 surface 默认是宽的、primitive 的。这不是 bug，而是互操作系统的自然形态。",
        language: "python",
        code: MCP_SNIPPET,
      },
      {
        title: "ZCP 的语义 profile 与工具元数据",
        path: "excel-mcp-server/src/excel_mcp/zcp_server.py",
        caption: "`semantic-workflow` 和 `groups/stages` 从这里开始决定 native client 看到什么。",
        language: "python",
        code: ZCP_PROFILE_SNIPPET,
      },
      {
        title: "`tools/list` 的可见性过滤",
        path: "zero-context-protocol-python/src/zcp/server.py",
        caption: "过滤不是 prompt 工程，而是 runtime 规则，直接作用在 discovery 层。",
        language: "python",
        code: ZCP_FILTER_SNIPPET,
      },
      {
        title: "scalar 或 handle 的结果压缩",
        path: "zero-context-protocol-python/src/zcp/canonical_runtime.py",
        caption: "这是最核心的 token 节约机制之一：小值直接回，大值走 handle + summary。",
        language: "python",
        code: ZCP_RESULT_SNIPPET,
      },
      {
        title: "task-augmented 工具调用",
        path: "zero-context-protocol-python/src/zcp/server.py",
        caption: "长任务不再强行伪装成同步 tool call，而是升级为真正的 task。",
        language: "python",
        code: ZCP_TASK_SNIPPET,
      },
    ],
    principleHeaders: ["层级", "MCP-compatible 倾向", "ZCP 原生机制", "最终效果"],
    principleRows: [
      ["搜索空间", "宽泛的 primitive 枚举", "语义 profile + stage filter", "第一次规划前就降低熵。"],
      ["策略一致性", "discovery 和 call 往往同样宽", "调用也执行可见性约束", "减少无关分支和重试。"],
      ["上下文增长", "结果默认继续 prompt-visible", "scalar 内联，大对象走 handle", "后续轮次上下文更小。"],
      ["执行状态", "后台工作容易泄漏回 prompt", "任务状态由 runtime 持有", "长工作流更稳定。"],
    ],
    overallHeaders: ["路径", "Answer", "Workbook", "Tool", "平均总 token", "平均轮次"],
    overallRows: [
      ["`zcp_client_to_native_zcp`", "100.0%", "97.3%", "100.0%", "8027.9", "2.8"],
      ["`mcp_client_to_zcp_mcp_surface`", "97.3%", "91.9%", "73.0%", "30723.7", "4.1"],
    ],
    tierHeaders: ["Tier", "结构上发生了什么", "ZCP Native", "MCP Surface", "优势倍数"],
    tierRows: [
      ["A", "几乎没有太多规划浪费可减", "15979.4", "17613.2", "1.10x"],
      ["B", "短链路被 semantic chain tools 压缩", "1826.6", "29239.4", "16.01x"],
      ["C", "workflow-level 工具替代长 primitive sequence", "2091.1", "72113.9", "34.49x"],
      ["D", "自主规划最受益于更小搜索空间", "2018.3", "19375.7", "9.60x"],
    ],
    tierInsightsTitle: "7. 为什么 Tier 结果会长这样",
    tierInsights: [
      {
        tier: "Tier A",
        title: "小优势很正常",
        body: "单工具请求本来就没有多少分支浪费可消除，所以这个 tier 不应该拿来当 headline。ZCP 只会有轻微优势。",
      },
      {
        tier: "Tier B",
        title: "语义链路开始真正生效",
        body: "一旦任务需要 2 到 4 个相关 primitive 操作，semantic chain tools 就能显著减少模型内部需要维护的决策点。",
      },
      {
        tier: "Tier C",
        title: "workflow 压缩开始主导结果",
        body: "这是真正说明架构有效的地方。token 下降不是 wire format 小了一点，而是模型不再需要规划每一个底层单步操作。",
      },
      {
        tier: "Tier D",
        title: "这是最公平的压力测试",
        body: "Tier D 最容易出现规划漂移、重复 readback 和 repair loop 爆炸。native ZCP 能赢，是因为 runtime 在这些噪声进入 prompt 之前就先把它们压住了。",
      },
    ],
    limitsTitle: "8. 边界与限制",
    limits: [
      "`3.83x` 是已公开 benchmark 的结果，不是所有任务域、所有模型上的数学定理。",
      "最大的收益来自 semantic workflow tools。这是架构设计选择，不意味着任何随便一个 ZCP server 都天然同样强。",
      "这里比较的是“宽的 MCP-compatible surface”和“经过优化的 native ZCP surface”。报告并不声称 MCP 不能被手动做窄，而是说 ZCP 现在把这种 narrowing policy 做成了 runtime 一等能力。",
      "因此，最强且最准确的结论是：ZCP 在模型执行效率上有更好的架构位置，而不是说 MCP 在生态上没有意义。",
    ],
    conclusionTitle: "9. 结论",
    conclusion: [
      "ZCP 在这些 benchmark 里之所以比 MCP 更强，核心原因不是 transport，也不是名字，而是它把模型效率策略真正下沉到了 runtime。",
      "这个优势能直接在代码里看到：语义工具元数据、基于 profile 的发现、调用时的可见性约束、scalar-or-handle 的结果压缩，以及 task-aware 执行。",
      "所以最准确的说法应该是：MCP 继续是兼容合同，而 ZCP 在规划密集、模型主导的工作负载上，是更强的执行合同。",
    ],
    figureArchitectureTitle: "图 1. 一个 Runtime，两套 Surface",
    figureArchitectureCaption:
      "兼容面和原生面共享同一套业务 runtime。优势来自改变模型面对的执行合同，而不是把应用逻辑重写两遍。",
    figureExecutionTitle: "图 2. Token 为什么会更省",
    figureExecutionCaption:
      "原生路径之所以更省 token，是因为它把搜索空间变小、把调用策略继续执行到底，并且避免大结果在每一轮都重新回到 prompt。",
    figureLabels: {
      clients: "客户端与宿主",
      surfaces: "协议 surface",
      runtime: "runtime 核心",
      policy: "runtime 策略",
      clientMcp: "MCP hosts / clients",
      clientZcp: "原生 ZCP clients",
      host: "共享的 tools、resources、prompts、tasks",
      mcpSurface: "MCP-compatible surface",
      nativeSurface: "Native ZCP surface",
      toolListAll: "宽泛的 primitive 工具集",
      semanticSubset: "语义化、分阶段的工具子集",
      genericPlanning: "对大量分支做通用规划",
      stagedPlanning: "在收窄动作空间里规划",
      verboseResults: "结果持续以大 payload 进入 prompt",
      compactResults: "小结果直接回，大结果走 handle",
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
