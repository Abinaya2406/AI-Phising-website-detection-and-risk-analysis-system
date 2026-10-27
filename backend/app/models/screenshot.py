"""Data model and schema for Screenshot analysis records."""
from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional

class ScreenshotModel:
    """Schema and serializer for screenshot analysis results."""
    @staticmethod
    def create(
        target_url: str,
        stored_filename: str,
        file_path: str,
        visual_similarity_score: float,
        detected_brand: str,
        logo_detected: str,
        ocr_tokens: List[str],
        urgency_detected: bool,
        layout_anomalies: List[Dict[str, str]],
        scan_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return {
            "id": f"shot-{uuid.uuid4().hex[:8]}",
            "scan_id": scan_id or f"scan-{uuid.uuid4().hex[:8]}",
            "target_url": target_url,
            "stored_filename": stored_filename,
            "file_path": file_path,
            "visual_similarity_score": round(visual_similarity_score, 1),
            "detected_brand": detected_brand,
            "logo_detected": logo_detected,
            "ocr_tokens": ocr_tokens,
            "urgency_detected": urgency_detected,
            "layout_anomalies": layout_anomalies,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

