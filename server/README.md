# Mock API сервер

Отдаёт мок-данные орг-структуры компании. Python 3.14+, FastAPI, uvicorn.

## Запуск

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 4000
```

Сервер стартует на `http://localhost:4000` (переопределяется через `PORT`).
CORS origin по умолчанию `http://localhost:5173` (переопределяется через `CORS_ORIGIN`).

## Эндпоинты

- `GET /api/org-tree` — плоский массив узлов орг-структуры: `id, name, parentId, headcount, budget, performance, updatedAt`.

## Тесты

```bash
source .venv/bin/activate
pytest
```
