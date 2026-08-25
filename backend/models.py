from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    age = Column(Integer, nullable=False)
    
    # Relationships
    symptom_logs = relationship("SymptomLog", back_populates="user")
    bctt_progressions = relationship("BCTTProgression", back_populates="user")

class SymptomLog(Base):
    __tablename__ = 'symptom_logs'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    timestamp = Column(DateTime, default=datetime.utcnow)
    context = Column(String) # e.g., 'pre-exercise', 'post-exercise', 'cognitive-pacing'
    vas_score = Column(Integer) # Visual Analog Scale 0-10
    notes = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="symptom_logs")

class BCTTProgression(Base):
    __tablename__ = 'bctt_progressions'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    timestamp = Column(DateTime, default=datetime.utcnow)
    stage = Column(Integer) # Stage 1-5
    duration_minutes = Column(Integer)
    completed_successfully = Column(Integer) # 1 for yes, 0 for no (failed due to symptom spike)
    
    user = relationship("User", back_populates="bctt_progressions")
