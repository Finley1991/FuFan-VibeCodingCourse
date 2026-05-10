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
