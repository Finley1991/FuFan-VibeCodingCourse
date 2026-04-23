// templates/next-layout-template.tsx
//
// 用途：作为 src/app/layout.tsx + src/components/layout.tsx 的参考模板。
// 把源项目 routes.tsx 里的 Root 函数（Header + Outlet + Footer）搬到这里。
//
// 放置位置：
//   1. 下面的 RootLayout → src/app/layout.tsx
//   2. Header / Footer 子组件 → src/components/layout.tsx（带 "use client"）
//
// 替代原项目的：
//   - routes.tsx 的 Root 函数
//   - App.tsx 里的 RouterProvider
//   - main.tsx 里的 ReactDOM.createRoot(...).render(...)

// ─────────────────────────────────────────────────────────────
// 文件 1：src/app/layout.tsx（服务端组件，不要标 "use client"）
// ─────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import { Header, Footer } from "@/components/layout";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto-sans-sc",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgentHub · AI Agent 商店与 Playground",
  description: "下一代 AI Agent 构建、编排与分发平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansSC.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-bg-base font-sans text-fg-default antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

// ─────────────────────────────────────────────────────────────
// 文件 2：src/components/layout.tsx
// 顶部必须加 "use client"，因为用到了 usePathname
// ─────────────────────────────────────────────────────────────

/*
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// 本地 NavLink 封装：Next.js 没有内置 NavLink，用 usePathname 判断 active
function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: (args: { isActive: boolean }) => string;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link href={href} className={className ? className({ isActive }) : ""}>
      {children}
    </Link>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border-default bg-bg-base/80 px-6 backdrop-blur">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-lg font-bold">AgentHub</span>
      </Link>

      <nav className="flex items-center gap-6">
        <NavLink
          href="/gallery"
          className={({ isActive }) =>
            cn(
              "text-sm transition-colors",
              isActive ? "text-fg-default" : "text-fg-secondary hover:text-fg-default"
            )
          }
        >
          商店
        </NavLink>
        <NavLink
          href="/runs"
          className={({ isActive }) =>
            cn(
              "text-sm transition-colors",
              isActive ? "text-fg-default" : "text-fg-secondary hover:text-fg-default"
            )
          }
        >
          运行记录
        </NavLink>
        <NavLink
          href="/pipeline"
          className={({ isActive }) =>
            cn(
              "text-sm transition-colors",
              isActive ? "text-fg-default" : "text-fg-secondary hover:text-fg-default"
            )
          }
        >
          Pipeline
        </NavLink>
        <NavLink
          href="/pricing"
          className={({ isActive }) =>
            cn(
              "text-sm transition-colors",
              isActive ? "text-fg-default" : "text-fg-secondary hover:text-fg-default"
            )
          }
        >
          定价
        </NavLink>
        <NavLink
          href="/settings"
          className={({ isActive }) =>
            cn(
              "text-sm transition-colors",
              isActive ? "text-fg-default" : "text-fg-secondary hover:text-fg-default"
            )
          }
        >
          设置
        </NavLink>
      </nav>
    </header>
  );
}

// Footer 可以是服务端组件，因为只是静态内容
export function Footer() {
  return (
    <footer className="border-t border-border-default px-6 py-4 text-xs text-fg-muted">
      <p>© 2025 AgentHub · Built with Next.js 15 App Router</p>
    </footer>
  );
}
*/
