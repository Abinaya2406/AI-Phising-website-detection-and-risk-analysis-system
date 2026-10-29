"""Unit & Integration Tests for Feature 3: Adaptive Phishing Risk Scoring & Evidence Breakdown.

Covers:
- Boundary values (0, 29, 30, 59, 60, 79, 80, 100)
- Missing evidence handling without treating missing signals as proof of safety
- Conflicting signal resolution across orthogonal dimensions
- Invalid inputs and boundary validation errors
- Strict separation between model probability and adaptive risk score
- Configurable thresholds and empirical validation dataset evaluation
- Historical scan comparison and delta tracking
"""

import pytest
from app.services.adaptive_risk_service import adaptive_risk_service, DEFAULT_THRESHOLDS
from app.services.risk_service import risk_service


def test_category_boundary_values():
    """Verify exact category classification at threshold boundary points."""
    # Low: 0 to 29
    assert adaptive_risk_service.classify_score(0)["key"] == "low"
    assert adaptive_risk_service.classify_score(15)["key"] == "low"
    assert adaptive_risk_service.classify_score(29)["key"] == "low"

    # Medium: 30 to 59
    assert adaptive_risk_service.classify_score(30)["key"] == "medium"
    assert adaptive_risk_service.classify_score(45)["key"] == "medium"
    assert adaptive_risk_service.classify_score(59)["key"] == "medium"

    # High: 60 to 79
    assert adaptive_risk_service.classify_score(60)["key"] == "high"
    assert adaptive_risk_service.classify_score(70)["key"] == "high"
    assert adaptive_risk_service.classify_score(79)["key"] == "high"

    # Critical: 80 to 100
    assert adaptive_risk_service.classify_score(80)["key"] == "critical"
    assert adaptive_risk_service.classify_score(90)["key"] == "critical"
    assert adaptive_risk_service.classify_score(100)["key"] == "critical"

    # Edge clamping for negative or over-100 scores
    assert adaptive_risk_service.classify_score(-10)["key"] == "low"
    assert adaptive_risk_service.classify_score(150)["key"] == "critical"


def test_missing_evidence_does_not_assume_safety():
    """Verify that when visual forensics and DOM inspection are missing, risk is NOT lowered to safe."""
    ml_result_phish = {
        "probability": 0.82,
        "features": {
            "subdomain_count": 3,
            "entropy_score": 4.3,
            "has_credential_token": 1,
            "is_risky_tld": 1,
            "has_ip_in_url": 0,
            "double_slash_redirect": 0,
        }
    }

    # Evaluate with missing screenshot, missing DOM content, and missing redirect info
    res = adaptive_risk_service.compute_adaptive_risk(
        url="https://verify.account-update.banking.xyz/login?token=abc",
        ml_result=ml_result_phish,
        ssl_info=None,
        dns_info=None,
        screenshot_result=None,
        page_content_info=None,
        redirect_info=None,
        target_brand=None
    )

    # Risk score must remain Elevated / Critical, NOT artificially dropped to 0 or Low
    assert res["adaptive_risk_score"] >= 60
    assert res["risk_category"]["key"] in ("high", "critical")

    # Completeness must reflect missing signals
    assert res["completeness_pct"] < 60.0
    # Uncertainty margin must be elevated due to missing data
    assert res["uncertainty_margin"] >= 8

    # Evidence breakdown must explicitly contain UNAVAILABLE flags explaining re-weighting
    unavailable_factors = [f for f in res["evidence_breakdown"] if f["status"] == "UNAVAILABLE"]
    assert len(unavailable_factors) >= 1
    assert any("not treated as proof of safety" in f["explanation"].lower() or "redistributed" in f["explanation"].lower() for f in unavailable_factors)


def test_conflicting_signals_resolution():
    """Verify resolution when signals conflict: e.g. legitimate brand on free SSL or high ML prob with benign cert."""
    # Scenario A: Legitimate brand URL with suspicious parameters
    # The canonical domain protects legitimate domains from false positives
    res_benign = risk_service.evaluate_url("https://www.paypal.com/signin")
    assert res_benign["risk_score"] <= 35
    assert res_benign["adaptive_risk"]["risk_category"]["key"] in ("low", "medium")

    # Scenario B: High-confidence brand spoofing on a non-canonical domain with Let's Encrypt SSL
    res_spoof = risk_service.evaluate_url("https://paypal.com.account-update.xyz/login")
    assert res_spoof["risk_score"] >= 65
    assert res_spoof["adaptive_risk"]["risk_category"]["key"] in ("high", "critical")
    # Check that both URL and domain intelligence factors are present
    breakdown = res_spoof["adaptive_risk"]["evidence_breakdown"]
    dimensions_found = {f["dimension"] for f in breakdown}
    assert "url_lexical" in dimensions_found
    assert "domain_intelligence" in dimensions_found


def test_distinct_model_probability_and_overall_score():
    """Verify clear distinction between statistical model probability and overall adaptive risk score."""
    res = risk_service.evaluate_url("https://github.com/security")
    adaptive = res["adaptive_risk"]

    assert "model_probability" in adaptive
    assert "adaptive_risk_score" in adaptive
    assert "disclaimer" in adaptive

    # Verify model_probability is a float percentage between 0 and 100
    assert 0.0 <= adaptive["model_probability"] <= 100.0
    # Verify adaptive_risk_score is integer between 0 and 100
    assert isinstance(adaptive["adaptive_risk_score"], int)
    assert 0 <= adaptive["adaptive_risk_score"] <= 100

    # Verify disclaimer explicitly cautions against guaranteed compromise
    assert "neither metric guarantees" in adaptive["disclaimer"].lower() or "does not guarantee" in adaptive["disclaimer"].lower()


def test_configurable_thresholds_api(client):
    """Verify GET and POST /api/risk/thresholds endpoints."""
    # 1. Retrieve current thresholds
    res = client.get("/api/risk/thresholds")
    assert res.status_code == 200
    th = res.get_json()["data"]["thresholds"]
    assert "low" in th
    assert "medium" in th
    assert "high" in th
    assert "critical" in th

    # 2. Update with valid thresholds
    new_th = {
        "low": {"min": 0, "max": 25, "label": "Low", "description": "Minimal risk."},
        "medium": {"min": 26, "max": 55, "label": "Medium", "description": "Suspicious signals."},
        "high": {"min": 56, "max": 75, "label": "High", "description": "High risk."},
        "critical": {"min": 76, "max": 100, "label": "Critical", "description": "Severe threat."}
    }
    update_res = client.post("/api/risk/thresholds", json={"thresholds": new_th})
    assert update_res.status_code == 200
    updated = update_res.get_json()["data"]["thresholds"]
    assert updated["low"]["max"] == 25
    assert updated["critical"]["min"] == 76

    # 3. Reject invalid inverted thresholds
    invalid_th = {
        "low": {"min": 0, "max": 50, "label": "Low"},
        "medium": {"min": 30, "max": 40, "label": "Medium"}, # Inverted: 30 < 50
        "high": {"min": 60, "max": 75, "label": "High"},
        "critical": {"min": 76, "max": 100, "label": "Critical"}
    }
    bad_res = client.post("/api/risk/thresholds", json={"thresholds": invalid_th})
    assert bad_res.status_code == 400
    assert bad_res.get_json()["success"] is False

    # Restore default thresholds
    client.post("/api/risk/thresholds", json={"thresholds": DEFAULT_THRESHOLDS})


def test_evaluate_thresholds_on_validation_data(client):
    """Verify POST /api/risk/evaluate-thresholds calculates benchmark metrics."""
    res = client.post("/api/risk/evaluate-thresholds", json={})
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "metrics" in data
    assert "category_distribution" in data
    assert "sample_results" in data

    metrics = data["metrics"]
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1_score" in metrics
    assert metrics["accuracy"] >= 0.70


def test_scan_comparison_endpoint(client):
    """Verify POST /api/scan/compare evaluates delta between two historical scans."""
    # Scan 1: Benign
    res1 = client.post("/api/scan", json={"url": "https://wikipedia.org"})
    assert res1.status_code == 200
    scan1_id = res1.get_json()["data"]["id"]

    # Scan 2: Phishing
    res2 = client.post("/api/scan", json={"url": "https://secure-chase-update-login.xyz/auth"})
    assert res2.status_code == 200
    scan2_id = res2.get_json()["data"]["id"]

    # Compare by IDs
    cmp_res = client.post("/api/scan/compare", json={"scan_id_1": scan1_id, "scan_id_2": scan2_id})
    assert cmp_res.status_code == 200
    data = cmp_res.get_json()["data"]

    assert "score_delta" in data
    assert "trend" in data
    assert "dimension_comparison" in data
    assert "new_risk_factors" in data
    assert data["score_delta"] > 0
    assert "scan_a" in data
    assert "scan_b" in data


def test_invalid_and_empty_inputs(client):
    """Verify robust rejection and handling of malformed inputs."""
    # 1. Empty body on scan
    res = client.post("/api/scan", json={})
    assert res.status_code == 400

    # 2. Compare with missing ID
    cmp_res = client.post("/api/scan/compare", json={"scan_id_1": "nonexistent"})
    assert cmp_res.status_code in (400, 404)

    # 3. Malformed threshold body
    bad_th_res = client.post("/api/risk/thresholds", json={"foo": "bar"})
    assert bad_th_res.status_code == 400
