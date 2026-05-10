# TODO List Web Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal TODO list web service with FastAPI backend and vanilla HTML/JS frontend.

**Architecture:** FastAPI serves REST API at `/api/todos` and static frontend at `/`. SQLite stores todos in a local database file.

**Tech Stack:** Python 3, FastAPI, uvicorn, SQLite (via `sqlite3` stdlib), Pydantic.

---

### Task 1: Project scaffolding

**Files:**
- Create: `src/main.py`
- Create: `src/models.py`
- Create: `src/database.py`
- Create: `static/index.html`
- Create: `tests/test_api.py`
- Create: `requirements.txt`

- [ ] **Step 1: Create `requirements.txt`**

```
fastapi==0.115.0
uvicorn==0.30.6
pydantic==2.9.2
httpx==0.27.2
pytest==8.3.3
```

- [ ] **Step 2: Create `src/models.py`**

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None


class TodoResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 3: Create `src/database.py`**

```python
import sqlite3
import os
from datetime import datetime
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
    return [dict(r) for r in rows]


def get_todo(todo_id: int):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM todos WHERE id = ?", (todo_id,)
    ).fetchone()
    conn.close()
    if row is None:
        return None
    return dict(row)


def create_todo(title: str, description: Optional[str] = None):
    now = datetime.utcnow().isoformat()
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
    now = datetime.utcnow().isoformat()
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
```

- [ ] **Step 4: Create `src/main.py`**

```python
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from src.database import init_db, get_all_todos, get_todo, create_todo, update_todo, delete_todo
from src.models import TodoCreate, TodoUpdate, TodoResponse

app = FastAPI()

init_db()

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/api/todos")
def list_todos(completed: bool = None):
    todos = get_all_todos(completed)
    return todos


@app.post("/api/todos", response_model=TodoResponse)
def create_todo_endpoint(todo: TodoCreate):
    result = create_todo(todo.title, todo.description)
    return result


@app.patch("/api/todos/{todo_id}", response_model=TodoResponse)
def update_todo_endpoint(todo_id: int, todo: TodoUpdate):
    result = update_todo(todo_id, **todo.model_dump(exclude_unset=True))
    if result is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return result


@app.delete("/api/todos/{todo_id}")
def delete_todo_endpoint(todo_id: int):
    result = delete_todo(todo_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"status": "deleted"}


@app.get("/")
def serve_frontend():
    return FileResponse("static/index.html")
```

- [ ] **Step 5: Create `static/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TODO List</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; padding: 2rem; }
  .container { max-width: 600px; margin: 0 auto; }
  h1 { font-size: 1.8rem; margin-bottom: 1.5rem; }
  .add-form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
  .add-form input[type="text"] { flex: 1; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
  .add-form button { padding: 0.6rem 1.2rem; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
  .add-form button:hover { background: #1d4ed8; }
  .filters { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
  .filters button { padding: 0.3rem 0.8rem; border: 1px solid #ddd; background: #fff; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
  .filters button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
  .todo-list { list-style: none; }
  .todo-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #fff; border-radius: 6px; margin-bottom: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .todo-item input[type="checkbox"] { width: 1.2rem; height: 1.2rem; cursor: pointer; accent-color: #2563eb; }
  .todo-item .title { flex: 1; font-size: 1rem; }
  .todo-item .title.done { text-decoration: line-through; color: #999; }
  .todo-item .desc { font-size: 0.85rem; color: #666; }
  .todo-item .delete-btn { background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.2rem; padding: 0 0.3rem; }
  .todo-item .delete-btn:hover { color: #ef4444; }
  .empty { text-align: center; color: #999; padding: 2rem; }
</style>
</head>
<body>
<div class="container">
  <h1>TODO List</h1>
  <form class="add-form" id="addForm">
    <input type="text" id="titleInput" placeholder="Add a new task..." required>
    <button type="submit">Add</button>
  </form>
  <div class="filters">
    <button class="active" data-filter="all">All</button>
    <button data-filter="active">Active</button>
    <button data-filter="done">Done</button>
  </div>
  <ul class="todo-list" id="todoList"></ul>
</div>
<script>
  let currentFilter = 'all';

  async function loadTodos() {
    let url = '/api/todos';
    if (currentFilter === 'active') url += '?completed=false';
    if (currentFilter === 'done') url += '?completed=true';
    const res = await fetch(url);
    const todos = await res.json();
    render(todos);
  }

  function render(todos) {
    const list = document.getElementById('todoList');
    if (todos.length === 0) {
      list.innerHTML = '<li class="empty">No tasks here.</li>';
      return;
    }
    list.innerHTML = todos.map(t => `
      <li class="todo-item">
        <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTodo(${t.id}, this.checked)">
        <span class="title ${t.completed ? 'done' : ''}">${escapeHtml(t.title)}</span>
        ${t.description ? `<span class="desc">${escapeHtml(t.description)}</span>` : ''}
        <button class="delete-btn" onclick="deleteTodo(${t.id})">&times;</button>
      </li>
    `).join('');
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('titleInput');
    const title = input.value.trim();
    if (!title) return;
    await fetch('/api/todos', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({title, description: null})
    });
    input.value = '';
    loadTodos();
  });

  document.querySelectorAll('.filters button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadTodos();
    });
  });

  async function toggleTodo(id, checked) {
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({completed: checked})
    });
    loadTodos();
  }

  async function deleteTodo(id) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    loadTodos();
  }

  loadTodos();
</script>
</body>
</html>
```

- [ ] **Step 6: Create `tests/test_api.py`**

```python
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from src.main import app
from src.database import init_db, get_connection

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Reset DB before each test."""
    conn = get_connection()
    conn.execute("DROP TABLE IF EXISTS todos")
    conn.execute("""
        CREATE TABLE todos (
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
    init_db()


def test_create_todo():
    res = client.post("/api/todos", json={"title": "Test task"})
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Test task"
    assert data["completed"] is False
    assert data["id"] is not None


def test_create_todo_with_description():
    res = client.post("/api/todos", json={"title": "Task", "description": "Details"})
    assert res.status_code == 200
    assert res.json()["description"] == "Details"


def test_list_todos():
    client.post("/api/todos", json={"title": "Task 1"})
    client.post("/api/todos", json={"title": "Task 2"})
    res = client.get("/api/todos")
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_list_todos_filter_completed():
    client.post("/api/todos", json={"title": "Active task"})
    res = client.post("/api/todos", json={"title": "Done task"})
    done_id = res.json()["id"]
    client.patch(f"/api/todos/{done_id}", json={"completed": True})
    res = client.get("/api/todos?completed=false")
    assert len(res.json()) == 1
    assert res.json()[0]["completed"] is False


def test_update_todo():
    res = client.post("/api/todos", json={"title": "Original"})
    todo_id = res.json()["id"]
    res = client.patch(f"/api/todos/{todo_id}", json={"title": "Updated"})
    assert res.status_code == 200
    assert res.json()["title"] == "Updated"


def test_update_todo_toggle():
    res = client.post("/api/todos", json={"title": "Task"})
    todo_id = res.json()["id"]
    res = client.patch(f"/api/todos/{todo_id}", json={"completed": True})
    assert res.json()["completed"] is True


def test_update_todo_not_found():
    res = client.patch("/api/todos/999", json={"title": "X"})
    assert res.status_code == 404


def test_delete_todo():
    res = client.post("/api/todos", json={"title": "Task"})
    todo_id = res.json()["id"]
    res = client.delete(f"/api/todos/{todo_id}")
    assert res.status_code == 200
    assert res.json()["status"] == "deleted"
    res = client.get("/api/todos")
    assert len(res.json()) == 0


def test_delete_todo_not_found():
    res = client.delete("/api/todos/999")
    assert res.status_code == 404


def test_serve_frontend():
    res = client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
```

- [ ] **Step 7: Run `pip install -r requirements.txt`**

Run: `pip install -r requirements.txt`

- [ ] **Step 8: Run tests to verify they pass**

Run: `pytest tests/test_api.py -v`
Expected: All 11 tests PASS

- [ ] **Step 9: Commit**

```bash
git add src/main.py src/models.py src/database.py static/index.html tests/test_api.py requirements.txt
git commit -m "feat: build TODO list web service with FastAPI and SQLite"
```
