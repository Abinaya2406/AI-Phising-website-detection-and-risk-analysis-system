"""Monitoring Security Alerts API endpoints."""
from flask import Blueprint, request
from app.utils.responses import api_response
from app.services.monitoring_service import monitoring_service

alert_bp = Blueprint("alert", __name__, url_prefix="/api")


@alert_bp.route("/alerts", methods=["GET"])
@alert_bp.route("/monitoring/alerts", methods=["GET"])
def list_alerts():
    """
    GET /api/alerts & GET /api/monitoring/alerts
    Retrieve security alerts triggered by domain defacement or lookalike attacks.
    """
    severity = request.args.get("severity")
    status = request.args.get("status")
    alerts = monitoring_service.list_alerts(severity=severity, status=status)
    return api_response(data=alerts, message=f"Retrieved {len(alerts)} alert(s).")

