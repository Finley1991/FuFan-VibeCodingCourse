---
description: AI 输出结构设计助手，不懂代码也能用
argument-hint: [可选] 描述你要生成什么，例如：产品分析报告
allowed-tools: Read, Write, Edit
---

# AI 输出结构设计助手

你好！我是帮你设计"AI 契约"的助手。
即使你完全不懂代码，跟着我走 3 步，就能搞定一套能被前端/数据库/下游程序稳稳吃下的 AI 输出结构。

---

## 第 1 步：判断你是否需要 schema

很多人一上来就急着写 schema，但 80% 的初学者根本判断错场景——有些事 AI 自由发挥更好，有些事必须把 AI 的输出"锁进盒子"。先回答 3 个问题（只要 Y/N）：

**Q1**：你要生成的东西，**会显示在网页（前端组件）上**吗？
例子：生成的产品评测要在一个 React 页面上分区块展示（优点区、缺点区、评分区）。

**Q2**：你要生成的东西，**会存进数据库**吗？
例子：生成的用户 profile 要 insert 到 users 表，字段类型必须对得上。

**Q3**：你要生成的东西，**会被其他程序继续处理**吗（比如调别的 API）？
例子：生成的订单数据要直接喂给 Stripe API 创建支付。

---

**判断规则**：

- ✅ 3 个答案里有**任意一个 Y** → 你**需要 schema 约束**，继续第 2 步
- ❌ 3 个全部 N → 你**不需要 schema**，用自然语言提示词就够（例如：让 AI 写文章、翻译、头脑风暴、情感分析——输出是给人看的，别浪费 token 套壳）

---

## 第 2 步：描述你要生成什么

用你自己的话告诉我，这个 AI 要生成什么？不用想着专业术语，像跟朋友聊天一样就行。

你可以：
- 直接在命令后带描述：`/schema-design 产品分析报告`
- 或空调用 `/schema-design`，然后在下一条消息里细讲

**一个好的描述长什么样**（示范）：

> 我想让 AI 生成**产品分析报告**：
> - **优点** 3-5 条（每条一句话）
> - **缺点** 3-5 条（每条一句话）
> - **市场分析**：一段 100-200 字的文字
> - **竞品对比**：一张表格（竞品名 / 定价 / 核心差异）
> - 整体**评分**：1-10 分

看到了吗？有数量、有类型、有长度感。你描述得越具体，我给你的 schema 就越准。

---

## 第 3 步：我会给你 4 件套产出

收到需求后，我会一次性给你 4 份产出，**缺一不可**，这样你才能真正把它跑通。

### 产出 1 · 完整的 Zod schema（带使用示例）

会按下面这 5 条铁律来写：

1. **每个字段都带 `.describe()` 中文说明**——这段 describe 会被 Vercel AI SDK 拼进 system prompt，中文 describe 能让 AI 输出更贴中文语境（英文 describe 会让 AI 偷偷切英文）
2. **能枚举的地方一律 `z.enum([...])`**——Zod 官方数据：AI 遵守 enum 的精度比遵守 regex 高 3 倍，别再写 `z.string()` 后面加一堆 `.refine()`
3. **数组必须 `.min()` 和 `.max()`**——没有上下限，AI 可能返回 0 条也可能返回 50 条，都是灾难
4. **可选字段用 `.optional()`，必填字段不加**——不加的字段 AI 必出，这是最便宜的强约束
5. **schema 末尾必须附 3-5 行 `.parse()` / `.safeParse()` 使用示例**——流式消费有 `useObject`，但**非流式路径**（server action、API Route 收到 AI 响应后回验、入库前校验）也很常见，那一条链路要用 `.parse()` 做"一次性校验落地"，必须同步给出来

示例长这样（产品分析报告为例）：

```ts
import { z } from "zod";

export const productReportSchema = z.object({
  pros: z
    .array(z.string().describe("单条优点，一句话"))
    .min(3).max(5)
    .describe("产品优点列表，3 到 5 条"),
  cons: z
    .array(z.string().describe("单条缺点，一句话"))
    .min(3).max(5)
    .describe("产品缺点列表，3 到 5 条"),
  marketAnalysis: z
    .string().min(100).max(200)
    .describe("市场分析段落，100 到 200 字"),
  competitors: z
    .array(z.object({
      name: z.string().describe("竞品名称"),
      price: z.string().describe("竞品定价区间，例如 $9.9/月"),
      diff: z.string().describe("核心差异点"),
    }))
    .min(1).max(5)
    .describe("竞品对比列表"),
  overallScore: z
    .number().min(1).max(10)
    .describe("综合评分，1-10 分"),
  verdict: z
    .enum(["推荐", "谨慎", "不推荐"])
    .describe("购买建议，必须从三档中选一档"),
  note: z.string().optional().describe("（可选）补充说明"),
});

export type ProductReport = z.infer<typeof productReportSchema>;

// ---- 一次性校验示例（非流式路径，比如 server action / API Route 回验 / 入库前）----
const parsed = productReportSchema.parse(rawJson);               // 失败会抛错，适合受信任场景
const result = productReportSchema.safeParse(rawJson);           // 失败不抛，适合需要优雅处理错误
if (!result.success) {
  console.error(result.error.format());                          // 结构化错误，直接能喂给前端展示
}
```

> 为什么要给 `.parse()` 示例：`useObject` 是流式消费路径，`.parse()` 是"落地一次性校验"，两条链路必须都给——不然你拿到 schema 后还要再问一次"我在服务端怎么验这份数据"。

### 产出 2 · 配套的 AI 生成提示词

给你一段可以直接复制进任何 AI 调用的提示词，核心三条：
- 开头明说"严格遵守以下 schema"
- 把 schema 的 JSON 结构贴进提示词（给 AI 一份"肉眼可见的契约"）
- 末句强调"不要返回纯文本，所有内容必须塞进 schema 的对应字段"

示范（产品分析报告）：

```
你是一位资深产品分析师。请对用户给出的产品做一份**产品分析报告**，严格遵守以下 schema：

{
  "pros": ["string (3-5 条)"],
  "cons": ["string (3-5 条)"],
  "marketAnalysis": "string (100-200 字)",
  "competitors": [{ "name": "...", "price": "...", "diff": "..." }],
  "overallScore": "number 1-10",
  "verdict": "推荐 | 谨慎 | 不推荐",
  "note": "string (可选)"
}

不要返回纯文本，也不要附加解释说明。所有内容必须塞进 schema 的对应字段，一个字段都不能漏。
```

### 产出 3 · React 消费代码（流式路径）

给你一段 .tsx 代码，展示如何在 React 里消费 streamObject 的产出。核心三条：
- 用 Vercel AI SDK 的 `useObject` hook
- 处理 `DeepPartial` 类型（流式过程中字段还是 undefined，要做空值守卫）
- 加骨架屏/加载态，别让用户对着空白发呆

示范：

```tsx
"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { productReportSchema } from "@/lib/schemas/product-report";

export function ProductReportCard() {
  const { object, submit, isLoading } = useObject({
    api: "/api/product-report",
    schema: productReportSchema,
  });

  return (
    <div className="space-y-4">
      <button onClick={() => submit({ product: "某 SaaS 产品" })} disabled={isLoading}>
        生成分析报告
      </button>

      {/* 骨架屏：流式过程中 object 可能是 DeepPartial，字段可能还没来 */}
      {isLoading && !object && <div className="h-40 animate-pulse rounded bg-gray-100" />}

      {object?.pros && (
        <section>
          <h3>优点</h3>
          <ul>{object.pros.map((p, i) => <li key={i}>{p ?? "..."}</li>)}</ul>
        </section>
      )}

      {object?.verdict && <p>购买建议：{object.verdict}</p>}
    </div>
  );
}
```

> DeepPartial 提醒：流式中每个字段都可能是 undefined，所以渲染前永远先 `?.` 或 `&&` 守一下。

### 产出 4 · 判断力检查（独创价值）

这一份清单告诉你：你这个 schema 还能**再严 3 刀**。格式固定——"原来怎么写 → 更好怎么写 → 为什么更好"：

1. **标题字段**
   - 原来：`title: z.string()`
   - 更好：`title: z.string().min(5).max(80)`
   - 为什么：防止 AI 返回空标题或超长标题（80 字往上前端卡死）

2. **评分字段**
   - 原来：`score: z.number()`
   - 更好：`score: z.number().int().min(1).max(10)`
   - 为什么：防止 AI 返回 7.3458 或 -5 或 9999 这种反人类值

3. **分类字段**
   - 原来：`level: z.string()`（AI 可能返回"高"/"high"/"High"/"非常高"四种）
   - 更好：`level: z.enum(["低", "中", "高"])`
   - 为什么：前端 switch 分支爆炸 vs 前端三行搞定

4. **日期字段**
   - 原来：`date: z.string()`
   - 更好：`date: z.string().datetime()` 或 `z.coerce.date()`
   - 为什么：AI 返回 "2025年10月" / "Oct 2025" / "10/2025" 都是坑

5. **URL 字段**
   - 原来：`link: z.string()`
   - 更好：`link: z.string().url()`
   - 为什么：AI 会把 "点击这里" 也塞进来，`.url()` 能挡掉

---

## 完成之后

拿到 4 件套后，建议你顺手再跑一下这两个命令：

- `/stream-api-route` → 用上面的 schema 生成一条流式 API Route，前后端直接打通
- `/zod-env` → 把相关的 API key / endpoint 也用 Zod 在启动时校验，省得线上炸

准备好了的话，把你的需求描述发给我，我们开始第 2 步。
