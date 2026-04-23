---
description: 流式 AI API 路由生成助手
argument-hint: [可选] 描述你要的路由，例如：/api/report 输入 product，输出 3 优点 + 评分
allowed-tools: Read, Write, Edit, Bash
---

# 流式 AI API 路由生成助手

你好！我帮你把一条 Next.js 15 App Router 的**流式 AI API 路由**稳稳地造出来——Vercel AI SDK `streamObject` + Edge Runtime 的组合，踩过的坑都替你绕开。

---

## 第 1 步：判断你是不是真的需要流式

别上来就冲流式，80% 初学者在不该用流式的地方硬上，白白把项目复杂度翻倍。先回答 3 个问题（Y/N）：

**Q1**：你的 AI 响应是否**超过 3 秒**？（低于 3 秒用户感知不到流式差别，流式反而引入额外错误面）

**Q2**：用户是否**需要看到生成过程**？（像 ChatGPT 那样边写边出，而不是等完整结果一次性弹出来）

**Q3**：你的前端是否**有能力处理流式数据**？（用了 `useObject` / `useChat` 这类 hook，或打算加上）

---

**判断规则**：

- ✅ 3 个都 Y → 继续第 2 步，我们把流式 route 造出来
- ❌ 任意一个 N → 用普通 API + loading spinner 就够，别过度工程化（普通 route 我就不生成了，省得你要维护一套用不上的代码）

---

## 第 2 步：收集关键信息（或直接用默认继续）

理论上我要问你 4 件事：

1. **AI provider**：OpenAI / Anthropic / DeepSeek / 其他？
2. **模型 ID**：例如 `openai/gpt-5.4-mini` / `anthropic/claude-haiku-4.5` / `google/gemini-2.5-flash` / `deepseek/deepseek-v3.2` / `qwen/qwen3.5-flash-02-23`（OpenRouter 命名空间；单厂商账号时去掉前缀即可）？
3. **Zod schema**：是否已有？没有的话建议先跑 `/schema-design` 再回来。
4. **maxDuration**：预估最长响应时间（秒），用来设 Edge Runtime 超时。

---

### ⭐ 关键规则：够用就别问，用默认继续

这条命令要同时支持两种使用场景：
- **交互式**（课堂里老师和学员一问一答）
- **非交互式**（`claude -p "/stream-api-route ..."` 一次性出文件）

所以——**如果用户在上一句话里已经给齐了"路由路径 + 输入形状 + 输出形状"这 3 个核心信息，就不要再反问上面 4 件事**，直接拿下面这套合理默认值继续造 route，并在代码注释里明示默认值位置，方便用户后续替换：

| 要素 | 默认值 | 备注 |
|---|---|---|
| provider | `OpenAI`（`@ai-sdk/openai`） | 生态最成熟、Edge 兼容好 |
| model | `openai/gpt-5.4-mini`（OpenRouter 命名）/ `gpt-5.4-mini`（原厂） | 2026-04 主流便宜档、streamObject 稳定 |
| schema | **内嵌示范 schema** | 根据用户描述的输出形状现造一份，顶部注释提醒"示范 schema，生产请换成 `/schema-design` 的产物" |
| maxDuration | `60` | Vercel Edge 流式的通用安全值 |

**只有**当用户的输入真的贫瘠到造不出任何具体 route（例如只说了"帮我做个流式 API"这种一句话诉求，没路径没数据形状），才停下来把 4 件事问齐。

> 为什么这么设计：死等用户回答 4 件事 = `claude -p` 非交互用户永远拿不到 `route.ts`。"先用默认继续 + 在代码里明示默认值位置"是两全之策——交互式用户依然能随时指定参数覆盖默认值，非交互式用户也能一次拿到可用文件。

---

## 第 3 步：产出 4 件套

收到信息（或决定用默认继续）后，我一次性给你 4 份产出，**缺一不可**。

### 产出 1 · 完整的 Next.js API Route 代码

下面 5 条是**硬性要求**，每条都对应一次真实事故，别省任何一条：

1. **必须 Edge Runtime**：`export const runtime = "edge"` —— cold start 比 Node.js 快 10 倍；但注意 Edge 不兼容 `tiktoken` / `tiktoken-wasm` 这类 native 包，要 token 预估请用 `js-tiktoken`。
2. **必须设 maxDuration**：`export const maxDuration = 60` —— Vercel Edge 默认 30 秒超时，AI 流式超过会被强杀断流。
3. **streamObject 必须带 `onError` 回调** —— 默认出错不抛异常，流会静默结束，用户只会看到一直转圈。`onError` 是防止静默失败的唯一姿势。
4. **必须用 `toTextStreamResponse()`** —— AI SDK v5 (2026) 的 breaking change，旧 `toAIStreamResponse` 已 deprecated；网上很多教程还在用旧 API，会直接报错。
5. **system prompt 必须强调"严格遵守 schema"** —— 单靠 schema 约束不够，必须在 system prompt 里再敲一锤："不要返回纯文本，所有内容必须塞进 schema 的对应字段"。

示范代码（`app/api/report/route.ts`）：

```ts
// ============================================================
// 流式 AI API Route · 默认值一览（想换就改这里）
// ------------------------------------------------------------
// provider    = OpenAI-compatible (@ai-sdk/openai + baseURL)  ← OpenRouter / Azure / 自建
// baseURL     = OPENAI_BASE_URL env                            ← 未设走 OpenAI 官方
// model       = openai/gpt-5.4-mini (OpenRouter 命名)          ← 换模型改这行
// maxDuration = 60 秒                                            ← 预估更久就调大
// schema      = 下方 reportSchema（示范用）                      ← 生产请换成 /schema-design 产物
// ============================================================

import { createOpenAI } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { z } from "zod";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // 可选：走 OpenRouter 时设 https://openrouter.ai/api/v1
});

export const runtime = "edge";        // 硬性要求 1：Edge Runtime
export const maxDuration = 60;        // 硬性要求 2：防止 30 秒超时断流（默认值）

// 示范 schema —— 生产环境请替换为你自己 /schema-design 的产物
const reportSchema = z.object({
  pros: z.array(z.string()).min(3).max(5).describe("优点，3 到 5 条"),
  score: z.number().min(1).max(10).describe("综合评分"),
  verdict: z.enum(["推荐", "谨慎", "不推荐"]).describe("购买建议"),
});

export async function POST(req: Request) {
  const { product } = await req.json();

  const result = streamObject({
    // 默认 OpenRouter 命名空间。换 provider/model 只改这一行：
    //   anthropic/claude-haiku-4.6 / google/gemini-3.1-flash / deepseek/deepseek-v3.2 / qwen/qwen3.5-flash-02-23
    model: openai("openai/gpt-5.3"),
    schema: reportSchema,
    // 硬性要求 5：system prompt 强调 schema，防止 AI 返回纯文本
    system:
      "你是一位资深产品分析师。严格遵守传入的 schema，不要返回纯文本，" +
      "所有内容必须塞进 schema 的对应字段，一个字段都不能漏。",
    prompt: `请对这个产品做分析：${product}`,
    // 硬性要求 3：onError 必加，防止静默失败
    onError: ({ error }) => {
      console.error("[stream-api-route] streamObject error:", error);
    },
  });

  // 硬性要求 4：用 toTextStreamResponse，禁用已 deprecated 的 toAIStreamResponse
  return result.toTextStreamResponse();
}
```

### 产出 2 · 前端 `useObject` 消费代码

```tsx
"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { reportSchema } from "@/lib/schemas/report";

export function ReportCard() {
  const { object, submit, isLoading, error } = useObject({
    api: "/api/report",
    schema: reportSchema,
    onError: (err) => {
      // 前端侧兜底：后端 onError 记日志，前端 onError 做 UI 提示
      console.error("[useObject] client error:", err);
    },
  });

  return (
    <div className="space-y-4">
      <button onClick={() => submit({ product: "某 SaaS 产品" })} disabled={isLoading}>
        生成报告
      </button>

      {error && <p className="text-red-500">生成失败，请重试</p>}

      {/* DeepPartial 守卫：流式中每个字段都可能 undefined，必须 ?. 或 && 守一下 */}
      {object?.pros && (
        <ul>{object.pros.map((p, i) => <li key={i}>{p ?? "..."}</li>)}</ul>
      )}
      {object?.score != null && <p>评分：{object.score}</p>}
      {object?.verdict && <p>建议：{object.verdict}</p>}
    </div>
  );
}
```

### 产出 3 · `.env.example` 模板

```bash
# ==========================================================
# AI Provider API Keys（按你用的 provider 填一个即可）
# 默认 provider = OpenAI-compatible，默认 model = openai/gpt-5.4-mini（OpenRouter 命名）
# 推荐搭 OpenRouter：OPENAI_BASE_URL=https://openrouter.ai/api/v1，只用一个 key 调多家模型
# ==========================================================

# OpenAI（默认）
OPENAI_API_KEY=sk-...

# Anthropic（如切换到 Claude 系列）
ANTHROPIC_API_KEY=sk-ant-...

# DeepSeek（如切换到 DeepSeek 系列，国内友好）
DEEPSEEK_API_KEY=...
```

> 建议搭配 `/zod-env`：把这些环境变量做 build-time Zod 校验，线上少炸一次算一次。

### 产出 4 · 判断力检查（还能更健壮的 3-5 条）

1. **加 Rate Limiting**：流式 AI 单次请求就烧几毛到几块，没限流等于给爬虫送钱。用 Upstash Ratelimit + 用户 ID/IP 做双维度限流。
2. **加请求签名验证**：公网裸奔的 API Key 可能被扒走做羊毛。前端带一个短时效 HMAC，后端验签后再调 AI。
3. **加 Token 预估**：在 route 开头用 `js-tiktoken`（注意：不能用 `tiktoken`，Edge 不兼容）估算输入 token，超过阈值直接拒，防止恶意 prompt 打爆成本。
4. **加超时兜底**：即使设了 `maxDuration = 60`，最好在 route 里再套一层 `AbortController`，让前端能主动取消。
5. **加错误分级**：`onError` 里区分"模型侧错误"（OpenAI 503）和"我方错误"（schema 校验失败），向前端返回不同错误码，方便 UI 做差异化提示。

---

## 完成之后

这条 route 造完，建议立刻跑 `/zod-env`，把 `OPENAI_API_KEY` 这类环境变量用 Zod 在启动时锁一遍——少一次线上 `undefined is not a function` 的绝望时刻。

准备好了的话，把路由需求发给我——只要带上"路径 + 输入 + 输出形状"三件套，我就用默认值直接开造；信息不够我再问你。
