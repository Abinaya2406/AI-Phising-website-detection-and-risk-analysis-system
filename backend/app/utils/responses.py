"""Standardized JSON Response Handlers for PhishGuard AI."""
from flask import jsonify

def api_response(data=None, message="Success", status_code=200, meta=None):
    """Return a consistent successful API envelope."""
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    if meta is not None:
        payload["meta"] = meta
    return jsonify(payload), status_code


def api_error(message="An error occurred", error_type="Error", details=None, status_code=400):
    """Return a consistent error API envelope."""
    payload = {
        "success": False,
        "error": {
            "type": error_type,
            "message": message,
            "details": details or {}
        }
    }
    return jsonify(payload), status_code

