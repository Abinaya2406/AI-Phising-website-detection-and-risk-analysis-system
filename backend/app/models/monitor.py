"""Data models and schemas for Website Monitoring, Snapshots, and Change History."""
from datetime import datetime, timezone, timedelta
import uuid
from typing import Dict, Any, Optional, List

INTERVAL_TO_SECONDS = {
    "Every 1 min": 60,
    "1 min": 60,
    "1m": 60,
    "Every 5 mins": 300,
    "5 mins": 300,
    "5m": 300,
    "Every 15 mins": 900,
    "15 mins": 900,
    "15m": 900,
    "Every 1 hour": 3600,
    "1 hour": 3600,
    "1h": 3600,
    "Every 6 hours": 21600,
    "6 hours": 21600,
    "6h": 21600,
    "Every 24 hours": 86400,
    "24 hours": 86400,
    "24h": 86400,
}


def parse_interval_seconds(interval_str: str) -> int:
    """Parse a human-readable interval string to seconds, enforcing a 60s minimum rate limit."""
    if not interval_str:
        return 300
    cleaned = str(interval_str).strip()
    if cleaned in INTERVAL_TO_SECONDS:
        return max(60, INTERVAL_TO_SECONDS[cleaned])
    try:
        val = int(cleaned)
        return max(60, val)
    except ValueError:
        return 300


class MonitoringConfigModel:
    """Schema and serializer for website monitoring targets."""

    @staticmethod
    def create(
        name: str,
        url: str,
        domain: str,
        check_interval: str = "Every 5 mins",
        status: str = "ACTIVE",
        health: str = "HEALTHY",
        baseline_risk_score: int = 0
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        interval_secs = parse_interval_seconds(check_interval)
        next_check = (now + timedelta(seconds=interval_secs)).isoformat()

        return {
            "id": f"mon-{uuid.uuid4().hex[:8]}",
            "name": name,
            "url": url,
            "domain": domain,
            "check_interval": check_interval,
            "interval_seconds": interval_secs,
            "status": status.upper(),  # ACTIVE, PAUSED, ERROR
            "health": health.upper(),  # HEALTHY, SUSPICIOUS, DEFACED, OFFLINE, DEGRADED
            "uptime": "100%",
            "ssl_days_left": 90,
            "baseline_risk_score": int(baseline_risk_score),
            "current_risk_score": int(baseline_risk_score),
            "previous_risk_score": int(baseline_risk_score),
            "risk_delta": 0,
            "last_checked": now.isoformat(),
            "next_check": next_check,
            "error_count": 0,
            "last_error": None,
            "total_checks": 1,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }


class MonitoringSnapshotModel:
    """Schema and serializer for historical website baseline and periodic snapshots."""

    @staticmethod
    def create(
        target_id: str,
        url: str,
        domain: str,
        content_hash: str,
        title: str,
        status_code: int = 200,
        redirect_chain: Optional[List[str]] = None,
        final_url: Optional[str] = None,
        screenshot_phash: Optional[str] = None,
        ssl_info: Optional[Dict[str, Any]] = None,
        dns_info: Optional[Dict[str, Any]] = None,
        forms_info: Optional[Dict[str, Any]] = None,
        risk_score: int = 0,
        risk_category: str = "Low"
    ) -> Dict[str, Any]:
        return {
            "id": f"snap-{uuid.uuid4().hex[:8]}",
            "target_id": target_id,
            "url": url,
            "domain": domain,
            "content_hash": content_hash,
            "title": title or "",
            "status_code": status_code,
            "redirect_chain": redirect_chain or [url],
            "final_url": final_url or url,
            "screenshot_phash": screenshot_phash or "0000000000000000",
            "ssl_info": ssl_info or {},
            "dns_info": dns_info or {},
            "forms_info": forms_info or {},
            "risk_score": int(risk_score),
            "risk_category": risk_category,
            "captured_at": datetime.now(timezone.utc).isoformat()
        }


class WebsiteChangeHistoryModel:
    """Schema and serializer for detected mutations, defacements, and risk score shifts."""

    @staticmethod
    def create(
        target_id: str,
        url: str,
        change_type: str,
        severity: str,
        description: str,
        previous_risk_score: int,
        new_risk_score: int,
        previous_hash: Optional[str] = None,
        new_hash: Optional[str] = None,
        diff_details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {
            "id": f"chg-{uuid.uuid4().hex[:8]}",
            "target_id": target_id,
            "url": url,
            "change_type": change_type.upper(),  # BASELINE_CAPTURED, CONTENT_MUTATION, LOGIN_FORM_ADDED, FORM_HIJACK, SSL_DEGRADATION, DNS_MIGRATION, REDIRECT_ANOMALY, NO_CHANGE
            "severity": severity.upper(),        # CRITICAL, HIGH, MEDIUM, LOW, INFO
            "description": description,
            "previous_risk_score": int(previous_risk_score),
            "new_risk_score": int(new_risk_score),
            "risk_delta": int(new_risk_score - previous_risk_score),
            "previous_hash": previous_hash or "N/A",
            "new_hash": new_hash or "N/A",
            "diff_details": diff_details or {},
            "detected_at": datetime.now(timezone.utc).isoformat()
        }
