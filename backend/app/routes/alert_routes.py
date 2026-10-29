"""Monitoring Security Alerts API endpoints."""
from flask import Blueprint, request
from app.utils.responses import api_response, api_error
from app.services.monitoring_service import monitoring_service

alert_bp = Blueprint("alert", __name__, url_prefix="/api")


@alert_bp.route("/alerts", methods=["GET"])
@alert_bp.route("/monitoring/alerts", methods=["GET"])
def list_alerts():
    """
    GET /api/alerts & GET /api/monitoring/alerts
    Retrieve security alerts triggered by domain defacement, credential form injection,
    or lookalike attacks with optional severity and status filtering.
    """
    severity = request.args.get("severity")
    status = request.args.get("status")
    alerts = monitoring_service.list_alerts(severity=severity, status=status)
    return api_response(data=alerts, message=f"Retrieved {len(alerts)} alert(s).")


@alert_bp.route("/alerts/<alert_id>/status", methods=["PATCH", "POST"])
def update_alert_status(alert_id):
    """
    PATCH /api/alerts/<id>/status & POST /api/alerts/<id>/status
    Update alert status: OPEN, INVESTIGATING, RESOLVED.
    """
    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "RESOLVED")

    updated = monitoring_service.update_alert_status(alert_id, new_status)
    if not updated:
        return api_error(message=f"Alert with ID '{alert_id}' not found.", error_type="ResourceNotFound", status_code=404)

    return api_response(data=updated, message=f"Alert status updated to '{new_status}'.")
