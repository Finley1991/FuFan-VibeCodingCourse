// templates/next-fonts-template.ts
//
// 用途：用 next/font/google 替代源项目里 fonts.css 的 Google Fonts @import
// 放置位置：src/app/layout.tsx 顶部（或拆到单独的 src/lib/fonts.ts 里 export）
//
// 为什么用 next/font 而不是 @import：
//   1. 自动下载字体并内联到 build，避免运行时请求 Google 服务器（国内加载快 3-5 秒）
//   2. 自动生成稳定的 font-family CSS 变量（--font-inter 等），避免 FOUT（无样式闪烁）
//   3. 自动 preload，首屏性能最优
//
// 配合 globals.css 里的：
//   --font-sans: var(--font-inter), var(--font-noto-sans-sc), sans-serif;
//   --font-mono: var(--font-jetbrains-mono), monospace;

import { Inter, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto-sans-sc",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// 在 layout.tsx 里使用：
//   <html className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansSC.variable}`}>
