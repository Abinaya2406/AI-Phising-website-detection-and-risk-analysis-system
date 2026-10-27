"""Data models and schemas for Website Monitoring and Change History."""
from datetime import datetime, timezone
import uuid
from typing import Dict, Any, Optional

class MonitoringConfigModel:
    """Schema and serializer for website monitoring targets."""
    @staticmethod
    def create(
        name: str,
        url: str,
        check_interval: str = "Every 5 mins",
        status: str = "ACTIVE",
        health: str = "HEALTHY"
    ) -> Dict[str, Any]:
        return {
            "id": f"mon-{uuid.uuid4().hex[:8]}",
            "name": name,
            "url": url,
            "check_interval": check_interval,
            "status": status,
            "health": health,
            "uptime": "100%",
            "ssl_days_left": 90,
            "last_checked": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }


class WebsiteChangeHistoryModel:
    """Schema and serializer for detected DOM/content mutations."""
    @staticmethod
    def create(
        target_id: str,
        url: str,
        change_type: str,
        previous_hash: str,
        new_hash: str,
        diff_details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {
            "id": f"chg-{uuid.uuid4().hex[:8]}",
            "target_id": target_id,
            "url": url,
            "change_type": change_type,
            "previous_hash": previous_hash,
            "new_hash": new_hash,
            "diff_details": diff_details or {},
            "detected_at": datetime.now(timezone.utc).isoformat()
        }

