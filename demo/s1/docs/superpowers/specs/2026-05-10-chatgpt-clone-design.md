# ChatGPT Clone - Design Spec

## Overview

Build a ChatGPT-like conversational system with a React frontend and FastAPI backend, supporting streaming output, conversation history management, and Markdown rendering.

## Architecture

```
Frontend (React + Vite + Tailwind)          Backend (FastAPI + SQLite)
├── Chat UI ──────────SSE──────────────> StreamingResponse
├── State Management (Zustand)             ├── REST API for conversations/messages
├── Markdown Renderer                      ├── OpenAI SDK integration
└── Conversation Sidebar                   └── SQLAlchemy ORM
```

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend framework | React 18 + Vite | Fast HMR, mainstream |
| Styling | Tailwind CSS | Rapid modern UI |
| Markdown | react-markdown + rehype-highlight | Mature, stable |
| Streaming | EventSource (SSE) | Native support, simple |
| Backend framework | FastAPI | Async-native, auto docs |
| Database | SQLite + SQLAlchemy | Zero config, sufficient for learning |
| AI API | openai Python SDK | Official library, good streaming support |

## Frontend Components

- `ChatLayout` — main layout managing sidebar and chat area
- `Sidebar` — conversation history list, new chat button
- `MessageList` — message rendering with auto-scroll
- `MessageItem` — single message, distinguishes user/assistant, Markdown rendering
- `ChatInput` — input field, send button, loading state
- `MarkdownContent` — Markdown + code highlight rendering

## Backend API Endpoints

| Method | Path | Function |
|--------|------|----------|
| POST | `/api/chat` | Send message, SSE streaming response |
| GET | `/api/conversations` | List conversations |
| POST | `/api/conversations` | Create new conversation |
| GET | `/api/conversations/{id}` | Get conversation details and messages |
| DELETE | `/api/conversations/{id}` | Delete conversation |

## Data Models

- **Conversation**: id (UUID), title, created_at, updated_at
- **Message**: id (UUID), conversation_id (FK), role (user/assistant), content, created_at

## Implementation Phases

1. **Phase 1 — Setup**: Initialize frontend and backend projects, configure Tailwind, CORS, env vars
2. **Phase 2 — Backend Core**: Database models, OpenAI integration, conversation API, SSE endpoint
3. **Phase 3 — Frontend Core**: Layout components, message list/input, SSE client, Markdown rendering
4. **Phase 4 — Polish**: Sidebar history, conversation switching, loading states, error handling
