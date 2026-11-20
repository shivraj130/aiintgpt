import json
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import ResumeAnalysis, InterviewSession, InterviewAnswer
from .schemas import QuestionRequest, EvaluateRequest
from .resume_parser import extract_resume_text
from .ai_service import ask_gemini_json

Base.metadata.create_all(bind=engine)

app = FastAPI(title="InterviewIQ API", version="1.0.0",
              description="Backend API for the AI Interview Intelligence academic prototype.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your frontend origin before public deployment.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "InterviewIQ API is running", "docs": "/docs"}

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "InterviewIQ API"}

@app.post("/api/resume/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: str = Form("AI / ML Engineer"),
    db: Session = Depends(get_db)
):
    if not file.filename or not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(400, "Upload a PDF or DOCX file.")
    raw = await file.read()
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(413, "File is larger than 10 MB.")
    try:
        extracted = extract_resume_text(file.filename, raw)
        if len(extracted) < 40:
            raise ValueError("Not enough readable text was found. Scanned PDFs may need OCR.")
        prompt = f'''You are a resume analysis assistant. Analyze the resume for the target role: {target_role}.
Return ONLY valid JSON with keys:
candidate_name (string or null), summary (string), skills (array of strings),
education (array of strings), experience (array of strings), projects (array of strings),
match_score (integer 0-100), strengths (array of strings),
improvements (array of strings), missing_skills (array of strings).
Be evidence-based. Do not invent qualifications. If information is absent, return an empty array.
RESUME TEXT:
{extracted[:18000]}'''
        result = ask_gemini_json(prompt)
        record = ResumeAnalysis(filename=file.filename, target_role=target_role,
                                extracted_text=extracted[:30000],
                                analysis_json=json.dumps(result))
        db.add(record)
        db.commit()
        db.refresh(record)
        return {"analysis_id": record.id, "filename": file.filename, "target_role": target_role,
                "extracted_characters": len(extracted), "analysis": result}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(502, f"Resume analysis failed: {str(e)}")

@app.post("/api/interview/questions")
def generate_questions(payload: QuestionRequest, db: Session = Depends(get_db)):
    prompt = f'''Create 5 interview questions for a candidate applying for {payload.target_role}.
Interview type: {payload.interview_type}. Difficulty: {payload.difficulty}.
Use resume context if supplied: {payload.resume_context[:5000]}
Return ONLY valid JSON: {{"questions":[{{"question":"...","category":"Technical|Behavioral|Problem solving","what_to_assess":"..."}}]}}
Questions must be clear, non-repetitive, appropriate to the role, and answerable in an interview.'''
    try:
        result = ask_gemini_json(prompt)
        questions = result.get("questions", [])
        if not questions:
            raise ValueError("Gemini returned no questions.")
        session = InterviewSession(target_role=payload.target_role,
                                   interview_type=payload.interview_type,
                                   questions_json=json.dumps(questions))
        db.add(session)
        db.commit()
        db.refresh(session)
        return {"session_id": session.id, "questions": questions}
    except Exception as e:
        db.rollback()
        raise HTTPException(502, f"Question generation failed: {str(e)}")

@app.post("/api/interview/evaluate")
def evaluate_answer(payload: EvaluateRequest, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == payload.session_id).first()
    if not session:
        raise HTTPException(404, "Interview session not found.")
    prompt = f'''Evaluate this interview answer for a {session.target_role} interview.
Question: {payload.question}
Candidate answer: {payload.answer}
Return ONLY valid JSON with keys:
overall_score (integer 0-100), technical_accuracy (integer 0-100),
relevance (integer 0-100), clarity (integer 0-100),
strengths (array of strings), improvements (array of strings),
feedback (string), suggested_answer_points (array of strings).
Be constructive, fair, and do not infer personality or protected traits.'''
    try:
        result = ask_gemini_json(prompt)
        record = InterviewAnswer(session_id=session.id, question=payload.question,
                                 answer=payload.answer, evaluation_json=json.dumps(result))
        db.add(record)
        db.commit()
        db.refresh(record)
        return {"answer_id": record.id, "session_id": session.id, "evaluation": result}
    except Exception as e:
        db.rollback()
        raise HTTPException(502, f"Answer evaluation failed: {str(e)}")

@app.get("/api/interview/{session_id}/answers")
def get_session_answers(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Interview session not found.")
    rows = db.query(InterviewAnswer).filter(InterviewAnswer.session_id == session_id).all()
    return [{"id": r.id, "question": r.question, "answer": r.answer,
             "evaluation": json.loads(r.evaluation_json)} for r in rows]

@app.get("/api/interview/sessions")
def list_interview_sessions(db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).all()
    output = []
    for session in sessions:
        answers = db.query(InterviewAnswer).filter(
            InterviewAnswer.session_id == session.id
        ).all()
        scores = []
        for answer in answers:
            try:
                evaluation = json.loads(answer.evaluation_json)
                value = evaluation.get("overall_score")
                if isinstance(value, (int, float)):
                    scores.append(float(value))
            except (json.JSONDecodeError, TypeError):
                pass
        questions = json.loads(session.questions_json or "[]")
        output.append({
            "session_id": session.id,
            "target_role": session.target_role,
            "interview_type": session.interview_type,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "question_count": len(questions) if isinstance(questions, list) else 0,
            "answer_count": len(answers),
            "average_score": round(sum(scores) / len(scores), 1) if scores else None,
            "completed": bool(questions) and len(answers) >= len(questions),
        })
    return output


@app.get("/api/interview/analytics")
def interview_analytics(db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.asc()).all()
    resume_count = db.query(ResumeAnalysis).count()
    all_answers = db.query(InterviewAnswer).all()

    score_fields = {
        "overall_score": [],
        "technical_accuracy": [],
        "relevance": [],
        "clarity": [],
    }
    session_scores = []
    total_completed = 0

    for session in sessions:
        rows = db.query(InterviewAnswer).filter(
            InterviewAnswer.session_id == session.id
        ).all()
        this_session_scores = []
        for row in rows:
            try:
                evaluation = json.loads(row.evaluation_json)
            except (json.JSONDecodeError, TypeError):
                continue
            for field in score_fields:
                value = evaluation.get(field)
                if isinstance(value, (int, float)):
                    score_fields[field].append(float(value))
            value = evaluation.get("overall_score")
            if isinstance(value, (int, float)):
                this_session_scores.append(float(value))

        try:
            questions = json.loads(session.questions_json or "[]")
        except (json.JSONDecodeError, TypeError):
            questions = []
        if questions and len(rows) >= len(questions):
            total_completed += 1
        if this_session_scores:
            session_scores.append({
                "day": session.created_at.strftime("%d %b") if session.created_at else f"#{session.id}",
                "score": round(sum(this_session_scores) / len(this_session_scores), 1),
                "_created": session.created_at,
            })

    overall_values = score_fields["overall_score"]
    trend = session_scores[-10:]
    recent_sessions = sorted(
        sessions, key=lambda item: item.created_at or 0, reverse=True
    )[:5]
    recent = []
    for session in recent_sessions:
        rows = db.query(InterviewAnswer).filter(
            InterviewAnswer.session_id == session.id
        ).all()
        values = []
        for row in rows:
            try:
                score = json.loads(row.evaluation_json).get("overall_score")
                if isinstance(score, (int, float)):
                    values.append(float(score))
            except (json.JSONDecodeError, TypeError):
                pass
        try:
            questions = json.loads(session.questions_json or "[]")
        except (json.JSONDecodeError, TypeError):
            questions = []
        recent.append({
            "session_id": session.id,
            "target_role": session.target_role,
            "interview_type": session.interview_type,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "answer_count": len(rows),
            "average_score": round(sum(values) / len(values), 1) if values else None,
            "completed": bool(questions) and len(rows) >= len(questions),
        })

    return {
        "total_interviews": len(sessions),
        "completed_interviews": total_completed,
        "total_answers": len(all_answers),
        "resume_analyses": resume_count,
        "average_score": round(sum(overall_values) / len(overall_values), 1) if overall_values else 0,
        "skill_scores": {
            "technical_accuracy": round(sum(score_fields["technical_accuracy"]) / len(score_fields["technical_accuracy"]), 1) if score_fields["technical_accuracy"] else 0,
            "relevance": round(sum(score_fields["relevance"]) / len(score_fields["relevance"]), 1) if score_fields["relevance"] else 0,
            "clarity": round(sum(score_fields["clarity"]) / len(score_fields["clarity"]), 1) if score_fields["clarity"] else 0,
        },
        "trend": [{"day": item["day"], "score": item["score"]} for item in trend],
        "recent_interviews": recent,
    }

