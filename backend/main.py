from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import models
from rag_pipeline import query_rag

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="NeuroPace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for request/response
class UserCreate(BaseModel):
    username: str
    age: int

class UserResponse(BaseModel):
    id: int
    username: str
    age: int
    hr_max: int
    
    class Config:
        orm_mode = True

class SymptomLogCreate(BaseModel):
    user_id: int
    context: str
    vas_score: int
    notes: str = None

class RAGQuery(BaseModel):
    query: str
    api_key: str = None

@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    new_user = models.User(username=user.username, age=user.age)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    hr_max = 220 - new_user.age
    return {"id": new_user.id, "username": new_user.username, "age": new_user.age, "hr_max": hr_max}

@app.get("/users/{user_id}/bctt-targets")
def get_bctt_targets(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    hr_max = 220 - user.age
    return {
        "hr_max": hr_max,
        "stage_1_target": int(hr_max * 0.50),
        "stage_2_target": int(hr_max * 0.55),
        "stage_3_target": int(hr_max * 0.60),
        "stage_4_target": int(hr_max * 0.65),
        "stage_5_target_low": int(hr_max * 0.70),
        "stage_5_target_high": int(hr_max * 0.80)
    }

@app.post("/symptoms/")
def log_symptom(log: SymptomLogCreate, db: Session = Depends(get_db)):
    new_log = models.SymptomLog(**log.dict())
    db.add(new_log)
    db.commit()
    return {"status": "success", "message": "Symptom logged"}

@app.post("/ask-ai/")
def ask_ai(req: RAGQuery):
    answer = query_rag(req.query, req.api_key)
    return {"answer": answer}

@app.get("/")
def read_root():
    return {"message": "Welcome to the NeuroPace API. Check /docs for endpoints."}
