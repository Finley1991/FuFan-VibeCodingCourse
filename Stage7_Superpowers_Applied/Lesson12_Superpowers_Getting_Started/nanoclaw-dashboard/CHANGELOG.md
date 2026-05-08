# Changelog

本项目所有显著变更记录于此。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本（SemVer）](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

> 用于记录尚未发版的开发中改动。下次发版时把这部分内容移到新版本号下。

### Added
- _尚无_

### Changed
- _尚无_

### Fixed
- _尚无_

---

## [1.0.0] - 2026-05-07

> **首版发布** · 九天老师《Claude Superpowers》直播课入门段 Step 10 产物 ·
> 入门段雏形首发：SaaS 级视觉外壳 + 唯一真功能（和 Andy 对话）+ 全 mock 数据

### Added

**项目结构**
- 独立项目仓库 `~/projects/nanoclaw-dashboard/`（不污染 NanoClaw fork upstream）
- 通过 `NANOCLAW_ROOT` 环境变量解耦后端路径，默认 `~/projects/nanoclaw-fork/nanoclaw-v2`
- 零依赖：仅 Node.js built-in（`http` / `fs` / `path` / `child_process`）
- 启动时校验 `NANOCLAW_ROOT/package.json` 存在，缺失则 exit 1 + 帮助提示

**后端（server.js · 145 行）**
- HTTP server 监听 `127.0.0.1:7777`
- `GET /` 返回 `index.html`
- `POST /chat`：`spawn('pnpm', ['run', 'chat', msg], { cwd: NANOCLAW_ROOT })` → 剥离 pnpm wrapper 行 → 返回 `{reply}`
- 120s 超时保护
- 简易请求日志（method / path / 状态）

**前端（index.html · 1446 行 · inline CSS + JS）**
- 暗色主题 + 橘色（`#ff8c1a`）accent 设计语言（参考 Intercom / Linear / Vercel）
- 左侧 sidebar (240px)：
  - Logo 区：`🐾 NanoClaw v2.0.33`
  - 导航 7 项：控制台（active）/ Agent管理 / Skills市场 / 工作流编排 / 运行日志 / 安全中心 / 系统设置
  - 快捷操作：➕ 创建新 Agent / ⬇ 导入 Skill
  - 平台连接状态：CLI 🟢 已连接（真实）/ iMessage 🟡 配置中 / Telegram & Discord ⚪ 未配置
- 顶部 navbar (60px)：
  - 搜索框（⌘K 聚焦）
  - 状态徽章：🟢 1 Agents 运行中 + 🟣 14 Skills 已部署
  - 🔔 通知 + 用户头像 "MY"
- 4 统计卡（橘色 48px 大数字）：Agent总数 / Skills总数 / 今日执行 / API消耗
- 双栏 4 面板：
  - 活跃 Agent 列表（Andy 真实，其他 mock）
  - 工作流执行状态（排队 / 执行 / 已完成）
  - 最近执行日志（6 行 mock，反映入门段实际跑过的事件）
  - 安全防线状态（成本控制 / Skill 审核 / 人工审批）
- **唯一真功能**：右下角橘色 💬 圆形浮层 → 360x540 对话面板 → fetch POST /chat 真聊 Andy
- 动画：状态点 pulse、工作流进度条 40→75% 渐变、打字指示器三点弹跳、浮层 open/close 缩放过渡
- 交互：⌘K 聚焦搜索、Enter 发送、Shift+Enter 换行、textarea 自适应、sidebar 切换 active

**项目元信息**
- `package.json` · 元信息 + `npm start` 命令（无 dependencies）
- `.gitignore` · node_modules / .DS_Store / *.log / .env
- `README.md` · 项目说明 / 视觉风格 / 启动方式 / 路线图

### Fixed
- `stripPnpmWrapper` 增加对 `> tsx scripts/chat.ts ...` 行的过滤——之前只过滤了 `> nanoclaw@...` 第一行，导致 reply 前缀污染

### 已知边界（YAGNI 有意为之，非 bug）
- 4 统计卡 / Agent 列表 / 工作流 / 日志 / 安全防线全是 mock 数据（A0 案例段会替换为真接口）
- 不持久化对话历史（浏览器刷新即清）
- 不接 Next.js / Tailwind / React（A0 段才接）
- 不做用户系统、权限、多 Agent 切换

### 实跑教学产出（嵌入直播课件素材）
- 端到端验证：浏览器 → SaaS Dashboard → 右下 💬 → 跟 Andy 真聊 → POST /chat 返回 `{"reply":"Andy"}`
- 顺手钓出 A6 Gates 钩素材：Andy 自报 "Sonnet 4.6"，但实际后端是 DeepSeek-V4 via Anthropic 兼容层 → "**LLM 连自己是谁都不知道**"

---

## 版本号约定

本项目按语义化版本管理：

- **MAJOR**（v1 → v2）：技术栈大变（如 Next.js 14 + Tailwind 重写）/ 不兼容变更
- **MINOR**（v1.0 → v1.1）：新增功能、模块替换 mock 数据为真接口、不破坏已有功能
- **PATCH**（v1.0.0 → v1.0.1）：bug 修复、样式微调、文案修订

---

[Unreleased]: ./CHANGELOG.md#unreleased
[1.0.0]: ./CHANGELOG.md#100---2026-05-07
