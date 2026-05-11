import sqlite3
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import contextmanager

DATABASE_PATH = "chatbot.db"


@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at REAL NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                thinking TEXT,
                created_at REAL NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions (id)
            )
        """)
        conn.commit()


def create_session(session_id: str, title: str, created_at: float):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO sessions (id, title, created_at) VALUES (?, ?, ?)",
            (session_id, title, created_at)
        )
        conn.commit()


def get_all_sessions() -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        if not row:
            return None

        session = dict(row)
        cursor.execute(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,)
        )
        messages = cursor.fetchall()
        session["messages"] = [dict(m) for m in messages]
        return session


def update_session_title(session_id: str, title: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE sessions SET title = ? WHERE id = ?",
            (title, session_id)
        )
        conn.commit()


def delete_session(session_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()


def add_message(
    message_id: str,
    session_id: str,
    role: str,
    content: str,
    thinking: Optional[str] = None
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO messages (id, session_id, role, content, thinking, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (message_id, session_id, role, content, thinking, datetime.now().timestamp())
        )
        conn.commit()


def update_message(message_id: str, content: str, thinking: Optional[str] = None):
    with get_db() as conn:
        cursor = conn.cursor()
        if thinking is not None:
            cursor.execute(
                "UPDATE messages SET content = ?, thinking = ? WHERE id = ?",
                (content, thinking, message_id)
            )
        else:
            cursor.execute(
                "UPDATE messages SET content = ? WHERE id = ?",
                (content, message_id)
            )
        conn.commit()

