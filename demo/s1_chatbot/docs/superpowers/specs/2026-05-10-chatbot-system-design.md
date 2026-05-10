# 类ChatGPT对话问答系统 - 设计文档

## 1. 项目概述

**目标**：构建一个类 ChatGPT 的对话问答系统，用于内部演示/展示。

**用户**：单用户场景，用户注册后配置自己的 DeepSeek API Key。

## 2. 技术架构

### 前端
- **框架**：React 18 + TypeScript
- **构建工具**：Vite
- **UI 组件**：shadcn/ui + Tailwind CSS
- **状态管理**：Zustand
- **HTTP 客户端**：axios
- **Markdown 渲染**：react-markdown + react-syntax-highlighter
- **流式处理**：Fetch API + ReadableStream

### 后端
- **框架**：FastAPI (Python 3.11+)
- **数据库**：SQLite (via SQLAlchemy + Alembic)
- **认证**：JWT (python-jose) + bcrypt
- **API 代理**：httpx (异步 HTTP 客户端)
- **流式响应**：FastAPI StreamingResponse

## 3. 数据模型

### User (用户)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| username | str | 用户名，唯一 |
| email | str | 邮箱，唯一 |
| hashed_password | str | bcrypt 加密密码 |
| api_key | str | 用户的 DeepSeek API Key（加密存储） |
| created_at | datetime | 创建时间 |

### Session (会话)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 外键 → User |
| title | str | 会话标题 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### Message (消息)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| session_id | UUID | 外键 → Session |
| role | str | "user" / "assistant" / "system" |
| content | str | 消息内容 |
| created_at | datetime | 创建时间 |

## 4. API 接口设计

### 认证模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录，返回 JWT |
| GET | /api/auth/me | 获取当前用户信息 |

### 会话模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/sessions | 创建新会话 |
| GET | /api/sessions | 获取当前用户的会话列表 |
| GET | /api/sessions/{id} | 获取会话详情（含消息） |
| PUT | /api/sessions/{id} | 重命名会话 |
| DELETE | /api/sessions/{id} | 删除会话 |

### 对话模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/chat | 发送消息，流式返回 AI 回复 |

请求体：
```json
{
  "session_id": "uuid",
  "message": "用户输入"
}
```

### 用户设置模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/settings/api-key | 获取当前用户的 API Key |
| PUT | /api/settings/api-key | 更新 API Key |

## 5. 前端组件结构

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/           # 整体布局（侧栏 + 主区域）
│   │   ├── Sidebar/          # 左侧会话列表
│   │   │   ├── SessionList   # 会话列表
│   │   │   ├── SessionItem   # 单个会话项
│   │   │   └── NewSessionBtn # 新建会话按钮
│   │   ├── Chat/             # 聊天主区域
│   │   │   ├── MessageList   # 消息列表
│   │   │   ├── MessageBubble # 单条消息（用户/AI 区分样式）
│   │   │   ├── InputBar      # 输入框 + 发送按钮
│   │   │   └── ThinkingBox   # AI 思考过程展示（可折叠）
│   │   ├── Settings/         # 设置面板
│   │   │   ├── ApiKeyForm    # API Key 配置表单
│   │   │   └── ModelSelector # 模型选择器
│   │   └── Auth/             # 认证组件
│   │       ├── LoginForm     # 登录表单
│   │       └── RegisterForm  # 注册表单
│   ├── hooks/
│   │   ├── useChat.ts        # 流式对话逻辑
│   │   ├── useSessions.ts    # 会话管理
│   │   └── useAuth.ts        # 认证状态
│   ├── store/
│   │   └── useStore.ts       # Zustand 全局状态
│   ├── api/
│   │   └── client.ts         # axios 实例 + 拦截器
│   ├── types/
│   │   └── index.ts          # TypeScript 类型定义
│   └── App.tsx
└── package.json
```

## 6. 后端模块结构

```
backend/
├── app/
│   ├── main.py               # FastAPI 应用入口
│   ├── config.py             # 配置（环境变量）
│   ├── database.py           # SQLAlchemy 引擎
│   ├── models/               # SQLAlchemy 数据模型
│   │   ├── user.py
│   │   ├── session.py
│   │   └── message.py
│   ├── schemas/              # Pydantic 请求/响应 schema
│   │   ├── auth.py
│   │   ├── session.py
│   │   ├── message.py
│   │   └── settings.py
│   ├── api/                  # 路由
│   │   ├── auth.py
│   │   ├── sessions.py
│   │   ├── chat.py
│   │   └── settings.py
│   ├── services/             # 业务逻辑
│   │   ├── auth_service.py   # 认证逻辑
│   │   ├── chat_service.py   # DeepSeek API 代理 + 流式
│   │   └── session_service.py # 会话管理
│   └── core/                 # 安全/依赖
│       ├── security.py       # JWT + bcrypt
│       └── deps.py           # FastAPI 依赖注入
├── alembic/                  # 数据库迁移
├── requirements.txt
└── alembic.ini
```

## 7. 流式响应设计

**后端**：
- `POST /api/chat` 使用 FastAPI `StreamingResponse`
- 调用 DeepSeek API 时，用 httpx 异步流式读取
- 将 DeepSeek 的 SSE 格式转换为自定义 SSE 格式：
  - `data: {type: "thinking", content: "..."}` — 思考过程
  - `data: {type: "answer", content: "..."}` — 正式回复
  - `data: {type: "done"}` — 结束标记

**前端**：
- 用 Fetch API 的 `response.body.getReader()` 读取 chunk
- 解析 SSE 格式，按 type 分发到不同状态
- ThinkingBox 实时渲染 thinking 内容
- MessageBubble 实时渲染 answer 内容

## 8. 安全设计

- 用户密码：bcrypt 哈希存储
- API Key：AES 加密存储（非明文）
- JWT：短期 token（1小时）+ 可选 refresh token
- CORS：仅允许前端域名
- 请求验证：所有输入用 Pydantic schema 校验

## 9. 实施阶段

### Phase 1: 项目初始化
- 创建前后端目录结构
- 初始化前端（Vite + React + TypeScript + shadcn/ui）
- 初始化后端（FastAPI + SQLAlchemy + Alembic）
- 健康检查接口 + 连通性测试

### Phase 2: 后端核心
- 用户注册/登录/JWT 认证
- 数据模型 + 数据库迁移
- 会话 CRUD API
- DeepSeek API 代理 + 流式响应

### Phase 3: 前端 UI
- 布局框架（侧栏 + 主区域）
- 认证页面（登录/注册）
- 会话列表组件
- 聊天界面（消息列表 + 输入框 + 思考过程展示）
- 设置面板

### Phase 4: 前后端联调
- 连接后端 API
- 流式响应集成（打字机效果）
- 会话切换 + 消息持久化
- 错误处理 + 加载状态

### Phase 5: 优化
- UI/UX 打磨
- 边界情况处理
- 演示准备
