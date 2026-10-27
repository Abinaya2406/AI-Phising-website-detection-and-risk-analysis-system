"""Data models and schemas for Scan History and Risk Assessments."""
from datetime import datetime, timezone
import uuid
from typing import Dict, Any, Optional

class ScanHistoryModel:
    """Schema and serializer for scan history documents."""
    @staticmethod
    def create(
        url: str,
        domain: str,
        risk_score: int,
        verdict: str,
        attack_type: str,
        target_brand: str = "Unspecified",
        ssl_status: Optional[Dict[str, Any]] = None,
        dns_info: Optional[Dict[str, Any]] = None,
        heuristic_features: Optional[Dict[str, Any]] = None,
        threat_intel: Optional[Dict[str, Any]] = None,
        is_demo: bool = False
    ) -> Dict[str, Any]:
        return {
            "id": f"scan-{uuid.uuid4().hex[:8]}",
            "url": url,
            "domain": domain,
            "status": "completed",
            "risk_score": int(risk_score),
            "verdict": verdict,
            "attack_type": attack_type,
            "target_brand": target_brand,
            "ssl_status": ssl_status or {},
            "dns_info": dns_info or {},
            "heuristic_features": heuristic_features or {},
            "threat_intel": threat_intel or {},
            "is_demo": is_demo,
            "created_at": datetime.now(timezone.utc).isoformat()
        }


class RiskAssessmentModel:
    """Schema and serializer for deep risk assessment breakdown documents."""
    @staticmethod
    def create(
        scan_id: str,
        risk_score: int,
        model_version: str,
        confidence: float,
        feature_contributions: list,
        decision_path: list
    ) -> Dict[str, Any]:
        return {
            "id": f"risk-{uuid.uuid4().hex[:8]}",
            "scan_id": scan_id,
            "risk_score": risk_score,
            "model_version": model_version,
            "confidence": confidence,
            "feature_contributions": feature_contributions,
            "decision_path": decision_path,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

