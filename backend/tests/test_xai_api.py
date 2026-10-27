"""Integration tests for Explainable AI (XAI) endpoints."""

def test_explain_endpoint_with_url(client):
    """Verify POST /api/assistant/explain returns SHAP and LIME decompositions."""
    res = client.post("/api/assistant/explain", json={"url": "https://chase-online-secure-auth.net/portal/login"})
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "shap_features" in data
    assert len(data["shap_features"]) > 0
    assert "lime_weights" in data
    assert "decision_tree_path" in data
    assert "prediction_score" in data
    assert "summary_text" in data


def test_explain_endpoint_missing_parameters(client):
    """Verify POST /api/assistant/explain returns 400 when url/scan_id are omitted."""
    res = client.post("/api/assistant/explain", json={})
    assert res.status_code == 400


def test_get_xai_by_id(client):
    """Verify GET /api/xai/explain/<scan_id>."""
    res = client.get("/api/xai/explain/scan-sample-id")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "shap_features" in data
    assert "lime_weights" in data

