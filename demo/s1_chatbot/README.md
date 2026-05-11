# ChatBot - 类ChatGPT对话问答系统

基于FastAPI + React + DeepSeek API的AI对话应用。

## 功能特性

- 🤖 DeepSeek模型集成（聊天和推理模式）
- 💭 模型思考过程可视化
- 💾 会话持久化（前端localStorage + 后端SQLite）
- ⚡ 流式响应，打字机效果
- ⚙️ 可配置模型参数和API Key

## 技术架构

- **前端**: React 19 + TypeScript + Vite + Zustand
- **后端**: FastAPI + SQLite + OpenAI SDK (DeepSeek兼容)

## 快速开始

### 前置准备

获取DeepSeek API Key: https://platform.deepseek.com/

### 后端运行

```bash
cd backend

# 创建并激活虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置API Key
cp .env.example .env
# 编辑 .env 文件，填入你的DEEPSEEK_API_KEY

# 启动服务器
uvicorn app.main:app --reload --port 8000
```

后端API文档: http://localhost:8000/docs

### 前端运行

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用: http://localhost:5173

## 使用说明

1. **配置API Key**: 点击右下角「设置」按钮，输入你的DeepSeek API Key
2. **选择模型**:
   - `deepseek-chat`: 快速对话模式
   - `deepseek-reasoner`: 深度推理模式，可查看思考过程
3. **开始对话**: 输入消息，按Enter发送

## 项目结构

```
s1_chatbot/
├── frontend/
│   ├── src/
│   │   ├── components/      # UI组件
│   │   ├── store/           # Zustand状态管理
│   │   ├── api/             # API调用
│   │   ├── types/           # TypeScript类型
│   │   └── App.tsx
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/             # 路由
│   │   ├── models/          # 数据模型
│   │   ├── services/        # 业务逻辑
│   │   └── core/            # 配置和数据库
│   ├── .env                 # 环境变量
│   └── requirements.txt
└── README.md
```

