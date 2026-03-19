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

type ReportCopy = {
  navLabel: string;
  nav: LinkItem[];
  title: string;
  subtitle: string;
  abstractTitle: string;
  abstract: string[];
  metrics: ReportMetric[];
  sections: ReportSection[];
  principleHeaders: string[];
  principleRows: string[][];
  overallHeaders: string[];
  overallRows: string[][];
  tierHeaders: string[];
  tierRows: string[][];
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

const REPORT_COPY: Record<Locale, ReportCopy> = {
  en: {
    navLabel: "Technical report",
    nav: [
      { href: "/architecture#abstract", label: "Abstract" },
      { href: "/architecture#problem", label: "Problem" },
      { href: "/architecture#architecture", label: "Architecture" },
      { href: "/architecture#principles", label: "Principles" },
      { href: "/architecture#compatibility", label: "Compatibility" },
      { href: "/architecture#benchmarks", label: "Benchmarks" },
      { href: "/architecture#limits", label: "Limits" },
      { href: "/architecture#conclusion", label: "Conclusion" },
    ],
    title: "Why ZCP Outperforms MCP",
    subtitle:
      "A technical report on protocol architecture, runtime policy, and benchmark-backed efficiency gains.",
    abstractTitle: "Abstract",
    abstract: [
      "ZCP is not presented as a separate interoperability standard that competes with MCP at the ecosystem boundary. Its stronger position comes from a different internal design target: one runtime, two protocol surfaces, and explicit runtime policy for model-facing efficiency.",
      "The MCP-compatible surface keeps ecosystem access stable. The native ZCP surface narrows tool visibility, reduces planning entropy, keeps results compact, and lets long-running work stay task-aware instead of forcing everything through generic synchronous tool calls.",
      "In the current published Excel workflow benchmark, the native ZCP path reports `8027.9` total tokens versus `30723.7` for the MCP surface on the same backend family, a `3.83x` advantage on that workload. The strongest gains appear in complex workflow and autonomous-planning tiers rather than in trivial one-tool calls.",
    ],
    metrics: [
      { label: "Runtime shape", value: "One runtime, two surfaces", note: "Compatibility on `/mcp`, optimization on `/zcp`." },
      { label: "Published benchmark", value: "3.83x", note: "Overall token advantage in `full_semantic_compare_v5`." },
      { label: "Where gains come from", value: "Policy, not marketing", note: "Tool exposure, staging, compact results, task-aware execution." },
    ],
    sections: [
      {
        id: "problem",
        title: "1. Problem Statement",
        paragraphs: [
          "MCP solves a real interoperability problem: clients and hosts need a shared language for tools, resources, prompts, and transport behavior. That is the correct boundary for an ecosystem protocol.",
          "But interoperability and model efficiency are not the same design target. A protocol can be excellent at connecting systems while still exposing too many tools, too much result payload, and too little scheduling structure to a model that is planning and acting over many turns.",
          "ZCP starts from that split. It accepts the interoperability boundary as necessary, then adds a native surface optimized for high-frequency model execution where token cost, planning drift, redundant tool calls, and long-running work are first-order concerns.",
        ],
      },
      {
        id: "architecture",
        title: "2. Architecture Overview",
        paragraphs: [
          "The central design choice is not a new object model for its own sake. It is the decision to keep a single runtime core and expose two protocol surfaces from it. The MCP-compatible surface exists so existing clients, hosts, and transport expectations continue to work. The native ZCP surface exists so runtime policy can become smaller, stricter, and more model-aware.",
          "This means the compatibility story is not a fallback branch or a hand-maintained bridge. Compatibility is part of the architecture, while optimization remains available to native clients that can benefit from reduced tool sets and staged execution.",
        ],
      },
      {
        id: "principles",
        title: "3. Why ZCP Is Stronger",
        paragraphs: [
          "ZCP becomes stronger than MCP when the workload is not a single isolated tool call but a model-led workflow. The gain does not come from renaming the protocol. It comes from runtime policies that lower planning entropy and keep each turn narrower.",
          "Three mechanisms matter most. First, ZCP can expose only the relevant semantic or staged subset of tools to a native client. Second, it can keep long-running or multi-step work task-aware instead of flattening it into stateless calls. Third, it can shape outputs compactly so the next model turn receives enough information to continue without receiving every raw artifact again.",
        ],
        bullets: [
          "Semantic workflow profiles turn discovery from flat enumeration into policy-driven filtering.",
          "Staged tool exposure lets a client move through inspect, plan, execute, and verify phases with different visibility sets.",
          "Compact structured results reduce downstream token growth and redundant readback turns.",
          "Task-aware execution makes progress, polling, status, and cancellation part of runtime behavior instead of ad hoc prompt instructions.",
        ],
      },
      {
        id: "compatibility",
        title: "4. Compatibility Strategy",
        paragraphs: [
          "ZCP does not need a hostile migration story. Existing MCP hosts and clients can continue to talk to `/mcp`, stdio, or websocket-compatible surfaces. That keeps ecosystem leverage intact.",
          "Native ZCP clients, however, do not need to inherit every cost of that compatibility surface. They can request `semantic-workflow` discovery, call tools through the same runtime, and benefit from stricter exposure policy without breaking the external contract.",
          "This is why compatibility and optimization can coexist. MCP remains the compatibility layer. ZCP becomes the runtime-efficient layer.",
        ],
      },
      {
        id: "benchmarks",
        title: "5. Benchmark Evidence",
        paragraphs: [
          "The public benchmark evidence used here comes from the SDK repository's `full_semantic_compare_v5` report. It compares native ZCP against the MCP surface under the same backend family and organizes the workload into four tiers: single-tool work, tool chains, complex workflows, and autonomous planning.",
          "The published evidence is strongest where planning matters most. Tier A is only a modest improvement because single-tool work leaves little room for scheduling policy. Tier B, Tier C, and Tier D show why the architecture matters: the more the model must plan and coordinate, the more the native runtime policy helps.",
        ],
      },
    ],
    principleHeaders: ["Layer", "MCP-style default", "ZCP-native policy", "Why it matters"],
    principleRows: [
      ["Tool discovery", "Flat, broad exposure", "Semantic workflow profile and staged subsets", "Reduces planning entropy before the first call."],
      ["Execution model", "Mostly generic tool invocation", "Task-aware execution with progress and status", "Long-running work stops pretending to be synchronous."],
      ["Result shaping", "Verbose or generic outputs", "Compact structured results and handle-first flow", "The next turn stays smaller and easier to plan."],
      ["Migration", "One protocol path", "Compatible MCP surface plus native path", "Teams keep ecosystem access while optimizing internal traffic."],
    ],
    overallHeaders: ["Path", "Answer", "Workbook", "Tool", "Avg total tokens", "Avg turns"],
    overallRows: [
      ["`zcp_client_to_native_zcp`", "100.0%", "97.3%", "100.0%", "8027.9", "2.8"],
      ["`mcp_client_to_zcp_mcp_surface`", "97.3%", "91.9%", "73.0%", "30723.7", "4.1"],
    ],
    tierHeaders: ["Tier", "What it measures", "ZCP native", "MCP surface", "Advantage"],
    tierRows: [
      ["A", "Single-tool requests", "15979.4", "17613.2", "1.10x"],
      ["B", "Short tool chains", "1826.6", "29239.4", "16.01x"],
      ["C", "Complex workflows", "2091.1", "72113.9", "34.49x"],
      ["D", "Autonomous planning", "2018.3", "19375.7", "9.60x"],
    ],
    limitsTitle: "6. Limits And Scope",
    limits: [
      "The `3.83x` headline is the current published result for the Excel workflow benchmark, not a universal claim for every task domain or model.",
      "The strongest evidence is in planning-heavy workloads. Single-tool requests show much smaller gains because there is less scheduling waste to remove.",
      "Some runtime areas in the repository are still explicitly marked beta or experimental. The report should not erase those boundaries.",
      "The argument here is that ZCP is architecturally better positioned for model execution efficiency, not that MCP becomes unnecessary.",
    ],
    conclusionTitle: "7. Conclusion",
    conclusion: [
      "ZCP is stronger than MCP in the place where modern agent systems actually pay their costs: model-facing runtime execution. The architecture separates ecosystem compatibility from internal efficiency and lets both remain true at once.",
      "That advantage comes from policy and structure: semantic discovery, staged exposure, compact result shaping, and task-aware execution. Those are runtime properties, not branding changes.",
      "The practical takeaway is simple. Keep MCP where compatibility is the requirement. Use native ZCP where planning depth, token cost, and long-running workflow quality define the real system bottleneck.",
    ],
    figureArchitectureTitle: "Figure 1. One Runtime, Two Surfaces",
    figureArchitectureCaption:
      "The same runtime serves MCP compatibility traffic and native ZCP traffic. Optimization happens by changing the model-facing surface, not by forking the backend logic.",
    figureExecutionTitle: "Figure 2. Why the Native Path Uses Fewer Tokens",
    figureExecutionCaption:
      "The MCP-compatible path remains broad and generic. The native path narrows visibility, stages execution, and keeps follow-up turns compact.",
    figureLabels: {
      clients: "Clients and hosts",
      surfaces: "Protocol surfaces",
      runtime: "Runtime core",
      policy: "Policy layer",
      clientMcp: "Existing MCP hosts and clients",
      clientZcp: "Native ZCP clients",
      host: "Shared tools, resources, prompts, tasks",
      mcpSurface: "MCP-compatible surface",
      nativeSurface: "Native ZCP surface",
      toolListAll: "Broad tool list",
      semanticSubset: "Semantic subset",
      genericPlanning: "Generic planning loop",
      stagedPlanning: "Staged planning loop",
      verboseResults: "Verbose follow-up context",
      compactResults: "Compact structured results",
      feedbackLoop: "Smaller next-turn context",
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
      { href: "/architecture#architecture", label: "架构总览" },
      { href: "/architecture#principles", label: "核心原理" },
      { href: "/architecture#compatibility", label: "兼容策略" },
      { href: "/architecture#benchmarks", label: "基准证据" },
      { href: "/architecture#limits", label: "边界与限制" },
      { href: "/architecture#conclusion", label: "结论" },
    ],
    title: "为什么 ZCP 比 MCP 更强",
    subtitle: "一份围绕协议架构、运行时策略与基准证据展开的技术报告。",
    abstractTitle: "摘要",
    abstract: [
      "ZCP 并不是想在生态边界上用另一个互操作协议去替代 MCP。它之所以更强，来自于一个不同的内部设计目标：一个 runtime、两套 surface，以及面向模型执行效率的显式运行时策略。",
      "MCP 兼容 surface 用来保持外部生态接入稳定；原生 ZCP surface 则负责缩小工具暴露范围、降低规划熵、压缩结果形态，并把长任务保留在 task-aware 的执行模型里，而不是强行塞回通用同步 tool call。",
      "在当前公开的 Excel workflow benchmark 里，native ZCP 路径的总 token 为 `8027.9`，同一后端上的 MCP surface 为 `30723.7`，在该工作负载上形成 `3.83x` 优势。最明显的收益出现在复杂 workflow 和自主规划 tier，而不是最简单的单工具请求。",
    ],
    metrics: [
      { label: "运行时形态", value: "一个 runtime，两套 surface", note: "兼容流量走 `/mcp`，优化流量走 `/zcp`。" },
      { label: "公开基准结果", value: "3.83x", note: "来自 `full_semantic_compare_v5` 的 overall token 优势。" },
      { label: "优势来源", value: "来自策略，不是口号", note: "工具暴露、分阶段调度、紧凑结果和 task-aware 执行。" },
    ],
    sections: [
      {
        id: "problem",
        title: "1. 问题定义",
        paragraphs: [
          "MCP 解决的是一个真实且重要的问题：client 和 host 需要一套共享语言来描述 tools、resources、prompts 和 transport 行为。从生态协议角度看，这个边界是正确的。",
          "但互操作与模型效率不是同一个设计目标。一个协议可以非常适合连接系统，却依然会在模型高频规划时暴露过多工具、返回过多结果、缺少足够的调度结构，从而在多轮执行里持续放大 token 开销。",
          "ZCP 正是从这个分歧点出发：接受互操作边界的必要性，然后在其上增加一个专门为模型执行效率优化的原生 surface。",
        ],
      },
      {
        id: "architecture",
        title: "2. 架构总览",
        paragraphs: [
          "这套设计的核心并不是“再发明一套原语”，而是把一个 runtime 核心同时暴露为两套 surface。MCP-compatible surface 负责让现有 host、client 和 transport 预期继续工作；native ZCP surface 负责让运行时策略变得更小、更严格、更面向模型。",
          "因此兼容性不是一个附加分支，也不是手写桥接后的副产品。兼容性本身就是架构的一部分，而原生优化则留给那些真正能利用更小工具集和分阶段执行策略的 client。",
        ],
      },
      {
        id: "principles",
        title: "3. 为什么 ZCP 更强",
        paragraphs: [
          "当工作负载从“单次工具调用”变成“模型主导的多轮 workflow”时，ZCP 的优势才真正显现。这个优势不是因为协议名字不同，而是因为运行时策略直接降低了规划熵，并把每一轮输入收窄到更小的范围。",
          "最关键的三件事是：第一，原生 client 可以只看到相关的语义工具子集；第二，长任务和多步任务能保留 task-aware 的执行模型，而不是被拍扁成普通调用；第三，结果可以保持紧凑，让下一轮模型继续工作时不必重新吞下整份冗长上下文。",
        ],
        bullets: [
          "`semantic-workflow` profile 让工具发现从平铺枚举变成策略化筛选。",
          "分阶段工具暴露可以让 client 依次进入 inspect、plan、execute、verify，而不是一开始就看见全量工具。",
          "紧凑结果与 handle-first 形态可以减少下一轮 prompt 膨胀和重复读回。",
          "task-aware execution 让 progress、polling、status 和 cancel 变成 runtime 行为，而不是写在 prompt 里的临时约定。",
        ],
      },
      {
        id: "compatibility",
        title: "4. 兼容策略",
        paragraphs: [
          "ZCP 不需要一条敌对的迁移路线。现有 MCP host 和 client 仍然可以继续访问 `/mcp`、stdio 或 websocket-compatible surface，这保证了生态接入不被打断。",
          "但原生 ZCP client 没必要继续承担这条兼容 surface 的全部成本。它可以请求 `semantic-workflow` 发现、仍然调用同一套 runtime、却用更严格的暴露策略拿到更小的模型上下文。",
          "这就是为什么兼容性和优化可以同时成立：MCP 继续承担兼容职责，ZCP 负责原生执行效率。",
        ],
      },
      {
        id: "benchmarks",
        title: "5. 基准证据",
        paragraphs: [
          "这里引用的公开 benchmark 证据来自 Python SDK 仓库里的 `full_semantic_compare_v5`。它在同一后端族上比较 native ZCP 与 MCP surface，并把工作负载拆成四个 tier：单工具请求、短工具链、复杂 workflow、自主规划。",
          "证据最有说服力的地方恰恰是最复杂的工作负载。Tier A 的优势较小，因为单工具请求本来就没有太多调度浪费可以消除。Tier B、Tier C 和 Tier D 则更能说明架构差异真正发生在规划层，而不仅仅是某个接口形式上。",
        ],
      },
    ],
    principleHeaders: ["层级", "MCP 风格默认形态", "ZCP 原生策略", "为什么重要"],
    principleRows: [
      ["工具发现", "平铺、宽暴露", "语义工作流 profile 与阶段子集", "在第一次调用前就先降低规划熵。"],
      ["执行模型", "通用 tool invocation 为主", "task-aware 执行与状态流转", "长任务不必再伪装成同步调用。"],
      ["结果形态", "冗长或通用输出", "紧凑 structured result 与 handle-first", "让下一轮上下文更小、更稳定。"],
      ["迁移方式", "单一路径", "兼容 MCP + 原生 ZCP 双路径", "既保住生态接入，又优化内部流量。"],
    ],
    overallHeaders: ["路径", "Answer", "Workbook", "Tool", "平均总 token", "平均轮次"],
    overallRows: [
      ["`zcp_client_to_native_zcp`", "100.0%", "97.3%", "100.0%", "8027.9", "2.8"],
      ["`mcp_client_to_zcp_mcp_surface`", "97.3%", "91.9%", "73.0%", "30723.7", "4.1"],
    ],
    tierHeaders: ["Tier", "测量内容", "ZCP Native", "MCP Surface", "优势倍数"],
    tierRows: [
      ["A", "单工具请求", "15979.4", "17613.2", "1.10x"],
      ["B", "短工具链", "1826.6", "29239.4", "16.01x"],
      ["C", "复杂 workflow", "2091.1", "72113.9", "34.49x"],
      ["D", "自主规划", "2018.3", "19375.7", "9.60x"],
    ],
    limitsTitle: "6. 边界与限制",
    limits: [
      "这里的 `3.83x` 是当前 Excel workflow benchmark 的公开结果，不应被写成所有任务域和所有模型上的普适结论。",
      "最强证据来自规划密集型工作负载。单工具请求上的提升较小，因为本身就没有太多调度浪费可减。",
      "仓库里仍有部分能力被明确标记为 beta 或 experimental，技术报告不应抹掉这些边界。",
      "这份报告的论点是：ZCP 在模型执行效率上具备更优的架构位置，而不是说 MCP 从此不再必要。",
    ],
    conclusionTitle: "7. 结论",
    conclusion: [
      "ZCP 比 MCP 更强，强在现代 agent 系统真正花钱的地方：模型面对 runtime 执行成本时的规划与调度效率。它把生态兼容和内部效率拆成两个 surface，于是两者可以同时成立。",
      "这种优势来自策略与结构，而不是换个名字：语义发现、分阶段暴露、紧凑结果形态和 task-aware 执行，都是运行时性质，不是包装层的文案差异。",
      "实际落地建议很简单：兼容性要求高的地方继续使用 MCP surface；真正受规划深度、token 成本和长任务质量约束的内部流量，优先切到 native ZCP。",
    ],
    figureArchitectureTitle: "图 1. 一个 Runtime，两套 Surface",
    figureArchitectureCaption:
      "同一套 runtime 同时服务 MCP 兼容流量和原生 ZCP 流量。优化不是复制一份后端逻辑，而是改变模型面对的 surface。",
    figureExecutionTitle: "图 2. 为什么原生路径更省 Token",
    figureExecutionCaption:
      "MCP-compatible 路径保持宽泛、通用的暴露；native 路径则收窄工具范围、分阶段执行，并保持更紧凑的后续上下文。",
    figureLabels: {
      clients: "客户端与宿主",
      surfaces: "协议 surface",
      runtime: "runtime 核心",
      policy: "策略层",
      clientMcp: "现有 MCP hosts / clients",
      clientZcp: "原生 ZCP clients",
      host: "共享的 tools、resources、prompts、tasks",
      mcpSurface: "MCP-compatible surface",
      nativeSurface: "Native ZCP surface",
      toolListAll: "全量工具暴露",
      semanticSubset: "语义化子集",
      genericPlanning: "通用规划循环",
      stagedPlanning: "分阶段规划循环",
      verboseResults: "冗长结果与回读",
      compactResults: "紧凑 structured result",
      feedbackLoop: "更小的下一轮上下文",
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
