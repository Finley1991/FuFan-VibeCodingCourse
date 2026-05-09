from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.api import conversations as conv_api
from app.api import chat as chat_api

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
app.include_router(chat_api.router)

@app.get("/health")
def health():
    return {"status": "ok"}
