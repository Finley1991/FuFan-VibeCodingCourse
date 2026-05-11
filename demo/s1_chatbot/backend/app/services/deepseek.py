import os
from openai import AsyncOpenAI
from typing import AsyncGenerator
from app.core.config import settings

class DeepSeekService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY or os.getenv("DEEPSEEK_API_KEY", ""),
            base_url=settings.DEEPSEEK_BASE_URL,
        )

    async def chat_stream(
        self,
        messages: list,
        model: str = "deepseek-v4-flash",
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        stream = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def reasoning_stream(
        self,
        messages: list,
        model: str = "deepseek-reasoner",
        temperature: float = 0.7,
    ) -> AsyncGenerator[dict, None]:
        stream = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if hasattr(delta, "reasoning_content") and delta.reasoning_content:
                yield {"type": "reasoning", "content": delta.reasoning_content}
            if delta.content:
                yield {"type": "content", "content": delta.content}

    def list_models(self) -> list:
        return [
            {"id": "deepseek-v4-flash", "object": "model", "owned_by": "deepseek"},
            {"id": "deepseek-reasoner", "object": "model", "owned_by": "deepseek"},
        ]

deepseek_service = DeepSeekService()

