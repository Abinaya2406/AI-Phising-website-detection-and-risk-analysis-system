"""Health and Liveness Check API endpoints."""
from datetime import datetime, timezone
from flask import Blueprint
from app.utils.responses import api_response
from app.database import db_manager

health_bp = Blueprint("health", __name__, url_prefix="/api")


@health_bp.route("/health", methods=["GET"])
def health_check():
    """
    GET /api/health
    Liveness and operational health inspection endpoint.
    """
    db_status = "connected" if db_manager.is_connected else ("in_memory_fallback" if db_manager.is_mock else "uninitialized")
    payload = {
        "status": "healthy",
        "service": "PhishGuard AI Backend",
        "version": "1.0.0",
        "database": {
            "status": db_status,
            "connected": db_manager.is_connected,
            "is_mock": db_manager.is_mock,
        },
        "engine": "Scikit-Learn Lexical + Deep Vision Ensemble",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    return api_response(data=payload, message="PhishGuard AI Backend is operational.")

