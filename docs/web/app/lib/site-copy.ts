import { Locale } from "./i18n";

export type SimplePageSection = {
  id: string;
  title: string;
  body?: string[];
  code?: string;
  list?: string[];
};

export type SimplePageCopy = {
  navLabel: string;
  nav: Array<{ href: string; label: string }>;
  title: string;
  summary: string;
  intro?: string[];
  sections: SimplePageSection[];
  readNext: Array<{ href: string; label: string }>;
};

type HomeCopy = {
  title: string;
  description: string;
  actions: Array<{ href: string; label: string }>;
  startTitle: string;
  startItems: string[];
  openSection: string;
};

type DocsIndexCopy = {
  title: string;
  description: string;
  actions: Array<{ href: string; label: string }>;
};

type BenchmarksCopy = {
  navLabel: string;
  nav: Array<{ href: string; label: string }>;
  title: string;
  summary: string;
  description: string;
  snapshotTitle: string;
  compactTitle: string;
  compactSummaryTitle: string;
  compactCasesTitle: string;
  semanticTitle: string;
  semanticHeadlineTitle: string;
  semanticOverallTitle: string;
  semanticTierTitle: string;
  modelLabel: string;
  repeatsLabel: string;
  ratioLabel: string;
  compactSummaryHeaders: string[];
  compactCaseHeaders: string[];
  semanticOverallHeaders: string[];
  semanticTierHeaders: string[];
  artifactLabel: string;
};

export const homeCopy: Record<Locale, HomeCopy> = {
  en: {
    title: "Zero Context Protocol documentation",
    description:
      "ZCP exposes an MCP-compatible surface for interoperability and a native ZCP surface for lower-overhead runtime traffic. This site documents both.",
    actions: [
      { href: "/docs", label: "Open docs" },
      { href: "/docs/protocol", label: "Protocol reference" },
      { href: "/docs/capability-matrix", label: "Capability matrix" },
    ],
    startTitle: "Start here",
    startItems: [
      "Use the overview pages to understand the project split and the two protocol surfaces.",
      "Use the guide pages when building servers, clients, auth, tasks, and transport deployments.",
      "Use the reference pages for exact protocol behavior, capability status, benchmarks, and migration planning.",
    ],
    openSection: "Open section",
  },
  zh: {
    title: "Zero Context Protocol 文档",
    description:
      "ZCP 同时暴露一个兼容 MCP 的互操作 surface，以及一个面向更低运行时开销的原生 ZCP surface。这个站点覆盖两者的产品文档。",
    actions: [
      { href: "/docs", label: "打开文档" },
      { href: "/docs/protocol", label: "协议参考" },
      { href: "/docs/capability-matrix", label: "能力矩阵" },
    ],
    startTitle: "从这里开始",
    startItems: [
      "先读概览页，理解仓库拆分方式和两套协议 surface 的关系。",
      "构建 server、client、auth、tasks 和 transport 部署时，优先看 guides。",
      "需要严格行为定义、能力现状、基准和迁移说明时，使用 reference 页面。",
    ],
    openSection: "进入分区",
  },
};

export const docsIndexCopy: Record<Locale, DocsIndexCopy> = {
  en: {
    title: "Documentation index",
    description:
      "The docs are organized by how people actually read product documentation: overview first, then concepts, implementation guides, examples, and strict reference pages.",
    actions: [
      { href: "/docs/introduction", label: "Start with introduction" },
      { href: "/docs/protocol", label: "Protocol reference" },
    ],
  },
  zh: {
    title: "文档索引",
    description:
      "这套文档按照真实阅读路径组织：先看概览，再看概念、实现指南、场景示例，以及严格参考资料。",
    actions: [
      { href: "/docs/introduction", label: "从介绍开始" },
      { href: "/docs/protocol", label: "协议参考" },
    ],
  },
};

export const simplePageCopy: Record<Locale, Record<string, SimplePageCopy>> = {
  en: {
    quickstart: {
      navLabel: "Quickstart",
      nav: [
        { href: "/", label: "Home" },
        { href: "/docs/introduction", label: "Introduction" },
        { href: "/docs/servers", label: "Servers" },
        { href: "/docs/transports", label: "Transports" },
        { href: "/docs/examples", label: "Examples" },
      ],
      title: "Quickstart",
      summary:
        "The shortest route to a running ZCP setup is to validate stdio first, then decide whether you need the hosted ASGI surface.",
      intro: [
        "Start with the docs corpus for the authoritative instructions. This page keeps the fast path in one place so you can get a server running and then move into the detailed guides.",
      ],
      sections: [
        {
          id: "fast-path",
          title: "Fast path",
          code: `cd zero-context-protocol-python\npip install -e ".[dev,openai,mcp]"\npython3 examples/run_zcp_mcp_stdio_server.py`,
          body: [
            "Use this path when you want the smallest MCP-compatible proof that the server surface is working.",
          ],
        },
        {
          id: "asgi",
          title: "ASGI path",
          code: `cd zero-context-protocol-python\npython3 examples/run_zcp_api_server.py`,
          body: [
            "That starts the official ASGI host example exposing `/zcp`, `/mcp`, and `/ws`.",
          ],
        },
        {
          id: "validation",
          title: "Validation",
          code: `cd zero-context-protocol-python\npython3 -m pytest -q`,
          body: [
            "Run the test suite after setup if you need SDK and transport confidence before integrating clients.",
          ],
        },
      ],
      readNext: [
        { href: "/docs/introduction", label: "Introduction" },
        { href: "/docs/servers", label: "Servers" },
        { href: "/docs/transports", label: "Transports" },
        { href: "/docs/examples", label: "Examples" },
      ],
    },
    architecture: {
      navLabel: "Architecture",
      nav: [
        { href: "/", label: "Home" },
        { href: "/docs/introduction", label: "Introduction" },
        { href: "/docs/transports", label: "Transports" },
        { href: "/docs/protocol", label: "Protocol" },
        { href: "/docs/migration", label: "Migration" },
      ],
      title: "ZCP architecture",
      summary:
        "ZCP keeps one runtime core and exposes two protocol surfaces from it. The repository split follows the same boundary.",
      sections: [
        {
          id: "two-surfaces",
          title: "Two surfaces, one runtime",
          body: [
            "ZCP keeps one runtime core and exposes two protocol surfaces from it: an MCP-compatible surface for ecosystem interoperability and a native surface for lower-overhead orchestration.",
            "That split is the center of the design, not an implementation accident.",
          ],
        },
        {
          id: "repo-split",
          title: "Repository split",
          body: [
            "The docs site and protocol explanation live in `zero-context-protocol`. The Python SDK, examples, tests, and benchmark harness live in `zero-context-protocol-python`.",
          ],
        },
        {
          id: "operational-shape",
          title: "Operational shape",
          body: [
            "The same backend can expose `/mcp` for streamable HTTP, `/ws` for WebSocket, `/zcp` for native compact traffic, and stdio for host-launched integrations.",
          ],
        },
        {
          id: "ownership",
          title: "Ownership",
          list: [
            "`zero-context-protocol`: docs site, protocol explanation, compatibility framing, benchmark presentation.",
            "`zero-context-protocol-python`: SDK, runtime, examples, tests, and benchmark generation.",
          ],
        },
      ],
      readNext: [
        { href: "/docs/transports", label: "Transports" },
        { href: "/docs/protocol", label: "Protocol reference" },
        { href: "/docs/migration", label: "Migration guide" },
      ],
    },
    sdk: {
      navLabel: "SDK",
      nav: [
        { href: "/", label: "Home" },
        { href: "/docs/servers", label: "Servers" },
        { href: "/docs/clients", label: "Clients" },
        { href: "/docs/sdk-api", label: "SDK API" },
        { href: "/docs/examples", label: "Examples" },
      ],
      title: "SDK surface",
      summary:
        "The official Python SDK lives in the companion repository and exports one public package, `zcp`.",
      intro: [
        "The conceptual guides and the exact API reference are intentionally split. Use guides for architecture and use the reference page for precise symbols.",
      ],
      sections: [
        {
          id: "server-side",
          title: "Server side",
          body: [
            "Use `FastZCP` plus registration decorators to build tools, resources, prompts, completions, and tasks, then expose the runtime via stdio or ASGI.",
          ],
        },
        {
          id: "client-side",
          title: "Client side",
          body: [
            "Use `ZCPClientSession` for one session or `ZCPSessionGroup` to aggregate multiple native sessions into one client-side view.",
          ],
        },
        {
          id: "main-entrypoints",
          title: "Main entry points",
          list: [
            "Server: `FastZCP`, `create_asgi_app`, `run_mcp_stdio_server_sync`",
            "Client: `ZCPClientSession`, `ZCPSessionGroup`",
            "Transport helpers: `stdio_client`, `streamable_http_client`, `websocket_client`",
          ],
        },
      ],
      readNext: [
        { href: "/docs/servers", label: "Servers" },
        { href: "/docs/clients", label: "Clients" },
        { href: "/docs/sdk-api", label: "SDK API" },
      ],
    },
    deploy: {
      navLabel: "Deploy",
      nav: [
        { href: "/", label: "Home" },
        { href: "/docs/transports", label: "Transports" },
        { href: "/docs/authorization", label: "Authorization" },
        { href: "/docs/servers", label: "Servers" },
        { href: "/docs/examples", label: "Examples" },
      ],
      title: "Deploy ZCP",
      summary: "Use the ASGI host for network deployments. Keep docs hosting separate from the SDK runtime.",
      sections: [
        {
          id: "api-host",
          title: "ASGI host",
          body: [
            "The production-oriented example lives in `examples/zcp_server_template.py` and is exposed through the ASGI runner in `examples/run_zcp_api_server.py`.",
          ],
          code: `cd zero-context-protocol-python\npython3 examples/run_zcp_api_server.py`,
        },
        {
          id: "routes",
          title: "Service routes",
          body: [
            "A standard deployment may expose `/zcp`, `/mcp`, `/ws`, `/metadata`, `/healthz`, and `/readyz`, plus OAuth metadata and token routes when enabled.",
          ],
        },
        {
          id: "production-checks",
          title: "Production checks",
          list: [
            "Decide which transports are public and which are internal-only.",
            "Attach bearer auth or OAuth before exposing mutating tools.",
            "Validate health, readiness, rate limiting, and reconnect behavior.",
          ],
        },
        {
          id: "docs",
          title: "Docs app",
          code: `cd zero-context-protocol/docs/web\nnpm ci\nnpm run dev`,
          body: ["The docs app is separate from the SDK runtime and should stay that way."],
        },
      ],
      readNext: [
        { href: "/docs/transports", label: "Transports" },
        { href: "/docs/authorization", label: "Authorization" },
        { href: "/docs/examples", label: "Examples" },
      ],
    },
  },
  zh: {
    quickstart: {
      navLabel: "快速开始",
      nav: [
        { href: "/", label: "首页" },
        { href: "/docs/introduction", label: "介绍" },
        { href: "/docs/servers", label: "服务端" },
        { href: "/docs/transports", label: "传输层" },
        { href: "/docs/examples", label: "示例" },
      ],
      title: "快速开始",
      summary: "跑通 ZCP 的最短路径，是先验证 stdio，再决定是否需要托管的 ASGI surface。",
      intro: [
        "权威说明仍然以完整文档为准，这一页只保留最快接入路径，帮助你先把服务跑起来，再进入详细指南。",
      ],
      sections: [
        {
          id: "fast-path",
          title: "最快路径",
          code: `cd zero-context-protocol-python\npip install -e ".[dev,openai,mcp]"\npython3 examples/run_zcp_mcp_stdio_server.py`,
          body: ["当你只想先拿到一个最小 MCP 兼容验证时，用这条路径最合适。"],
        },
        {
          id: "asgi",
          title: "ASGI 路径",
          code: `cd zero-context-protocol-python\npython3 examples/run_zcp_api_server.py`,
          body: ["这会启动官方 ASGI host 示例，对外暴露 `/zcp`、`/mcp` 和 `/ws`。"],
        },
        {
          id: "validation",
          title: "验证",
          code: `cd zero-context-protocol-python\npython3 -m pytest -q`,
          body: ["如果你要在接入 client 前先确认 SDK 和 transport 的可靠性，安装后就跑测试。"],
        },
      ],
      readNext: [
        { href: "/docs/introduction", label: "介绍" },
        { href: "/docs/servers", label: "服务端" },
        { href: "/docs/transports", label: "传输层" },
        { href: "/docs/examples", label: "示例" },
      ],
    },
    architecture: {
      navLabel: "架构",
      nav: [
        { href: "/", label: "首页" },
        { href: "/docs/introduction", label: "介绍" },
        { href: "/docs/transports", label: "传输层" },
        { href: "/docs/protocol", label: "协议" },
        { href: "/docs/migration", label: "迁移" },
      ],
      title: "ZCP 架构",
      summary: "ZCP 维护一个运行时内核，并从它暴露两套协议 surface。仓库拆分也遵循同样的边界。",
      sections: [
        {
          id: "two-surfaces",
          title: "两套 surface，一个 runtime",
          body: [
            "ZCP 维护一个 runtime core，并从中暴露两套协议 surface：一套面向生态互操作的 MCP 兼容 surface，一套面向更低开销编排的原生 surface。",
            "这不是实现细节，而是设计中心。",
          ],
        },
        {
          id: "repo-split",
          title: "仓库拆分",
          body: [
            "文档站和协议说明位于 `zero-context-protocol`。Python SDK、示例、测试和 benchmark harness 位于 `zero-context-protocol-python`。",
          ],
        },
        {
          id: "operational-shape",
          title: "运行形态",
          body: [
            "同一个后端可以同时暴露 `/mcp` 用于 streamable HTTP、`/ws` 用于 WebSocket、`/zcp` 用于原生紧凑流量，以及 stdio 用于宿主拉起的集成方式。",
          ],
        },
        {
          id: "ownership",
          title: "职责归属",
          list: [
            "`zero-context-protocol`：文档站、协议解释、兼容性表述、benchmark 展示。",
            "`zero-context-protocol-python`：SDK、runtime、示例、测试和 benchmark 生成。",
          ],
        },
      ],
      readNext: [
        { href: "/docs/transports", label: "传输层" },
        { href: "/docs/protocol", label: "协议参考" },
        { href: "/docs/migration", label: "迁移指南" },
      ],
    },
    sdk: {
      navLabel: "SDK",
      nav: [
        { href: "/", label: "首页" },
        { href: "/docs/servers", label: "服务端" },
        { href: "/docs/clients", label: "客户端" },
        { href: "/docs/sdk-api", label: "SDK API" },
        { href: "/docs/examples", label: "示例" },
      ],
      title: "SDK Surface",
      summary: "官方 Python SDK 位于配套仓库，对外只导出一个公共包：`zcp`。",
      intro: [
        "概念指南和精确 API 参考是刻意拆开的。理解架构请看 guide，需要精确符号时看 reference。",
      ],
      sections: [
        {
          id: "server-side",
          title: "服务端",
          body: [
            "使用 `FastZCP` 和注册装饰器构建 tools、resources、prompts、completions 和 tasks，再通过 stdio 或 ASGI 暴露 runtime。",
          ],
        },
        {
          id: "client-side",
          title: "客户端",
          body: [
            "单会话用 `ZCPClientSession`，需要把多个原生 session 聚合成一个视图时用 `ZCPSessionGroup`。",
          ],
        },
        {
          id: "main-entrypoints",
          title: "主要入口",
          list: [
            "Server：`FastZCP`、`create_asgi_app`、`run_mcp_stdio_server_sync`",
            "Client：`ZCPClientSession`、`ZCPSessionGroup`",
            "Transport helpers：`stdio_client`、`streamable_http_client`、`websocket_client`",
          ],
        },
      ],
      readNext: [
        { href: "/docs/servers", label: "服务端" },
        { href: "/docs/clients", label: "客户端" },
        { href: "/docs/sdk-api", label: "SDK API" },
      ],
    },
    deploy: {
      navLabel: "部署",
      nav: [
        { href: "/", label: "首页" },
        { href: "/docs/transports", label: "传输层" },
        { href: "/docs/authorization", label: "鉴权" },
        { href: "/docs/servers", label: "服务端" },
        { href: "/docs/examples", label: "示例" },
      ],
      title: "部署 ZCP",
      summary: "面向网络部署时使用 ASGI host，并把文档站和 SDK runtime 保持分离。",
      sections: [
        {
          id: "api-host",
          title: "ASGI Host",
          body: [
            "面向生产的示例在 `examples/zcp_server_template.py`，通过 `examples/run_zcp_api_server.py` 这个 ASGI runner 对外暴露。",
          ],
          code: `cd zero-context-protocol-python\npython3 examples/run_zcp_api_server.py`,
        },
        {
          id: "routes",
          title: "服务路由",
          body: [
            "标准部署通常会暴露 `/zcp`、`/mcp`、`/ws`、`/metadata`、`/healthz` 和 `/readyz`，启用 OAuth 后还会补充 metadata 和 token 相关路由。",
          ],
        },
        {
          id: "production-checks",
          title: "生产检查项",
          list: [
            "先明确哪些 transport 对公网开放，哪些只保留在内网。",
            "对外暴露可变更 tool 之前，先接上 bearer auth 或 OAuth。",
            "验证 health、readiness、限流以及 reconnect 行为。",
          ],
        },
        {
          id: "docs",
          title: "文档站",
          code: `cd zero-context-protocol/docs/web\nnpm ci\nnpm run dev`,
          body: ["文档应用独立于 SDK runtime，这个边界应该保持不变。"],
        },
      ],
      readNext: [
        { href: "/docs/transports", label: "传输层" },
        { href: "/docs/authorization", label: "鉴权" },
        { href: "/docs/examples", label: "示例" },
      ],
    },
  },
};

export const benchmarksCopy: Record<Locale, BenchmarksCopy> = {
  en: {
    navLabel: "Benchmarks",
    nav: [
      { href: "/", label: "Home" },
      { href: "#snapshot", label: "Snapshot" },
      { href: "#compact", label: "Compact" },
      { href: "#semantic", label: "Semantic" },
    ],
    title: "Benchmark reports",
    summary:
      "This page publishes the benchmark artifacts that back the docs claims. The runner itself still lives in the Python SDK repository.",
    description:
      "The docs site ships curated benchmark artifacts so deployed builds can render the same evidence that was generated in the SDK repository.",
    snapshotTitle: "Latest snapshot",
    compactTitle: "Compact Tool Benchmark",
    compactSummaryTitle: "Compact summary",
    compactCasesTitle: "Compact case breakdown",
    semanticTitle: "Semantic Workflow Benchmark v5",
    semanticHeadlineTitle: "Headline",
    semanticOverallTitle: "Overall comparison",
    semanticTierTitle: "Tier comparison",
    modelLabel: "Model",
    repeatsLabel: "Repeats",
    ratioLabel: "Advantage",
    compactSummaryHeaders: ["Protocol", "Runs", "Answer Accuracy", "Tool Compliance", "Avg Prompt", "Avg Completion", "Avg Total"],
    compactCaseHeaders: ["Case", "ZCP Avg Total", "MCP Avg Total", "MCP / ZCP", "Token Delta"],
    semanticOverallHeaders: ["Backend", "Answer", "Workbook", "Tool", "Avg Total", "Avg Turns", "Avg Tool Calls"],
    semanticTierHeaders: ["Tier", "Native ZCP Avg Total", "MCP Surface Avg Total", "Ratio", "Native Quality"],
    artifactLabel: "Artifacts",
  },
  zh: {
    navLabel: "基准测试",
    nav: [
      { href: "/", label: "首页" },
      { href: "#snapshot", label: "快照" },
      { href: "#compact", label: "紧凑基准" },
      { href: "#semantic", label: "语义工作流" },
    ],
    title: "基准报告",
    summary: "这个页面发布支撑文档结论的 benchmark 产物。benchmark runner 本身仍然位于 Python SDK 仓库。",
    description:
      "docs 站点现在直接携带已发布的 benchmark 产物，因此部署到 Vercel 后也能渲染同一份正式证据。",
    snapshotTitle: "最新快照",
    compactTitle: "紧凑工具基准",
    compactSummaryTitle: "紧凑基准汇总",
    compactCasesTitle: "紧凑基准案例拆解",
    semanticTitle: "语义工作流基准 v5",
    semanticHeadlineTitle: "核心结论",
    semanticOverallTitle: "总体对比",
    semanticTierTitle: "分层对比",
    modelLabel: "模型",
    repeatsLabel: "重复次数",
    ratioLabel: "优势倍数",
    compactSummaryHeaders: ["协议", "运行次数", "回答准确率", "工具合规率", "平均 Prompt", "平均 Completion", "平均总量"],
    compactCaseHeaders: ["案例", "ZCP 平均总量", "MCP 平均总量", "MCP / ZCP", "Token 差值"],
    semanticOverallHeaders: ["后端", "回答", "工作簿", "工具", "平均总量", "平均轮次", "平均工具调用"],
    semanticTierHeaders: ["Tier", "原生 ZCP 平均总量", "MCP Surface 平均总量", "倍数", "原生质量"],
    artifactLabel: "原始产物",
  },
};
