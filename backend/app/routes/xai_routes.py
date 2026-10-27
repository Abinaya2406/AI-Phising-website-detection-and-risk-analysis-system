"""Explainable AI (XAI) API endpoints."""
from flask import Blueprint, request
from app.utils.responses import api_response, api_error
from app.utils.exceptions import ValidationError, SSRFError, SecurityError
from app.utils.security import validate_safe_url
from app.services.xai_service import xai_service
from app.database import db_manager

xai_bp = Blueprint("xai", __name__, url_prefix="/api")


@xai_bp.route("/assistant/explain", methods=["POST"])
def explain_endpoint():
    """
    POST /api/assistant/explain
    Generate SHAP values, LIME token weights, and decision tree explanation for a URL or scan_id.
    Persists the explanation to MongoDB.
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
        validate_safe_url(url)
        explanation = xai_service.generate_explanation(url, scan_id)
        
        # Persist explanation in risk_assessments collection
        collection = db_manager.get_collection("risk_assessments")
        collection.update_one(
            {"scan_id": explanation["scan_id"]},
            {"$set": explanation},
        )
        if collection.count_documents({"scan_id": explanation["scan_id"]}) == 0:
            collection.insert_one(explanation)

        return api_response(data=explanation, message="XAI Explanation formulated successfully.")
    except (ValidationError, SSRFError, SecurityError) as e:
        return api_error(message=e.message, error_type=e.__class__.__name__, status_code=e.status_code)
    except Exception as e:
        return api_error(message=f"XAI calculation error: {str(e)}", error_type="XAIError", status_code=500)


@xai_bp.route("/xai/explain/<scan_id>", methods=["GET"])
def get_xai_by_id(scan_id):
    """
    GET /api/xai/explain/<scan_id>
    Retrieve or compute XAI explanation corresponding to a historical scan ID.
    """
    # 1. Check if explanation is already saved in risk_assessments
    existing_explanation = db_manager.get_collection("risk_assessments").find_one({"scan_id": scan_id})
    if existing_explanation and "shap_features" in existing_explanation:
        return api_response(data=existing_explanation, message="XAI Explanation retrieved from database.")

    # 2. Look up scan in scan_history
    doc = db_manager.get_collection("scan_history").find_one({"id": scan_id})
    if not doc:
        doc = db_manager.get_collection("scan_history").find_one({"_id": scan_id})

    url = doc.get("url") if doc else "https://security-verify-account-paypal.com/signin/webapps"

    explanation = xai_service.generate_explanation(url, scan_id)

    # Persist in risk_assessments
    collection = db_manager.get_collection("risk_assessments")
    collection.insert_one(dict(explanation))

    return api_response(data=explanation, message="XAI Explanation formulated and stored successfully.")
