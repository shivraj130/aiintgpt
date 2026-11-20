# InterviewIQ Backend

## Setup (Windows PowerShell)
1. Open a second VS Code terminal in the `backend` folder.
2. Create a virtual environment:
   `py -m venv .venv`
3. Activate it:
   `.venv\\Scripts\\Activate.ps1`
   If PowerShell blocks activation, use `..\\.venv\\Scripts\\python.exe` style commands or run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.
4. Install:
   `python -m pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and add your Gemini API key. Never paste the key into source code or chat.
6. Start:
   `python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
7. Open `http://127.0.0.1:8000/docs`.

## Endpoints
- GET `/api/health`
- POST `/api/resume/analyze` (multipart: file, target_role)
- POST `/api/interview/questions` (JSON)
- POST `/api/interview/evaluate` (JSON)
- GET `/api/interview/{session_id}/answers`

SQLite database file `interviewiq.db` is created automatically in this folder.

## Notes
This is an academic prototype starter. Validate outputs and handle API quota/errors. CORS is permissive for local development; restrict origins before deployment. Do not commit `.env` or expose your API key in frontend code.
