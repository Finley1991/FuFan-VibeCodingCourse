# "use client" 判定规则

Next.js 15 App Router **默认所有组件都是服务端组件**。任何文件只要用了以下任一特性，必须在
文件首行（在所有 import 之前）加 `"use client";`。

## 判定清单

只要文件里出现下面**任一**，就必须加 `"use client"`：

### React Hooks

- `useState`
- `useEffect`
- `useMemo`
- `useCallback`
- `useRef`
- `useReducer`
- `useContext`（如果 context 里装了 state）
- `useLayoutEffect`
- `useImperativeHandle`

### Next.js Client Hooks

- `useRouter` from `next/navigation`
- `usePathname` from `next/navigation`
- `useSearchParams` from `next/navigation`
- `useParams` from `next/navigation`
- `useSelectedLayoutSegment` / `useSelectedLayoutSegments`

### 事件处理

- `onClick` / `onChange` / `onSubmit` / `onKeyDown` / `onFocus` / `onBlur` / `onMouseEnter` …
- 任何 `on*` 属性

### 浏览器 API

- `window` / `document` / `navigator` / `localStorage` / `sessionStorage`
- `fetch` 放客户端（服务端组件推荐直接 `await fetch`）
- `setTimeout` / `setInterval`
- `addEventListener`
- `IntersectionObserver` / `ResizeObserver` / `MutationObserver`

### 第三方客户端库

- 依赖 React Context 的库（`react-hook-form`、`zustand`、`jotai`、大多数 UI 库的 Provider）
- Canvas / WebGL / audio / video 相关（`recharts`、`three.js`、`framer-motion`、
  `canvas-confetti`）
- 依赖 `window` 的库

---

## 典型 7 页的判定（AgentHub 项目）

| 页面 | 需要 "use client"？ | 原因 |
|------|:---:|------|
| `app/page.tsx`（Landing） | ❌ | 纯展示，没有状态和事件 |
| `app/pricing/page.tsx`（Pricing） | ❌ | 纯展示 |
| `app/gallery/page.tsx`（Gallery） | ✅ | `useState(searchTerm)` / `useEffect` |
| `app/agent/[id]/page.tsx`（AgentDetail） | ✅ | `useState(prompt, isGenerating, output)` / `useParams` |
| `app/runs/page.tsx`（RunHistory） | ✅ | `useState` / `useEffect` |
| `app/settings/page.tsx`（Settings） | ✅ | `useState(activeTab)` |
| `app/pipeline/page.tsx`（Pipeline） | ✅ | `useState(selectedNode)` |
| `components/layout.tsx` 里的 Header | ✅ | 用了 `usePathname()` 判断 active |
| `components/layout.tsx` 里的 Footer | ❌ | 纯展示 |

## 边界 case

### Case 1：同一文件里既有 Server 逻辑又有 Client 逻辑

不能。`"use client"` 是文件级的。把 Client 部分拆到独立的 `Xxx.client.tsx`，再在 Server
Component 里 import 它。

### Case 2：layout.tsx 要用 usePathname 高亮导航

推荐做法：把 Header 拆成独立的 Client Component 文件（`components/header.tsx` 加
`"use client"`），`app/layout.tsx` 保持服务端，只 import Header。

### Case 3：第三方 UI 库组件（如 shadcn dialog）

shadcn 的 `dialog.tsx` / `dropdown-menu.tsx` / `popover.tsx` 等组件**内部**已经加了
`"use client"`，你在 page 里 import 它们不需要额外标注（除非你的 page 自己也用了 hook）。

### Case 4：只有 onClick 但没有 state

仍然需要 `"use client"`。事件 handler 必须在客户端执行。

### Case 5：Server Component 里用 `<form action={serverAction}>`

不需要 `"use client"`。Server Actions 就是为了让服务端组件也能处理表单。

### Case 6：从 Server Component 往 Client Component 传函数 prop

**不行**。函数不能序列化跨 RSC 边界。要么把事件 handler 定义在 Client Component 内部，要么
把整个父组件也标成 Client。

---

## 常见错误信号

如果在 server 组件里用了客户端特性而没标 `"use client"`，Next.js 会抛：

```
Error: useState can only be used in Client Components. Add the "use client"
directive at the top of the file to use it. Read more: https://nextjs.org/docs/...
```

或者：

```
You're importing a component that needs useState. This React hook only works
in a client component. To fix, mark the file (or its parent) with the "use client"
directive.
```

看到这类报错，立即在对应文件首行加 `"use client";`（注意是第一行，连 import 都要放它下面）。

---

## 批量加 "use client" 的脚本（bash 片段）

```bash
# 给指定 7 个页面（如有需要）批量加 "use client"
for file in gallery/page.tsx agent/\[id\]/page.tsx runs/page.tsx settings/page.tsx pipeline/page.tsx; do
  full="src/app/$file"
  if [ -f "$full" ] && ! head -1 "$full" | grep -q '"use client"'; then
    printf '"use client";\n\n' | cat - "$full" > /tmp/tmpfile && mv /tmp/tmpfile "$full"
    echo "加了 use client: $full"
  fi
done
```
