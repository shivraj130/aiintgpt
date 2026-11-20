
from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    target_role: str = "AI / ML Engineer"
    interview_type: str = "Mixed"
    difficulty: str = "Intermediate"
    resume_context: str = ""


class EvaluateRequest(BaseModel):
    session_id: int
    question: str
    answer: str = Field(min_length=3)


class InterviewQuestion(BaseModel):
    question: str
    category: str
    what_to_assess: str


class SessionCreateResponse(BaseModel):
    session_id: int
    questions: list[InterviewQuestion]
