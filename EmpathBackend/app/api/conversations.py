from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.incident import Incident
from app.services.ai_service import call_mistral
from app.services.incident_service import (
    INCIDENT_TEMPLATE,
    merge_entities,
    completion_percentage
)

from app.llm.incident_assistant.intake.entity_extraction import extract_entities
from app.llm.incident_assistant.intake.questioning import generate_next_question
from app.llm.incident_assistant.responses.empathy import empathetic_response
from app.llm.incident_assistant.responses.pocso import pocso_message
from app.llm.incident_assistant.responses.high_risk import high_risk_message
from app.llm.incident_assistant.safety.router import route_request

import json

router = APIRouter(prefix="/conversations", tags=["Conversations"])


# =========================
# GET ALL CONVERSATIONS
# =========================
@router.get("")
def get_all(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "conversations": db.query(Conversation)
        .filter_by(user_id=user.id)
        .all()
    }


# =========================
# CREATE CONVERSATION
# =========================
@router.post("")
def create_conversation(data: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    convo = Conversation(
        user_id=user.id,
        title=data.get("title", "New Chat")
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)
    return convo


# =========================
# GET MESSAGES
# =========================
@router.get("/{id}/messages")
def get_messages(id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "messages": db.query(Message)
        .join(Conversation)
        .filter(
            Conversation.user_id == user.id,
            Message.conversation_id == id
        )
        .all()
    }


# =========================
# SEND MESSAGE (MAIN LOGIC)
# =========================
@router.post("/{id}/messages")
def send_message(
    id: str,
    body: dict,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    user_text = body.get("content", "").strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Empty message")

    # 1️⃣ Validate conversation
    conversation = db.query(Conversation).filter_by(id=id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 2️⃣ Save USER message
    db.add(Message(
        conversation_id=id,
        role="user",
        content=user_text
    ))
    db.commit()

    # =====================================================
    # 🔥 SAFETY ROUTING FIRST
    # =====================================================
    user_age = getattr(user, "age", None)
    mode = route_request(user_text, user_age)

    if mode["mode"] == "HIGH_RISK":
        reply = high_risk_message()

        db.add(Message(conversation_id=id, role="assistant", content=reply))
        db.commit()

        async def stream_hr():
            yield f"data: {json.dumps({'content': reply, 'done': True})}\n\n"

        return StreamingResponse(stream_hr(), media_type="text/event-stream")

    if mode["mode"] == "POCSO":
        reply = pocso_message()

        db.add(Message(conversation_id=id, role="assistant", content=reply))
        db.commit()

        async def stream_pc():
            yield f"data: {json.dumps({'content': reply, 'done': True})}\n\n"

        return StreamingResponse(stream_pc(), media_type="text/event-stream")

    # =====================================================
    # ✅ NORMAL FLOW
    # =====================================================

    incident = db.query(Incident).filter_by(conversation_id=id).first()

    if not incident:
        incident = Incident(
            conversation_id=id,
            data=INCIDENT_TEMPLATE.copy(),
            completion_percentage=0.0
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

    # 🔹 Extract entities
    extracted = extract_entities(user_text)
    incident.data = merge_entities(dict(incident.data), extracted)
    incident.completion_percentage = completion_percentage(incident.data)

    db.add(incident)
    db.commit()
    db.refresh(incident)

    async def stream():

        # 1️⃣ ALWAYS generate normal AI reply
        ai_prompt = f"""
You are a compassionate legal counselor AI.

Respond to the user's latest message in a warm, supportive, counselor-like tone.

Keep it:
- Calm
- Human
- Not robotic
- Not too long

User message:
{user_text}
"""

        ai_reply = call_mistral(ai_prompt).strip()

        if not ai_reply:
            ai_reply = "I’m here with you. Please tell me more."

        # 2️⃣ Generate soft intake question if needed
        intake_question = None

        if incident.completion_percentage < 0.7:
            next_q = generate_next_question(incident.data)

            if next_q:
                intake_question = (
                    "\n\nIf you feel comfortable sharing, "
                    + next_q.lower()
                )

        # 3️⃣ Combine response
        final_reply = ai_reply

        if intake_question:
            final_reply += intake_question

        # 4️⃣ Save assistant reply
        db.add(Message(
            conversation_id=id,
            role="assistant",
            content=final_reply
        ))
        db.commit()

        yield f"data: {json.dumps({'content': final_reply, 'done': True})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

# =========================
# DELETE CONVERSATION
# =========================
@router.delete("/{id}")
def delete_conversation(
    id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == id,
            Conversation.user_id == user.id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()

    return {"success": True}