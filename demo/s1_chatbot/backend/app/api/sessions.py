from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core import database

router = APIRouter()


class SessionCreate(BaseModel):
    title: str = "新对话"


class MessageInput(BaseModel):
    role: str
    content: str
    thinking: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    title: str
    created_at: float
    messages: List[dict] = []


@router.post("/sessions")
async def create_session(data: SessionCreate):
    session_id = str(hash(f"{data.title}{__import__('time').time()}"))
    database.create_session(session_id, data.title, __import__("time").time())
    return {"id": session_id, "title": data.title}


@router.get("/sessions")
async def list_sessions():
    sessions = database.get_all_sessions()
    return {"sessions": sessions}


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    session = database.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    database.delete_session(session_id)
    return {"status": "ok"}


@router.put("/sessions/{session_id}/title")
async def update_title(session_id: str, data: SessionCreate):
    database.update_session_title(session_id, data.title)
    return {"status": "ok"}


@router.post("/sessions/{session_id}/messages")
async def add_message_to_session(session_id: str, message: MessageInput):
    message_id = str(hash(f"{session_id}{message.content}{__import__('time').time()}"))
    database.add_message(
        message_id,
        session_id,
        message.role,
        message.content,
        message.thinking
    )
    return {"id": message_id}

