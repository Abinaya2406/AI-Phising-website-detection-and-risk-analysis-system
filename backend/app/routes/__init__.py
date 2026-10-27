"""Route exports for PhishGuard AI."""
from app.routes.scan_routes import scan_bp
from app.routes.xai_routes import xai_bp
from app.routes.vision_routes import vision_bp
from app.routes.monitor_routes import monitor_bp
from app.routes.alert_routes import alert_bp
from app.routes.assistant_routes import assistant_bp
from app.routes.health_routes import health_bp

__all__ = [
    "scan_bp",
    "xai_bp",
    "vision_bp",
    "monitor_bp",
    "alert_bp",
    "assistant_bp",
    "health_bp",
]

