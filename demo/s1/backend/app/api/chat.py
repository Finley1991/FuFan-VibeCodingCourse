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

    # Create conversation if not exists
    if not conv:
        from app.services.conversation_service import create_conversation
        conv = create_conversation(db, request.content[:50])

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
