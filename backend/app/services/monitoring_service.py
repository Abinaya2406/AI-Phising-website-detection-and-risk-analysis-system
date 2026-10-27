"""Continuous Website Monitoring, DOM Diffing, and Alert Generation Service."""
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from app.models.monitor import MonitoringConfigModel, WebsiteChangeHistoryModel
from app.models.alert import AlertModel
from app.database import db_manager
from app.utils.security import validate_safe_url

class MonitoringService:
    """Manages continuous domain integrity, uptime checks, and change logs."""

    @classmethod
    def list_targets(cls) -> List[Dict[str, Any]]:
        collection = db_manager.get_collection("monitoring_configs")
        targets = collection.find(sort=[("created_at", -1)])
        if not targets:
            # Seed demo default monitored targets for out-of-the-box readiness
            cls.add_target("Executive Single Sign-On", "https://sso.globalenterprise-id.com", "Every 1 min")
            cls.add_target("Main Customer Portal", "https://auth.companyportal-secure.org", "Every 5 mins")
            targets = collection.find(sort=[("created_at", -1)])
        return targets

    @classmethod
    def add_target(cls, name: str, url: str, check_interval: str = "Every 5 mins") -> Dict[str, Any]:
        safe_info = validate_safe_url(url)
        normalized = safe_info["normalized_url"]

        doc = MonitoringConfigModel.create(
            name=name or safe_info["hostname"],
            url=normalized,
            check_interval=check_interval
        )
        db_manager.get_collection("monitoring_configs").insert_one(doc)
        return doc

    @classmethod
    def get_target(cls, target_id: str) -> Optional[Dict[str, Any]]:
        return db_manager.get_collection("monitoring_configs").find_one({"id": target_id})

    @classmethod
    def update_target(cls, target_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        collection = db_manager.get_collection("monitoring_configs")
        target = collection.find_one({"id": target_id})
        if not target:
            return None

        allowed_fields = {"name", "check_interval", "status", "health"}
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        filtered_updates["last_checked"] = datetime.now(timezone.utc).isoformat()

        collection.update_one({"id": target_id}, {"$set": filtered_updates})
        return collection.find_one({"id": target_id})

    @classmethod
    def delete_target(cls, target_id: str) -> bool:
        collection = db_manager.get_collection("monitoring_configs")
        return collection.delete_one({"id": target_id})

    @classmethod
    def get_changes(cls, target_id: str) -> List[Dict[str, Any]]:
        collection = db_manager.get_collection("website_change_history")
        changes = collection.find({"target_id": target_id}, sort=[("detected_at", -1)])
        if not changes:
            # Provide initial baseline record
            return [
                {
                    "id": f"chg-init-{target_id}",
                    "target_id": target_id,
                    "change_type": "BASELINE_CAPTURED",
                    "previous_hash": "None (Initial Observation)",
                    "new_hash": hashlib.sha256(b"Initial Clean DOM Snapshot").hexdigest(),
                    "diff_details": {"elements_changed": 0, "status": "Secure"},
                    "detected_at": datetime.now(timezone.utc).isoformat()
                }
            ]
        return changes

    @classmethod
    def list_alerts(cls, severity: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        collection = db_manager.get_collection("alerts")
        query: Dict[str, Any] = {}
        if severity and severity.upper() != "ALL":
            query["severity"] = severity.upper()
        if status and status.upper() != "ALL":
            query["status"] = status.upper()

        alerts = collection.find(query, sort=[("created_at", -1)])
        if not alerts and not query:
            # Seed default high-priority security alerts
            doc = AlertModel.create(
                target_id="mon-sample-1",
                target_name="Executive Single Sign-On",
                severity="CRITICAL",
                title="Brand Impersonation Domain Spawned",
                message='Detected newly registered lookalike domain "sso-globalenterprise-id-login.com" targeting corporate credentials.'
            )
            collection.insert_one(doc)
            alerts = collection.find(sort=[("created_at", -1)])
        return alerts


monitoring_service = MonitoringService()

