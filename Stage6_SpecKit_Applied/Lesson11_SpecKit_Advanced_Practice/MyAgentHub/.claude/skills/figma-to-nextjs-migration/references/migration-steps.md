# 搬家 7 步完整流程（从 Figma Make / v0.dev / Bolt 的 Vite 项目到 Next.js 15 App Router）

## 目录

1. Step 1：备份 + 起 Next.js 脚手架
2. Step 2：样式层迁移
3. Step 3：shadcn/ui 组件库迁移
4. Step 4：布局层重构
5. Step 5：页面层迁移
6. Step 6：路由和导航批量重写
7. Step 7：启动验证 + Hydration 修复

**前提**：当前目录假设 `$PROJECT_DIR` 是用户的 monorepo 根目录，源项目（Figma Make 产出）在
`$PROJECT_DIR/<源项目名>`，新项目会在 `$PROJECT_DIR/<目标项目名>` 里生成。

---

## Step 1：备份 + 起 Next.js 脚手架（5 分钟）

### 1.1 备份原项目

```bash
cd "$PROJECT_DIR"
cp -r "<源项目>" "<源项目>.backup-$(date +%Y%m%d-%H%M%S)"
```

或者直接用 Skill 自带的 `scripts/backup.sh <源项目路径>`。

**为什么必须备份**：搬家过程中可能"搬到一半发现不对想回去参考"，备份就是你的设计参考底稿，
永远不动。

### 1.2 起 Next.js 15 新项目

```bash
cd "$PROJECT_DIR"

pnpm create next-app@latest <新项目名> \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-eslint \
  --no-turbopack \
  --import-alias "@/*" \
  --use-pnpm
```

各选项解释：

- `--typescript`：TypeScript
- `--tailwind`：Tailwind v4
- `--app`：App Router（不是 Pages Router）
- `--src-dir`：代码放 `src/` 下
- `--no-eslint`：先不开，避免搬家过程被警告干扰
- `--no-turbopack`：先用稳定 Webpack（Turbopack 在某些 shadcn 场景有兼容问题）
- `--import-alias "@/*"`：路径别名对齐 Figma Make 原项目

或直接运行 `scripts/create-next-scaffold.sh <新项目名>`。

### 1.3 进入新项目确认可跑

```bash
cd "<新项目名>"
pnpm dev  # 浏览器打开 http://localhost:3000 看到欢迎页 = 成功
```

Ctrl+C 停掉。

### 1.4 一次性装全 shadcn/ui 依赖

shadcn 组件间相互依赖（`dialog` 依赖 `@radix-ui/react-dialog` 等），漏装一个就编译报错。
一次装全最省事：

```bash
pnpm add \
  @radix-ui/react-accordion @radix-ui/react-alert-dialog \
  @radix-ui/react-aspect-ratio @radix-ui/react-avatar \
  @radix-ui/react-checkbox @radix-ui/react-collapsible \
  @radix-ui/react-context-menu @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu @radix-ui/react-hover-card \
  @radix-ui/react-label @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu @radix-ui/react-popover \
  @radix-ui/react-progress @radix-ui/react-radio-group \
  @radix-ui/react-scroll-area @radix-ui/react-select \
  @radix-ui/react-separator @radix-ui/react-slider \
  @radix-ui/react-slot @radix-ui/react-switch \
  @radix-ui/react-tabs @radix-ui/react-toggle-group \
  @radix-ui/react-toggle @radix-ui/react-tooltip

pnpm add \
  class-variance-authority clsx tailwind-merge \
  tw-animate-css cmdk date-fns lucide-react \
  react-day-picker react-hook-form react-resizable-panels \
  recharts sonner embla-carousel-react input-otp vaul
```

---

## Step 2：样式层迁移（5 分钟）

源项目的样式常见是分散在 `globals.css` + `theme.css` + `fonts.css` 三个文件，**而且两个文件
里有重复的 @theme 定义**。搬家时合并成单一 `app/globals.css`。

### 2.1 用 next/font 加载字体

替换源项目 `fonts.css` 里的 Google Fonts `@import`。参考 `templates/next-fonts-template.ts`。

**为什么用 next/font 而不是 @import**：

1. next/font 会自动下载字体、内联到 build，避免运行时请求 Google 服务器（国内加载快 3-5 秒）
2. 自动生成稳定的 font-family CSS 变量（`--font-inter` 等），避免 FOUT（无样式闪烁）
3. 自动 preload，首屏性能最优

### 2.2 合并并重写 globals.css

用 `templates/globals-css-template.css` 的内容**完整覆盖** `src/app/globals.css`。

关键变化：

- 原来的 `@import 'tailwindcss' source(none); @source '../**/*.{js,ts,jsx,tsx}';` →
  换成标准 `@import "tailwindcss"`（Next.js 默认会扫 `src/` 目录）
- `var(--font-inter)` 等字体变量来自 `next/font/google` 注入到 `<html>` 的 className
- 删掉 `theme.css` 里 `:root` + `@theme inline` 的双层写法，只保留单层 `@theme`

---

## Step 3：shadcn/ui 组件库迁移（3 分钟）

### 3.1 复制整个 ui 目录

```bash
cp -r "<源项目>/src/app/components/ui" \
      "<新项目>/src/components/ui"
```

### 3.2 复制 utils.ts（shadcn 的 cn 函数）

```bash
cp "<源项目>/src/app/lib/utils.ts" \
   "<新项目>/src/lib/utils.ts"
```

### 3.3 批量修正 ui 组件里的 import 路径

shadcn 组件里用 `@/components/ui/xxx` 和 `@/lib/utils`。在 Vite 原项目里 `@` 可能指向
`src/app/`，在 Next.js 里 `@` 指向 `src/`，所以如果有 `@/app/lib/utils` 要改成 `@/lib/utils`：

```bash
cd "<新项目>"
grep -rn "from '@/app/" src/components/ui || echo "没有误引用，safe"

# 如果有命中，批量替换
find src/components/ui -name "*.tsx" -exec sed -i '' "s|@/app/lib/utils|@/lib/utils|g" {} +
```

### 3.4 复制 figma/ImageWithFallback（如果用到）

```bash
mkdir -p src/components/figma
cp "<源项目>/src/app/components/figma/ImageWithFallback.tsx" \
   src/components/figma/ImageWithFallback.tsx
```

---

## Step 4：布局层重构（5 分钟）

原项目的布局通常在 `routes.tsx` 的 `Root` 函数里（Header + Outlet + Footer）。Next.js 把这个
搬到 `app/layout.tsx`。

### 4.1 复制并改造 layout.tsx

把源项目的 `components/layout.tsx` 复制过来，然后做三处替换：

1. 顶部加 `"use client"`（因为 `usePathname` 是 Client-only hook）
2. `import { NavLink, Link } from 'react-router'` → `import Link from 'next/link'` +
   `import { usePathname } from 'next/navigation'`
3. 自己写一个本地 `NavLink` 封装（Next.js 没内置），用 `usePathname()` 判断 active

具体代码见 `templates/next-layout-template.tsx`。

### 4.2 重写 src/app/layout.tsx

整合字体加载 + Header + Footer，参考 `templates/next-layout-template.tsx` 里的
`RootLayout` 部分。

**和原项目的区别**：原项目里 Footer 可能是特定页面才显示的，在 Next.js 里有两种做法：

- **简单版**：layout.tsx 始终渲染 Footer（直播推荐，目测不碍事）
- **精细版**：后台页用路由组（`app/(dashboard)/runs/page.tsx` + `app/(dashboard)/layout.tsx`）

直播版只需要简单版。

---

## Step 5：页面层迁移（10 分钟）

### 5.1 复制 mock-data 和设计 token

```bash
cp "<源项目>/src/app/lib/mock-data.ts" \
   "<新项目>/src/lib/mock-data.ts"
cp "<源项目>/src/app/lib/design-tokens.json" \
   "<新项目>/src/lib/" 2>/dev/null || true
cp "<源项目>/src/app/lib/normalization-report.ts" \
   "<新项目>/src/lib/" 2>/dev/null || true
```

### 5.2 逐页迁移（7 页）

按下表把页面文件移到对应位置：

| 原项目 | Next.js 目标路径 |
|---|---|
| `pages/Landing.tsx` | `src/app/page.tsx` |
| `pages/Pricing.tsx` | `src/app/pricing/page.tsx` |
| `pages/Gallery.tsx` | `src/app/gallery/page.tsx` |
| `pages/AgentDetail.tsx` | `src/app/agent/[id]/page.tsx` |
| `pages/RunHistory.tsx` | `src/app/runs/page.tsx` |
| `pages/Settings.tsx` | `src/app/settings/page.tsx` |
| `pages/Pipeline.tsx` | `src/app/pipeline/page.tsx` |

每一页都是 `mkdir -p <目标目录>` 然后 `cp <源文件> <目标>/page.tsx`。

### 5.3 创建 404 页

参考 `templates/not-found-template.tsx`，写到 `src/app/not-found.tsx`。

---

## Step 6：路由和导航批量重写（10 分钟）

这是搬家里**工作量最集中**的一步——要把每个页面里的 `react-router` 用法全部换成 Next.js
等价物。

### 6.1 给需要的页面加 "use client"

根据 @use-client-rules.md 的判定表，**当前 7 页里**通常需要加的是：Gallery / AgentDetail /
RunHistory / Settings / Pipeline（这 5 页有 useState、useEffect、onClick 等交互）。

Landing / Pricing 是纯展示，保持服务端组件。

### 6.2 批量替换 react-router → Next.js

批量替换规则（交给 Claude Code / Cursor 执行）：

1. **import 替换**
   - 删除所有 `import { Link } from 'react-router';`
   - 删除所有 `import { useParams } from 'react-router';`
   - 删除合并 `import { Link, useParams } from 'react-router';`
   - 文件顶部（`"use client"` 之后）加：
     - 用到 Link 的文件：`import Link from 'next/link';`
     - 用到 useParams 的文件：`import { useParams } from 'next/navigation';`

2. **JSX 属性替换**
   - `<Link to="...">` → `<Link href="...">`
   - `<Link to={...}>` → `<Link href={...}>`
   - 模板字符串：`<Link to={`/agent/${id}`}>` → `<Link href={`/agent/${id}`}>`

3. **useParams 类型适配**
   - `const { id } = useParams();` 保留（Next.js 13+ 签名兼容）
   - TS 报错就改成 `const { id } = useParams<{ id: string }>();`

4. **相对路径 import 改为 @/**
   - `../components/ui/button` → `@/components/ui/button`
   - `../lib/mock-data` → `@/lib/mock-data`
   - `../lib/utils` → `@/lib/utils`
   - `../components/figma/ImageWithFallback` → `@/components/figma/ImageWithFallback`

5. **保留不变**
   - 所有 Tailwind class
   - 所有已有注释
   - 所有业务逻辑（useState / useEffect / handleSend 等）
   - 所有中文文案

每迁移完一个文件，在文件头加一行注释：

```tsx
// [Prep-03] Migrated from react-router to Next.js App Router
```

### 6.3 手动检查死链

Figma Make 出的原型有时会有死链（比如 `<Link to="/docs">` 但没有 `/docs` 页面）。搬家后检查
一下，把死链改成外部占位或静态 `<a>`。

---

## Step 7：启动验证 + Hydration 修复（5 分钟）

### 7.1 启动 dev server

```bash
cd "<新项目>"
pnpm dev
```

### 7.2 逐页目视检查

打开浏览器，逐个访问 7 个 URL，每一页做下面的检查：

- `http://localhost:3000/` — Landing：Hero 按钮、Stats Row、精选 Agent 卡片
- `http://localhost:3000/pricing` — 三档定价卡
- `http://localhost:3000/gallery` — 搜索 + 筛选 + 卡片
- `http://localhost:3000/agent/agent-1` — 左右布局 + Playground
- `http://localhost:3000/runs` — Trace 瀑布图
- `http://localhost:3000/settings` — 5 个 Tab
- `http://localhost:3000/pipeline` — 节点画布

也可以直接跑 `scripts/verify.sh`。

### 7.3 修 Hydration mismatch

`mock-data.ts` 里常有 `Math.random()` 和 `new Date(Date.now() - ...)`——这会导致服务端和
客户端渲染出不同数字，Next.js 抛 Hydration mismatch 警告。

详见 @hydration-fixes.md 的 seededRandom 修复模式。

### 7.4 常见报错排查

见 @common-errors.md。

---

## 搬家完成判据

- [ ] `pnpm dev` 无报错启动
- [ ] `pnpm build` 无类型错误通过
- [ ] 7 个路由都能访问且视觉和原型一致
- [ ] 浏览器控制台无 Hydration warning
- [ ] 顶部导航高亮当前页
- [ ] 中文字体正常加载
- [ ] `scripts/verify.sh` 全绿
