"""Application Factory for PhishGuard AI Backend."""
import os
from flask import Flask
from flask_cors import CORS

from app.config import config_by_name
from app.database import db_manager
from app.utils.responses import api_error
from app.utils.exceptions import PhishGuardException
from app.utils.logger import logger

# Import blueprints
from app.routes.scan_routes import scan_bp
from app.routes.xai_routes import xai_bp
from app.routes.vision_routes import vision_bp
from app.routes.monitor_routes import monitor_bp
from app.routes.alert_routes import alert_bp
from app.routes.assistant_routes import assistant_bp
from app.routes.health_routes import health_bp


def create_app(config_name: str = None) -> Flask:
    """Construct and configure the modular Flask application."""
    if not config_name:
        config_name = os.environ.get("FLASK_ENV", "development").lower()

    app = Flask(__name__)
    config_class = config_by_name.get(config_name, config_by_name["default"])
    app.config.from_object(config_class)

    # Initialize CORS with restricted origins
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}},
        supports_credentials=True
    )

    # Initialize database
    db_manager.init_app(app)

    # Ensure upload directory exists
    os.makedirs(app.config.get("UPLOAD_FOLDER", "uploads"), exist_ok=True)

    # Register Blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(scan_bp)
    app.register_blueprint(xai_bp)
    app.register_blueprint(vision_bp)
    app.register_blueprint(monitor_bp)
    app.register_blueprint(alert_bp)
    app.register_blueprint(assistant_bp)

    # Global Error Handlers
    @app.errorhandler(PhishGuardException)
    def handle_phishguard_exception(e):
        return api_error(message=e.message, error_type=e.__class__.__name__, details=e.details, status_code=e.status_code)

    @app.errorhandler(400)
    def handle_bad_request(e):
        return api_error(message="Bad Request: The server could not understand the request.", error_type="BadRequest", status_code=400)

    @app.errorhandler(404)
    def handle_not_found(e):
        return api_error(message="The requested endpoint or resource was not found.", error_type="NotFound", status_code=404)

    @app.errorhandler(405)
    def handle_method_not_allowed(e):
        return api_error(message="Method Not Allowed for the requested endpoint.", error_type="MethodNotAllowed", status_code=405)

    @app.errorhandler(413)
    def handle_oversized_payload(e):
        return api_error(message="Payload Too Large: Uploaded file exceeds the allowable threshold.", error_type="PayloadTooLarge", status_code=413)

    @app.errorhandler(500)
    def handle_internal_server_error(e):
        logger.error(f"Internal server error: {str(e)}")
        return api_error(message="Internal Server Error: An unexpected error occurred.", error_type="InternalServerError", status_code=500)

    logger.info(f"PhishGuard AI Backend initialized in '{config_name}' mode.")
    return app

