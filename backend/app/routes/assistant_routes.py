"""Bilingual Security Assistant API endpoints."""
from flask import Blueprint, request
from app.utils.responses import api_response, api_error
from app.services.assistant_service import assistant_service

assistant_bp = Blueprint("assistant", __name__, url_prefix="/api")


@assistant_bp.route("/assistant/chat", methods=["POST"])
def assistant_chat():
    """
    POST /api/assistant/chat
    Process bilingual natural language queries (English & Tamil) for cyber security guidance.
    """
    data = request.get_json(silent=True) or {}
    message = data.get("message")
    language = data.get("language", "en")

    if not message:
        return api_error(message="Missing 'message' field in request body.", error_type="ValidationError", status_code=400)

    result = assistant_service.answer_query(message=message, language=language)
    return api_response(data=result, message="Assistant responded successfully.")

