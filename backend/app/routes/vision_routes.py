"""Screenshot & Vision Analysis API endpoints."""
import os
from flask import Blueprint, request, current_app
from app.utils.responses import api_response, api_error
from app.utils.exceptions import ValidationError, SecurityError, SSRFError
from app.services.screenshot_service import screenshot_service

vision_bp = Blueprint("vision", __name__, url_prefix="/api")


@vision_bp.route("/screenshot/analyze", methods=["POST"])
def analyze_screenshot():
    """
    POST /api/screenshot/analyze
    Analyze an uploaded screenshot image or initiate headless visual capture.
    """
    upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
    os.makedirs(upload_folder, exist_ok=True)

    # 1. Check if multipart file upload
    if "file" in request.files:
        file = request.files["file"]
        target_url = request.form.get("targetUrl") or request.form.get("target_url")
        try:
            result = screenshot_service.analyze_uploaded_file(file, upload_folder, target_url)
            return api_response(data=result, message="Screenshot visual layout analyzed successfully.", status_code=200)
        except (ValidationError, SecurityError) as e:
            return api_error(message=e.message, error_type=e.__class__.__name__, status_code=e.status_code)
        except Exception as e:
            return api_error(message=f"Vision inspection failed: {str(e)}", error_type="VisionError", status_code=500)

    # 2. Check if JSON targetUrl request
    data = request.get_json(silent=True) or {}
    target_url = data.get("targetUrl") or data.get("target_url")
    if target_url:
        try:
            result = screenshot_service.analyze_remote_url(target_url)
            return api_response(data=result, message="Headless browser capture analyzed successfully.", status_code=200)
        except (ValidationError, SSRFError, SecurityError) as e:
            return api_error(message=e.message, error_type=e.__class__.__name__, status_code=e.status_code)
        except Exception as e:
            return api_error(message=f"Remote capture failed: {str(e)}", error_type="VisionError", status_code=500)

    return api_error(
        message="Please provide a valid image 'file' in multipart form data or 'targetUrl' in JSON body.",
        error_type="ValidationError",
        status_code=400
    )

