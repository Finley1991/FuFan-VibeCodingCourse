# TODO List Web Service — Design Spec

## Architecture

- FastAPI backend with SQLite for persistence
- Single-page frontend: one HTML file with embedded CSS + vanilla JS
- Both served from the same project directory

## Data Model

- `Todo` entity: `id` (auto), `title` (str), `description` (str, optional), `completed` (bool), `created_at` (datetime), `updated_at` (datetime)
- No categories/tags — personal use, YAGNI

## API Endpoints

- `GET /api/todos` — list all todos (optional `?completed=true/false` filter)
- `POST /api/todos` — create a todo (body: `{title, description?}`)
- `PATCH /api/todos/{id}` — update todo (toggle complete, edit title/description)
- `DELETE /api/todos/{id}` — delete a todo

## Frontend

- Simple list view with add form, checkboxes for toggle, inline edit for title
- Clean but minimal styling — functional over fancy
- No auth — local personal use

## Storage

- SQLite database file in the project directory
- Database URL configured via `.env` (following existing pattern)
