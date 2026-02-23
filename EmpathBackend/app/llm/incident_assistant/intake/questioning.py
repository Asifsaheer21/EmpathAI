def generate_next_question(incident_data: dict) -> str | None:
    """
    Generates the next intake question in a gentle, counselor-like tone.
    Prioritizes emotional safety and natural conversational flow.
    """

    asked = incident_data.get("asked_fields", [])

    # --------------------------------------------------
    # 🧠 PHASE 1 — Encourage sharing if description missing
    # --------------------------------------------------
    if not incident_data.get("incident_description"):
        return (
            "If you feel comfortable, would you like to tell me a little more "
            "about what happened?"
        )

    # --------------------------------------------------
    # 🧠 PHASE 2 — Soft structured follow-up
    # --------------------------------------------------
    priority_questions = [
        (
            "time_period",
            "When did this situation first begin for you?"
        ),
        (
            "frequency",
            "Has this been happening repeatedly, or was it a one-time experience?"
        ),
        (
            "crime_location",
            "Is this happening somewhere specific, like online or in a particular place?"
        ),
        (
            "witnesses",
            "Was anyone else aware of what happened, or someone you trust who knows about this?"
        ),
        (
            "evidence_available",
            "Do you happen to have any messages, screenshots, or anything else that might document what happened?"
        ),
        (
            "injury_present",
            "Have you experienced any physical harm as a result of this?"
        ),
    ]

    for field, question in priority_questions:
        if not incident_data.get(field) and field not in asked:
            incident_data["asked_fields"] = asked + [field]
            return (
                "If you're comfortable sharing, " + question
            )

    return None