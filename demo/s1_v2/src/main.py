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
