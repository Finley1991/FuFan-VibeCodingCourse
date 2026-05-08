# NanoClaw Dashboard

> SaaS 级前端控制台 · 给 [NanoClaw](https://github.com/obra/nanoclaw) 后端的可视化界面
>
> 九天老师 · 《Claude Superpowers》直播课 · 入门段 Step 10 雏形

![Stack](https://img.shields.io/badge/runtime-Node.js%2018%2B-green)
![Deps](https://img.shields.io/badge/dependencies-zero-brightgreen)
![Style](https://img.shields.io/badge/UI-暗色%20%2B%20橘色%20accent-ff8c1a)

---

## 这是什么

NanoClaw 后端的设计哲学是"消息平台即前端"——它本身不带 Web UI，要么走 CLI，要么接 IM channel（iMessage / Telegram / Discord 等）。

本项目给 NanoClaw **配一个 SaaS 级前端 Dashboard**，作为入门段的视觉锚点。

**功能边界**（YAGNI ruthlessly）：
- ✅ **唯一真实功能**：右下角悬浮 💬 浮层，能跟 Andy（NanoClaw 默认 agent）真聊
- ✅ 完整 Dashboard 视觉框架（左 sidebar + 顶 navbar + 4 统计卡 + 双栏 4 面板）
- 🟡 所有数据 mock 在前端 hardcode（统计、Agent 列表、工作流、日志、安全防线）
- ❌ 不接真实 NanoClaw API（A0 案例段才做）
- ❌ 不持久化对话历史（刷新就清）
- ❌ 不做用户系统、权限、多 Agent 切换

**为什么这样设计**：入门段需要一个视觉锚点让学员"装完合上电脑后脑子里有画面"，但又不能抢 A0 Dashboard 案例段的高光（A0 用 Next.js 14 + Tailwind + 真接口做产品级版本）。所以视觉档次拉到 SaaS 级，功能严格只做一个。

---

## 视觉风格

参考 Intercom / Linear / Vercel Dashboard，暗色主题 + 橘色 accent：

| 角色 | 色号 |
|---|---|
| 主背景 | `#0a0a0a` |
| 卡片背景 | `#161616`（hover `#1c1c1c`）|
| 边框 | `#262626`（hover `#3a3a3a`）|
| 主文字 | `#f5f5f5` |
| 次文字 | `#a1a1a1` |
| **Accent 主色（橘黄）** | **`#ff8c1a`** |
| 成功绿 | `#22c55e` |
| 警告红 | `#ef4444` |
| 紫色 | `#a855f7` |

字体：`system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif`

---

## 技术栈

**零依赖**——只用 Node.js built-in（`http` / `fs` / `path` / `child_process`）。

```
nanoclaw-dashboard/
├── server.js     ← 145 行 · HTTP server + POST /chat 包装 NanoClaw CLI
├── index.html    ← 1446 行 · 单页 inline CSS + JS
├── package.json  ← 元信息（无 dependencies）
├── .gitignore
└── README.md
```

---

## 快速开始

### 前置

- Node.js 18+
- 已安装并跑起来的 NanoClaw 后端（默认在 `~/projects/nanoclaw-fork/nanoclaw-v2`）
- NanoClaw 已创建至少一个 agent group（默认 Andy，跑 `pnpm exec tsx scripts/init-cli-agent.ts` 创建）

### 启动

```bash
# 默认指向 ~/projects/nanoclaw-fork/nanoclaw-v2
node server.js

# 或自定义 NanoClaw 项目根
NANOCLAW_ROOT=/path/to/your/nanoclaw-v2 node server.js

# 自定义端口
PORT=8080 node server.js
```

打开浏览器：[http://127.0.0.1:7777](http://127.0.0.1:7777)

点右下角橘色 💬 浮层 → 输入"你好" → 看到 Andy 真实回复。

---

## 工作原理

```
浏览器 → POST /chat {message}
   ↓
server.js: spawn 'pnpm run chat <message>'  (cwd = NANOCLAW_ROOT)
   ↓
NanoClaw service → Docker 容器（Andy）→ Claude Agent SDK → DeepSeek-V4
   ↓
返回 stdout → 剥离 pnpm wrapper 行 → JSON {reply}
   ↓
浏览器气泡渲染
```

**为什么 spawn CLI 而不是直读 SQLite？** NanoClaw 的 inbound.db / outbound.db 有跨容器单写者约束（journal_mode=DELETE / 一份 DB 一个写者），直接读写会破坏数据契约。复用 `pnpm run chat` CLI 是最安全的路径。

---

## 配置

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `7777` | HTTP 监听端口 |
| `HOST` | `127.0.0.1` | 监听地址 |
| `NANOCLAW_ROOT` | `~/projects/nanoclaw-fork/nanoclaw-v2` | NanoClaw 项目根路径 |

---

## 路线图

- [x] **入门段 v0.1**：SaaS 级视觉外壳 + 唯一真实对话浮层（**当前版本**）
- [ ] **A0 案例段 v1.0**（移植到 Next.js 14 + Tailwind + 真实 API）：
  - 真接 NanoClaw 的 agent groups 表 → 替换 Agent 列表 mock
  - 真接 sessions DB → 替换工作流执行状态 mock
  - 真接成本统计 → 替换 API 消耗 mock
  - 添加 Agent 创建 / Skill 导入功能
  - 路由 + 多页面（控制台 / Agent管理 / Skills市场 / ...）
- [ ] 后续案例段：A2 定时任务面板 / A6 Gates 配置 UI / B 轨进阶能力

---

## License

MIT — 课程教学用例，自由二开
