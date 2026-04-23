# AgentHub 首次搬家记录（成功案例）

> 这份文档是 `part1-02-agenthub-prep-migration.md` 的**压缩版成功案例**。
> 完整原文 1000+ 行；这里压缩到 200 行以内，供后续同类搬家快速参考。

## 背景

- **源项目**：Figma Make 出的 AgentHub UI 原型
  - 路径：`/Users/muyu/MuYuCourseSpace/MyAgentHub/Start Project/`
  - 技术栈：Vite + React Router v7 + Tailwind v4 + shadcn/ui
  - 特点：7 个页面 + 40+ 个 shadcn 组件 + 中文化 + 视觉规范（Prep-02 过）
- **目标项目**：Next.js 15 App Router 生产脚手架
  - 路径：`/Users/muyu/MuYuCourseSpace/MyAgentHub/agenthub/`
  - 技术栈：Next.js 15 + TS + Tailwind v4 + App Router + shadcn/ui
- **为什么搬**：下半场要教流式 API / 服务端组件 / Edge Runtime / Vercel 部署——Vite 原生都做不了
- **耗时**：第一次 ~45 分钟，熟了之后 ~20 分钟，Skill 化后 ~10 分钟

## 执行记录

### Step 1：备份 + 脚手架（实际 ~5 分钟）

```bash
cd /Users/muyu/MuYuCourseSpace/MyAgentHub
cp -r "Start Project" "Start Project.backup-20240420-143000"

pnpm create next-app@latest agenthub \
  --typescript --tailwind --app --src-dir \
  --no-eslint --no-turbopack \
  --import-alias "@/*" --use-pnpm

cd agenthub
pnpm dev  # 确认欢迎页 OK，Ctrl+C
pnpm add <26 个 Radix UI 包> <10 个 shadcn 相关库>  # 一次性装全
```

关键点：一次性装全 Radix 依赖，避免后面用 shadcn 组件时缺包报错。

### Step 2：样式层迁移（实际 ~5 分钟）

- 源项目三份样式（`globals.css` + `theme.css` + `fonts.css`）合并成单一 `app/globals.css`
- Google Fonts `@import` 全部换成 `next/font/google`
- 删掉 `@theme inline` 的双层写法，只保留单层 `@theme`

关键变化：

```diff
- @import 'tailwindcss' source(none);
- @source '../**/*.{js,ts,jsx,tsx}';
+ @import "tailwindcss";
```

```diff
- /* fonts.css */
- @import url('https://fonts.googleapis.com/css2?family=Inter:...');
+ /* layout.tsx */
+ import { Inter, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
+ const inter = Inter({ subsets: ["latin"], variable: "--font-inter", ... });
```

### Step 3：shadcn/ui 搬家（实际 ~3 分钟）

```bash
cp -r "Start Project/src/app/components/ui"  agenthub/src/components/ui
cp "Start Project/src/app/lib/utils.ts"       agenthub/src/lib/utils.ts
mkdir -p agenthub/src/components/figma
cp "Start Project/src/app/components/figma/ImageWithFallback.tsx" agenthub/src/components/figma/
```

路径别名冲突：源项目 `@` 指向 `src/app/`，新项目 `@` 指向 `src/`——批量把
`@/app/lib/utils` 改成 `@/lib/utils`。

### Step 4：布局重构（实际 ~5 分钟）

- 原项目 `routes.tsx` 的 `Root` 函数搬到 `app/layout.tsx` + `components/layout.tsx`
- `components/layout.tsx` 顶部加 `"use client"`
- 把 `NavLink from 'react-router'` 换成自己封装的 `NavLink`（用 `usePathname()` 判断 active）
- 把 `<Link to="...">` 全改成 `<Link href="...">`

### Step 5：7 个页面迁移（实际 ~10 分钟）

逐页复制到文件路由对应位置：

| 源 | 目标 |
|---|---|
| `pages/Landing.tsx` | `app/page.tsx` |
| `pages/Pricing.tsx` | `app/pricing/page.tsx` |
| `pages/Gallery.tsx` | `app/gallery/page.tsx` |
| `pages/AgentDetail.tsx` | `app/agent/[id]/page.tsx` |
| `pages/RunHistory.tsx` | `app/runs/page.tsx` |
| `pages/Settings.tsx` | `app/settings/page.tsx` |
| `pages/Pipeline.tsx` | `app/pipeline/page.tsx` |

额外创建：`app/not-found.tsx`（404 页）。

### Step 6：批量替换 react-router + 标 "use client"（实际 ~10 分钟）

- Landing / Pricing 纯展示，**不标** `"use client"`（服务端组件）
- Gallery / AgentDetail / RunHistory / Settings / Pipeline 这 5 页**必须标** `"use client"`
- 批量替换 `import { Link } from 'react-router'` → `import Link from 'next/link'`
- 批量替换 `<Link to="...">` → `<Link href="...">`
- 批量替换 `../lib/mock-data` → `@/lib/mock-data` 等相对路径

手工检查：Landing 的 `/docs` 死链改成外部占位。

### Step 7：Hydration 修复 + 启动验证（实际 ~5 分钟）

发现 `mock-data.ts` 有 `Math.random()` 和 `new Date(Date.now() - ...)`，导致
Hydration mismatch。修法：

```ts
// 顶部加：
function seededRandom(seed: number) {
  return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
}
const rand = seededRandom(42);
const MOCK_NOW = 1713600000000;

// 全局替换：Math.random() → rand(); Date.now() → MOCK_NOW
```

启动 `pnpm dev`，逐页访问 7 个路由，控制台干净无警告。

## 最终结构

```
agenthub/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx              (Landing)
│   │   ├── not-found.tsx
│   │   ├── pricing/page.tsx
│   │   ├── gallery/page.tsx
│   │   ├── agent/[id]/page.tsx
│   │   ├── runs/page.tsx
│   │   ├── settings/page.tsx
│   │   └── pipeline/page.tsx
│   ├── components/
│   │   ├── layout.tsx
│   │   ├── ui/*.tsx              (40+ shadcn components)
│   │   └── figma/ImageWithFallback.tsx
│   └── lib/
│       ├── utils.ts
│       ├── mock-data.ts
│       ├── design-tokens.json
│       └── normalization-report.ts
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config (内含在 globals.css)
```

## 验收结果

- `pnpm dev` 无报错启动
- `pnpm build` 无 TS 类型错误通过
- 7 个路由全部 200
- 浏览器控制台无 Hydration warning
- 顶部导航高亮当前页
- 中文字体（思源黑体）正常加载
- 暗色模式生效

## 经验教训

1. **一次性装全 Radix 依赖**——漏装一个就编译炸，来回 debug 很烦
2. **先做备份再动手**——搬家过程中总有"想回去看看原来怎么写的"
3. **Landing / Pricing 保持服务端组件**——首屏渲染最快，也为后面讲 RSC 做铺垫
4. **手工改 7 页 react-router 容易漏**——批量脚本 / AI 批量处理更稳
5. **Hydration warning 要提前修**——不然下半场直播调试时控制台全是红的
6. **路径别名冲突是个隐雷**——Vite 的 `@` 可能是 `src/app/`，Next.js 是 `src/`
7. **ESLint 搬家阶段关掉**——减少干扰；上线前再开
