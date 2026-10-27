"""Website Monitoring & Change History API endpoints."""
from flask import Blueprint, request
from app.utils.responses import api_response, api_error
from app.utils.exceptions import ValidationError, SSRFError
from app.services.monitoring_service import monitoring_service

monitor_bp = Blueprint("monitor", __name__, url_prefix="/api")


@monitor_bp.route("/monitor", methods=["GET"])
@monitor_bp.route("/monitoring/targets", methods=["GET"])
def list_monitors():
    """
    GET /api/monitor & GET /api/monitoring/targets
    List all websites enrolled in continuous monitoring.
    """
    targets = monitoring_service.list_targets()
    return api_response(data=targets, message=f"Retrieved {len(targets)} monitored target(s).")


@monitor_bp.route("/monitor", methods=["POST"])
@monitor_bp.route("/monitoring/targets", methods=["POST"])
def add_monitor():
    """
    POST /api/monitor & POST /api/monitoring/targets
    Enroll a new web asset for 24/7 defacement & SSL integrity monitoring.
    """
    data = request.get_json(silent=True) or {}
    url = data.get("url")
    name = data.get("name")
    check_interval = data.get("checkInterval") or data.get("check_interval", "Every 5 mins")

    if not url:
        return api_error(message="Missing required field 'url'.", error_type="ValidationError", status_code=400)

    try:
        new_target = monitoring_service.add_target(name=name, url=url, check_interval=check_interval)
        return api_response(data=new_target, message="Target successfully enrolled in monitoring.", status_code=201)
    except (ValidationError, SSRFError) as e:
        return api_error(message=e.message, error_type=e.__class__.__name__, status_code=e.status_code)
    except Exception as e:
        return api_error(message=f"Failed to add monitor: {str(e)}", error_type="MonitorError", status_code=500)


@monitor_bp.route("/monitor/<target_id>", methods=["PATCH"])
def update_monitor(target_id):
    """
    PATCH /api/monitor/<id>
    Update configuration attributes for a monitored website target.
    """
    data = request.get_json(silent=True) or {}
    updated = monitoring_service.update_target(target_id, data)
    if not updated:
        return api_error(message=f"Monitored target with ID '{target_id}' not found.", error_type="ResourceNotFound", status_code=404)

    return api_response(data=updated, message="Monitored target updated successfully.")


@monitor_bp.route("/monitor/<target_id>", methods=["DELETE"])
@monitor_bp.route("/monitoring/targets/<target_id>", methods=["DELETE"])
def delete_monitor(target_id):
    """
    DELETE /api/monitor/<id> & DELETE /api/monitoring/targets/<id>
    Remove a web asset from continuous monitoring.
    """
    success = monitoring_service.delete_target(target_id)
    if not success:
        return api_error(message=f"Monitored target with ID '{target_id}' not found.", error_type="ResourceNotFound", status_code=404)

    return api_response(data={"deleted_id": target_id}, message="Monitored target removed successfully.")


@monitor_bp.route("/monitor/<target_id>/changes", methods=["GET"])
def get_monitor_changes(target_id):
    """
    GET /api/monitor/<id>/changes
    Retrieve the historical audit log of DOM & content alterations for a target.
    """
    target = monitoring_service.get_target(target_id)
    if not target:
        return api_error(message=f"Monitored target with ID '{target_id}' not found.", error_type="ResourceNotFound", status_code=404)

    changes = monitoring_service.get_changes(target_id)
    return api_response(data=changes, message=f"Retrieved {len(changes)} change log record(s).")

