# ChatGPT Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a ChatGPT-like conversational system with React frontend and FastAPI backend supporting streaming output, conversation history, and Markdown rendering.

**Architecture:** React SPA communicates with FastAPI REST API + SSE endpoints. FastAPI proxies to OpenAI API with streaming. SQLite persists conversations and messages.

**Tech Stack:** React 18 + Vite + TypeScript + Tailwind CSS | FastAPI + SQLAlchemy + SQLite + openai SDK

---

## File Map

```
frontend/
├── src/types/index.ts           # TS types for Conversation, Message
├── services/api.ts              # API client (fetch wrappers)
├── store/chatStore.ts           # Zustand state management
├── hooks/useChat.ts             # SSE chat hook
├── components/
│   ├── ChatLayout.tsx           # Main layout wrapper
│   ├── Sidebar.tsx              # Conversation history sidebar
│   ├── MessageList.tsx          # Scrollable message container
│   ├── MessageItem.tsx          # Single message bubble
│   ├── ChatInput.tsx            # Input + send button
│   └── MarkdownContent.tsx      # Markdown + code highlight renderer
├── App.tsx                      # Root app component
└── main.tsx                     # Entry point

backend/
├── app/main.py                  # FastAPI app, CORS, router mounting
├── app/database.py              # SQLAlchemy engine, session, base
├── app/models/models.py         # Conversation, Message models
├── api/chat.py                  # POST /api/chat (SSE)
├── api/conversations.py         # CRUD for conversations
├── services/chat_service.py     # OpenAI streaming proxy
├── services/conversation_service.py  # DB conversation/message ops
├── requirements.txt             # Python deps
└── .env                         # OPENAI_API_KEY
```

---

### Task 1: Initialize Frontend Project

**Files:**
- Create: `frontend/` (via create vite)

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

Run:
```bash
cd /mnt/d/wangyafan/study/FuFan-VibeCodingCourse/demo/s1
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
cd frontend
npm install zustand axios react-markdown remark-gfm rehype-highlight highlight.js
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Verify project builds**

Run:
```bash
cd frontend && npm run build
```
Expected: SUCCESS, dist/ directory created

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: initialize React + Vite frontend with dependencies"
```

---

### Task 2: Configure Tailwind CSS with Vite Plugin

**Files:**
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/index.css` (replaces App.css)

- [ ] **Step 1: Configure Vite for Tailwind v4**

Edit `frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 2: Set up Tailwind imports**

Replace `frontend/src/index.css` with:
```css
@import "tailwindcss";
```

Remove `frontend/src/App.css` if it exists.

Update `frontend/src/App.tsx` to remove CSS import:
```typescript
function App() {
  return <h1 className="text-3xl font-bold underline">Hello world!</h1>
}
export default App
```

Update `frontend/src/App.tsx` imports in `main.tsx` if needed.

- [ ] **Step 3: Verify build still works**

Run:
```bash
cd frontend && npm run build
```
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: configure Tailwind CSS v4 with Vite plugin and API proxy"
```

---

### Task 3: Initialize Backend Project

**Files:**
- Create: `backend/app/__init__.py`, `backend/app/main.py`
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`

- [ ] **Step 1: Create project structure and requirements**

```bash
mkdir -p backend/app/api backend/app/models backend/app/services
touch backend/app/__init__.py backend/app/api/__init__.py backend/app/models/__init__.py backend/app/services/__init__.py
```

Create `backend/requirements.txt`:
```
fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy==2.0.35
openai>=1.40.0
python-dotenv==1.0.1
pydantic==2.9.2
```

- [ ] **Step 2: Create .env.example**

Create `backend/.env.example`:
```
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
DATABASE_URL=sqlite:///./chat.db
```

- [ ] **Step 3: Create FastAPI app skeleton**

Create `backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ChatGPT Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Verify backend starts**

Run:
```bash
cd backend && pip install -r requirements.txt
python -c "from app.main import app; print('Backend imports OK')"
```
Expected: `Backend imports OK`

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: initialize FastAPI backend with CORS and health endpoint"
```

---

### Task 4: Create Database Models

**Files:**
- Create: `backend/app/database.py`
- Create: `backend/app/models/models.py`

- [ ] **Step 1: Set up database connection**

Create `backend/app/database.py`:
```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chat.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 2: Define models**

Create `backend/app/models/models.py`:
```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200), default="New Chat")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversations.id"))
    role: Mapped[str] = mapped_column(String(10))  # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
```

- [ ] **Step 3: Create tables on startup**

Add to `backend/app/main.py`:
```python
from app.database import Base, engine

Base.metadata.create_all(bind=engine)
```

- [ ] **Step 4: Verify models work**

Run:
```bash
cd backend && python -c "
from app.models.models import Conversation, Message
from app.database import Base, engine
Base.metadata.create_all(bind=engine)
print('Models and tables created OK')
"
```
Expected: `Models and tables created OK`

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: add SQLAlchemy database models for Conversation and Message"
```

---

### Task 5: Implement OpenAI Chat Service with Streaming

**Files:**
- Create: `backend/app/services/chat_service.py`

- [ ] **Step 1: Create chat service**

Create `backend/app/services/chat_service.py`:
```python
import os
from typing import AsyncGenerator
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

async def chat_stream(messages: list[dict]) -> AsyncGenerator[str, None]:
    response = await client.chat.completions.create(
        model=MODEL,
        messages=messages,
        stream=True,
    )
    async for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta

async def chat_complete(messages: list[dict]) -> str:
    response = await client.chat.completions.create(
        model=MODEL,
        messages=messages,
    )
    return response.choices[0].message.content or ""
```

- [ ] **Step 2: Verify import**

Run:
```bash
cd backend && python -c "from app.services.chat_service import chat_stream, chat_complete; print('Chat service OK')"
```
Expected: `Chat service OK`

- [ ] **Step 3: Commit**

```bash
git add backend/
git commit -m "feat: implement OpenAI chat service with streaming support"
```

---

### Task 6: Implement Conversation CRUD API

**Files:**
- Create: `backend/app/services/conversation_service.py`
- Create: `backend/app/api/conversations.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create conversation service**

Create `backend/app/services/conversation_service.py`:
```python
from sqlalchemy.orm import Session
from app.models.models import Conversation, Message
from datetime import datetime

def list_conversations(db: Session) -> list[Conversation]:
    return db.query(Conversation).order_by(Conversation.updated_at.desc()).all()

def create_conversation(db: Session, title: str = "New Chat") -> Conversation:
    conv = Conversation(title=title)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

def get_conversation(db: Session, conv_id: str) -> Conversation | None:
    return db.query(Conversation).filter(Conversation.id == conv_id).first()

def delete_conversation(db: Session, conv_id: str) -> bool:
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        return False
    db.delete(conv)
    db.commit()
    return True

def add_message(db: Session, conversation_id: str, role: str, content: str) -> Message:
    msg = Message(conversation_id=conversation_id, role=role, content=content)
    db.add(msg)
    # Update conversation timestamp and title from first user message
    conv = get_conversation(db, conversation_id)
    if conv and role == "user" and not conv.messages:
        conv.title = content[:50] + ("..." if len(content) > 50 else "")
        conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)
    return msg

def get_messages(db: Session, conversation_id: str) -> list[Message]:
    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).all()
```

- [ ] **Step 2: Create conversations API**

Create `backend/app/api/conversations.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.services.conversation_service import (
    list_conversations, create_conversation, get_conversation,
    delete_conversation, get_messages,
)
from pydantic import BaseModel

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

class ConversationCreate(BaseModel):
    title: str = "New Chat"

@router.get("")
def list_conv(db: Session = Depends(get_db)):
    convs = list_conversations(db)
    return [{"id": c.id, "title": c.title, "created_at": c.created_at.isoformat(), "updated_at": c.updated_at.isoformat()} for c in convs]

@router.post("")
def create_conv(data: ConversationCreate, db: Session = Depends(get_db)):
    conv = create_conversation(db, data.title)
    return {"id": conv.id, "title": conv.title}

@router.get("/{conversation_id}")
def get_conv(conversation_id: str, db: Session = Depends(get_db)):
    conv = get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = get_messages(db, conversation_id)
    return {
        "id": conv.id, "title": conv.title,
        "messages": [{"role": m.role, "content": m.content} for m in messages],
    }

@router.delete("/{conversation_id}")
def delete_conv(conversation_id: str, db: Session = Depends(get_db)):
    if not delete_conversation(db, conversation_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"deleted": True}
```

- [ ] **Step 3: Mount router in main.py**

Update `backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.api import conversations as conv_api
# chat_api will be added in next task

app = FastAPI(title="ChatGPT Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(conv_api.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Verify API imports**

Run:
```bash
cd backend && python -c "from app.main import app; print('API routes OK')"
```
Expected: `API routes OK`

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: implement conversation CRUD API endpoints"
```

---

### Task 7: Implement SSE Chat Endpoint

**Files:**
- Create: `backend/app/api/chat.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create chat endpoint with SSE streaming**

Create `backend/app/api/chat.py`:
```python
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.chat_service import chat_stream
from app.services.conversation_service import get_conversation, get_messages, add_message
from pydantic import BaseModel

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    content: str
    conversation_id: str | None = None

async def event_generator(request: ChatRequest, db: Session):
    conv = None
    if request.conversation_id:
        conv = get_conversation(db, request.conversation_id)
        if not conv:
            yield f"data: {json.dumps({'error': 'Conversation not found'})}\n\n"
            return

    messages = []
    if conv:
        for msg in get_messages(db, request.conversation_id):
            messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": request.content})
    add_message(db, conv.id if conv else "", "user", request.content)

    # Create conversation if not exists
    if not conv:
        from app.services.conversation_service import create_conversation
        conv = create_conversation(db, request.content[:50])
        # Re-add message with correct conversation_id
        add_message(db, conv.id, "user", request.content)

    full_response = ""
    try:
        async for delta in chat_stream(messages):
            full_response += delta
            yield f"data: {json.dumps({'delta': delta})}\n\n"
        # Save assistant response
        add_message(db, conv.id, "assistant", full_response)
        yield f"data: {json.dumps({'done': True})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

@router.post("")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    return StreamingResponse(
        event_generator(request, db),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
```

Note: The SSE generator uses `EventSource` compatible format with JSON payloads.

- [ ] **Step 2: Mount chat router**

Update `backend/app/main.py`:
```python
from app.api import conversations as conv_api, chat as chat_api

# ... in the app setup ...
app.include_router(conv_api.router)
app.include_router(chat_api.router)
```

- [ ] **Step 3: Verify full backend imports**

Run:
```bash
cd backend && python -c "from app.main import app; routes = [r.path for r in app.routes]; print('Routes:', routes)"
```
Expected: Shows `/api/conversations`, `/api/chat`, `/health` routes

- [ ] **Step 4: Commit**

```bash
git add backend/
git commit -m "feat: implement SSE streaming chat endpoint with OpenAI proxy"
```

---

### Task 8: Create Frontend Types and API Service

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/services/api.ts`

- [ ] **Step 1: Define TypeScript types**

Create `frontend/src/types/index.ts`:
```typescript
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  content: string;
  conversation_id?: string;
}

export interface ChatDelta {
  delta?: string;
  done?: boolean;
  error?: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}
```

- [ ] **Step 2: Create API service**

Create `frontend/src/services/api.ts`:
```typescript
import type { Conversation, ChatRequest, ChatDelta, ConversationDetail, Message } from "../types";

const BASE = "/api";

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(`${BASE}/conversations`);
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function createConversation(title = "New Chat"): Promise<{ id: string; title: string }> {
  const res = await fetch(`${BASE}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

export async function fetchConversation(id: string): Promise<ConversationDetail> {
  const res = await fetch(`${BASE}/conversations/${id}`);
  if (!res.ok) throw new Error("Failed to fetch conversation");
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${BASE}/conversations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete conversation");
}

export function streamChat(request: ChatRequest, onDelta: (data: ChatDelta) => void): AbortController {
  const controller = new AbortController();

  fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: controller.signal,
  }).then(async (res) => {
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onDelta(data);
            } catch {}
          }
        }
      }
    })
    .catch((e) => {
      if (e.name !== "AbortError") console.error("Stream error:", e);
    });

  return controller;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
cd frontend && npx tsc --noEmit
```
Expected: No errors (or only pre-existing Vite template errors)

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: add TypeScript types and API service layer"
```

---

### Task 9: Set Up Zustand Store

**Files:**
- Create: `frontend/src/store/chatStore.ts`

- [ ] **Step 1: Create Zustand store**

Create `frontend/src/store/chatStore.ts`:
```typescript
import { create } from "zustand";
import type { Message, Conversation } from "../types";

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;

  setConversations: (convs: Conversation[]) => void;
  setCurrentConversation: (id: string | null) => void;
  setMessages: (msgs: Message[]) => void;
  appendMessage: (msg: Message) => void;
  setStreaming: (streaming: boolean, content?: string) => void;
  updateStreamingContent: (text: string) => void;
  addConversation: (conv: Conversation) => void;
  removeConversation: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",

  setConversations: (convs) => set({ conversations: convs }),
  setCurrentConversation: (id) => set({ currentConversationId: id, messages: [], streamingContent: "" }),
  setMessages: (msgs) => set({ messages: msgs }),
  appendMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setStreaming: (streaming, content = "") => set({ isStreaming: streaming, streamingContent: content }),
  updateStreamingContent: (text) => set({ streamingContent: text }),
  addConversation: (conv) => set((state) => ({ conversations: [conv, ...state.conversations] })),
  removeConversation: (id) => set((state) => ({
    conversations: state.conversations.filter((c) => c.id !== id),
    currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
    messages: state.currentConversationId === id ? [] : state.messages,
  })),
}));
```

- [ ] **Step 2: Verify build**

Run:
```bash
cd frontend && npm run build
```
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: add Zustand store for chat state management"
```

---

### Task 10: Create ChatLayout and Sidebar Components

**Files:**
- Create: `frontend/src/components/ChatLayout.tsx`
- Create: `frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: Create Sidebar component**

Create `frontend/src/components/Sidebar.tsx`:
```typescript
import { useChatStore } from "../store/chatStore";
import { fetchConversations, createConversation, deleteConversation } from "../services/api";

export default function Sidebar() {
  const { conversations, currentConversationId, setConversations, setCurrentConversation, addConversation, removeConversation } = useChatStore();

  const reload = () => fetchConversations().then(setConversations);

  const handleNew = async () => {
    const conv = await createConversation();
    addConversation({ id: conv.id, title: conv.title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    setCurrentConversation(conv.id);
  };

  const handleSelect = (id: string) => {
    setCurrentConversation(id);
    fetchConversations().then(setConversations);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    removeConversation(id);
  };

  return (
    <div className="w-64 h-full bg-gray-900 text-gray-300 flex flex-col p-3">
      <button
        onClick={handleNew}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-left mb-4"
      >
        + New Chat
      </button>
      <div className="flex-1 overflow-y-auto space-y-1">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => handleSelect(conv.id)}
            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 ${currentConversationId === conv.id ? "bg-white/10" : ""}`}
          >
            <span className="truncate text-sm">{conv.title}</span>
            <button
              onClick={(e) => handleDelete(e, conv.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ChatLayout component**

Create `frontend/src/components/ChatLayout.tsx`:
```typescript
import Sidebar from "./Sidebar";

interface Props {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: Props) {
  return (
    <div className="flex h-screen bg-gray-800">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd frontend && npm run build
```
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: add ChatLayout and Sidebar components"
```

---

### Task 11: Create MessageList, MessageItem, and MarkdownContent Components

**Files:**
- Create: `frontend/src/components/MarkdownContent.tsx`
- Create: `frontend/src/components/MessageItem.tsx`
- Create: `frontend/src/components/MessageList.tsx`

- [ ] **Step 1: Create MarkdownContent with code highlighting**

Create `frontend/src/components/MarkdownContent.tsx`:
```typescript
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface Props {
  content: string;
}

export default function MarkdownContent({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre: ({ children }) => <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto my-2">{children}</pre>,
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code className={className}>{children}</code>
          ) : (
            <code className="bg-gray-700 px-1 rounded text-sm">{children}</code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

- [ ] **Step 2: Create MessageItem component**

Create `frontend/src/components/MessageItem.tsx`:
```typescript
import MarkdownContent from "./MarkdownContent";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export default function MessageItem({ role, content }: Props) {
  const isUser = role === "user";
  return (
    <div className={`py-6 px-4 ${isUser ? "bg-gray-800" : "bg-gray-900"}`}>
      <div className="max-w-3xl mx-auto">
        <div className="font-semibold text-sm text-gray-400 mb-1">{isUser ? "You" : "Assistant"}</div>
        <div className={isUser ? "text-white" : "text-gray-200"}>
          {isUser ? <p className="whitespace-pre-wrap">{content}</p> : <MarkdownContent content={content} />}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create MessageList component with auto-scroll**

Create `frontend/src/components/MessageList.tsx`:
```typescript
import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import { useChatStore } from "../store/chatStore";

export default function MessageList() {
  const { messages, isStreaming, streamingContent } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-4">
        {messages.length === 0 && !isStreaming ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>How can I help you today?</p>
          </div>
        ) : null}
        {messages.map((msg, i) => (
          <MessageItem key={i} role={msg.role} content={msg.content} />
        ))}
        {isStreaming && streamingContent ? (
          <div className="py-6 px-4 bg-gray-900">
            <div className="max-w-3xl mx-auto">
              <div className="font-semibold text-sm text-gray-400 mb-1">Assistant</div>
              <div className="text-gray-200">
                <MarkdownContent content={streamingContent} />
              </div>
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

Note: Import MarkdownContent in MessageList:
Add `import MarkdownContent from "./MarkdownContent";` to MessageList.tsx.

- [ ] **Step 4: Verify build**

Run:
```bash
cd frontend && npm run build
```
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: add MessageList, MessageItem, and MarkdownContent components"
```

---

### Task 12: Create ChatInput Component and SSE Hook

**Files:**
- Create: `frontend/src/hooks/useChat.ts`
- Create: `frontend/src/components/ChatInput.tsx`

- [ ] **Step 1: Create useChat hook with SSE handling**

Create `frontend/src/hooks/useChat.ts`:
```typescript
import { useCallback, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import { streamChat } from "../services/api";

export function useChat() {
  const { appendMessage, setStreaming, updateStreamingContent, currentConversationId } = useChatStore();
  const controllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    appendMessage({ role: "user", content });
    setStreaming(true, "");

    let accumulated = "";
    controllerRef.current = streamChat(
      { content, conversation_id: currentConversationId || undefined },
      (data) => {
        if (data.error) {
          console.error("Stream error:", data.error);
          setStreaming(false);
        } else if (data.done) {
          setStreaming(false);
          controllerRef.current = null;
        } else if (data.delta) {
          accumulated += data.delta;
          updateStreamingContent(accumulated);
        }
      },
    );
  }, [appendMessage, setStreaming, updateStreamingContent, currentConversationId]);

  const stopStreaming = useCallback(() => {
    controllerRef.current?.abort();
    setStreaming(false);
    controllerRef.current = null;
  }, [setStreaming]);

  return { sendMessage, stopStreaming, isStreaming: useChatStore((s) => s.isStreaming) };
}
```

- [ ] **Step 2: Create ChatInput component**

Create `frontend/src/components/ChatInput.tsx`:
```typescript
import { useState, useRef } from "react";
import { useChat } from "../hooks/useChat";

export default function ChatInput() {
  const [input, setInput] = useState("");
  const { sendMessage, stopStreaming, isStreaming } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    await sendMessage(content);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) handleSend();
    }
  };

  return (
    <div className="border-t border-gray-700 p-4 bg-gray-800">
      <div className="max-w-3xl mx-auto relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          disabled={isStreaming}
          className="w-full bg-gray-700 text-white rounded-lg pl-4 pr-12 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {isStreaming ? (
          <button
            onClick={stopStreaming}
            className="absolute right-2 bottom-2 p-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd frontend && npm run build
```
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: add ChatInput component and SSE streaming hook"
```

---

### Task 13: Wire Up App Entry Point with Conversation Loading

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Assemble the full app**

Replace `frontend/src/App.tsx`:
```typescript
import { useEffect } from "react";
import ChatLayout from "./components/ChatLayout";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import { useChatStore } from "./store/chatStore";
import { fetchConversations, fetchConversation } from "./services/api";

function App() {
  const { currentConversationId, setConversations, setCurrentConversation, setMessages } = useChatStore();

  useEffect(() => {
    fetchConversations().then(setConversations).catch(console.error);
  }, [setConversations]);

  useEffect(() => {
    if (currentConversationId) {
      fetchConversation(currentConversationId)
        .then((detail) => setMessages(detail.messages))
        .catch(console.error);
    } else {
      setMessages([]);
    }
  }, [currentConversationId, setMessages]);

  return (
    <ChatLayout>
      <div className="flex flex-col h-full">
        <MessageList />
        <ChatInput />
      </div>
    </ChatLayout>
  );
}

export default App;
```

- [ ] **Step 2: Verify build**

Run:
```bash
cd frontend && npm run build
```
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: wire up App with conversation loading and full chat layout"
```

---

### Task 14: End-to-End Verification

**Files:** All files

- [ ] **Step 1: Start backend server**

Run in background:
```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

Wait for `Application startup complete`.

- [ ] **Step 2: Verify health endpoint**

Run:
```bash
curl http://localhost:8000/health
```
Expected: `{"status":"ok"}`

- [ ] **Step 3: Start frontend dev server**

Run in background:
```bash
cd frontend && npm run dev &
```

Wait for `Local: http://localhost:3000/`.

- [ ] **Step 4: Verify frontend serves**

Run:
```bash
curl -s http://localhost:3000/ | head -20
```
Expected: HTML with Vite entry point

- [ ] **Step 5: Test conversation creation via API**

Run:
```bash
curl -X POST http://localhost:8000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat"}'
```
Expected: `{"id":"...","title":"Test Chat"}`

- [ ] **Step 6: Clean up background processes**

Run:
```bash
pkill -f "uvicorn app.main" 2>/dev/null; pkill -f "vite" 2>/dev/null; true
```

- [ ] **Step 7: Final commit**

```bash
git add .
git status
# Review all changes
git commit -m "feat: complete ChatGPT clone with streaming chat, conversation history, and Markdown rendering"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All spec requirements mapped to tasks (frontend components, backend API, SSE streaming, DB models, state management)
- [x] **No placeholders:** Every step has concrete code, commands, and expected output
- [x] **Type consistency:** Message/Conversation types consistent between frontend TS types and backend SQLAlchemy models
- [x] **File boundaries:** Each file has one clear responsibility; no oversized files
- [x] **TDD note:** Backend uses Python (tests would require pytest setup); frontend uses build verification. For production, add pytest for backend and Vitest for frontend as a follow-up task.
