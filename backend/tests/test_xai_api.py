"""Integration and unit tests for Feature 1: Explainable AI (XAI) & SHAP service."""
import pytest
from app.services.ml_service import ml_service
from app.services.xai_service import xai_service


def test_explain_endpoint_with_phishing_url(client):
    """Verify POST /api/assistant/explain returns SHAP decompositions and observed evidence for phishing URL."""
    phishing_url = "https://security-verify-account-paypal.com/signin/webapps/index.php"
    res = client.post("/api/assistant/explain", json={"url": phishing_url})
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["success"] is True
    data = json_data["data"]

    # Model and Base Values
    assert "shap_features" in data
    assert len(data["shap_features"]) == 16
    assert "prediction_score" in data
    assert data["prediction_score"] > 0.5  # Phishing URL should have elevated risk probability
    assert "base_value" in data

    # Evidence and Attribution Separation
    assert "positive_contributors" in data
    assert "negative_contributors" in data
    assert len(data["positive_contributors"]) > 0

    # Measured Observed Evidence
    assert "observed_evidence" in data
    obs = data["observed_evidence"]
    assert "lexical_patterns" in obs
    assert obs["lexical_patterns"]["url_length"] == len(phishing_url)
    assert "domain_indicators" in obs
    assert obs["domain_indicators"]["hostname"] == "security-verify-account-paypal.com"
    assert "redirect_and_syntax_markers" in obs

    # Methodology Disclaimer
    assert "methodology_disclaimer" in data
    assert "definitive forensic proof" in data["methodology_disclaimer"]


def test_explain_endpoint_with_benign_url(client):
    """Verify POST /api/assistant/explain returns lower risk and negative contributors for a benign URL."""
    benign_url = "https://github.com/torvalds/linux"
    res = client.post("/api/assistant/explain", json={"url": benign_url})
    assert res.status_code == 200
    data = res.get_json()["data"]

    assert data["prediction_score"] < 0.5
    assert len(data["negative_contributors"]) > 0
    # Clean URL should have clean indicators
    obs = data["observed_evidence"]
    assert obs["domain_indicators"]["hostname"] == "github.com"
    assert obs["domain_indicators"]["is_raw_ip"] is False
    assert obs["domain_indicators"]["is_punycode"] is False


def test_shap_mathematical_consistency():
    """Verify ML service explain_url_with_shap produces valid Shapley values and consistent contributions."""
    test_url = "https://login-apple-support-verify.org/auth/reset"
    res = ml_service.explain_url_with_shap(test_url)

    assert "shap_features" in res
    assert "base_value" in res
    assert "probability" in res

    features = res["shap_features"]
    assert len(features) == 16

    # Verify each feature dict structure
    for f in features:
        assert "feature" in f
        assert "human_label" in f
        assert "shap_value" in f
        assert "measured_value" in f
        assert "sign" in f
        assert f["sign"] in ("positive", "negative")
        # Ensure sign matches the numeric shap_value
        if f["shap_value"] >= 0:
            assert f["sign"] == "positive"
        else:
            assert f["sign"] == "negative"


def test_positive_and_negative_separation():
    """Verify XAIService cleanly separates positive and negative contributors."""
    url = "https://secure-banking-portal-verification.com/login"
    explanation = xai_service.generate_explanation(url)

    pos = explanation["positive_contributors"]
    neg = explanation["negative_contributors"]

    assert all(item["shap_value"] >= 0 for item in pos)
    assert all(item["shap_value"] < 0 for item in neg)
    assert len(pos) + len(neg) == len(explanation["shap_features"])


def test_observed_evidence_integrity():
    """Verify measured physical evidence matches actual URL metrics and never invents values."""
    test_url = "http://192.168.1.50:8080/path/test?user=admin&token=secret#section"
    # Unit level feature extraction directly
    features, observed = ml_service.extract_features(test_url)

    assert observed["hostname"] == "192.168.1.50"
    assert observed["raw_ip_detected"] is True
    assert observed["custom_port"] == 8080
    assert "token" in observed["credential_parameters_found"]
    assert features["has_ip_in_url"] == 1.0
    assert features["has_port"] == 1.0
    assert features["has_credential_token"] == 1.0


def test_explain_endpoint_missing_parameters(client):
    """Verify POST /api/assistant/explain returns 400 when url/scan_id are omitted."""
    res = client.post("/api/assistant/explain", json={})
    assert res.status_code == 400
    res_json = res.get_json()
    assert res_json["success"] is False
    assert "url" in res_json["error"]["message"].lower()


def test_explain_endpoint_invalid_url(client):
    """Verify POST /api/assistant/explain rejects invalid or unsafe URL schemes."""
    res = client.post("/api/assistant/explain", json={"url": "javascript:alert(1)"})
    assert res.status_code == 400
    res_json = res.get_json()
    assert res_json["success"] is False


def test_get_xai_by_id_and_persistence(client):
    """Verify scan creation stores XAI explanation in MongoDB and GET /api/xai/explain/<scan_id> retrieves it."""
    # 1. Initiate a scan
    scan_res = client.post("/api/scan", json={"url": "https://secure-update-verify.com/login"})
    assert scan_res.status_code == 200
    scan_data = scan_res.get_json()["data"]
    scan_id = scan_data["id"]

    # 2. Retrieve XAI explanation for this scan_id
    xai_res = client.get(f"/api/xai/explain/{scan_id}")
    assert xai_res.status_code == 200
    xai_data = xai_res.get_json()["data"]

    assert xai_data["scan_id"] == scan_id
    assert "shap_features" in xai_data
    assert "observed_evidence" in xai_data
    assert len(xai_data["positive_contributors"]) > 0 or len(xai_data["negative_contributors"]) > 0
