"""Model exports for PhishGuard AI."""
from app.models.scan import ScanHistoryModel, RiskAssessmentModel
from app.models.screenshot import ScreenshotModel
from app.models.monitor import MonitoringConfigModel, WebsiteChangeHistoryModel
from app.models.alert import AlertModel

__all__ = [
    "ScanHistoryModel",
    "RiskAssessmentModel",
    "ScreenshotModel",
    "MonitoringConfigModel",
    "WebsiteChangeHistoryModel",
    "AlertModel",
]

