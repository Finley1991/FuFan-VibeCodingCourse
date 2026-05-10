# 类ChatGPT对话问答系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个类 ChatGPT 的对话问答系统，支持用户注册登录、会话管理、DeepSeek API 代理流式对话。

**Architecture:** 前后端分离架构。后端 FastAPI 提供 JWT 认证、会话 CRUD、DeepSeek API 代理（流式响应）。前端 React + TypeScript + shadcn/ui 实现聊天界面、会话列表、设置面板。

**Tech Stack:**
- 前端：React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, axios, react-markdown
- 后端：FastAPI, SQLAlchemy, SQLite, Alembic, python-jose, bcrypt, httpx, pydantic

---

## Phase 1: 项目初始化

### Task 1: 创建后端目录结构

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/__init__.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/requirements.txt`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/__init__.py`

- [ ] **Step 1: 创建后端目录和配置文件**

在 `backend/` 目录下创建以下目录结构：
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── session.py
│   │   └── message.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── session.py
│   │   ├── message.py
│   │   └── settings.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── sessions.py
│   │   ├── chat.py
│   │   └── settings.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── chat_service.py
│   │   └── session_service.py
│   └── core/
│       ├── __init__.py
│       ├── security.py
│       └── deps.py
├── alembic/
│   ├── alembic.ini
│   ├── env.py
│   └── versions/
│       └── __init__.py
└── requirements.txt
```

- [ ] **Step 2: 创建 requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
alembic==1.13.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
httpx==0.27.2
pydantic==2.9.2
pydantic-settings==2.5.2
cryptography==43.0.1
```

- [ ] **Step 3: 创建 config.py**

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "ChatBot"
    database_url: str = "sqlite:///./chatbot.db"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 4: 创建 database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # SQLite 特有
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 5: 创建 main.py**

```python
from fastapi import FastAPI
from app.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
```

- [ ] **Step 6: 创建后端 venv 并安装依赖**

```bash
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

- [ ] **Step 7: 启动后端验证健康检查**

```bash
uvicorn app.main:app --reload --port 8000
```

然后用 curl 测试：`curl http://localhost:8000/api/health`，预期返回 `{"status":"ok"}`

- [ ] **Step 8: 提交**

```bash
git add backend/
git commit -m "feat: initialize backend project structure with FastAPI"
```

---

### Task 2: 创建前端项目

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`

- [ ] **Step 1: 用 Vite 初始化 React + TypeScript 项目**

```bash
cd frontend && npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: 安装依赖**

```bash
npm install
```

- [ ] **Step 3: 安装 shadcn/ui 和 Tailwind**

```bash
npm install tailwindcss postcss autoprefixer
npx tailwindcss init
```

- [ ] **Step 4: 配置 tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 5: 配置 postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: 配置 src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: system-ui, -apple-system, sans-serif;
  }
}
```

- [ ] **Step 7: 配置 src/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 8: 配置 src/App.tsx**

```tsx
function App() {
  return (
    <div className="flex h-screen">
      <h1 className="m-auto">ChatBot</h1>
    </div>
  )
}

export default App
```

- [ ] **Step 9: 启动前端验证**

```bash
npm run dev
```

预期在 http://localhost:5173 看到 "ChatBot" 页面。

- [ ] **Step 10: 提交**

```bash
git add frontend/
git commit -m "feat: initialize frontend project with Vite + React + TypeScript"
```

---

### Task 3: 安装 shadcn/ui 组件

**Files:**
- Create: `frontend/src/components/ui/button.tsx`
- Create: `frontend/src/components/ui/input.tsx`
- Create: `frontend/src/components/ui/textarea.tsx`
- Create: `frontend/src/components/ui/card.tsx`
- Create: `frontend/src/components/ui/dialog.tsx`
- Create: `frontend/src/components/ui/label.tsx`
- Create: `frontend/src/components/ui/sidebar.tsx` (或手动创建)
- Create: `frontend/src/components/ui/separator.tsx`
- Create: `frontend/src/components/ui/scroll-area.tsx`
- Create: `frontend/src/components/ui/tabs.tsx`
- Create: `frontend/src/components/ui/badge.tsx`
- Create: `frontend/src/components/ui/alert-dialog.tsx`
- Create: `frontend/src/components/ui/popover.tsx`

- [ ] **Step 1: 初始化 shadcn/ui**

```bash
npx shadcn@latest init
```

选择：
- Style: new-york
- Base color: slate
- CSS variables: yes

- [ ] **Step 2: 安装基础组件**

```bash
npx shadcn@latest add button input textarea card dialog label separator scroll-area tabs badge alert-dialog popover
```

- [ ] **Step 3: 验证组件可用**

在 App.tsx 中导入一个 Button 组件，确认编译通过。

- [ ] **Step 4: 提交**

```bash
git add frontend/src/components/ui/
git commit -m "feat: add shadcn/ui base components"
```

---

## Phase 2: 后端核心

### Task 4: 数据模型定义

**Files:**
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/session.py`
- Create: `backend/app/models/message.py`
- Create: `backend/app/models/__init__.py`

- [ ] **Step 1: 创建 user.py**

```python
from sqlalchemy import Column, String, DateTime, UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class User(Base):
    __tablename__ = "users"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    api_key = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 2: 创建 session.py**

```python
from sqlalchemy import Column, String, DateTime, ForeignKey, UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False, default="新会话")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

- [ ] **Step 3: 创建 message.py**

```python
from sqlalchemy import Column, String, DateTime, ForeignKey, UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID, ForeignKey("sessions.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" | "assistant" | "system"
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 4: 创建 models/__init__.py**

```python
from app.models.user import User
from app.models.session import Session
from app.models.message import Message

__all__ = ["User", "Session", "Message"]
```

- [ ] **Step 5: 创建 Alembic 迁移**

```bash
cd backend && alembic revision --autogenerate -m "initial schema"
cd backend && alembic upgrade head
```

- [ ] **Step 6: 提交**

```bash
git add backend/app/models/ backend/alembic/
git commit -m "feat: add database models and initial migration"
```

---

### Task 5: 认证模块

**Files:**
- Create: `backend/app/core/security.py`
- Create: `backend/app/core/deps.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/services/auth_service.py`
- Create: `backend/app/api/auth.py`

- [ ] **Step 1: 创建 security.py**

```python
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from app.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=60))
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except JWTError:
        return None
```

- [ ] **Step 2: 创建 deps.py**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
```

- [ ] **Step 3: 创建 schemas/auth.py**

```python
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    username: str
    email: str

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: 创建 auth_service.py**

```python
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token


def register(db: Session, req: RegisterRequest) -> tuple[User, str]:
    existing = db.query(User).filter(
        (User.username == req.username) | (User.email == req.email)
    ).first()
    if existing:
        raise ValueError("Username or email already exists")

    user = User(username=req.username, email=req.email, hashed_password=hash_password(req.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return user, token


def login(db: Session, req: LoginRequest) -> tuple[User, str]:
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise ValueError("Invalid username or password")

    token = create_access_token(str(user.id))
    return user, token
```

- [ ] **Step 5: 创建 api/auth.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, LoginResponse, UserResponse
from app.services.auth_service import register, login
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
def api_register(req: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user, _ = register(db, req)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return user


@router.post("/login", response_model=LoginResponse)
def api_login(req: LoginRequest, db: Session = Depends(get_db)):
    try:
        user, token = login(db, req)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    return LoginResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def api_me(current_user: User = Depends(get_current_user)):
    return current_user
```

- [ ] **Step 6: 在 main.py 中注册路由 + CORS**

修改 `backend/app/main.py`：

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api import auth, sessions, chat, settings

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(settings.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
```

- [ ] **Step 7: 测试认证接口**

```bash
# 启动后端
uvicorn app.main:app --reload --port 8000

# 注册
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# 登录
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

- [ ] **Step 8: 提交**

```bash
git add backend/app/core/ backend/app/schemas/auth.py backend/app/services/auth_service.py backend/app/api/auth.py backend/app/main.py
git commit -m "feat: add user authentication with JWT"
```

---

### Task 6: 会话管理 API

**Files:**
- Create: `backend/app/schemas/session.py`
- Create: `backend/app/services/session_service.py`
- Create: `backend/app/api/sessions.py`

- [ ] **Step 1: 创建 schemas/session.py**

```python
from pydantic import BaseModel
from datetime import datetime


class SessionCreate(BaseModel):
    title: str = "新会话"


class SessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SessionDetail(SessionResponse):
    messages: list["MessageResponse"] = []


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


SessionDetail.model_rebuild()
```

- [ ] **Step 2: 创建 session_service.py**

```python
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.session import Session
from app.models.message import Message
from app.schemas.session import SessionCreate


def list_sessions(db: Session, user_id: str) -> list[Session]:
    return (
        db.query(Session)
        .filter(Session.user_id == user_id)
        .order_by(desc(Session.updated_at))
        .all()
    )


def get_session(db: Session, session_id: str, user_id: str) -> Session | None:
    return (
        db.query(Session)
        .filter(Session.id == session_id, Session.user_id == user_id)
        .first()
    )


def create_session(db: Session, user_id: str, req: SessionCreate) -> Session:
    session = Session(user_id=user_id, title=req.title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def delete_session(db: Session, session_id: str, user_id: str) -> bool:
    session = db.query(Session).filter(
        Session.id == session_id, Session.user_id == user_id
    ).first()
    if not session:
        return False
    db.query(Message).filter(Message.session_id == session_id).delete()
    db.delete(session)
    db.commit()
    return True


def rename_session(db: Session, session_id: str, user_id: str, title: str) -> Session | None:
    session = db.query(Session).filter(
        Session.id == session_id, Session.user_id == user_id
    ).first()
    if not session:
        return None
    session.title = title
    db.commit()
    db.refresh(session)
    return session


def get_session_with_messages(db: Session, session_id: str, user_id: str) -> dict | None:
    session = get_session(db, session_id, user_id)
    if not session:
        return None
    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at)
        .all()
    )
    return {"session": session, "messages": messages}
```

- [ ] **Step 3: 创建 api/sessions.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.session import SessionCreate, SessionResponse, SessionDetail, MessageResponse
from app.services.session_service import (
    list_sessions,
    get_session,
    create_session,
    delete_session,
    rename_session,
    get_session_with_messages,
)
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse)
def api_create(req: SessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_session(db, str(current_user.id), req)


@router.get("", response_model=list[SessionResponse])
def api_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return list_sessions(db, str(current_user.id))


@router.get("/{session_id}", response_model=SessionDetail)
def api_detail(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = get_session_with_messages(db, session_id, str(current_user.id))
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return SessionDetail(
        id=str(result["session"].id),
        title=result["session"].title,
        created_at=result["session"].created_at,
        updated_at=result["session"].updated_at,
        messages=[
            MessageResponse(
                id=str(m.id),
                role=m.role,
                content=m.content,
                created_at=m.created_at,
            )
            for m in result["messages"]
        ],
    )


@router.put("/{session_id}", response_model=SessionResponse)
def api_rename(
    session_id: str,
    title: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = rename_session(db, session_id, str(current_user.id), title)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def api_delete(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not delete_session(db, session_id, str(current_user.id)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
```

- [ ] **Step 4: 测试会话 API**

```bash
# 先登录获取 token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}' | jq -r .access_token)

# 创建会话
curl -X POST http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"测试会话"}'

# 列出会话
curl http://localhost:8000/api/sessions \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] **Step 5: 提交**

```bash
git add backend/app/schemas/session.py backend/app/services/session_service.py backend/app/api/sessions.py
git commit -m "feat: add session management API"
```

---

### Task 7: DeepSeek API 代理 + 流式对话

**Files:**
- Create: `backend/app/schemas/message.py`
- Create: `backend/app/services/chat_service.py`
- Create: `backend/app/api/chat.py`

- [ ] **Step 1: 创建 schemas/message.py**

```python
from pydantic import BaseModel


class ChatRequest(BaseModel):
    session_id: str
    message: str
```

- [ ] **Step 2: 创建 chat_service.py**

```python
import httpx
from sqlalchemy.orm import Session
from app.models.session import Session
from app.models.message import Message
from app.schemas.message import ChatRequest


async def send_chat(db: Session, session: Session, user_id: str, req: ChatRequest) -> str:
    api_key = session.user.api_key
    if not api_key:
        raise ValueError("API key not configured")

    # 获取会话历史
    history = (
        db.query(Message)
        .filter(Message.session_id == session.id)
        .order_by(Message.created_at)
        .all()
    )

    # 构建 messages 数组
    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": req.message})

    # 保存用户消息
    user_msg = Message(session_id=session.id, role="user", content=req.message)
    db.add(user_msg)
    db.commit()

    # 调用 DeepSeek API
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://api.deepseek.com/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek-chat",
                "messages": messages,
                "stream": True,
            },
        )

        if response.status_code != 200:
            raise ValueError(f"DeepSeek API error: {response.status_code} {response.text}")

        # 流式读取
        full_content = ""
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                data = line[6:]
                if data == "[DONE]":
                    break
                import json
                chunk = json.loads(data)
                delta = chunk.get("choices", [{}])[0].get("delta", {})
                content = delta.get("content", "")
                full_content += content

    # 保存 AI 回复
    assistant_msg = Message(session_id=session.id, role="assistant", content=full_content)
    db.add(assistant_msg)
    db.commit()

    return full_content


async def send_chat_stream(db: Session, session: Session, user_id: str, req: ChatRequest):
    """流式返回，不等待完整响应"""
    api_key = session.user.api_key
    if not api_key:
        raise ValueError("API key not configured")

    history = (
        db.query(Message)
        .filter(Message.session_id == session.id)
        .order_by(Message.created_at)
        .all()
    )

    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": req.message})

    # 先保存用户消息
    user_msg = Message(session_id=session.id, role="user", content=req.message)
    db.add(user_msg)
    db.commit()

    # 调用 DeepSeek 流式 API
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://api.deepseek.com/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek-chat",
                "messages": messages,
                "stream": True,
            },
        )

        if response.status_code != 200:
            raise ValueError(f"DeepSeek API error: {response.status_code} {response.text}")

        return response
```

- [ ] **Step 3: 创建 api/chat.py**

```python
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.message import ChatRequest
from app.services.chat_service import send_chat_stream
from app.core.deps import get_current_user
from app.models.user import User
from app.models.session import Session

router = APIRouter(prefix="/api/chat", tags=["chat"])


def format_sse(data: str) -> str:
    return f"data: {json.dumps({'data': data})}\n\n"


@router.post("/{session_id}/chat")
async def api_chat(
    session_id: str,
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(Session).filter(
        Session.id == session_id, Session.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    async def event_stream():
        response = await send_chat_stream(db, session, str(current_user.id), req)
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                data = line[6:]
                if data == "[DONE]":
                    yield format_sse("[DONE]")
                    break
                yield format_sse(data)

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

- [ ] **Step 4: 测试流式对话**

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}' | jq -r .access_token)

# 先创建会话
SESSION_ID=$(curl -s -X POST http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"测试"}' | jq -r .id)

# 发送对话（需要先在设置中配置 API Key）
curl -N -X POST http://localhost:8000/api/chat/$SESSION_ID/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"你好"}'
```

- [ ] **Step 5: 提交**

```bash
git add backend/app/schemas/message.py backend/app/services/chat_service.py backend/app/api/chat.py
git commit -m "feat: add DeepSeek API proxy with streaming response"
```

---

### Task 8: API Key 设置模块

**Files:**
- Create: `backend/app/schemas/settings.py`
- Create: `backend/app/api/settings.py`

- [ ] **Step 1: 创建 schemas/settings.py**

```python
from pydantic import BaseModel


class ApiKeyUpdate(BaseModel):
    api_key: str
```

- [ ] **Step 2: 创建 api/settings.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.settings import ApiKeyUpdate
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/api-key")
def api_get_key(current_user: User = Depends(get_current_user)):
    return {"api_key": current_user.api_key or ""}


@router.put("/api-key")
def api_update_key(req: ApiKeyUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.api_key = req.api_key
    db.commit()
    return {"status": "ok"}
```

- [ ] **Step 3: 提交**

```bash
git add backend/app/schemas/settings.py backend/app/api/settings.py
git commit -m "feat: add API key settings endpoint"
```

---

## Phase 3: 前端 UI 开发

### Task 9: 前端基础设施

**Files:**
- Create: `frontend/src/store/useStore.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/hooks/useAuth.ts`
- Create: `frontend/src/hooks/useSessions.ts`
- Create: `frontend/src/hooks/useChat.ts`

- [ ] **Step 1: 创建 types/index.ts**

```typescript
export interface User {
  id: string
  username: string
  email: string
}

export interface Session {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface SessionDetail {
  session: Session
  messages: Message[]
}

export interface AuthResponse {
  access_token: string
  token_type: string
}
```

- [ ] **Step 2: 创建 api/client.ts**

```typescript
import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8000',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
```

- [ ] **Step 3: 安装 axios**

```bash
npm install axios
npm install -D @types/axios
```

- [ ] **Step 4: 创建 store/useStore.ts**

```typescript
import { create } from 'zustand'
import { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}))
```

- [ ] **Step 5: 创建 hooks/useAuth.ts**

```typescript
import { useCallback } from 'react'
import client from '../api/client'
import { useStore } from '../store/useStore'
import { User, AuthResponse } from '../types'

export function useAuth() {
  const { setAuth, logout } = useStore()

  const login = useCallback(async (username: string, password: string) => {
    const res = await client.post<AuthResponse>('/api/auth/login', { username, password })
    setAuth(
      { id: res.data.access_token, username, email: '' },
      res.data.access_token,
    )
    return res.data
  }, [setAuth])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await client.post<User>('/api/auth/register', { username, email, password })
    return res.data
  }, [])

  const me = useCallback(async () => {
    const res = await client.get<User>('/api/auth/me')
    return res.data
  }, [])

  return { login, register, me, logout }
}
```

- [ ] **Step 6: 创建 hooks/useSessions.ts**

```typescript
import { useCallback } from 'react'
import client from '../api/client'
import { Session, SessionDetail } from '../types'

export function useSessions() {
  const list = useCallback(async () => {
    const res = await client.get<Session[]>('/api/sessions')
    return res.data
  }, [])

  const create = useCallback(async (title: string) => {
    const res = await client.post<Session>('/api/sessions', { title })
    return res.data
  }, [])

  const getDetail = useCallback(async (id: string) => {
    const res = await client.get<SessionDetail>(`/api/sessions/${id}`)
    return res.data
  }, [])

  const remove = useCallback(async (id: string) => {
    await client.delete(`/api/sessions/${id}`)
  }, [])

  const rename = useCallback(async (id: string, title: string) => {
    const res = await client.put<Session>(`/api/sessions/${id}`, { title })
    return res.data
  }, [])

  return { list, create, getDetail, remove, rename }
}
```

- [ ] **Step 7: 创建 hooks/useChat.ts**

```typescript
import { useCallback, useRef } from 'react'

interface UseChatOptions {
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (error: string) => void
}

export function useChat(options: UseChatOptions) {
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(async (sessionId: string, message: string) => {
    abortRef.current = new AbortController()

    try {
      const response = await fetch(`http://localhost:8000/api/chat/${sessionId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message }),
        signal: abortRef.current.signal,
      })

      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              options.onDone()
              return
            }
            try {
              const parsed = JSON.parse(data)
              options.onChunk(parsed.data || '')
            } catch {
              options.onChunk(data)
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        options.onError(err.message)
      }
    }
  }, [options])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { send, cancel }
}
```

- [ ] **Step 8: 安装 zustand**

```bash
npm install zustand
```

- [ ] **Step 9: 提交**

```bash
git add frontend/src/store/ frontend/src/api/ frontend/src/types/ frontend/src/hooks/
git commit -m "feat: add frontend infrastructure (store, API client, hooks)"
```

---

### Task 10: 认证页面

**Files:**
- Create: `frontend/src/components/auth/LoginForm.tsx`
- Create: `frontend/src/components/auth/RegisterForm.tsx`
- Create: `frontend/src/components/auth/AuthPage.tsx`

- [ ] **Step 1: 创建 LoginForm.tsx**

```tsx
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'

interface LoginFormProps {
  onSwitch: () => void
}

export function LoginForm({ onSwitch }: LoginFormProps) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败')
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>登录</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full">登录</Button>
        </form>
        <p className="mt-4 text-center text-sm">
          还没有账号？{' '}
          <button type="button" onClick={onSwitch} className="text-blue-500 hover:underline">
            注册
          </button>
        </p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: 创建 RegisterForm.tsx**

```tsx
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'

interface RegisterFormProps {
  onSwitch: () => void
}

export function RegisterForm({ onSwitch }: RegisterFormProps) {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register(username, email, password)
      onSwitch()
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败')
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>注册</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full">注册</Button>
        </form>
        <p className="mt-4 text-center text-sm">
          已有账号？{' '}
          <button type="button" onClick={onSwitch} className="text-blue-500 hover:underline">
            登录
          </button>
        </p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: 创建 AuthPage.tsx**

```tsx
import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      {isLogin ? (
        <LoginForm onSwitch={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onSwitch={() => setIsLogin(true)} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: 在 App.tsx 中使用**

修改 `frontend/src/App.tsx`：

```tsx
import { useStore } from './store/useStore'
import { AuthPage } from './components/auth/AuthPage'
import { ChatLayout } from './components/layout/ChatLayout'

function App() {
  const { user } = useStore()

  return user ? <ChatLayout /> : <AuthPage />
}

export default App
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/auth/
git commit -m "feat: add login and register pages"
```

---

### Task 11: 聊天布局 + 会话列表

**Files:**
- Create: `frontend/src/components/layout/ChatLayout.tsx`
- Create: `frontend/src/components/sidebar/SessionList.tsx`
- Create: `frontend/src/components/sidebar/SessionItem.tsx`
- Create: `frontend/src/components/sidebar/NewSessionBtn.tsx`

- [ ] **Step 1: 创建 NewSessionBtn.tsx**

```tsx
import { Button } from '../ui/button'

interface NewSessionBtnProps {
  onClick: () => void
}

export function NewSessionBtn({ onClick }: NewSessionBtnProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="w-full justify-start gap-2"
    >
      <span className="text-lg">+</span>
      新会话
    </Button>
  )
}
```

- [ ] **Step 2: 创建 SessionItem.tsx**

```tsx
import { Session } from '../../types'

interface SessionItemProps {
  session: Session
  active: boolean
  onClick: () => void
  onDelete: () => void
}

export function SessionItem({ session, active, onClick, onDelete }: SessionItemProps) {
  return (
    <div
      className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer text-sm
        ${active ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
      onClick={onClick}
    >
      <span className="truncate flex-1">{session.title}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 3: 创建 SessionList.tsx**

```tsx
import { useEffect, useState } from 'react'
import { useSessions } from '../../hooks/useSessions'
import { Session } from '../../types'
import { SessionItem } from './SessionItem'
import { NewSessionBtn } from './NewSessionBtn'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'

interface SessionListProps {
  activeId: string | null
  onSelect: (id: string) => void
}

export function SessionList({ activeId, onSelect }: SessionListProps) {
  const { list, create, remove } = useSessions()
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    list().then(setSessions)
  }, [list])

  const handleNew = async () => {
    const s = await create('新会话')
    onSelect(s.id)
    setSessions((prev) => [s, ...prev])
  }

  const handleDelete = async (id: string) => {
    await remove(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="flex h-full flex-col bg-gray-50 p-3">
      <NewSessionBtn onClick={handleNew} />
      <Separator className="my-3" />
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {sessions.map((s) => (
            <SessionItem
              key={s.id}
              session={s}
              active={s.id === activeId}
              onClick={() => onSelect(s.id)}
              onDelete={() => handleDelete(s.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
```

- [ ] **Step 4: 创建 ChatLayout.tsx**

```tsx
import { useState, useEffect } from 'react'
import { useSessions } from '../hooks/useSessions'
import { SessionDetail } from '../types'
import { SessionList } from './SessionList'
import { ChatArea } from './ChatArea'
import { SettingsPanel } from './SettingsPanel'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

export function ChatLayout() {
  const { list } = useSessions()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    list().then((sessions) => {
      if (sessions.length > 0 && !activeSessionId) {
        setActiveSessionId(sessions[0].id)
      }
    })
  }, [list, activeSessionId])

  useEffect(() => {
    if (activeSessionId) {
      list().then((sessions) => {
        const current = sessions.find((s) => s.id === activeSessionId)
        if (!current) {
          setActiveSessionId(sessions[0]?.id ?? null)
          return
        }
      })
    }
  }, [activeSessionId, list])

  return (
    <div className="flex h-screen">
      <div className="w-64 flex-shrink-0">
        <SessionList activeId={activeSessionId} onSelect={setActiveSessionId} />
      </div>
      <Separator orientation="vertical" />
      <div className="flex flex-1 flex-col">
        {activeSessionId ? (
          <ChatArea sessionId={activeSessionId} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            选择一个会话或创建新会话
          </div>
        )}
      </div>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4"
        onClick={() => setShowSettings(!showSettings)}
      >
        设置
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/layout/ frontend/src/components/sidebar/
git commit -m "feat: add chat layout and session list"
```

---

### Task 12: 聊天区域 + 消息渲染

**Files:**
- Create: `frontend/src/components/chat/ChatArea.tsx`
- Create: `frontend/src/components/chat/MessageList.tsx`
- Create: `frontend/src/components/chat/MessageBubble.tsx`
- Create: `frontend/src/components/chat/InputBar.tsx`
- Create: `frontend/src/components/chat/ThinkingBox.tsx`

- [ ] **Step 1: 创建 MessageBubble.tsx**

```tsx
import { Message } from '../../types'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3
          ${isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900'
          }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            children={message.content + (isStreaming ? '▌' : '')}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                return match ? (
                  <SyntaxHighlighter
                    children={String(children).replace(/\n$/, '')}
                    language={match[1]}
                    style={vscDarkPlus}
                    {...props}
                  />
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
            }}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 安装 Markdown 依赖**

```bash
npm install react-markdown react-syntax-highlighter
```

- [ ] **Step 3: 创建 MessageList.tsx**

```tsx
import { Message } from '../../types'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  streamingMessage: string | null
}

export function MessageList({ messages, streamingMessage }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {streamingMessage && (
        <MessageBubble message={{ id: 'streaming', role: 'assistant', content: streamingMessage, created_at: '' }} isStreaming />
      )}
    </div>
  )
}
```

- [ ] **Step 4: 创建 InputBar.tsx**

```tsx
import { useState } from 'react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

interface InputBarProps {
  onSend: (message: string) => void
  loading: boolean
}

export function InputBar({ onSend, loading }: InputBarProps) {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (text.trim() && !loading) {
      onSend(text.trim())
      setText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t bg-white p-4">
      <div className="flex gap-2 max-w-3xl mx-auto">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          rows={2}
          className="resize-none"
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim() || loading}
          className="self-end"
        >
          {loading ? '发送中...' : '发送'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 创建 ThinkingBox.tsx**

```tsx
import { useState } from 'react'
import { Badge } from '../ui/badge'

interface ThinkingBoxProps {
  content: string
  isOpen: boolean
  onToggle: () => void
}

export function ThinkingBox({ content, isOpen, onToggle }: ThinkingBoxProps) {
  if (!content) return null

  return (
    <div className="mb-4 max-w-[70%]">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <Badge variant="secondary">思考过程</Badge>
        <span>{isOpen ? '收起' : '展开'}</span>
      </button>
      {isOpen && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          <pre className="whitespace-pre-wrap font-mono text-xs">{content}</pre>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: 创建 ChatArea.tsx**

```tsx
import { useState, useEffect, useRef } from 'react'
import { useSessions } from '../../hooks/useSessions'
import { useChat } from '../../hooks/useChat'
import { Message } from '../../types'
import { MessageList } from './MessageList'
import { InputBar } from './InputBar'
import { ThinkingBox } from './ThinkingBox'

interface ChatAreaProps {
  sessionId: string
}

export function ChatArea({ sessionId }: ChatAreaProps) {
  const { getDetail } = useSessions()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [thinkingContent, setThinkingContent] = useState('')
  const [thinkingOpen, setThinkingOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getDetail(sessionId).then((detail) => {
      setMessages(detail.messages)
      setStreamingContent('')
      setThinkingContent('')
    })
  }, [sessionId, getDetail])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const { send } = useChat({
    onChunk: (chunk) => {
      if (chunk === '[DONE]') return
      setStreamingContent((prev) => prev + chunk)
    },
    onDone: () => {
      setLoading(false)
      setStreamingContent('')
      // 刷新会话消息
      getDetail(sessionId).then((detail) => {
        setMessages(detail.messages)
      })
    },
    onError: (error) => {
      setLoading(false)
      setStreamingContent('')
      alert('错误: ' + error)
    },
  })

  const handleSend = async (message: string) => {
    setLoading(true)
    setThinkingContent('')
    setStreamingContent('')
    // 乐观更新：先显示用户消息
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])

    await send(sessionId, message)
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} streamingMessage={streamingContent} />
      {thinkingContent && (
        <div className="px-6">
          <ThinkingBox
            content={thinkingContent}
            isOpen={thinkingOpen}
            onToggle={() => setThinkingOpen(!thinkingOpen)}
          />
        </div>
      )}
      <InputBar onSend={handleSend} loading={loading} />
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 7: 提交**

```bash
git add frontend/src/components/chat/
git commit -m "feat: add chat area with message rendering and streaming"
```

---

### Task 13: 设置面板

**Files:**
- Create: `frontend/src/components/settings/SettingsPanel.tsx`

- [ ] **Step 1: 创建 SettingsPanel.tsx**

```tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('http://localhost:8000/api/settings/api-key', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => res.json())
      .then((data) => setApiKey(data.api_key))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch('http://localhost:8000/api/settings/api-key', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ api_key: apiKey }),
    })
    setSaving(false)
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">DeepSeek API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>
          <Separator />
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? '保存中...' : '保存 API Key'}
          </Button>
        </CardContent>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/components/settings/
git commit -m "feat: add settings panel for API key configuration"
```

---

## Phase 4: 联调与优化

### Task 14: 端到端联调测试

**Files:**
- Modify: `backend/app/config.py` (CORS 配置)
- Modify: `frontend/src/api/client.ts` (baseURL)

- [ ] **Step 1: 确保 CORS 配置正确**

检查 `backend/app/config.py` 中 `cors_origins` 包含 `http://localhost:5173`。

- [ ] **Step 2: 确保前端 baseURL 正确**

检查 `frontend/src/api/client.ts` 中 `baseURL` 为 `http://localhost:8000`。

- [ ] **Step 3: 启动前后端**

```bash
# 终端 1: 后端
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# 终端 2: 前端
cd frontend && npm run dev
```

- [ ] **Step 4: 测试完整流程**

1. 在 http://localhost:5173 注册账号
2. 登录
3. 创建新会话
4. 在设置中配置 DeepSeek API Key
5. 发送消息，验证流式响应
6. 切换会话，验证消息恢复
7. 删除会话，验证列表更新

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "feat: complete end-to-end integration testing"
```

---

### Task 15: 边界情况处理

**Files:**
- Modify: `backend/app/services/chat_service.py`
- Modify: `frontend/src/hooks/useChat.ts`
- Modify: `frontend/src/components/chat/ChatArea.tsx`

- [ ] **Step 1: 后端 - 添加 API Key 缺失检查**

在 `chat_service.py` 中，如果用户未配置 API Key，返回明确的错误信息。

- [ ] **Step 2: 后端 - 添加会话不存在检查**

在 `chat_service.py` 中，发送前验证会话存在且属于当前用户。

- [ ] **Step 3: 前端 - 添加加载状态反馈**

在 ChatArea 中，流式响应期间显示"AI 正在思考..."的提示。

- [ ] **Step 4: 前端 - 添加错误提示 UI**

用 toast 或 alert 组件替代 alert()，显示更友好的错误信息。

- [ ] **Step 5: 提交**

```bash
git add backend/app/services/chat_service.py frontend/src/hooks/useChat.ts frontend/src/components/chat/ChatArea.tsx
git commit -m "fix: improve error handling and edge cases"
```

---
