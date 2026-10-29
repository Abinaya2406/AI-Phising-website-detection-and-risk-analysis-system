"""Data model and schema for Security Alerts."""
from datetime import datetime, timezone
import uuid
from typing import Dict, Any, Optional

class AlertModel:
    """Schema and serializer for monitoring security alerts."""
    @staticmethod
    def create(
        target_id: str,
        target_name: str,
        severity: str,
        title: str,
        message: str,
        change_id: Optional[str] = None,
        status: str = "OPEN"
    ) -> Dict[str, Any]:
        return {
            "id": f"alt-{uuid.uuid4().hex[:8]}",
            "target_id": target_id,
            "target_name": target_name,
            "severity": severity.upper(),  # CRITICAL, HIGH, MEDIUM, LOW, INFO
            "title": title,
            "message": message,
            "change_id": change_id,
            "status": status.upper(),      # OPEN, INVESTIGATING, RESOLVED
            "created_at": datetime.now(timezone.utc).isoformat(),
            "resolved_at": None
        }
