"""Explainable AI (XAI) API endpoints."""
from flask import Blueprint, request
from app.utils.responses import api_response, api_error
from app.services.xai_service import xai_service
from app.database import db_manager

xai_bp = Blueprint("xai", __name__, url_prefix="/api")


@xai_bp.route("/assistant/explain", methods=["POST"])
def explain_endpoint():
    """
    POST /api/assistant/explain
    Generate SHAP values, LIME token weights, and decision tree explanation for a URL or scan_id.
    """
    data = request.get_json(silent=True) or {}
    url = data.get("url")
    scan_id = data.get("scan_id")

    if not url and scan_id:
        doc = db_manager.get_collection("scan_history").find_one({"id": scan_id})
        if doc:
            url = doc.get("url")

    if not url:
        return api_error(message="Please provide a 'url' or valid 'scan_id' to explain.", error_type="ValidationError", status_code=400)

    try:
        explanation = xai_service.generate_explanation(url, scan_id)
        return api_response(data=explanation, message="XAI Explanation formulated successfully.")
    except Exception as e:
        return api_error(message=f"XAI calculation error: {str(e)}", error_type="XAIError", status_code=500)


@xai_bp.route("/xai/explain/<scan_id>", methods=["GET"])
def get_xai_by_id(scan_id):
    """
    GET /api/xai/explain/<scan_id>
    Retrieve XAI explanation corresponding to a historical scan ID.
    """
    doc = db_manager.get_collection("scan_history").find_one({"id": scan_id})
    url = doc.get("url") if doc else "https://security-verify-account-paypal.com/signin/webapps"

    explanation = xai_service.generate_explanation(url, scan_id)
    return api_response(data=explanation, message="XAI Explanation retrieved successfully.")

