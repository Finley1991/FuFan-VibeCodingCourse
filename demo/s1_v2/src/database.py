import sqlite3
import os
from datetime import datetime, UTC
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "todos.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            completed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def get_all_todos(completed: Optional[bool] = None):
    conn = get_connection()
    if completed is not None:
        rows = conn.execute(
            "SELECT * FROM todos WHERE completed = ? ORDER BY created_at DESC",
            (int(completed),)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM todos ORDER BY created_at DESC"
        ).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["completed"] = bool(d["completed"])
        result.append(d)
    return result


def get_todo(todo_id: int):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM todos WHERE id = ?", (todo_id,)
    ).fetchone()
    conn.close()
    if row is None:
        return None
    d = dict(row)
    d["completed"] = bool(d["completed"])
    return d


def create_todo(title: str, description: Optional[str] = None):
    now = datetime.now(UTC).isoformat()
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO todos (title, description, completed, created_at, updated_at) VALUES (?, ?, 0, ?, ?)",
        (title, description, now, now)
    )
    conn.commit()
    todo_id = cursor.lastrowid
    conn.close()
    return {"id": todo_id, "title": title, "description": description, "completed": False, "created_at": now, "updated_at": now}


def update_todo(todo_id: int, title: Optional[str] = None, description: Optional[str] = None, completed: Optional[bool] = None):
    existing = get_todo(todo_id)
    if existing is None:
        return None
    new_title = title if title is not None else existing["title"]
    new_description = description if description is not None else existing["description"]
    new_completed = completed if completed is not None else existing["completed"]
    now = datetime.now(UTC).isoformat()
    conn = get_connection()
    conn.execute(
        "UPDATE todos SET title = ?, description = ?, completed = ?, updated_at = ? WHERE id = ?",
        (new_title, new_description, int(new_completed), now, todo_id)
    )
    conn.commit()
    conn.close()
    return {"id": todo_id, "title": new_title, "description": new_description, "completed": new_completed, "created_at": existing["created_at"], "updated_at": now}


def delete_todo(todo_id: int):
    existing = get_todo(todo_id)
    if existing is None:
        return None
    conn = get_connection()
    conn.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
    conn.commit()
    conn.close()
    return True
