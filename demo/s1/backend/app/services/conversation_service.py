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
    conv = get_conversation(db, conversation_id)
    if conv and role == "user" and not conv.messages:
        conv.title = content[:50] + ("..." if len(content) > 50 else "")
        conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)
    return msg

def get_messages(db: Session, conversation_id: str) -> list[Message]:
    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).all()
