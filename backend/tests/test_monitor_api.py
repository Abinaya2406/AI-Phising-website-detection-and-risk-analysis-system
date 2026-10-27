"""Integration tests for Website Monitoring and Alerts endpoints."""

def test_list_and_add_monitor(client):
    """Verify POST /api/monitor and GET /api/monitor."""
    # 1. Add new target
    add_res = client.post("/api/monitor", json={
        "name": "Production Payment Gateway",
        "url": "https://gateway.secure-company.com",
        "checkInterval": "Every 1 min"
    })
    assert add_res.status_code == 201
    target = add_res.get_json()["data"]
    target_id = target["id"]
    assert target["name"] == "Production Payment Gateway"

    # 2. List targets
    list_res = client.get("/api/monitor")
    assert list_res.status_code == 200
    targets = list_res.get_json()["data"]
    assert any(t["id"] == target_id for t in targets)

    # 3. Patch target
    patch_res = client.patch(f"/api/monitor/{target_id}", json={"check_interval": "Every 15 mins"})
    assert patch_res.status_code == 200
    assert patch_res.get_json()["data"]["check_interval"] == "Every 15 mins"

    # 4. View changes
    chg_res = client.get(f"/api/monitor/{target_id}/changes")
    assert chg_res.status_code == 200
    assert len(chg_res.get_json()["data"]) >= 1

    # 5. Delete target
    del_res = client.delete(f"/api/monitor/{target_id}")
    assert del_res.status_code == 200


def test_monitor_ssrf_blocked(client):
    """Verify POST /api/monitor denies private IPs."""
    res = client.post("/api/monitor", json={"url": "http://192.168.0.1"})
    assert res.status_code == 403


def test_alerts_endpoint(client):
    """Verify GET /api/alerts returns security alerts."""
    res = client.get("/api/alerts")
    assert res.status_code == 200
    alerts = res.get_json()["data"]
    assert isinstance(alerts, list)
    assert len(alerts) >= 1

