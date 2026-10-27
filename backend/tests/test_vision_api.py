"""Integration and unit tests for Feature 2: Screenshot Vision Analysis & Brand Impersonation Detection."""
import io
import pytest
from PIL import Image
from app.services.screenshot_service import (
    compute_dhash,
    compute_ahash,
    compute_phash,
    hamming_distance,
    hash_similarity,
    extract_dominant_palette,
    calculate_color_palette_similarity,
    VERIFIED_REFERENCE_BRANDS,
    screenshot_service
)


def test_screenshot_analyze_with_remote_url(client):
    """Verify POST /api/screenshot/analyze using targetUrl."""
    res = client.post("/api/screenshot/analyze", json={"targetUrl": "https://paypal-verify-account.cc"})
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "visual_similarity_score" in data
    assert data["visual_similarity_score"] > 50.0
    assert "detected_brand" in data
    assert "ocr_tokens" in data
    assert len(data["ocr_tokens"]) > 0
    assert "perceptual_hashes" in data
    assert "dominant_colors" in data
    assert "reference_comparison" in data


def test_screenshot_analyze_with_ssrf_url(client):
    """Verify POST /api/screenshot/analyze blocks SSRF URLs."""
    res = client.post("/api/screenshot/analyze", json={"targetUrl": "http://127.0.0.1:3000"})
    assert res.status_code == 403


def test_screenshot_analyze_with_valid_image_upload(client):
    """Verify POST /api/screenshot/analyze accepting valid PNG multipart upload."""
    buf = io.BytesIO()
    # Create blue image mimicking brand palette
    img = Image.new("RGB", (300, 300), color=(0, 48, 135))
    img.save(buf, format="PNG")
    buf.seek(0)
    data = {
        "file": (buf, "paypal_sample_screenshot.png"),
        "targetUrl": "https://paypal.spoofed.domain/signin"
    }
    res = client.post("/api/screenshot/analyze", data=data, content_type="multipart/form-data")
    assert res.status_code == 200
    result = res.get_json()["data"]
    assert result["detected_brand"] == "PayPal Inc."
    assert result["visual_similarity_score"] > 80.0
    assert result["reference_comparison"]["is_impersonation"] is True
    assert "perceptual_hashes" in result
    assert "dhash" in result["perceptual_hashes"]


def test_screenshot_analyze_empty_payload(client):
    """Verify POST /api/screenshot/analyze returns 400 when no image or URL is provided."""
    res = client.post("/api/screenshot/analyze", json={})
    assert res.status_code == 400


def test_screenshot_analyze_disallowed_file_extension(client):
    """Verify POST /api/screenshot/analyze rejects unauthorized file extensions (.exe)."""
    buf = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00")
    data = {
        "file": (buf, "malicious_payload.exe"),
        "targetUrl": "https://example.com"
    }
    res = client.post("/api/screenshot/analyze", data=data, content_type="multipart/form-data")
    assert res.status_code in (400, 403)


def test_perceptual_hashing_consistency():
    """Verify dHash, aHash, and pHash produce reproducible fingerprints and sensible distances."""
    img1 = Image.new("RGB", (200, 200), color=(255, 255, 255))
    img2 = Image.new("RGB", (200, 200), color=(0, 0, 0))

    dhash1 = compute_dhash(img1)
    dhash2 = compute_dhash(img2)
    ahash1 = compute_ahash(img1)
    phash1 = compute_phash(img1)

    assert len(dhash1) == 16  # 64 bits = 16 hex chars
    assert len(ahash1) == 16
    assert len(phash1) == 16

    # Identical image similarity should be 1.0
    assert hash_similarity(dhash1, dhash1) == 1.0
    assert hamming_distance(dhash1, dhash1) == 0


def test_dominant_color_palette_extraction():
    """Verify dominant color palette clustering produces valid hex colors."""
    img = Image.new("RGB", (100, 100), color=(0, 120, 212))  # Microsoft blue
    palette = extract_dominant_palette(img, n_colors=3)

    assert len(palette) > 0
    assert "hex" in palette[0]
    assert "rgb" in palette[0]
    assert palette[0]["hex"].startswith("#")

    # Calculate similarity with Microsoft reference colors
    ms_colors = VERIFIED_REFERENCE_BRANDS["microsoft"]["reference_colors"]
    sim = calculate_color_palette_similarity(palette, ms_colors)
    assert sim > 0.65


def test_canonical_domain_impersonation_detection(client):
    """Verify authentic canonical domain vs unauthorized domain impersonation verdict."""
    # 1. Authentic domain test (paypal.com)
    buf_auth = io.BytesIO()
    img_auth = Image.new("RGB", (200, 200), color=(0, 48, 135))
    img_auth.save(buf_auth, format="PNG")
    buf_auth.seek(0)

    data_auth = {
        "file": (buf_auth, "paypal_login.png"),
        "targetUrl": "https://www.paypal.com/signin"
    }
    res_auth = client.post("/api/screenshot/analyze", data=data_auth, content_type="multipart/form-data")
    assert res_auth.status_code == 200
    res_json_auth = res_auth.get_json()["data"]
    assert res_json_auth["reference_comparison"]["is_impersonation"] is False
    assert "Authentic" in res_json_auth["reference_comparison"]["impersonation_verdict"]

    # 2. Spoofed domain test (paypal-login-alert.biz)
    buf_spoof = io.BytesIO()
    img_spoof = Image.new("RGB", (200, 200), color=(0, 48, 135))
    img_spoof.save(buf_spoof, format="PNG")
    buf_spoof.seek(0)

    data_spoof = {
        "file": (buf_spoof, "paypal_login.png"),
        "targetUrl": "https://paypal-login-alert.biz/signin"
    }
    res_spoof = client.post("/api/screenshot/analyze", data=data_spoof, content_type="multipart/form-data")
    assert res_spoof.status_code == 200
    res_json_spoof = res_spoof.get_json()["data"]
    assert res_json_spoof["reference_comparison"]["is_impersonation"] is True
    assert "Dangerous Impersonation" in res_json_spoof["reference_comparison"]["impersonation_verdict"]


def test_get_reference_brands_endpoint(client):
    """Verify GET /api/screenshot/reference-brands returns benchmark brand profiles."""
    res = client.get("/api/screenshot/reference-brands")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert len(data) >= 5
    brand_names = [b["brand_name"] for b in data]
    assert "PayPal Inc." in brand_names
    assert "Microsoft 365" in brand_names
    assert "Google LLC" in brand_names
