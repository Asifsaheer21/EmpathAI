from app.llm.incident_assistant.intake.entity_extraction import extract_entities
from app.llm.incident_assistant.intake.questioning import generate_next_question
from app.llm.incident_assistant.intake.summary import summarize_incident
from app.llm.incident_assistant.responses.empathy import empathetic_response
from app.llm.incident_assistant.responses.pocso import pocso_message
from app.llm.incident_assistant.responses.high_risk import high_risk_message
from app.llm.incident_assistant.safety.router import route_request
def run_incident_assistant(
    user_text: str,
    history: list,
    user_age: int | None,
    emotions: dict,
    incident_state: dict
):
    # 1️⃣ Decide safety mode
    mode = route_request(user_text, user_age)

    # 2️⃣ Always extract factual entities
    entities = extract_entities(user_text)
    incident_state.update(entities)

    # 3️⃣ HIGH RISK MODE (murder, extreme violence)
    if mode["mode"] == "HIGH_RISK":
        return high_risk_message(), mode

    # 4️⃣ POCSO MODE (minor sexual abuse)
    if mode["mode"] == "POCSO":
        return pocso_message(), mode

    # 5️⃣ NORMAL MODE ONLY
    summary = summarize_incident(incident_state)

    if mode.get("allow_questions", False):
        question = generate_next_question(incident_state)
        if question:
            return question, mode

    if mode.get("allow_empathy", False):
        return (
            empathetic_response(user_text, summary),
            mode
        )

    # 6️⃣ Fallback (should rarely happen)
    return "I’m here to listen. Please continue.", mode
