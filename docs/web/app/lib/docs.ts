import { readFile } from "node:fs/promises";
import path from "node:path";

import { Locale } from "./i18n";

type LocalizedText = {
  en: string;
  zh: string;
};

type DocSectionDefinition = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  summary: LocalizedText;
};

type DocEntryDefinition = {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  source: string;
  summary: LocalizedText;
  section: DocSectionDefinition["id"];
};

export type DocSection = {
  id: string;
  title: string;
  description: string;
  summary: string;
};

export type DocEntry = {
  slug: string;
  title: string;
  description: string;
  source: string;
  summary: string;
  section: DocSection["id"];
};

export type Heading = {
  level: number;
  text: string;
  id: string;
};

export type MarkdownBlock =
  | { type: "heading"; level: number; text: string; id: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; language: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] };

const DOC_SECTIONS: DocSectionDefinition[] = [
  {
    id: "overview",
    title: { en: "Overview", zh: "概览" },
    description: {
      en: "Start here if you need the project shape, compatibility promise, and the first deployment choices.",
      zh: "先从这里了解项目结构、兼容性边界，以及第一步该如何部署。",
    },
    summary: {
      en: "What ZCP is, how it relates to MCP, and how to choose your first path.",
      zh: "理解 ZCP 是什么、它和 MCP 的关系，以及应该先走哪条接入路径。",
    },
  },
  {
    id: "concepts",
    title: { en: "Concepts", zh: "核心概念" },
    description: {
      en: "The object model and runtime features that define how a ZCP server should be designed.",
      zh: "用于设计 ZCP 服务端的对象模型与运行时特性。",
    },
    summary: {
      en: "Tools, resources, prompts, sampling, elicitation, progress, roots, and tasks.",
      zh: "覆盖 tools、resources、prompts、sampling、elicitation、progress、roots 和 tasks。",
    },
  },
  {
    id: "guides",
    title: { en: "Guides", zh: "指南" },
    description: {
      en: "Topic-focused implementation guidance for transport, auth, clients, and servers.",
      zh: "围绕 transport、auth、client 和 server 的实现指南。",
    },
    summary: {
      en: "The pages you should rely on while building and deploying.",
      zh: "构建和部署时最该依赖的页面集合。",
    },
  },
  {
    id: "examples",
    title: { en: "Examples", zh: "示例" },
    description: {
      en: "Scenario-driven pages for adoption, migration, and compatibility planning.",
      zh: "围绕接入、迁移和兼容规划的场景化页面。",
    },
    summary: {
      en: "Use cases and FAQ material for real-world rollout questions.",
      zh: "用于回答真实落地问题的 use case 和 FAQ。",
    },
  },
  {
    id: "reference",
    title: { en: "Reference", zh: "参考" },
    description: {
      en: "Exact protocol, parity, API, benchmark, and gap-tracking material.",
      zh: "协议、对标、API、基准和缺口跟踪的严格参考资料。",
    },
    summary: {
      en: "The strict source of truth for what is implemented and how to verify it.",
      zh: "用于确认当前实现范围与验证方式的严格真源。",
    },
  },
];

const DOC_ENTRIES: DocEntryDefinition[] = [
  {
    slug: "introduction",
    title: { en: "Introduction And Getting Started", zh: "介绍与快速开始" },
    description: {
      en: "What ZCP is, why it keeps two surfaces, and how to choose your first integration path.",
      zh: "解释 ZCP 是什么、为什么保留两套 surface，以及如何选择第一条接入路径。",
    },
    source: "introduction_getting_started.md",
    summary: {
      en: "The best first page if you already know MCP and need to understand the ZCP split quickly.",
      zh: "如果你已经了解 MCP，这一页是快速理解 ZCP 双 surface 设计的最佳入口。",
    },
    section: "overview",
  },
  {
    slug: "core-concepts",
    title: { en: "Core Concepts: Tools, Resources, Templates, And Prompts", zh: "核心概念：Tools、Resources、Templates 与 Prompts" },
    description: {
      en: "How to model callable operations, readable content, parameterized resources, and prompt scaffolding.",
      zh: "如何建模可调用操作、可读内容、参数化资源，以及 prompt 脚手架。",
    },
    source: "core_concepts_tools_resources_prompts.md",
    summary: {
      en: "The core object model behind most ZCP and MCP-compatible server design decisions.",
      zh: "绝大多数 ZCP 和 MCP 兼容服务端设计决策都要先理解这套对象模型。",
    },
    section: "concepts",
  },
  {
    slug: "runtime-features",
    title: { en: "Core Concepts: Sampling, Elicitation, Roots, Logging, Progress, And Tasks", zh: "核心概念：Sampling、Elicitation、Roots、Logging、Progress 与 Tasks" },
    description: {
      en: "How ZCP handles host interaction, long-running work, and runtime-managed state.",
      zh: "解释 ZCP 如何处理宿主交互、长任务与运行时状态管理。",
    },
    source: "core_concepts_sampling_elicitation_roots_logging_tasks.md",
    summary: {
      en: "The guide for workflows that move beyond synchronous tool calling.",
      zh: "这是理解同步 tool call 之外复杂工作流的关键页面。",
    },
    section: "concepts",
  },
  {
    slug: "transports",
    title: { en: "Transport Guide", zh: "传输层指南" },
    description: {
      en: "How stdio, streamable HTTP, websocket, and native ZCP surfaces map to real deployment choices.",
      zh: "解释 stdio、streamable HTTP、websocket 与原生 ZCP surface 如何对应真实部署选择。",
    },
    source: "transports_guide.md",
    summary: {
      en: "Use this before you lock in your transport, reconnect, and replay assumptions.",
      zh: "在你确定 transport、reconnect 和 replay 策略之前先读这一页。",
    },
    section: "guides",
  },
  {
    slug: "authorization",
    title: { en: "Authorization Guide", zh: "鉴权指南" },
    description: {
      en: "Bearer auth, OAuth 2.1 style flows, PKCE, provider-backed state, and scope enforcement.",
      zh: "覆盖 bearer auth、OAuth 2.1 风格流程、PKCE、provider-backed state 和 scope enforcement。",
    },
    source: "authorization_guide.md",
    summary: {
      en: "The current auth story, including production boundaries and deployment guidance.",
      zh: "用于理解当前 auth 能力边界和生产部署建议。",
    },
    section: "guides",
  },
  {
    slug: "servers",
    title: { en: "Server Guide", zh: "服务端指南" },
    description: {
      en: "How to build, host, configure, and validate a ZCP server.",
      zh: "如何构建、托管、配置并验证一个 ZCP server。",
    },
    source: "server_guide.md",
    summary: {
      en: "The main implementation guide for `FastZCP`, ASGI hosting, stdio, and server policy.",
      zh: "这是理解 `FastZCP`、ASGI 托管、stdio 和 server policy 的主实现指南。",
    },
    section: "guides",
  },
  {
    slug: "clients",
    title: { en: "Client Guide", zh: "客户端指南" },
    description: {
      en: "How to think about native client sessions, compatibility clients, and transport-aware consumers.",
      zh: "如何理解原生 client session、兼容客户端以及 transport-aware 的消费方式。",
    },
    source: "client_guide.md",
    summary: {
      en: "The page to read before you design client retries, notifications, and long-running task handling.",
      zh: "在设计 client retry、notification 和 task handling 之前应该先读这一页。",
    },
    section: "guides",
  },
  {
    slug: "semantic-workflow-profile",
    title: { en: "Semantic Workflow Profile", zh: "语义工作流 Profile" },
    description: {
      en: "What the built-in native profile does, how it filters tools, and when to use it.",
      zh: "解释内置原生 profile 做了什么、如何过滤工具，以及应该在什么场景使用。",
    },
    source: "semantic_workflow_profile.md",
    summary: {
      en: "The dedicated explanation page for `semantic-workflow`, workflow-tagged tools, and native discovery.",
      zh: "这是专门解释 `semantic-workflow`、workflow-tagged tools 与原生发现路径的页面。",
    },
    section: "guides",
  },
  {
    slug: "examples",
    title: { en: "Examples And Use Cases", zh: "示例与使用场景" },
    description: {
      en: "Migration, hosted API, human approval, document-centric flows, and other practical patterns.",
      zh: "覆盖迁移、hosted API、人工审批、文档型工作流等实际模式。",
    },
    source: "examples_and_use_cases.md",
    summary: {
      en: "Scenario-driven reading for real adoption paths instead of isolated API snippets.",
      zh: "这是一组面向真实接入路径的场景化文档，而不是零散 API 片段。",
    },
    section: "examples",
  },
  {
    slug: "faq",
    title: { en: "FAQ", zh: "常见问题" },
    description: {
      en: "Short answers to the most common compatibility, token, auth, and migration questions.",
      zh: "用于快速回答兼容性、token、auth 和迁移上的常见问题。",
    },
    source: "faq.md",
    summary: {
      en: "A fast way to check the current claim boundary without reading the full reference stack.",
      zh: "如果你不想先读完整参考文档栈，这是最快确认当前 claim boundary 的方式。",
    },
    section: "examples",
  },
  {
    slug: "protocol",
    title: { en: "Protocol Reference", zh: "协议参考" },
    description: {
      en: "MCP-facing methods, notifications, transports, and auth notes implemented by ZCP.",
      zh: "记录 ZCP 当前实现的面向 MCP 的 methods、notifications、transports 和 auth notes。",
    },
    source: "mcp_protocol_reference.md",
    summary: {
      en: "What ZCP serves on `/mcp`, how it maps runtime behavior to MCP, and which notes still matter.",
      zh: "解释 ZCP 在 `/mcp` 上暴露了什么、如何映射运行时行为到 MCP，以及哪些说明仍然重要。",
    },
    section: "reference",
  },
  {
    slug: "sdk-api",
    title: { en: "SDK API", zh: "SDK API 参考" },
    description: {
      en: "Reference index for the public Python SDK surface exported by `zcp`.",
      zh: "面向 `zcp` Python SDK 公共导出的 API 参考索引。",
    },
    source: "sdk_api_reference.md",
    summary: {
      en: "Server APIs, session APIs, transport helpers, auth types, and configuration types.",
      zh: "覆盖 server API、session API、transport helpers、auth types 和 config types。",
    },
    section: "reference",
  },
  {
    slug: "capability-matrix",
    title: { en: "Capability Matrix", zh: "能力矩阵" },
    description: {
      en: "Parity matrix against the official MCP docs and Python SDK.",
      zh: "对标官方 MCP docs 和 Python SDK 的能力矩阵。",
    },
    source: "mcp_capability_matrix.md",
    summary: {
      en: "Implemented versus covered versus still incomplete, with ZCP-native advantages called out directly.",
      zh: "直接区分已实现、已覆盖和仍未完成的部分，并标出 ZCP-native 的优势。",
    },
    section: "reference",
  },
  {
    slug: "migration",
    title: { en: "Migration Guide", zh: "迁移指南" },
    description: {
      en: "How to preserve MCP compatibility while selectively moving internal traffic to native ZCP.",
      zh: "如何在保持 MCP 兼容的同时，选择性地把内部流量迁移到原生 ZCP。",
    },
    source: "mcp_migration.md",
    summary: {
      en: "Rollout order, compatibility strategy, and where native ZCP should and should not be introduced first.",
      zh: "给出 rollout 顺序、兼容策略，以及哪些地方应先上原生 ZCP、哪些地方不应先动。",
    },
    section: "reference",
  },
  {
    slug: "benchmark-methodology",
    title: { en: "Benchmark Methodology", zh: "基准方法论" },
    description: {
      en: "Rules for generating, presenting, and interpreting ZCP versus MCP benchmark evidence.",
      zh: "规定如何生成、展示并解释 ZCP 与 MCP 的 benchmark 证据。",
    },
    source: "benchmark_methodology.md",
    summary: {
      en: "The benchmark source of truth lives in the Python SDK repo and should stay reproducible.",
      zh: "benchmark 的真源在 Python SDK 仓库里，并且必须保持可复现。",
    },
    section: "reference",
  },
  {
    slug: "mcp-gap",
    title: { en: "MCP Gap And TODO", zh: "MCP 缺口与 TODO" },
    description: {
      en: "Strict tracker for parity work that remains incomplete.",
      zh: "严格记录仍未完成的 parity 工作。",
    },
    source: "mcp_gap_todo.md",
    summary: {
      en: "Auth-client interop, task coverage, transport soak tests, output validation, and docs convergence gaps.",
      zh: "覆盖 auth-client interop、task coverage、transport soak tests、output validation 和 docs 剩余缺口。",
    },
    section: "reference",
  },
];

function text(value: LocalizedText, locale: Locale): string {
  return value[locale];
}

function localizedSource(source: string, locale: Locale): string {
  if (locale === "en") {
    return source;
  }
  return source.replace(/\.md$/, ".zh.md");
}

function buildDocEntry(entry: DocEntryDefinition, locale: Locale): DocEntry {
  return {
    slug: entry.slug,
    title: text(entry.title, locale),
    description: text(entry.description, locale),
    source: localizedSource(entry.source, locale),
    summary: text(entry.summary, locale),
    section: entry.section,
  };
}

export function getDocSections(locale: Locale = "en"): Array<DocSection & { entries: DocEntry[] }> {
  return DOC_SECTIONS.map((section) => ({
    id: section.id,
    title: text(section.title, locale),
    description: text(section.description, locale),
    summary: text(section.summary, locale),
    entries: DOC_ENTRIES.filter((entry) => entry.section === section.id).map((entry) => buildDocEntry(entry, locale)),
  }));
}

export function getDocEntry(slug: string, locale: Locale = "en"): DocEntry | undefined {
  const entry = DOC_ENTRIES.find((item) => item.slug === slug);
  return entry ? buildDocEntry(entry, locale) : undefined;
}

export async function readDocEntry(
  slug: string,
  locale: Locale = "en",
): Promise<{ entry: DocEntry; markdown: string }> {
  const entry = getDocEntry(slug, locale);
  if (!entry) {
    throw new Error(`unknown doc slug: ${slug}`);
  }
  const absolutePath = path.join(process.cwd(), "..", entry.source);
  const markdown = await readFile(absolutePath, "utf-8");
  return { entry, markdown };
}

export const DOC_SLUGS = DOC_ENTRIES.map((entry) => entry.slug);

export function parseMarkdown(markdown: string): { blocks: MarkdownBlock[]; headings: Heading[] } {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  const headings: Heading[] = [];
  const headingIds = new Map<string, number>();
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = uniqueHeadingId(slugify(text), headingIds);
      blocks.push({ type: "heading", level, text, id });
      headings.push({ level, text, id });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      index += 1;
      const codeLines: string[] = [];
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({ type: "code", language, code: codeLines.join("\n") });
      continue;
    }

    if (isTableStart(lines, index)) {
      const header = splitTableRow(lines[index]);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && looksLikeTableRow(lines[index])) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", headers: header, rows });
      continue;
    }

    if (isListItem(trimmed)) {
      const ordered = /^\d+\.\s+/.test(trimmed);
      const items: string[] = [];
      while (index < lines.length) {
        const candidate = lines[index].trim();
        if (!candidate) {
          break;
        }
        if (ordered && /^\d+\.\s+/.test(candidate)) {
          items.push(candidate.replace(/^\d+\.\s+/, "").trim());
          index += 1;
          continue;
        }
        if (!ordered && /^[*-]\s+/.test(candidate)) {
          items.push(candidate.replace(/^[*-]\s+/, "").trim());
          index += 1;
          continue;
        }
        break;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    index += 1;
    while (index < lines.length) {
      const candidate = lines[index].trim();
      if (!candidate || isBlockBoundary(lines, index)) {
        break;
      }
      paragraphLines.push(candidate);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return { blocks, headings };
}

function isBlockBoundary(lines: string[], index: number): boolean {
  const line = lines[index].trim();
  return (
    /^#{1,6}\s+/.test(line) ||
    line.startsWith("```") ||
    isListItem(line) ||
    isTableStart(lines, index)
  );
}

function isListItem(line: string): boolean {
  return /^[*-]\s+/.test(line) || /^\d+\.\s+/.test(line);
}

function isTableStart(lines: string[], index: number): boolean {
  return looksLikeTableRow(lines[index]) && looksLikeTableDivider(lines[index + 1] ?? "");
}

function looksLikeTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.includes("|") && trimmed.split("|").filter((cell) => cell.trim()).length > 1;
}

function looksLikeTableDivider(line: string): boolean {
  return line
    .trim()
    .split("|")
    .filter((cell) => cell.trim())
    .every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=[\]{};:'",.<>/?\\|]/g, "")
    .replace(/\s+/g, "-");
}

function uniqueHeadingId(baseId: string, seen: Map<string, number>): string {
  const normalized = baseId || "section";
  const count = seen.get(normalized) ?? 0;
  seen.set(normalized, count + 1);
  return count === 0 ? normalized : `${normalized}-${count + 1}`;
}
