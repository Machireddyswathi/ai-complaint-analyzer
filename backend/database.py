from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import os
import pytz
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./complaints.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Complaint(Base):
    """
    Enhanced Complaint model with status tracking
    """
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    text = Column(String, nullable=False)
    category = Column(String, nullable=False)
    sentiment = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    status = Column(String, default="open", nullable=False)  # open, in_progress, resolved
    category_confidence = Column(Float)
    sentiment_confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    response_due_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    def to_dict(self):
        # Convert to Indian Standard Time (IST)
        ist = pytz.timezone('Asia/Kolkata')
        created_ist = self.created_at.replace(tzinfo=pytz.utc).astimezone(ist) if self.created_at else None
        
        # Calculate response time remaining
        response_due_ist = self.response_due_at.replace(tzinfo=pytz.utc).astimezone(ist) if self.response_due_at else None
        is_overdue = False
        hours_remaining = None
        
        if response_due_ist:
            now_ist = datetime.now(ist)
            time_diff = response_due_ist - now_ist
            hours_remaining = int(time_diff.total_seconds() / 3600)
            is_overdue = hours_remaining < 0
        
        return {
            "id": self.id,
            "customer_name": self.customer_name,
            "customer_email": self.customer_email,
            "text": self.text,
            "category": self.category,
            "sentiment": self.sentiment,
            "priority": self.priority,
            "status": self.status,
            "confidence": {
                "category": self.category_confidence,
                "sentiment": self.sentiment_confidence
            },
            "created_at": created_ist.isoformat() if created_ist else None,
            "response_due_at": response_due_ist.isoformat() if response_due_ist else None,
            "hours_remaining": hours_remaining,
            "is_overdue": is_overdue,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None
        }


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for getting DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()