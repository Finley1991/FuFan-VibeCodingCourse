# 搬家常见报错 + 解法

搬家过程中遇到的每一个"看起来不合理"的错，这张表先查一遍再临场发挥。

## 启动 / 编译报错

### 错误 1：`useState can only be used in Client Components`

```
Error: useState can only be used in Client Components.
Add the "use client" directive at the top of the file to use it.
```

- **原因**：文件用了 Client-only hook（useState / useEffect / usePathname 等）但没标
  `"use client"`
- **修复**：在文件**第一行**加 `"use client";`（比所有 import 都靠前）
- **细则**：查 @use-client-rules.md 的判定清单

### 错误 2：`Module not found: Can't resolve 'react-router'`

```
Module not found: Can't resolve 'react-router'
 > import { Link } from 'react-router';
```

- **原因**：还有 import 没换
- **修复**：全局搜 `react-router`，替换成 `next/link` 或 `next/navigation`
  ```bash
  grep -rn "from 'react-router'" src
  ```

### 错误 3：`Property 'to' does not exist on type 'LinkProps'`

```
Type error: Property 'to' does not exist on type
'DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & { ... }'.
```

- **原因**：Next.js 的 `Link` 用的是 `href` 不是 `to`
- **修复**：全局替换
  ```bash
  grep -rn "<Link to=" src
  # 然后批量改
  ```

### 错误 4：`Can't resolve '@/app/lib/utils'`

- **原因**：shadcn utils.ts 从 Vite 老项目过来的 `@/app/lib/utils` 引用，Next.js 的 `@`
  指向 `src/`，没有 `/app` 前缀
- **修复**：批量把 `@/app/lib/utils` 改成 `@/lib/utils`
  ```bash
  find src/components/ui -name "*.tsx" -exec sed -i '' "s|@/app/lib/utils|@/lib/utils|g" {} +
  ```

### 错误 5：`Can't resolve '~/components/...'`

- **原因**：Figma Make 项目常用 `~/` 作 path alias，Next.js 默认是 `@/`
- **修复**：要么改 tsconfig.json 让 `~/` 也生效，要么批量替换成 `@/`
  ```bash
  # 推荐：统一成 @/
  find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '~/|from '@/|g"
  ```

### 错误 6：`pnpm dev` 启动后浏览器访问 404

- **原因**：文件路径没对齐 Next.js 文件路由约定
- **修复**：检查 `src/app/` 下每个 page 文件名必须是 `page.tsx`（不是 `Landing.tsx`）、
  动态段必须用 `[...]`（如 `agent/[id]/page.tsx`）

### 错误 7：`Event handlers cannot be passed to Client Component props`

```
Error: Event handlers cannot be passed to Client Component props.
  {value: ..., onValueChange: function}
                             ^^^^^^^^^
```

- **原因**：从 Server Component 往 Client Component 传函数 prop——跨 RSC 边界不能传函数
- **修复**：把外层父组件也标成 `"use client"`，或者把 handler 移到 Client Component 内部

---

## 运行时 / 渲染报错

### 错误 8：`Hydration failed because the initial UI does not match`

```
Warning: Text content did not match. Server: "1234" Client: "5678"
```

- **原因**：mock-data 或渲染逻辑里有 `Math.random()` / `Date.now()` / `typeof window`
- **修复**：详见 @hydration-fixes.md 的 5 种修复模式。最常用是 seededRandom 替换。

### 错误 9：字体没加载（页面显示宋体 / fallback）

- **原因**：`<html>` 上没挂 font variable className
- **修复**：检查 `src/app/layout.tsx` 的 `<html className={...}>` 是否包含 `${inter.variable}`
  等三个变量。模板见 templates/next-layout-template.tsx

### 错误 10：shadcn 组件样式丢失（按钮是默认蓝色、dialog 没动画）

- **原因**：`globals.css` 里缺 `@import "tw-animate-css"` 或 `@theme` 变量没配
- **修复**：用 templates/globals-css-template.css 完整覆盖一次

### 错误 11：暗色模式失效

- **原因**：缺 `@custom-variant dark (&:is(.dark *));` 或 `<html>` 没挂 `dark` class
- **修复**：
  1. `globals.css` 里确保有 `@custom-variant dark (&:is(.dark *));`
  2. 如果想默认暗色，在 `<html className="dark ...">` 里加 `dark`

### 错误 12：useParams 拿到 undefined

```tsx
const { id } = useParams();  // id is undefined
```

- **原因 1**：文件路径没用动态段 `[id]`
- **修复**：目录结构必须是 `app/agent/[id]/page.tsx`（方括号）
- **原因 2**：在 Server Component 里用了 Client hook
- **修复**：要么加 `"use client"`，要么改用 `{ params }: { params: { id: string } }` props

---

## 构建 / 部署报错

### 错误 13：`pnpm build` 过，但 `pnpm start` 报错

- **原因**：动态组件里用了 build 时不可用的 API（`window` / `localStorage`）
- **修复**：用 Hydration 修复模式 4（客户端延迟）或模式 5（`dynamic(..., { ssr: false })`）

### 错误 14：Vercel 部署时报 `Module not found`

- **原因**：大小写敏感——本地 macOS 不敏感，Vercel 的 Linux 敏感
- **修复**：检查 import 路径大小写和文件名是否一致

### 错误 15：`next/font` 需要网络访问下载字体，build 挂了

- **原因**：首次 build 需要从 Google Fonts 下字体缓存到 `.next/`，公司网络/GFW 可能挂
- **修复**：
  - 本地先 `pnpm build` 一次，让字体缓存到 `.next/cache/webpack`
  - 或者临时换 Inter + JetBrains_Mono（不用 Noto_Sans_SC 这类大字体）
  - 或者配代理

---

## 逻辑 / 业务报错

### 错误 16：导航高亮不工作

- **原因**：Header 里用了 NavLink 但没基于 `usePathname()` 判断
- **修复**：参考 templates/next-layout-template.tsx 里的 NavLink 封装

### 错误 17：Landing 的 "/docs" 链接报 404

- **原因**：Figma Make 生成的占位链接，没有对应页面
- **修复**：改成外部文档占位：
  ```tsx
  <Link href="https://your-docs-url" target="_blank" rel="noopener noreferrer">
    查看文档
  </Link>
  ```

### 错误 18：Gallery 搜索 / 筛选不触发重渲染

- **原因**：`useState` 改了但 UI 没反应——大概率是 page.tsx 没标 `"use client"`，
  当成服务端组件编译了
- **修复**：文件首行加 `"use client";`

### 错误 19：RunHistory 的 Trace 瀑布图不显示

- **原因**：`recharts` 是 Client-only 库，依赖 `window`
- **修复**：确保 page.tsx 有 `"use client";`

### 错误 20：Pipeline 节点点击没反应

- **原因**：Server Component 不支持 onClick
- **修复**：页面文件标 `"use client";`

---

## 搬家完成后的"气味"自检

如果上面都过了，但**感觉**哪里不对，跑一次自检：

```bash
# 1. 有没有还没替换的 react-router
grep -rn "react-router" src && echo "还有 react-router 残留"

# 2. 有没有漏标的 "use client"（检查用了 hook 的文件）
grep -rl "useState\|useEffect\|usePathname\|useParams" src/app | \
  xargs -I {} sh -c 'head -1 {} | grep -q "use client" || echo "没标 use client: {}"'

# 3. 有没有 @/app/ 残留（Vite 遗留）
grep -rn "from '@/app/" src && echo "还有 @/app/ 残留"

# 4. 有没有 Math.random / Date.now（潜在 hydration 风险）
grep -rn "Math.random\|Date.now" src/lib/mock-data.ts && echo "mock-data 还有未确定化的值"
```

干净 = 搬家合格。
