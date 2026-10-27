"""Screenshot & Vision Analysis API endpoints."""
import os
from flask import Blueprint, request, current_app, send_from_directory
from app.utils.responses import api_response, api_error
from app.utils.exceptions import ValidationError, SecurityError, SSRFError
from app.services.screenshot_service import screenshot_service, VERIFIED_REFERENCE_BRANDS

vision_bp = Blueprint("vision", __name__, url_prefix="/api")


@vision_bp.route("/screenshot/analyze", methods=["POST"])
def analyze_screenshot():
    """
    POST /api/screenshot/analyze
    Analyze an uploaded screenshot image or initiate headless visual capture.
    """
    upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
    if not os.path.isabs(upload_folder):
        upload_folder = os.path.join(current_app.root_path, "..", upload_folder)
    upload_folder = os.path.abspath(upload_folder)
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


@vision_bp.route("/screenshot/reference-brands", methods=["GET"])
def get_reference_brands():
    """
    GET /api/screenshot/reference-brands
    Retrieve verified benchmark reference profiles for visual brand comparison.
    """
    brands = []
    for key, data in VERIFIED_REFERENCE_BRANDS.items():
        brands.append({
            "key": key,
            "brand_name": data["brand_name"],
            "brandName": data["brand_name"],
            "logo_name": data["logo_name"],
            "logoName": data["logo_name"],
            "canonical_domains": data["canonical_domains"],
            "canonicalDomains": data["canonical_domains"],
            "reference_colors": data["reference_colors"],
            "referenceColors": data["reference_colors"],
            "reference_dhash": data["reference_dhash"],
            "referenceDhash": data["reference_dhash"],
            "reference_logo_url": data["reference_logo_url"],
            "referenceLogoUrl": data["reference_logo_url"],
            "reference_preview_url": data["reference_preview_url"],
            "referencePreviewUrl": data["reference_preview_url"],
        })
    return api_response(data=brands, message="Verified reference benchmark profiles retrieved.")


@vision_bp.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename):
    """
    GET /api/uploads/<filename>
    Securely serve uploaded or captured screenshot images with directory traversal protection.
    """
    upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
    if not os.path.isabs(upload_folder):
        upload_folder = os.path.join(current_app.root_path, "..", upload_folder)
    upload_folder = os.path.abspath(upload_folder)

    # Sanitize filename to prevent directory traversal
    base_name = os.path.basename(filename)
    if not os.path.exists(os.path.join(upload_folder, base_name)):
        return api_error(message="Requested image file was not found.", error_type="NotFoundError", status_code=404)

    return send_from_directory(upload_folder, base_name)
