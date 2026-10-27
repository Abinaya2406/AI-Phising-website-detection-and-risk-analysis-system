"""Integration tests for Screenshot and Computer Vision endpoints."""
import io


def test_screenshot_analyze_with_remote_url(client):
    """Verify POST /api/screenshot/analyze using targetUrl."""
    res = client.post("/api/screenshot/analyze", json={"targetUrl": "https://paypal-verify-account.cc"})
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "visual_similarity_score" in data
    assert "detected_brand" in data
    assert "ocr_tokens" in data
    assert len(data["ocr_tokens"]) > 0


def test_screenshot_analyze_with_ssrf_url(client):
    """Verify POST /api/screenshot/analyze blocks SSRF URLs."""
    res = client.post("/api/screenshot/analyze", json={"targetUrl": "http://127.0.0.1:3000"})
    assert res.status_code == 403


def test_screenshot_analyze_with_valid_image_upload(client):
    """Verify POST /api/screenshot/analyze accepting valid PNG multipart upload."""
    from PIL import Image
    buf = io.BytesIO()
    img = Image.new("RGB", (20, 20), color=(0, 200, 255))
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


def test_screenshot_analyze_empty_payload(client):
    """Verify POST /api/screenshot/analyze returns 400 when no image or URL is provided."""
    res = client.post("/api/screenshot/analyze", json={})
    assert res.status_code == 400
