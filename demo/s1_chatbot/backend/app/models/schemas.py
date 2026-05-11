from pydantic import BaseModel
from typing import List, Literal


class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "deepseek-v4-flash"
    temperature: float = 0.7
    stream: bool = True


class ModelInfo(BaseModel):
    id: str
    object: str = "model"
    owned_by: str = "deepseek"


class ModelListResponse(BaseModel):
    object: str = "list"
    data: List[ModelInfo]

