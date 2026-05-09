from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
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
