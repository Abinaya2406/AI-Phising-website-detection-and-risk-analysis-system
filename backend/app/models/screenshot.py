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
        perceptual_hashes: Optional[Dict[str, str]] = None,
        dominant_colors: Optional[List[Dict[str, Any]]] = None,
        reference_comparison: Optional[Dict[str, Any]] = None,
        evidence_measurements: Optional[Dict[str, Any]] = None,
        limitations: Optional[List[str]] = None,
        scan_id: Optional[str] = None
    ) -> Dict[str, Any]:
        sim_rounded = round(float(visual_similarity_score), 1)
        ref_comp = reference_comparison or {}
        limitations_list = limitations or [
            "Visual similarity is computed via 64-bit difference hashing (dHash) and dominant color palette clustering against verified reference benchmarks.",
            "Heuristic token and DOM inspection are utilized when standalone system OCR binaries are unavailable.",
            "Obfuscated dynamic JavaScript canvas renders and iframe cloaking require real-time interactive browser emulation."
        ]

        # Preview path served via API
        preview_url = f"/api/uploads/{stored_filename}"

        return {
            "id": f"shot-{uuid.uuid4().hex[:8]}",
            "scan_id": scan_id or f"scan-{uuid.uuid4().hex[:8]}",
            "target_url": target_url,
            "targetUrl": target_url,
            "url": target_url,
            "stored_filename": stored_filename,
            "storedFilename": stored_filename,
            "file_path": file_path,
            "filePath": file_path,
            "preview_url": preview_url,
            "previewUrl": preview_url,
            "visual_similarity_score": sim_rounded,
            "visualSimilarityScore": sim_rounded,
            "detected_brand": detected_brand,
            "detectedBrand": detected_brand,
            "targetBrand": detected_brand,
            "logo_detected": logo_detected,
            "logoDetected": logo_detected,
            "ocr_tokens": ocr_tokens,
            "ocrTokens": ocr_tokens,
            "ocr_text_extracted": ocr_tokens,
            "ocrTextExtracted": ocr_tokens,
            "urgency_detected": urgency_detected,
            "urgencyDetected": urgency_detected,
            "ocr_urgency_detected": urgency_detected,
            "ocrUrgencyDetected": urgency_detected,
            "layout_anomalies": layout_anomalies,
            "layoutAnomalies": layout_anomalies,
            "perceptual_hashes": perceptual_hashes or {},
            "perceptualHashes": perceptual_hashes or {},
            "dominant_colors": dominant_colors or [],
            "dominantColors": dominant_colors or [],
            "reference_comparison": ref_comp,
            "referenceComparison": ref_comp,
            "evidence_measurements": evidence_measurements or {},
            "evidenceMeasurements": evidence_measurements or {},
            "limitations": limitations_list,
            "is_demo": False,
            "isDemo": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
