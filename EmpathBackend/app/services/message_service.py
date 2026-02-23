from sqlalchemy.orm import Session
from app.models import Conversation, Message, Incident
from app.services.incident_service import (
    INCIDENT_TEMPLATE,
    merge_entities,
    completion_percentage
)

# 🔥 SAFETY
from app.llm.incident_assistant.safety.router import route_request
from app.llm.incident_assistant.responses.high_risk import high_risk_message
from app.llm.incident_assistant.responses.pocso import pocso_message

# Intake + AI
from app.llm.incident_assistant.intake.entity_extraction import extract_entities
from app.llm.incident_assistant.intake.questioning import generate_next_question
from app.services.ai_service import call_mistral


def handle_text_message(
    *,
    conversation_id: str,
    user_text: str,
    user,
    db: Session,
):
    """
    Full pipeline:
    - Safety routing
    - Entity extraction
    - Incident DB update
    - Mistral general response
    - Intake question (if needed)
    """

    user_text = (user_text or "").strip()
    if not user_text:
        raise ValueError("Empty user message")

    # 1️⃣ Validate conversation
    conversation = db.query(Conversation).filter_by(id=conversation_id).first()
    if not conversation:
        raise ValueError("Conversation not found")

    # 2️⃣ Save USER message
    db.add(
        Message(
            conversation_id=conversation_id,
            role="user",
            content=user_text,
        )
    )
    db.commit()

    # =====================================================
    # 🔥 SAFETY ROUTING FIRST
    # =====================================================

    user_age = getattr(user, "age", None)
    mode = route_request(user_text, user_age)

    if mode["mode"] == "HIGH_RISK":
        reply = high_risk_message()

        db.add(
            Message(
                conversation_id=conversation_id,
                role="assistant",
                content=reply,
            )
        )
        db.commit()

        return {
            "phase": "high_risk",
            "reply": reply,
        }

    if mode["mode"] == "POCSO":
        reply = pocso_message()

        db.add(
            Message(
                conversation_id=conversation_id,
                role="assistant",
                content=reply,
            )
        )
        db.commit()

        return {
            "phase": "pocso",
            "reply": reply,
        }

    # =====================================================
    # ✅ NORMAL FLOW
    # =====================================================

    # 3️⃣ Load or create Incident
    incident = (
        db.query(Incident)
        .filter_by(conversation_id=conversation_id)
        .first()
    )

    if not incident:
        incident = Incident(
            conversation_id=conversation_id,
            data=INCIDENT_TEMPLATE.copy(),
            completion_percentage=0.0,
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

    # 4️⃣ Extract entities
    extracted = extract_entities(user_text)
    incident.data = merge_entities(dict(incident.data), extracted)

    # 5️⃣ Update completion %
    incident.completion_percentage = completion_percentage(incident.data)

    db.add(incident)
    db.commit()
    db.refresh(incident)

    # =====================================================
    # 🤖 Generate Mistral Response (General Reply)
    # =====================================================

    ai_reply = call_mistral(user_text).strip()

    if not ai_reply:
        ai_reply = "I'm here to listen. Please tell me more."

    # =====================================================
    # 🧠 Ask Intake Question (if incomplete)
    # =====================================================

    question = None

    if incident.completion_percentage < 0.7:
        question = generate_next_question(incident.data)

    # Combine response + intake question
    if question:
        final_reply = f"{ai_reply}\n\n{question}"
    else:
        final_reply = ai_reply

    # 6️⃣ Save Assistant message
    db.add(
        Message(
            conversation_id=conversation_id,
            role="assistant",
            content=final_reply,
        )
    )
    db.commit()

    return {
        "phase": "normal",
        "reply": final_reply,
        "completion": incident.completion_percentage,
    }