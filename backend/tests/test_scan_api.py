"""Integration tests for Scan, History, and Risk API endpoints."""
import json


def test_health_check(client):
    """Verify GET /api/health endpoint returns 200 OK and valid status."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert data["data"]["version"] == "1.0.0"


def test_scan_missing_url(client):
    """Verify POST /api/scan returns 400 when URL is omitted."""
    res = client.post("/api/scan", json={})
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["type"] == "ValidationError"


def test_scan_ssrf_blocked(client):
    """Verify POST /api/scan returns 403 when private/loopback URL is submitted."""
    res = client.post("/api/scan", json={"url": "http://127.0.0.1:8000/secret"})
    assert res.status_code == 403
    data = res.get_json()
    assert data["success"] is False
    assert "SSRF" in data["error"]["type"]


def test_scan_valid_url(client):
    """Verify POST /api/scan successfully analyzes a legitimate public domain."""
    res = client.post("/api/scan", json={"url": "https://github.com/security"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    scan = data["data"]
    assert "risk_score" in scan
    assert "verdict" in scan
    assert "domain" in scan
    assert scan["domain"] == "github.com"
    assert scan["risk_score"] < 40
    assert scan["verdict"] == "Safe"


def test_scan_phishing_impersonator(client):
    """Verify POST /api/scan accurately scores suspicious brand impersonation patterns."""
    res = client.post("/api/scan", json={"url": "https://security-verify-account-paypal.com/signin/webapps"})
    assert res.status_code == 200
    data = res.get_json()
    scan = data["data"]
    assert scan["risk_score"] >= 65
    assert scan["target_brand"] == "PayPal Inc."
    assert "heuristic_features" in scan


def test_get_scan_details_and_history(client):
    """Verify GET /api/scan/<id> and GET /api/history."""
    # 1. Create a scan
    create_res = client.post("/api/scan", json={"url": "https://example.com"})
    assert create_res.status_code == 200
    scan_id = create_res.get_json()["data"]["id"]

    # 2. Retrieve by ID
    get_res = client.get(f"/api/scan/{scan_id}")
    assert get_res.status_code == 200
    assert get_res.get_json()["data"]["id"] == scan_id

    # 3. Retrieve non-existent ID -> 404
    non_existent = client.get("/api/scan/invalid-nonexistent-id")
    assert non_existent.status_code == 404

    # 4. Check history contains the record
    hist_res = client.get("/api/history")
    assert hist_res.status_code == 200
    history = hist_res.get_json()["data"]
    assert len(history) >= 1
    assert any(h["id"] == scan_id for h in history)


def test_risk_metrics_endpoint(client):
    """Verify GET /api/risk/metrics returns SOC dashboard summary and trends."""
    res = client.get("/api/risk/metrics")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "summary" in data
    assert "trend24h" in data
    assert "attackCategoryDistribution" in data
    assert "targetedBrandsTop" in data

