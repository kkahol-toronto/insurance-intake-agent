from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

from services.chat_service import ChatService

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="SunLife Insurance Intake Portal API",
    description="Backend API for SunLife Insurance Claims Processing",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3030", 
        "http://localhost:3031", 
        "http://localhost:5173",
        "http://localhost:8004"  # Backend port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize chat service
chat_service = ChatService()

# Create data directory for event logs if it doesn't exist
EVENT_LOG_DIR = Path("data/event_logs")
EVENT_LOG_DIR.mkdir(parents=True, exist_ok=True)

# Request/Response models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[ChatMessage]] = []
    context_type: Optional[str] = "dashboard"  # "dashboard" or "document"
    document_id: Optional[int] = None
    claims_data: Optional[Dict[str, Any]] = None
    event_log: Optional[List[Dict[str, Any]]] = None  # Simulator event log

class EventLogRequest(BaseModel):
    claim_number: str
    patient_name: str
    event_log: List[Dict[str, Any]]

class ChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SunLife Insurance Intake Portal API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "chat_service_configured": chat_service.configured
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint for interacting with dashboard data and documents
    """
    try:
        # Call chat service
        result = chat_service.chat(
            user_message=request.message,
            chat_history=[{"role": msg.role, "content": msg.content} for msg in request.chat_history],
            context_type=request.context_type,
            document_id=request.document_id,
            claims_data=request.claims_data,
            event_log=request.event_log
        )
        
        return ChatResponse(
            success=result.get("success", False),
            response=result.get("response"),
            error=result.get("error")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")

@app.post("/api/event-log")
async def save_event_log(request: EventLogRequest):
    """
    Save event log for a claim simulation
    """
    try:
        # Create filename from claim number (sanitize for filesystem)
        safe_claim_number = request.claim_number.replace(" ", "_").replace("/", "_")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{safe_claim_number}_{timestamp}.json"
        filepath = EVENT_LOG_DIR / filename
        
        # Prepare log data
        log_data = {
            "claim_number": request.claim_number,
            "patient_name": request.patient_name,
            "timestamp": datetime.now().isoformat(),
            "events": request.event_log
        }
        
        # Save to file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        
        # Also save/update the latest log for this claim
        latest_filepath = EVENT_LOG_DIR / f"{safe_claim_number}_latest.json"
        with open(latest_filepath, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        
        return {
            "success": True,
            "message": "Event log saved successfully",
            "filepath": str(filepath),
            "event_count": len(request.event_log)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving event log: {str(e)}")

@app.get("/api/event-log/{claim_number}")
async def get_event_log(claim_number: str):
    """
    Get the latest event log for a claim
    """
    try:
        safe_claim_number = claim_number.replace(" ", "_").replace("/", "_")
        latest_filepath = EVENT_LOG_DIR / f"{safe_claim_number}_latest.json"
        
        if not latest_filepath.exists():
            return {
                "success": False,
                "message": "Event log not found for this claim"
            }
        
        with open(latest_filepath, 'r', encoding='utf-8') as f:
            log_data = json.load(f)
        
        return {
            "success": True,
            "data": log_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading event log: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

