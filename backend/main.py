from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import pytz
import os
from dotenv import load_dotenv

from database import init_db, get_db, Complaint
from ai_analyzer import analyze_complaint

load_dotenv()
init_db()

app = FastAPI(
    title="AI Complaint Analyzer API",
    description="Enterprise-grade complaint management with AI classification",
    version="2.0.0"
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ComplaintInput(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_email: EmailStr
    text: str = Field(..., min_length=15, max_length=2000)


class ComplaintResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: str
    text: str
    category: str
    sentiment: str
    priority: str
    status: str
    suggested_action: str
    confidence: dict
    created_at: str
    response_due_at: Optional[str]
    hours_remaining: Optional[int]
    is_overdue: bool

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    total_complaints: int
    categories: dict
    sentiments: dict
    priorities: dict
    statuses: dict
    recent_trends: dict
    avg_response_time: float
    sla_compliance: float
    csat_score: float
    top_issues: list


@app.post("/api/complaints", response_model=ComplaintResponse)
async def create_complaint(
    complaint: ComplaintInput,
    db: Session = Depends(get_db)
):
    """Submit and analyze complaint with Indian timezone"""
    try:
        analysis = analyze_complaint(complaint.text, complaint.customer_email)
        
        db_complaint = Complaint(
            customer_name=complaint.customer_name,
            customer_email=complaint.customer_email,
            text=complaint.text,
            category=analysis["category"],
            sentiment=analysis["sentiment"],
            priority=analysis["priority"],
            status="open",
            category_confidence=analysis["confidence"]["category"],
            sentiment_confidence=analysis["confidence"]["sentiment"],
            response_due_at=analysis["response_due_at"]
        )
        
        db.add(db_complaint)
        db.commit()
        db.refresh(db_complaint)
        
        complaint_dict = db_complaint.to_dict()
        
        return ComplaintResponse(
            id=complaint_dict["id"],
            customer_name=complaint_dict["customer_name"],
            customer_email=complaint_dict["customer_email"],
            text=complaint_dict["text"],
            category=complaint_dict["category"],
            sentiment=complaint_dict["sentiment"],
            priority=complaint_dict["priority"],
            status=complaint_dict["status"],
            suggested_action=analysis["suggested_action"],
            confidence=complaint_dict["confidence"],
            created_at=complaint_dict["created_at"],
            response_due_at=complaint_dict["response_due_at"],
            hours_remaining=complaint_dict["hours_remaining"],
            is_overdue=complaint_dict["is_overdue"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/complaints", response_model=List[ComplaintResponse])
async def get_complaints(
    limit: int = 100,
    category: Optional[str] = None,
    sentiment: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get complaints with filters"""
    query = db.query(Complaint)
    
    if category:
        query = query.filter(Complaint.category == category)
    if sentiment:
        query = query.filter(Complaint.sentiment == sentiment)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if status:
        query = query.filter(Complaint.status == status)
    
    complaints = query.order_by(Complaint.created_at.desc()).limit(limit).all()
    
    result = []
    for c in complaints:
        c_dict = c.to_dict()
        result.append(ComplaintResponse(
            id=c_dict["id"],
            customer_name=c_dict["customer_name"],
            customer_email=c_dict["customer_email"],
            text=c_dict["text"],
            category=c_dict["category"],
            sentiment=c_dict["sentiment"],
            priority=c_dict["priority"],
            status=c_dict["status"],
            suggested_action="",
            confidence=c_dict["confidence"],
            created_at=c_dict["created_at"],
            response_due_at=c_dict["response_due_at"],
            hours_remaining=c_dict["hours_remaining"],
            is_overdue=c_dict["is_overdue"]
        ))
    
    return result


@app.get("/api/analytics", response_model=AnalyticsResponse)
async def get_analytics(db: Session = Depends(get_db)):
    """Enhanced analytics dashboard"""
    total = db.query(func.count(Complaint.id)).scalar()
    
    categories = dict(
        db.query(Complaint.category, func.count(Complaint.id))
        .group_by(Complaint.category)
        .all()
    )
    
    sentiments = dict(
        db.query(Complaint.sentiment, func.count(Complaint.id))
        .group_by(Complaint.sentiment)
        .all()
    )
    
    priorities = dict(
        db.query(Complaint.priority, func.count(Complaint.id))
        .group_by(Complaint.priority)
        .all()
    )
    
    statuses = dict(
        db.query(Complaint.status, func.count(Complaint.id))
        .group_by(Complaint.status)
        .all()
    )
    
    # Last 7 days trend
    ist = pytz.timezone('Asia/Kolkata')
    week_ago = datetime.now(ist) - timedelta(days=7)
    week_ago_utc = week_ago.astimezone(pytz.utc).replace(tzinfo=None)
    
    recent_count = db.query(func.count(Complaint.id))\
        .filter(Complaint.created_at >= week_ago_utc)\
        .scalar()
    
    # Calculate CSAT score (based on sentiment)
    positive_count = sentiments.get("positive", 0)
    negative_count = sentiments.get("negative", 0)
    neutral_count = sentiments.get("neutral", 0)
    
    if total > 0:
        csat_score = ((positive_count * 5 + neutral_count * 3 + negative_count * 1) / total)
    else:
        csat_score = 0
    
    # Top issues (most common categories this week)
    top_categories = db.query(
        Complaint.category,
        func.count(Complaint.id).label('count')
    ).filter(Complaint.created_at >= week_ago_utc)\
     .group_by(Complaint.category)\
     .order_by(func.count(Complaint.id).desc())\
     .limit(3)\
     .all()
    
    top_issues = [{"category": cat, "count": count} for cat, count in top_categories]
    
    # SLA Compliance (percentage of complaints resolved on time)
    sla_compliance = 95.0  # Placeholder - implement based on actual resolution data
    
    # Average response time (placeholder)
    avg_response_time = 2.5
    
    return AnalyticsResponse(
        total_complaints=total,
        categories=categories,
        sentiments=sentiments,
        priorities=priorities,
        statuses=statuses,
        recent_trends={"last_7_days": recent_count},
        avg_response_time=avg_response_time,
        sla_compliance=sla_compliance,
        csat_score=round(csat_score, 1),
        top_issues=top_issues
    )


@app.patch("/api/complaints/{complaint_id}/status")
async def update_status(
    complaint_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """Update complaint status"""
    if status not in ["open", "in_progress", "resolved"]:
        raise HTTPException(400, "Invalid status")
    
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(404, "Complaint not found")
    
    complaint.status = status
    if status == "resolved":
        complaint.resolved_at = datetime.utcnow()
    
    db.commit()
    return {"message": f"Status updated to {status}"}


@app.delete("/api/complaints/{complaint_id}")
async def delete_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """Delete complaint"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(404, "Complaint not found")
    
    db.delete(complaint)
    db.commit()
    return {"message": "Complaint deleted successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)