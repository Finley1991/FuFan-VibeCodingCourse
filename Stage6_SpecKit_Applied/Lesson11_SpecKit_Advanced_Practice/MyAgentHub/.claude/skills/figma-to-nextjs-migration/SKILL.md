---
name: figma-to-nextjs-migration
description: >
  把 Figma Make / v0.dev / Bolt / Lovable 等 UI 原型生成器产出的 Vite + React Router 项目，
  搬家（迁移 / 搬运 / 换成 / migrate / port）到 Next.js 15 App Router 生产脚手架。覆盖路由
  迁移（react-router → next/link + next/navigation）、样式系统合并（globals.css + @theme +
  @custom-variant dark）、字体切换（@import Google Fonts → next/font/google）、客户端组件
  标注（"use client"）、Hydration mismatch 修复（seededRandom 替换 Math.random）、shadcn/ui
  组件库复用、路径别名统一（~/ → @/）。典型触发场景：用户说"把 Figma Make 项目换成 Next.js"、
  "v0.dev 出的代码怎么部署"、"Vite 项目跑不了流式 API / 服务端组件 / Edge Runtime"、
  "React Router 搬家到 App Router"、"Bolt / Lovable 出的原型怎么改造成能上线的项目"。
  Make sure to use this skill whenever the user mentions Figma Make, v0.dev, Bolt, Lovable,
  Vite, React Router, Next.js, App Router, 搬家, 迁移, migrate, port, 流式 API, 服务端组件,
  Edge Runtime, 部署, 即使用户没有明说"请用 figma-to-nextjs-migration skill"。
  不处理反向迁移（Next.js → Remix / Next.js → Vite / App Router → Pages Router）。
---

# figma-to-nextjs-migration — UI 原型到生产脚手架的工程化迁移

## 触发条件

这个 Skill 要在以下对话里被加载：

- 用户提到 **Figma Make / v0.dev / Bolt / Lovable** 等 UI 原型生成器，并希望把产物用到正式项目
- 用户手里有 **Vite + React Router** 的项目，想换成 **Next.js 15 App Router**
- 用户说"搬家"、"迁移"、"换成"、"migrate"、"port"、"改造"这类动作词
- 用户诉苦 Vite 项目"跑不了流式 API"、"做不了服务端组件"、"没法部署到 Vercel"、"Edge Runtime 不支持"
- 用户说"React Router 搬到 App Router 怎么弄"

**不触发**的场景：

- Next.js → Remix / Vite / Astro 等**反向迁移**
- Next.js 内部的 Pages Router → App Router 迁移（那是另一回事，不在本 Skill 覆盖范围）
- 纯 Tailwind 升级 / 纯 shadcn 组件替换等**局部变更**

---

## 核心心智模型（先讲清楚，再干活）

用户拿着 Figma Make / v0.dev 出的 Vite 项目过来的时候，心里常常有一个误解：
**"这是个能接着往下做的脚手架"**——不是的。

- **Figma Make / v0.dev / Bolt / Lovable 是"UI 原型生成器"，不是"脚手架生成器"**
- 它们的定位是设计参考和视觉验证，**不是生产项目的起点**
- 所以"搬家"**不是返工**，不是因为工具做错了——这是工程化的必经之路
- 阶段一（UI 原型）的产出 ≠ 阶段二（工程化）的起点，两者是接力关系

把这段话讲给用户听（用你自己的口吻），让他们理解"为什么不能在 Vite 上硬改"，再开始干活。
详见 @references/migration-steps.md 开头的 "为什么搬家" 章节。

---

## 工作流（7 步，按顺序执行）

> 完整指令和代码块在 `@references/migration-steps.md`。下面是每步的**索引 + 对应物料**。
> 建议：先跟用户确认源项目路径和目标项目名，再按顺序跑。

### Step 1：备份 + 起新脚手架

- 运行 `scripts/backup.sh <源项目路径>` — 带时间戳的完整备份
- 运行 `scripts/create-next-scaffold.sh <新项目名>` — `pnpm create next-app` 固定参数
- 装 shadcn 用到的 Radix UI 依赖（一次性装全，避免漏）
- 详见 @references/migration-steps.md Step 1

### Step 2：样式层迁移

- 用 `next/font/google` 替换 Google Fonts `@import`——参考 `templates/next-fonts-template.ts`
- 合并 `globals.css` + `theme.css` 为单一 `app/globals.css`——参考 `templates/globals-css-template.css`
- 为什么：`next/font` 会自动把字体内联到 build，国内加载快 3-5 秒，且消除 FOUT

### Step 3：shadcn/ui 组件库迁移

- `cp -r` 整个 `components/ui/` 目录到新项目的 `src/components/ui/`
- 复制 `lib/utils.ts`、`components/figma/ImageWithFallback.tsx`
- 检查并修正 import 路径：把老项目的 `@/app/lib/utils` 或 `~/` 一律改成 `@/lib/utils`

### Step 4：布局层重构

- 原项目里 `routes.tsx` 的 `Root` 函数（带 Header + Outlet + Footer）→ Next.js `app/layout.tsx`
- 由于 Next.js 没有内置 `NavLink`，自己封装一个用 `usePathname()` 判断 active
- 详细模板见 `templates/next-layout-template.tsx`
- Header 里用 `usePathname()` 了就得标 `"use client"`；Footer 没交互，服务端组件即可

### Step 5：页面层迁移（逐页复制）

按下表对应复制到 Next.js 文件路由位置：

| React Router 源 | Next.js 目标 |
|---|---|
| `pages/Landing.tsx` | `app/page.tsx` |
| `pages/Pricing.tsx` | `app/pricing/page.tsx` |
| `pages/Gallery.tsx` | `app/gallery/page.tsx` |
| `pages/AgentDetail.tsx` | `app/agent/[id]/page.tsx` |
| `pages/RunHistory.tsx` | `app/runs/page.tsx` |
| `pages/Settings.tsx` | `app/settings/page.tsx` |
| `pages/Pipeline.tsx` | `app/pipeline/page.tsx` |

完整 React Router ↔ Next.js API 对照表见 @references/rr-to-next-mapping.md。

同时创建 `app/not-found.tsx`——参考 `templates/not-found-template.tsx`。

### Step 6：批量替换 react-router + 标 "use client"

- 按 @references/use-client-rules.md 判断哪些页面要标 `"use client"`——有 `useState`
  / `useEffect` / `onClick` / 浏览器 API / `useRouter` / `usePathname` / `useSearchParams`
  / `useParams` 任一就要标
- 把 `import { Link } from 'react-router'` → `import Link from 'next/link'`
- 把 `import { useParams } from 'react-router'` → `import { useParams } from 'next/navigation'`
- 把所有 `<Link to="...">` → `<Link href="...">`
- 把相对路径 import 统一成 `@/...` 绝对别名

### Step 7：修 Hydration mismatch + 启动验证

- 如果 mock-data 里有 `Math.random()` / `new Date(Date.now())`，会导致服务端和客户端渲染
  结果不一致，Next.js 控制台会喷 Hydration warning
- 修法：用 `seededRandom(42)` 替换 `Math.random()`，用固定时间戳替换 `Date.now()`
- 详见 @references/hydration-fixes.md
- 最后运行 `scripts/verify.sh` 一键验证 7 个路由

---

## 关键决策规则

当你在执行上面 7 步时遇到判断点，按以下规则处理：

- **哪些页面要标 `"use client"`？** → 查 @references/use-client-rules.md 的判定表
- **遇到 Hydration mismatch？** → 查 @references/hydration-fixes.md 的修复模式
- **Gallery / mock-data 里有 `Math.random()` 怎么办？** → 改成 `seededRandom(42)` 的 `rand()`
- **shadcn 组件报 "Can't resolve '@/app/lib/utils'"？** → 统一成 `@/lib/utils`（去掉 `/app`）
- **Footer 在后台页想不显示？** → 直播版保持始终显示；进阶版用 Next.js 路由组
  `app/(dashboard)/layout.tsx`，课后玩
- **遇到不认识的报错？** → 查 @references/common-errors.md 的错误-原因-修复表

---

## 验收标准（搬完要过这几关）

按顺序检查：

1. `pnpm dev` 无报错启动
2. `pnpm build` 无 TypeScript 类型错误通过
3. 浏览器依次访问 7 个路由（`/`、`/pricing`、`/gallery`、`/agent/agent-1`、`/runs`、
   `/settings`、`/pipeline`）全部能打开且视觉和 Figma Make 版本一致
4. 浏览器控制台**无 Hydration mismatch 警告**
5. 顶部导航高亮当前页工作正常
6. 中文字体（思源黑体）正常加载，不是 fallback 宋体
7. 跑 `scripts/verify.sh` 全绿

只要有一项不过，回到对应 Step 补修。

---

## 反模式（AI 要主动规避 / 主动劝阻用户）

这些是迁移过程里常见的"走捷径最后挖坑"的做法，遇到就要明确说"不要这么做"：

- **不要在 Vite 项目上直接加 Next.js 依赖硬改**——要起新项目。硬改 = 学习"怎么把 Vite 改造
  成 Next.js"，完全偏离目标
- **不要把 Google Fonts `@import` 留在 globals.css**——Next.js 有 `next/font/google`，自动
  内联、自动 preload，比 CDN 请求快得多
- **不要在 Server Component 里用 `useState` / `useEffect` / 浏览器 API**——必须先标 `"use client"`
- **不要把 Figma Make 的 `~/` path alias 照搬**——统一改成 Next.js 默认的 `@/`
- **不要保留 `routes.tsx` 和 `createBrowserRouter`**——Next.js App Router 是文件系统路由，
  `routes.tsx` 整个扔掉
- **不要漏装 Radix UI 依赖**——shadcn 组件间相互依赖，漏一个就编译炸，一次性全装（清单见
  @references/migration-steps.md Step 1.4）
- **不要手工 diff 7 个页面的 react-router 调用**——30-40 处很容易漏，用 Claude Code 批量替换
- **不要无视 Hydration warning**——虽然不影响功能，但会干扰后续调试时的控制台阅读

---

## 相关物料清单

当你按 7 步往下走时，会用到这些文件：

**references/**（按需 @ 引用的深度资料）

- `@references/migration-steps.md` — 7 步完整流程详解
- `@references/rr-to-next-mapping.md` — React Router ↔ Next.js API 对照表
- `@references/use-client-rules.md` — "use client" 判定规则和 7 页清单
- `@references/hydration-fixes.md` — Hydration mismatch 的 seededRandom 修复模式
- `@references/common-errors.md` — 常见报错表 + 解法

**templates/**（直接 copy 到用户项目的代码模板）

- `templates/next-layout-template.tsx` — `app/layout.tsx` + NavLink 封装
- `templates/not-found-template.tsx` — `app/not-found.tsx`
- `templates/next-fonts-template.ts` — `next/font/google` 配置
- `templates/globals-css-template.css` — 合并后的 globals.css

**scripts/**（直接执行的 bash 脚本）

- `scripts/backup.sh` — 备份源项目
- `scripts/create-next-scaffold.sh` — `pnpm create next-app` 固定参数
- `scripts/verify.sh` — 搬家后一键验证

**examples/**（成功案例）

- `examples/agenthub-migration-log.md` — 本课程第一次搬家的完整记录

---

## 执行建议

跟用户对话时：

1. **先对齐源项目路径和目标项目名**——不要猜，让用户告诉你
2. **每一步做完就汇报**——不要 7 步跑完一次性 dump，用户会跟不上
3. **遇到报错先查 common-errors.md**——而不是临场发挥
4. **不要擅自改业务逻辑、Tailwind class、中文文案、原有注释**——你只做迁移，不做优化
