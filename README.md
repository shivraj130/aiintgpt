# InterviewIQ — AI Interview Intelligence Platform

A frontend-first academic prototype built with React + Vite.

## Run locally
1. Install Node.js (18+ recommended).
2. Extract this project.
3. Open a terminal in the project folder.
4. Run:

```bash
npm install
npm run dev
```

5. Open the local URL printed by Vite (usually http://localhost:5173).

## Production build
```bash
npm run build
npm run preview
```

## Demo walkthrough
1. Overview: show readiness score, activity, trend and competency breakdown.
2. Resume intelligence: upload a PDF/DOC/DOCX, select a target role, and click Analyze.
3. AI interview: select an interview type and start. Submit answers to progress through the four sample questions.
4. Performance reports: show sample competency scores and recommendations. The Answer Review tab shows responses submitted during the current session.
5. Settings: show profile and preference controls.

## Important academic-prototype note
This starter is a frontend demonstration. Resume analysis and performance metrics are illustrative demo outputs; no real LLM, speech model, webcam analysis, psychometric validation, or backend persistence is connected yet. Do not present sample scores as validated AI predictions. The UI is structured so API services can be integrated next.

## Suggested next integration steps
- FastAPI backend with `/api/resume/analyze`, `/api/interview/questions`, `/api/interview/evaluate`.
- PDF/DOCX parsing and skill extraction.
- LLM provider for question generation and rubric-based answer feedback.
- Speech-to-text service for recorded responses.
- MediaPipe/OpenCV module for optional visual engagement signals, with consent.
- PostgreSQL for users, resumes, sessions and reports.
