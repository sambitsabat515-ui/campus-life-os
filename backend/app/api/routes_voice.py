import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, VoiceSession
from app.auth.security import get_current_user
from app.schemas import VoiceIntentRequest, VoiceIntentResponse
from app.agents.voice_intent_agent import VoiceIntentAgent

router = APIRouter(prefix="/api/voice", tags=["Multilingual Voice Agent"])
voice_agent = VoiceIntentAgent()

@router.post("/process", response_model=VoiceIntentResponse)
def process_voice_transcript(
    data: VoiceIntentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = voice_agent.run({
        "transcript": data.transcript,
        "page_context": data.page_context,
        "language": data.language or user.preferred_language or "en"
    })

    out = result.output

    # Log to VoiceSession table
    session_log = VoiceSession(
        user_id=user.id,
        language=data.language or user.preferred_language or "en",
        transcript=data.transcript,
        response_text=out.get("response_text", ""),
        created_at=datetime.datetime.utcnow()
    )
    db.add(session_log)
    db.commit()

    return {
        "intent": out.get("intent", "UNKNOWN"),
        "confidence": result.confidence or 0.5,
        "response_text": out.get("response_text", ""),
        "action_type": out.get("action_type", "NONE"),
        "action_data": out.get("action_data", {}),
        "offline_status": out.get("offline_status", {})
    }

@router.get("/status")
def get_voice_offline_status():
    from app.agents.voice_intent_agent import OFFLINE_MODEL_STATUS
    return OFFLINE_MODEL_STATUS
