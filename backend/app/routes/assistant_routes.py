"""Bilingual Security Assistant API endpoints."""
from flask import Blueprint, request
from app.utils.responses import api_response, api_error
from app.services.assistant_service import assistant_service
from app.database import db_manager

assistant_bp = Blueprint("assistant", __name__, url_prefix="/api")


@assistant_bp.route("/assistant/chat", methods=["POST"])
def assistant_chat():
    """
    POST /api/assistant/chat
    Process bilingual natural language queries (English & Tamil) for cybersecurity guidance,
    scan evidence forensic breakdown, brand verification, and incident response.
    """
    data = request.get_json(silent=True) or {}
    message = data.get("message")
    language = data.get("language", "en")
    scan_id = data.get("scan_id")
    scan_context = data.get("scan_context")
    history = data.get("history")

    if not message:
        return api_error(message="Missing 'message' field in request body.", error_type="ValidationError", status_code=400)

    # Resolve scan data if scan_id or scan_context is supplied
    scan_doc = None
    if scan_context and isinstance(scan_context, dict):
        scan_doc = scan_context
    elif scan_id:
        scan_doc = db_manager.get_collection("scan_history").find_one({"id": scan_id})
        if not scan_doc:
            scan_doc = db_manager.get_collection("scan_history").find_one({"_id": scan_id})

    result = assistant_service.answer_query(
        message=message,
        language=language,
        scan_data=scan_doc,
        conversation_history=history
    )
    return api_response(data=result, message="Assistant responded successfully.")


@assistant_bp.route("/assistant/presets", methods=["GET"])
def assistant_presets():
    """
    GET /api/assistant/presets
    Retrieve context-aware suggested prompt questions in English and Tamil.
    """
    presets = {
        "scan_context": {
            "en": [
                "Why is this website dangerous?",
                "Why did the risk score increase?",
                "How can I identify the official website?",
                "What should I do if I entered my password?",
                "What precautions should I take on this site?"
            ],
            "ta": [
                "இந்த இணையதளம் ஏன் ஆபத்தானது?",
                "இடர் மதிப்பீடு ஏன் அதிகரித்தது?",
                "அதிகாரப்பூர்வ இணையதளத்தை எவ்வாறு கண்டறிவது?",
                "எனது கடவுச்சொல்லை உள்ளிட்டிருந்தால் நான் என்ன செய்ய வேண்டும்?",
                "நான் என்ன முன்னெச்சரிக்கை நடவடிக்கைகளை எடுக்க வேண்டும்?"
            ]
        },
        "general": {
            "en": [
                "How does PhishGuard AI detect zero-day phishing websites?",
                "Why is an SSL certificate not enough to prove a website is safe?",
                "What are the key indicators of a brand impersonation attack?",
                "I accidentally clicked a suspicious link. What immediate steps should I take?"
            ],
            "ta": [
                "ஃபிஷிங் (Phishing) இணையதளங்களை எவ்வாறு அடையாளம் காண்பது?",
                "SSL சான்றிதழ் (https) இருந்தால் மட்டுமே அந்த தளம் பாதுகாப்பானதா?",
                "என் வங்கி கடவுச்சொல்லை போலி தளத்தில் கொடுத்துவிட்டால் என்ன செய்வது?",
                "ஜீரோ-டே (Zero-Day) ஃபிஷிங்கை AI எவ்வாறு கண்டறிகிறது?"
            ]
        }
    }
    return api_response(data=presets, message="Presets retrieved successfully.")
