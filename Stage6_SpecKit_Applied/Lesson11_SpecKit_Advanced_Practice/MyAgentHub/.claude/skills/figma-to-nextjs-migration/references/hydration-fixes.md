# Hydration mismatch 修复模式

## 什么是 Hydration mismatch

Next.js App Router 的默认渲染流程：

1. **服务端**先渲染 HTML（SSR 或 SSG）
2. HTML 发到浏览器立即可见
3. **客户端** JS 接管，React 在已有 HTML 上"hydrate"（附加事件、启动状态）

Hydration 成功的前提：**服务端渲染出来的 HTML 必须和客户端首次渲染出来的 HTML 完全一致**。
一旦不一致，React 抛：

```
Warning: Text content did not match. Server: "..." Client: "..."
Hydration failed because the server rendered HTML didn't match the client.
```

虽然 React 18 会尝试自动修复，但：

- 控制台充斥警告，真的报错时看不到
- 部分页面会闪一下（视觉抖动）
- 直播调试 / 学员复现时容易被吓到

## 典型触发源

凡是**每次执行结果不同**的代码，都会导致 SSR 和 CSR 不一致：

- `Math.random()` — 服务端一个值，客户端另一个值
- `new Date()` / `Date.now()` — 时间一直在走
- `typeof window !== 'undefined'` 分支 — 服务端是 false，客户端是 true
- `localStorage.getItem(...)` — 服务端 undefined，客户端有值
- 基于环境变量或 `Math.random()` 的 ID / key

## 修复模式 1：seededRandom（mock-data 首选）

**用途**：mock-data 里的"随机"数据其实不需要真随机，用一个确定的伪随机就够了。

**实现**：在 `src/lib/mock-data.ts` 文件顶部加一个确定种子的 PRNG：

```ts
// [Prep-03] 修复 Hydration mismatch：确定化所有随机值
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}
const rand = seededRandom(42);
```

然后把文件里所有 `Math.random()` 替换成 `rand()`。

这是一个**线性同余生成器（LCR）**，每次调用 `rand()` 都按相同序列返回，服务端和客户端执行
结果完全一致，Hydration 稳定。

## 修复模式 2：固定时间戳

**用途**：mock-data 里的 `new Date(Date.now() - ...)` 是假时间，不需要真实时间。

**实现**：把 `Date.now()` 替换为固定时间戳，比如：

```ts
const MOCK_NOW = 1713600000000;  // 2024-04-20

// 原来：
const createdAt = new Date(Date.now() - Math.random() * 86400000);
// 改为：
const createdAt = new Date(MOCK_NOW - rand() * 86400000);
```

## 修复模式 3：suppressHydrationWarning

**用途**：真需要显示当前时间（"现在是 16:42"），不能确定化——这时只能告诉 React 忽略这个节点
的 Hydration check。

**实现**：

```tsx
<time suppressHydrationWarning>{new Date().toLocaleTimeString()}</time>
```

**注意**：`suppressHydrationWarning` 是**灭火器**，不是修复。它只消灭警告，不解决不一致——
只能用在你**确定**不一致是可接受的节点上（比如时钟、当前日期显示）。不要泛滥使用。

## 修复模式 4：只在客户端渲染（"use client" + useEffect 延迟）

**用途**：依赖 `window` / `localStorage` 的组件，本来就没法在服务端渲染。

**实现**：

```tsx
"use client";
import { useState, useEffect } from "react";

export function ClientOnlyTheme() {
  const [theme, setTheme] = useState<string | null>(null);  // 首屏为 null

  useEffect(() => {
    setTheme(localStorage.getItem("theme") ?? "dark");
  }, []);

  if (theme === null) return null;  // 服务端和客户端首次渲染都是 null，一致

  return <div data-theme={theme}>...</div>;
}
```

**关键**：服务端渲染 `null`（什么都不出），Hydration 时客户端首次渲染也是 `null`——一致。
useEffect 在 Hydration 完成后才跑，那时改 state 触发正常的客户端 re-render，不算 mismatch。

## 修复模式 5：动态导入 + ssr: false

**用途**：整个组件完全不能 SSR（比如 Monaco Editor、3D 场景）。

**实现**：

```tsx
import dynamic from "next/dynamic";

const ClientOnlyComponent = dynamic(() => import("./client-only"), {
  ssr: false,
});
```

组件完全跳过 SSR，只在客户端 mount 后渲染。

## AgentHub 项目典型案例

Prep-01 的 Gallery 页面，mock-data 里有大量 `Math.random()` 用来：

- 生成 Agent 的随机 run 次数（`1234` / `567` 等）
- 生成 Agent 的随机星级
- 生成 Agent 的随机发布时间

搬家时应用**修复模式 1 + 2** 解决：

```ts
// src/lib/mock-data.ts 顶部加：
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}
const rand = seededRandom(42);
const MOCK_NOW = 1713600000000;

// 然后全局替换：
// Math.random()   → rand()
// Date.now()      → MOCK_NOW
// new Date()      → new Date(MOCK_NOW)
```

替换后 `pnpm dev` 控制台应干净无警告。

## 自检

修完之后：

1. `pnpm dev` 启动
2. 打开 `http://localhost:3000`，F12 打开控制台
3. 访问 7 个路由
4. 控制台**不应**出现 `Hydration failed` / `Text content did not match` / `Warning: Did not
   expect server HTML` 任一警告

有任一警告就继续定位——通常是漏了某个 `Math.random()` 或组件里用了 `new Date()`。
