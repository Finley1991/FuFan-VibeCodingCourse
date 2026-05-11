import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ModelListResponse
from app.services.deepseek import deepseek_service

router = APIRouter()

@router.get("/models")
async def get_models():
    models = deepseek_service.list_models()
    return ModelListResponse(object="list", data=models)

@router.post("/chat")
async def chat(request: ChatRequest):
    valid_messages = [
        m for m in request.messages if m.content and m.content.strip()
    ]
    if not valid_messages:
        raise HTTPException(status_code=400, detail="消息列表不能为空")

    async def generate():
        try:
            async for chunk in deepseek_service.chat_stream(
                messages=[m.model_dump() for m in valid_messages],
                model=request.model,
                temperature=request.temperature,
            ):
                yield f"{json.dumps({'type': 'content', 'content': chunk})}\n"
        except Exception as e:
            yield f"{json.dumps({'type': 'error', 'content': str(e)})}\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")

@router.post("/reasoning")
async def reasoning(request: ChatRequest):
    valid_messages = [
        m for m in request.messages if m.content and m.content.strip()
    ]
    if not valid_messages:
        raise HTTPException(status_code=400, detail="消息列表不能为空")

    async def generate():
        try:
            async for chunk in deepseek_service.reasoning_stream(
                messages=[m.model_dump() for m in valid_messages],
                model=request.model,
                temperature=request.temperature,
            ):
                yield f"{json.dumps(chunk)}\n"
        except Exception as e:
            yield f"{json.dumps({'type': 'error', 'content': str(e)})}\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")
