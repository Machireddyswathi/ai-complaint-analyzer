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
    """Professional action suggestions"""
    actions = {
        ("Billing Issues", "negative", "high"): f"⚠️ URGENT: Contact {customer_email} within 2 hours. Escalate to billing manager.",
        ("Delivery Issues", "negative", "high"): f"🚚 URGENT: Email {customer_email} immediately with tracking update.",
        ("Technical Support", "neutral", "low"): f"💡 Forward feedback to product team. Thank {customer_email} for suggestion.",
        ("Refund Requests", "negative", "high"): f"💰 URGENT: Process refund for {customer_email}. Get manager approval.",
        ("Service Quality", "neutral", "low"): f"📋 Acknowledge {customer_email}. Forward to management for review.",
    }
    
    key = (category, sentiment, priority)
    if key in actions:
        return actions[key]
    
    if priority == "high":
        return f"⚠️ Contact {customer_email} within 2 hours. Assign to {category} lead."
    elif priority == "medium":
        return f"📌 Email {customer_email} within 24 hours."
    else:
        return f"📋 Respond to {customer_email} within 48 hours."


def analyze_complaint(text: str, customer_email: str = "customer@example.com") -> Dict:
    """Complete analysis with error handling"""
    if not text or len(text.strip()) < 10:
        raise ValueError("⚠️ Complaint must be at least 10 characters long")
    
    if len(text) < 50:
        raise ValueError("⚠️ Please provide more details (minimum 50 characters)")
    
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