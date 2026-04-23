# React Router ↔ Next.js App Router 对照表

搬家时反复查这张表。

## 路由组织

| React Router（源） | Next.js App Router（目标） |
|---|---|
| `src/app/App.tsx` + `RouterProvider` | 不存在（框架自动处理） |
| `routes.tsx` 的 `createBrowserRouter([...])` | 文件系统路由（`app/*/page.tsx`） |
| `{ index: true, element: <Landing /> }` | `app/page.tsx` |
| `{ path: "pricing", element: <Pricing /> }` | `app/pricing/page.tsx` |
| `{ path: "gallery", element: <Gallery /> }` | `app/gallery/page.tsx` |
| `{ path: "agent/:id", element: <AgentDetail /> }` | `app/agent/[id]/page.tsx` |
| `{ path: "runs", element: <RunHistory /> }` | `app/runs/page.tsx` |
| `{ path: "settings", element: <Settings /> }` | `app/settings/page.tsx` |
| `{ path: "pipeline", element: <Pipeline /> }` | `app/pipeline/page.tsx` |
| `{ path: "*", element: <NotFound /> }` | `app/not-found.tsx` |
| `Root` 组件（带 Header + Outlet）| `app/layout.tsx` |

## 链接和导航

| React Router | Next.js |
|---|---|
| `import { Link } from 'react-router'` | `import Link from 'next/link'` |
| `<Link to="/gallery">` | `<Link href="/gallery">` |
| `<Link to={`/agent/${id}`}>` | `<Link href={`/agent/${id}`}>` |
| `import { NavLink } from 'react-router'` | 自己包一层，用 `usePathname()` 判断 active（见 templates/next-layout-template.tsx）|
| `<NavLink to="/gallery" className={({ isActive }) => ...}>` | 自己的 NavLink 封装，签名相同 |

## Hooks

| React Router | Next.js |
|---|---|
| `import { useParams } from 'react-router'` | `import { useParams } from 'next/navigation'` |
| `const { id } = useParams()` | 同（Client Component）<br>或 `{ params }: { params: { id: string } }`（Server Component） |
| `import { useNavigate } from 'react-router'` | `import { useRouter } from 'next/navigation'` |
| `navigate('/foo')` | `router.push('/foo')` |
| `navigate(-1)` | `router.back()` |
| `useSearchParams()` | `import { useSearchParams } from 'next/navigation'`（签名不同，返回 ReadonlyURLSearchParams） |
| `useLocation()` | `import { usePathname } from 'next/navigation'`（只拿 pathname）或自己拼 |
| `useMatches()` | 无直接等价；用 `usePathname()` + 自己的逻辑 |

## 布局/嵌套

| React Router | Next.js |
|---|---|
| `<Outlet />` | 直接写 `{children}` 在 layout.tsx 里 |
| 嵌套路由 `{ path: "dashboard", children: [...] }` | 嵌套目录：`app/dashboard/layout.tsx` + `app/dashboard/page.tsx` |
| Layout Route（只做布局）| `app/.../layout.tsx` |
| Index Route (`{ index: true }`)| `app/.../page.tsx`（当前目录的根） |
| Pathless Layout Route | 路由组：`app/(dashboard)/layout.tsx` |

## 加载和错误

| React Router | Next.js |
|---|---|
| `loader` 函数 | Server Component 里直接 `async function` 拿数据 |
| `action` 函数 | Server Action（`"use server"`）或 `app/api/*/route.ts` |
| `<ErrorBoundary>` / `errorElement` | `app/.../error.tsx`（要 `"use client"`） |
| Loading UI | `app/.../loading.tsx`（自动用 React Suspense） |

## 其他常见换算

| 源 | 目标 |
|---|---|
| `main.tsx` + `ReactDOM.createRoot(...).render(...)` | 不需要，Next.js 框架处理 |
| `vite.config.ts` | 扔掉，Next.js 有自己的 `next.config.ts` |
| `index.html` + `<link rel="icon">` | `app/icon.png` / `app/favicon.ico`（文件系统约定） |
| `<head>` manipulation（`react-helmet` 等）| `export const metadata: Metadata = { ... }` 或 `generateMetadata` |
| 相对路径 import `'../lib/utils'` | 绝对别名 `'@/lib/utils'` |
| `~/` path alias（Figma Make 常用）| 改成 `@/`（Next.js 默认） |
