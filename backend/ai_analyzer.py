import os
import requests
import time
from typing import Dict, Optional
from dotenv import load_dotenv

load_dotenv()

HUGGINGFACE_API_TOKEN = os.getenv("HF_API_TOKEN")

CLASSIFICATION_MODEL = "facebook/bart-large-mnli"
SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"

# Professional Categories (Shorter Names)
CATEGORIES = [
    "Billing Issues",
    "Delivery Issues",
    "Technical Support",
    "Product Quality",
    "Service Quality",
    "Refund Requests",
    "Account Issues"
]

URGENT_KEYWORDS = [
    "urgent", "asap", "immediately", "emergency", "critical", 
    "refund", "fraud", "lawsuit", "legal", "lawyer", "sue"
]


def call_huggingface_api(model: str, payload: dict, max_retries: int = 3) -> Optional[dict]:
    """Call HuggingFace API with retry logic"""
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}
    url = f"https://api-inference.huggingface.co/models/{model}"
    
    for attempt in range(max_retries):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 503:
                time.sleep(2 ** attempt)
                continue
            else:
                return None
        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise TimeoutError("⏰ AI service request timeout - please try again")
        except requests.exceptions.ConnectionError:
            raise ConnectionError("🔌 Connection lost - please check your internet")
        except Exception as e:
            raise Exception(f"❌ AI service temporarily unavailable: {str(e)}")
    
    return None


def classify_complaint_with_keywords(text: str) -> Dict:
    """Enhanced keyword-based classification"""
    text_lower = text.lower()
    
    category_keywords = {
        "Billing Issues": [
            "bill", "billing", "charge", "charged", "payment", "invoice", "paid", 
            "overcharged", "double charge", "subscription", "fee", "cost", "price",
            "credit card", "debit", "transaction", "autopay", "refund"
        ],
        "Delivery Issues": [
            "deliver", "delivery", "shipping", "shipped", "ship", "late", "delay", 
            "arrived", "tracking", "package", "order", "dispatch", "courier",
            "transit", "logistics", "warehouse", "not received", "lost package"
        ],
        "Product Quality": [
            "broken", "defect", "defective", "quality", "damaged", "faulty",
            "poor quality", "cheap", "deteriorated", "malfunction", "doesn't work",
            "stopped working", "issue with product", "product problem", "warranty"
        ],
        "Refund Requests": [
            "refund", "return", "money back", "reimbursement", "give back",
            "want my money", "cancellation", "cancel", "exchange", "replacement"
        ],
        "Account Issues": [
            "account", "login", "password", "access", "locked", "suspended",
            "can't log in", "username", "profile", "sign in", "authentication",
            "verify", "verification", "reset", "blocked"
        ],
        "Service Quality": [
            "support", "service", "representative", "agent", "staff", "employee",
            "rude", "unhelpful", "poor service", "bad service", "customer care",
            "help desk", "no response", "ignored", "waiting", "attitude"
        ],
        "Technical Support": [
            "bug", "error", "crash", "technical", "app", "website", "system",
            "not working", "glitch", "freeze", "slow", "loading", "connection",
            "software", "update", "feature", "functionality", "interface", "dark mode"
        ]
    }
    
    scores = {}
    for category, keywords in category_keywords.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > 0:
            scores[category] = score
    
    if scores:
        best_category = max(scores, key=scores.get)
        confidence = min(0.85 + (scores[best_category] * 0.02), 0.99)
        return {"category": best_category, "confidence": round(confidence, 3)}
    
    return {"category": "Service Quality", "confidence": 0.70}


def classify_complaint(text: str) -> Dict:
    """Classify complaint with error handling"""
    try:
        payload = {
            "inputs": text,
            "parameters": {
                "candidate_labels": CATEGORIES,
                "multi_label": False
            }
        }
        
        result = call_huggingface_api(CLASSIFICATION_MODEL, payload)
        
        if result and "labels" in result and result["scores"][0] > 0.5:
            return {
                "category": result["labels"][0],
                "confidence": round(result["scores"][0], 3)
            }
        
        return classify_complaint_with_keywords(text)
    except Exception as e:
        print(f"Classification error: {e}")
        return classify_complaint_with_keywords(text)


def analyze_sentiment_with_keywords(text: str) -> Dict:
    """Enhanced keyword-based sentiment"""
    text_lower = text.lower()
    
    negative_words = [
        "angry", "frustrated", "terrible", "awful", "horrible", "worst", 
        "hate", "disappointed", "disgusted", "furious", "annoyed", "upset",
        "useless", "pathetic", "ridiculous", "unacceptable", "poor", "bad"
    ]
    
    positive_words = [
        "thank", "thanks", "great", "excellent", "happy", "satisfied", 
        "love", "appreciate", "wonderful", "amazing", "fantastic", "good",
        "pleased", "glad", "perfect", "awesome", "brilliant"
    ]
    
    neutral_words = [
        "suggest", "suggestion", "would be nice", "could", "maybe", "perhaps",
        "consider", "feature request", "idea", "feedback"
    ]
    
    negative_count = sum(1 for word in negative_words if word in text_lower)
    positive_count = sum(1 for word in positive_words if word in text_lower)
    neutral_count = sum(1 for word in neutral_words if word in text_lower)
    
    if neutral_count > 0 and negative_count == 0:
        return {"sentiment": "neutral", "confidence": 0.85}
    elif negative_count > positive_count:
        return {"sentiment": "negative", "confidence": 0.80}
    elif positive_count > negative_count:
        return {"sentiment": "positive", "confidence": 0.80}
    else:
        return {"sentiment": "neutral", "confidence": 0.75}


def analyze_sentiment(text: str) -> Dict:
    """Detect sentiment with error handling"""
    try:
        payload = {"inputs": text}
        result = call_huggingface_api(SENTIMENT_MODEL, payload)
        
        if result and isinstance(result, list) and len(result) > 0:
            predictions = result[0]
            top_prediction = max(predictions, key=lambda x: x['score'])
            
            if top_prediction['score'] > 0.6:
                sentiment_map = {
                    "positive": "positive",
                    "negative": "negative",
                    "neutral": "neutral"
                }
                
                sentiment = sentiment_map.get(top_prediction['label'].lower(), "neutral")
                return {
                    "sentiment": sentiment,
                    "confidence": round(top_prediction['score'], 3)
                }
        
        return analyze_sentiment_with_keywords(text)
    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        return analyze_sentiment_with_keywords(text)


def calculate_priority(sentiment: str, text: str, category: str) -> str:
    """Calculate priority"""
    text_lower = text.lower()
    has_urgent = any(keyword in text_lower for keyword in URGENT_KEYWORDS)
    
    high_priority_categories = ["Refund Requests", "Billing Issues", "Account Issues"]
    
    if sentiment == "negative" and has_urgent:
        return "high"
    elif sentiment == "negative" or has_urgent or category in high_priority_categories:
        return "medium"
    else:
        return "low"


def calculate_response_due_time(priority: str):
    """Calculate response deadline"""
    from datetime import datetime, timedelta
    
    hours_map = {
        "high": 2,
        "medium": 24,
        "low": 48
    }
    
    hours = hours_map.get(priority, 24)
    return datetime.utcnow() + timedelta(hours=hours)


def suggest_action(category: str, sentiment: str, priority: str, customer_email: str) -> str:
    """
    Generate specific action recommendations based on complaint details
    """
    
    # Comprehensive action mapping
    actions = {
        # BILLING ISSUES
        ("Billing Issues", "negative", "high"): 
            f"⚠️ URGENT ACTION REQUIRED:\n"
            f"1. Call {customer_email} within 2 hours\n"
            f"2. Review billing records immediately\n"
            f"3. Prepare refund/credit authorization\n"
            f"4. Escalate to Billing Manager\n"
            f"5. Document resolution for legal compliance",
        
        ("Billing Issues", "negative", "medium"): 
            f"💳 PRIORITY ACTION:\n"
            f"1. Email {customer_email} within 6 hours\n"
            f"2. Verify payment transaction details\n"
            f"3. Assign to Senior Billing Specialist\n"
            f"4. Provide itemized statement\n"
            f"5. Offer payment plan if applicable",
        
        ("Billing Issues", "neutral", "low"): 
            f"📋 STANDARD PROCEDURE:\n"
            f"1. Email {customer_email} within 48 hours\n"
            f"2. Send billing clarification document\n"
            f"3. Assign to Billing Support Team\n"
            f"4. Schedule follow-up call if needed",
        
        ("Billing Issues", "positive", "low"): 
            f"✅ ACKNOWLEDGMENT:\n"
            f"1. Thank {customer_email} for patience\n"
            f"2. Confirm billing issue resolved\n"
            f"3. Offer loyalty discount (10% next purchase)\n"
            f"4. Update customer satisfaction record",
        
        # DELIVERY ISSUES
        ("Delivery Issues", "negative", "high"): 
            f"🚚 IMMEDIATE ESCALATION:\n"
            f"1. Contact {customer_email} within 1 hour\n"
            f"2. Track shipment with courier urgently\n"
            f"3. Offer expedited replacement shipping\n"
            f"4. Escalate to Logistics Manager\n"
            f"5. Provide tracking updates every 4 hours\n"
            f"6. Consider partial refund for inconvenience",
        
        ("Delivery Issues", "negative", "medium"): 
            f"📦 PRIORITY TRACKING:\n"
            f"1. Email {customer_email} within 6 hours\n"
            f"2. Request tracking update from courier\n"
            f"3. Assign to Delivery Resolution Team\n"
            f"4. Provide estimated delivery timeline\n"
            f"5. Offer shipping refund if delayed >3 days",
        
        ("Delivery Issues", "neutral", "low"): 
            f"📋 STANDARD FOLLOW-UP:\n"
            f"1. Email {customer_email} within 24 hours\n"
            f"2. Share current tracking status\n"
            f"3. Set delivery expectation window\n"
            f"4. Provide customer service contact",
        
        # TECHNICAL SUPPORT
        ("Technical Support", "negative", "high"): 
            f"🔧 CRITICAL TECHNICAL ISSUE:\n"
            f"1. Assign senior engineer immediately\n"
            f"2. Call {customer_email} within 2 hours\n"
            f"3. Provide temporary workaround solution\n"
            f"4. Escalate to Tech Lead\n"
            f"5. Schedule screen-sharing session\n"
            f"6. Commit to resolution timeline",
        
        ("Technical Support", "negative", "medium"): 
            f"💻 TECHNICAL ASSISTANCE:\n"
            f"1. Email {customer_email} within 12 hours\n"
            f"2. Assign to Technical Support Specialist\n"
            f"3. Request system logs/screenshots\n"
            f"4. Provide troubleshooting guide\n"
            f"5. Schedule callback within 24 hours",
        
        ("Technical Support", "neutral", "low"): 
            f"💡 FEATURE FEEDBACK:\n"
            f"1. Thank {customer_email} for suggestion\n"
            f"2. Forward to Product Development Team\n"
            f"3. Add to feature request backlog\n"
            f"4. Provide timeline for consideration\n"
            f"5. Offer to join beta testing program",
        
        # PRODUCT QUALITY
        ("Product Quality", "negative", "high"): 
            f"📦 QUALITY ISSUE ESCALATION:\n"
            f"1. Contact {customer_email} immediately\n"
            f"2. Arrange free return shipping label\n"
            f"3. Offer replacement + 20% discount\n"
            f"4. Escalate to Quality Assurance Manager\n"
            f"5. Investigate batch/lot number\n"
            f"6. Document for supplier feedback",
        
        ("Product Quality", "negative", "medium"): 
            f"🔍 QUALITY REVIEW:\n"
            f"1. Email {customer_email} within 8 hours\n"
            f"2. Request product photos/description\n"
            f"3. Offer exchange or refund options\n"
            f"4. Assign to Quality Control Team\n"
            f"5. Provide return instructions",
        
        # REFUND REQUESTS
        ("Refund Requests", "negative", "high"): 
            f"💰 URGENT REFUND PROCESSING:\n"
            f"1. Call {customer_email} within 1 hour\n"
            f"2. Verify refund eligibility immediately\n"
            f"3. Process refund within 24 hours\n"
            f"4. Escalate to Finance Manager if >$500\n"
            f"5. Send refund confirmation email\n"
            f"6. Offer future purchase credit (15% bonus)",
        
        ("Refund Requests", "negative", "medium"): 
            f"💵 REFUND REVIEW:\n"
            f"1. Email {customer_email} within 6 hours\n"
            f"2. Review return policy compliance\n"
            f"3. Request order details and reason\n"
            f"4. Process standard refund (3-5 business days)\n"
            f"5. Provide refund tracking information",
        
        ("Refund Requests", "positive", "low"): 
            f"✅ REFUND ACKNOWLEDGMENT:\n"
            f"1. Confirm refund received by {customer_email}\n"
            f"2. Request feedback on experience\n"
            f"3. Offer 10% discount on future purchase\n"
            f"4. Update customer satisfaction metrics",
        
        # SERVICE QUALITY
        ("Service Quality", "negative", "high"): 
            f"👤 SERVICE RECOVERY:\n"
            f"1. Manager to call {customer_email} within 2 hours\n"
            f"2. Review service interaction logs\n"
            f"3. Offer sincere apology + compensation\n"
            f"4. Retrain involved staff member\n"
            f"5. Assign dedicated account manager\n"
            f"6. Follow up within 48 hours",
        
        ("Service Quality", "negative", "medium"): 
            f"📞 SERVICE IMPROVEMENT:\n"
            f"1. Email {customer_email} within 8 hours\n"
            f"2. Assign to Customer Service Supervisor\n"
            f"3. Review service standards with team\n"
            f"4. Offer direct contact for future issues\n"
            f"5. Request detailed feedback",
        
        ("Service Quality", "neutral", "low"): 
            f"📋 FEEDBACK COLLECTION:\n"
            f"1. Thank {customer_email} for feedback\n"
            f"2. Forward to Service Training Department\n"
            f"3. Use for staff coaching session\n"
            f"4. Send follow-up satisfaction survey",
        
        # ACCOUNT ISSUES
        ("Account Issues", "negative", "high"): 
            f"🔐 URGENT ACCOUNT ACCESS:\n"
            f"1. Contact {customer_email} immediately\n"
            f"2. Verify identity through security questions\n"
            f"3. Reset credentials within 1 hour\n"
            f"4. Escalate to IT Security Team\n"
            f"5. Enable two-factor authentication\n"
            f"6. Monitor account for suspicious activity",
        
        ("Account Issues", "negative", "medium"): 
            f"🔑 ACCOUNT ASSISTANCE:\n"
            f"1. Email {customer_email} within 4 hours\n"
            f"2. Send password reset link\n"
            f"3. Provide account recovery guide\n"
            f"4. Assign to Account Support Specialist\n"
            f"5. Schedule verification callback",
    }
    
    # Try to find exact match
    key = (category, sentiment, priority)
    if key in actions:
        return actions[key]
    
    # Fallback with dynamic generation
    urgency_map = {
        "high": {
            "timeframe": "2 hours",
            "method": "Call",
            "escalation": "Escalate to department manager",
            "compensation": "Offer immediate compensation/solution"
        },
        "medium": {
            "timeframe": "12 hours",
            "method": "Email",
            "escalation": "Assign to senior specialist",
            "compensation": "Review compensation options"
        },
        "low": {
            "timeframe": "48 hours",
            "method": "Email",
            "escalation": "Route to standard queue",
            "compensation": "Acknowledge and thank customer"
        }
    }
    
    urgency = urgency_map.get(priority, urgency_map["medium"])
    
    return (
        f" ACTION PLAN:\n"
        f"1. {urgency['method']} {customer_email} within {urgency['timeframe']}\n"
        f"2. {urgency['escalation']}\n"
        f"3. Assign to {category} department\n"
        f"4. {urgency['compensation']}\n"
        f"5. Document resolution and follow up"
    )


def analyze_complaint(text: str, customer_email: str = "customer@example.com") -> Dict:
    """Complete analysis with error handling"""
    if not text or len(text.strip()) < 10:
        raise ValueError("⚠️ Complaint must be at least 10 characters long")
    
    if len(text) < 15:
        raise ValueError("⚠️ Please provide more details (minimum 15 characters)")
    
    try:
        category_result = classify_complaint(text)
        sentiment_result = analyze_sentiment(text)
        
        category = category_result["category"]
        sentiment = sentiment_result["sentiment"]
        priority = calculate_priority(sentiment, text, category)
        response_due = calculate_response_due_time(priority)
        suggested_action = suggest_action(category, sentiment, priority, customer_email)
        
        return {
            "category": category,
            "sentiment": sentiment,
            "priority": priority,
            "suggested_action": suggested_action,
            "response_due_at": response_due,
            "confidence": {
                "category": category_result["confidence"],
                "sentiment": sentiment_result["confidence"]
            }
        }
    except TimeoutError as e:
        raise TimeoutError(str(e))
    except ConnectionError as e:
        raise ConnectionError(str(e))
    except Exception as e:
        raise Exception(f"❌ Analysis failed: {str(e)}")