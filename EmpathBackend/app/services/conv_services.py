import json
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Conversation, Message, Incident

from app.services.incident_service import (
    INCIDENT_TEMPLATE,
    merge_entities,
    completion_percentage
)

# ✅ SAFETY ROUTER
from app.llm.incident_assistant.safety.router import route_request
from app.llm.incident_assistant.responses.high_risk import high_risk_message
from app.llm.incident_assistant.responses.pocso import pocso_message

# Intake + AI
from app.llm.incident_assistant.intake.entity_extraction import extract_entities
from app.llm.incident_assistant.intake.questioning import generate_next_question
from app.llm.incident_assistant.responses.empathy import empathetic_response
from app.services.ai_service import call_mistral

from langdetect import detect
from deep_translator import GoogleTranslator


async def process_user_message(
    *,
    emotion: str,
    conversation_id: str,
    normalized_text: str,
    user_text: str,
    user,
    db: Session,
):

    # =====================================================
    # 1️⃣ Validate conversation
    # =====================================================

    conversation = db.query(Conversation).filter_by(id=conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save USER message
    db.add(Message(
        conversation_id=conversation_id,
        role="user",
        content=user_text
    ))
    db.commit()

    # =====================================================
    # 🔥 2️⃣ SAFETY ROUTING (RUN FIRST)
    # =====================================================

    user_age = getattr(user, "age", None)
    mode = route_request(user_text, user_age)

    if mode["mode"] == "HIGH_RISK":
        reply = high_risk_message()

        db.add(Message(
            conversation_id=conversation_id,
            role="assistant",
            content=reply
        ))
        db.commit()

        return {
            "phase": "high_risk",
            "reply": reply
        }

    if mode["mode"] == "POCSO":
        reply = pocso_message()

        db.add(Message(
            conversation_id=conversation_id,
            role="assistant",
            content=reply
        ))
        db.commit()

        return {
            "phase": "pocso",
            "reply": reply
        }

    # =====================================================
    # ✅ 3️⃣ NORMAL FLOW
    # =====================================================

    # Load or create Incident
    incident = db.query(Incident).filter_by(
        conversation_id=conversation_id
    ).first()

    if not incident:
        incident = Incident(
            conversation_id=conversation_id,
            data=INCIDENT_TEMPLATE.copy(),
            completion_percentage=0.0
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

    # =====================================================
    # 4️⃣ Extract + merge entities (background)
    # =====================================================

    extracted = extract_entities(normalized_text)
    incident.data = merge_entities(dict(incident.data), extracted)
    incident.completion_percentage = completion_percentage(incident.data)

    db.add(incident)
    db.commit()
    db.refresh(incident)

    # =====================================================
    # 5️⃣ Generate conversational reply using Mistral
    # =====================================================

    chat_prompt = f"""
User message:
{user_text}

Known incident data:
{json.dumps(incident.data, indent=2)}

Respond helpfully and naturally.
If the user is asking a question, answer clearly.
If this relates to a legal or harmful situation,
provide practical guidance.
Keep it professional and supportive.
"""

    mistral_reply = call_mistral(chat_prompt).strip()

    if not mistral_reply:
        mistral_reply = "I understand. Could you tell me more?"

    # =====================================================
    # 6️⃣ Ask structured intake question (if incomplete)
    # =====================================================

    intake_question = None

    if incident.completion_percentage < 0.7:
        intake_question = generate_next_question(incident.data)

    # =====================================================
    # 7️⃣ Combine responses
    # =====================================================

    if intake_question:
        final_reply = (
            f"{mistral_reply}\n\n"
            f"To better understand your situation, I need to ask:\n"
            f"{intake_question}"
        )
    else:
        final_reply = mistral_reply

    # Save assistant message
    db.add(Message(
        conversation_id=conversation_id,
        role="assistant",
        content=final_reply
    ))
    db.commit()

    return {
        "phase": "normal",
        "reply": final_reply,
        "completion": incident.completion_percentage
    }


# =====================================================
# Optional: Language normalization helper
# =====================================================

def normalize_text(text: str) -> dict:
    try:
        lang = detect(text)
    except Exception:
        lang = "unknown"

    if lang != "en":
        translated = GoogleTranslator(
            source=lang,
            target="en"
        ).translate(text)
    else:
        translated = text

    return {
        "original_text": text,
        "english_text": translated,
        "language": lang
    }