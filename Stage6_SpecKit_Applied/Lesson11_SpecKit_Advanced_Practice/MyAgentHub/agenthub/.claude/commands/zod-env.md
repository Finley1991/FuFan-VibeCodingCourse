---
description: 环境变量 Zod 校验铸造助手
argument-hint: [可选] 描述你的 env 需求，例如：server 端 OPENAI_API_KEY + client 端 NEXT_PUBLIC_APP_URL
allowed-tools: Read, Write, Edit, Bash, Grep
---

# 环境变量 Zod 校验铸造助手

你好！我帮你把这个 Next.js 项目的环境变量用 Zod 锁成 **build-time 校验**——让配错的 env 在 `pnpm build` 阶段就被拦下，而不是部署到线上让用户 500。

走 3 步就够。

---

## 第 1 步：扫描项目现状

动手前先摸清家底。我会按顺序做三件事：

1. **Read** 项目里所有 env 相关文件：`.env`、`.env.local`、`.env.example`、`.env.production`（存在的都读一遍，不存在就跳过）
2. **Read** `next.config.ts`，看里面有没有 `process.env.XXX` 的直接引用
3. **Grep** 全仓 `process.env\.` 的访问位置（`src/**/*.ts`、`src/**/*.tsx`、`app/**/*.ts` 等），把所有被用到的 env 变量名收集齐

扫完告诉你一句话总结：

> 你的项目用到了 **N** 个环境变量，其中 **M** 个是 server-only（敏感，绝不能泄露），**K** 个是 `NEXT_PUBLIC_` 前缀（会打包进客户端 JS bundle）。

这一步不写文件，只收集信息。

---

## 第 2 步：分类与校验规则

扫到的变量要分三类放：

- **server**：只服务端可见（`*_API_KEY` / `*_SECRET` / `DATABASE_URL` / `*_TOKEN` 这些敏感货）——**绝不允许带 `NEXT_PUBLIC_` 前缀**
- **client**：`NEXT_PUBLIC_` 开头、会被 Next.js 打进浏览器 bundle 的（`NEXT_PUBLIC_APP_URL`、`NEXT_PUBLIC_ANALYTICS_ID` 等）
- **shared**：服务端和客户端都要读、又不敏感的（`NODE_ENV`、`VERCEL_URL` 这类）

再按字段特性决定校验方式：

- **必填 vs 可选**：不明确就**默认必填**（宁严勿松）
- **固定前缀**：OpenAI `sk-` / Anthropic `sk-ant-` / DeepSeek `sk-` → 用 `.startsWith(...)`
- **URL 类**：名字含 `_URL` 的 → 用 `.url()`
- **数字类**：名字含 `_PORT` / `_TIMEOUT` / `_LIMIT` → 用 `z.coerce.number()`（env 永远是 string，必须 coerce）

---

### ⭐ 关键规则：够用就别问，用默认继续

这条命令同时服务两种场景：交互式（一问一答）和非交互式（`claude -p` 一次性出文件）。所以——

**如果用户在上一句话里已经说清了 server / client 各要哪些变量，就不要再逐个反问，直接按名字套合理默认：**

| 命名特征 | 默认归类 | 默认校验 |
|---|---|---|
| `*_API_KEY` / `*_SECRET` / `*_TOKEN` | server | 必填 + `.startsWith(...)`（不认识的 provider 降级 `.min(10)`） |
| `NEXT_PUBLIC_*` | client | 必填；含 `_URL` 加 `.url()` |
| `NODE_ENV` / `VERCEL_*` | shared | 按语义给默认值 |
| `*_PORT` / `*_TIMEOUT` / `*_LIMIT` | server | `z.coerce.number()` |
| 没明说必选/可选的 | server | **一律默认必填**，注释写"如要改可选换 `.optional()`" |

**额外默认行为**：

- 如果扫到 `.env.example` 有变量而用户没提，把这些也**默认**带进 schema，注释标"来自 .env.example"
- 所有默认选择都要在产出的 `env.ts` 里写**行内注释**提醒用户能改
- **只有**当用户给的信息真的少到连变量名都没说（只一句"帮我做个 env 校验"），才停下来把变量清单问齐

---

## 第 3 步：产出 4 件套

信息收齐（或决定用默认继续）后，一次性给你 4 份，缺一不可。

### 产出 1 · `src/env.ts`（T3 Stack 三 schema 模式）

**硬性要求**：

1. **必须分 `serverSchema` / `clientSchema` / `sharedSchema` 三个 schema**（T3 Stack 经典模式，缺一不可）
2. **当前项目 shared 如果没变量，也要保留 `sharedSchema = z.object({})` 空对象占位**，不允许删掉这行——统一代码形状，日后加 shared 变量知道往哪放
3. **API Key 必须用 `.startsWith(...)` 校验前缀**（`sk-` / `sk-ant-` 等），防止 Anthropic key 被错填进 `OPENAI_API_KEY` 这类事故
4. `NEXT_PUBLIC_APP_URL` 这类必须用 `.url()`
5. 解析失败要走**自定义 errorFormat**，给出"哪个变量错了、应该是什么格式"的友好提示
6. 三个 schema 合并成一个 exported `env` 对象，供项目代码 `import { env } from "@/env"` 使用

示范代码（`src/env.ts`）：

```ts
// ============================================================
// 环境变量 · T3 Stack 三 schema 模式
// ------------------------------------------------------------
// serverSchema : 仅服务端可见的机密（API_KEY / SECRET / DATABASE_URL）
// clientSchema : NEXT_PUBLIC_ 开头、会打进客户端 bundle 的变量
// sharedSchema : 两端都要读的非敏感变量（NODE_ENV / VERCEL_URL）
// ------------------------------------------------------------
// 默认策略：没明说必选/可选的变量，一律按必填处理（宁严勿松）
// 想改可选的，把下面对应字段换成 .optional() 即可
// ============================================================

import { z } from "zod";

// ---------- 1. serverSchema：服务端机密 ----------
const serverSchema = z.object({
  // OpenAI：key 必须以 sk- 开头（防止错填成 Anthropic key）
  OPENAI_API_KEY: z
    .string()
    .startsWith("sk-", "OPENAI_API_KEY 必须以 sk- 开头")
    .min(20, "OPENAI_API_KEY 长度看起来不对"),

  // Anthropic：key 必须以 sk-ant- 开头（默认必填，如要改可选换 .optional()）
  ANTHROPIC_API_KEY: z
    .string()
    .startsWith("sk-ant-", "ANTHROPIC_API_KEY 必须以 sk-ant- 开头")
    .optional(),
});

// ---------- 2. clientSchema：客户端可见 ----------
const clientSchema = z.object({
  // NEXT_PUBLIC_ 开头的变量会被 Next.js 打进浏览器 bundle
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL 必须是合法 URL，例如 https://example.com"),
});

// ---------- 3. sharedSchema：两端共享（当前项目暂无 shared 变量） ----------
// 暂无 shared 变量，此处留空方便日后扩展（如加 NODE_ENV / VERCEL_URL 再往里塞）
// 千万别删掉这一行——保留 z.object({}) 占位可保持代码形状统一
const sharedSchema = z.object({});

// ---------- 4. 合并 + 解析 + 友好错误 ----------
const merged = serverSchema.merge(clientSchema).merge(sharedSchema);

const parsed = merged.safeParse(process.env);

if (!parsed.success) {
  // 自定义 errorFormat：把 Zod 默认的 JSON 路径翻译成人能看懂的话
  const formatted = parsed.error.issues
    .map((i) => `  · ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  console.error(
    "\n[env] 环境变量校验失败，build 终止：\n" +
      formatted +
      "\n请参照 .env.example 补齐/修正，再重试。\n",
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
```

### 产出 2 · `.env.example`（按 schema 自动生成）

基于上面三个 schema 的字段，自动产出一份 `.env.example`，每个变量都带注释说明**用途 / 格式 / 获取方式**：

```bash
# ==========================================================
# 环境变量示例 · 由 /zod-env 根据 src/env.ts 自动生成
# 新人克隆项目后：cp .env.example .env.local 再填值
# ==========================================================

# ---------- server（服务端机密，严禁带 NEXT_PUBLIC_ 前缀）----------

# OpenAI API Key
# 格式：以 sk- 开头的字符串
# 获取：https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Anthropic API Key（可选，用 Claude 模型时才需要）
# 格式：以 sk-ant- 开头的字符串
# 获取：https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-...

# ---------- client（NEXT_PUBLIC_ 前缀，会打进浏览器 bundle）----------

# 应用公开访问地址
# 格式：合法 URL（含 https://）
# 本地默认：http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 产出 3 · `next.config.ts` 改法

为了让校验在 **build 时**执行（而不是 runtime 才炸），必须在 `next.config.ts` 顶部 **import** 一次 `env.ts`——import 副作用会触发上面的 `safeParse`，env 错了 `pnpm build` 直接失败。

```ts
// next.config.ts
import "./src/env"; // 或者走路径别名：import "@/env"

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ...你原有的配置
};

export default nextConfig;
```

> 为什么这么设计：Vercel 部署时 build 阶段炸掉 = 部署直接失败，线上老版本继续服务；比部署成功后 runtime 500 友好一万倍。

### 产出 4 · 判断力检查（还能更健壮的 3-5 条）

1. 🔐 **加 dotenv-vault 做多环境管理**：`.env.development` / `.env.staging` / `.env.production` 各一份，避免本地 key 泄漏到仓库。
2. 🤝 **团队密钥共享走 Doppler / Infisical**：别在 Slack 丢 `.env` 文件，密钥一旦在聊天记录里就等于泄露。
3. 🧪 **production 和 development 的 schema 可以不同**：dev 允许 mock 值（例如 `OPENAI_API_KEY=sk-mock-xxx` 跳过 `.startsWith` 用 `.refine` 放行），prod 严格校验。
4. 🚨 **把 server env 泄露到 client 做静态检查**：在 `serverSchema` 外再加一层 `.refine`，禁止字段名以 `NEXT_PUBLIC_` 开头，彻底杜绝 Stripe key 被错加前缀的事故。
5. 🧩 **接入 `@t3-oss/env-nextjs`**：官方库帮你自动做"server env 不能在 client 被 import"的运行时守卫，比手搓再上一层保险。

---

## 完成之后

`env.ts` 造完，跑一次 `pnpm build` 验证——故意把 `.env.local` 里某个 key 改错，看 build 是不是如预期失败。失败了才说明校验真的生效了。

准备好了的话，把你的变量清单告诉我（server 要哪些、client 要哪些就行），我就用上面的默认策略直接开造；信息不够我再问你。
