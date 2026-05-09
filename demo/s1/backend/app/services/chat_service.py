import os
from dotenv import load_dotenv
from typing import AsyncGenerator
from openai import AsyncOpenAI

load_dotenv()

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
