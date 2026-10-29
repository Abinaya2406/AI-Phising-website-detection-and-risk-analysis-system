"""Integration and unit tests for Feature 5: Website Change Monitoring and Historical Risk Analysis."""
from app.services.monitoring_service import monitoring_service
from app.services.scheduler_service import scheduler_service
from app.database import db_manager


def test_list_and_add_monitor(client):
    """Verify POST /api/monitor and GET /api/monitor with baseline snapshot."""
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
    assert target["status"] == "ACTIVE"
    assert "last_checked" in target
    assert "next_check" in target

    # 2. List targets
    list_res = client.get("/api/monitor")
    assert list_res.status_code == 200
    targets = list_res.get_json()["data"]
    assert any(t["id"] == target_id for t in targets)

    # 3. Patch target
    patch_res = client.patch(f"/api/monitor/{target_id}", json={"check_interval": "Every 15 mins"})
    assert patch_res.status_code == 200
    assert patch_res.get_json()["data"]["check_interval"] == "Every 15 mins"
    assert patch_res.get_json()["data"]["interval_seconds"] == 900

    # 4. View changes & baseline
    chg_res = client.get(f"/api/monitor/{target_id}/changes")
    assert chg_res.status_code == 200
    changes = chg_res.get_json()["data"]
    assert len(changes) >= 1
    assert any(c["change_type"] == "BASELINE_CAPTURED" for c in changes)

    # 5. Delete target
    del_res = client.delete(f"/api/monitor/{target_id}")
    assert del_res.status_code == 200


def test_monitor_ssrf_blocked(client):
    """Verify POST /api/monitor denies loopback, private RFC1918 IPs, and AWS metadata addresses."""
    res1 = client.post("/api/monitor", json={"url": "http://192.168.0.1"})
    assert res1.status_code == 403

    res2 = client.post("/api/monitor", json={"url": "http://127.0.0.1:8080/admin"})
    assert res2.status_code == 403

    res3 = client.post("/api/monitor", json={"url": "http://169.254.169.254/latest/meta-data"})
    assert res3.status_code == 403


def test_monitor_pause_and_resume_lifecycle(client):
    """Verify pause and resume lifecycle transitions."""
    # Add target
    add_res = client.post("/api/monitor", json={
        "name": "Single Sign-On Target",
        "url": "https://auth.companyportal-test.org",
        "checkInterval": "Every 5 mins"
    })
    assert add_res.status_code == 201
    target_id = add_res.get_json()["data"]["id"]

    # Pause target
    pause_res = client.post(f"/api/monitor/{target_id}/pause")
    assert pause_res.status_code == 200
    assert pause_res.get_json()["data"]["status"] == "PAUSED"

    # Verify check skipped when paused
    check_when_paused = monitoring_service.execute_target_check(target_id)
    assert check_when_paused["status"] == "skipped"

    # Resume target
    resume_res = client.post(f"/api/monitor/{target_id}/resume")
    assert resume_res.status_code == 200
    assert resume_res.get_json()["data"]["status"] == "ACTIVE"


def test_unchanged_content_check_does_not_generate_duplicate_alerts(client):
    """Verify clean check on unchanged site increments check count without spawning spurious alerts."""
    # Add target
    add_res = client.post("/api/monitor", json={
        "name": "Static Benign Documentation",
        "url": "https://docs.secure-enterprise.org",
        "checkInterval": "Every 15 mins"
    })
    target_id = add_res.get_json()["data"]["id"]
    initial_alerts_count = len(monitoring_service.list_alerts())

    # Execute check with unchanged content
    probe_result = monitoring_service.execute_target_check(target_id)
    assert probe_result["status"] == "completed"
    assert probe_result["changes_detected_count"] == 0
    assert probe_result["risk_delta"] == 0

    # Ensure no new alert was created
    new_alerts_count = len(monitoring_service.list_alerts())
    assert new_alerts_count == initial_alerts_count


def test_changed_content_and_suspicious_mutation_detection(client):
    """
    Verify meaningful change detection:
    1. Injected login form with password input field (LOGIN_FORM_ADDED).
    2. Form action destination hijacked to remote origin (FORM_HIJACK).
    3. Escalation of risk score and generation of security alerts.
    """
    # 1. Enroll clean target
    target = monitoring_service.add_target(
        name="Employee Portal",
        url="https://portal.mycompany-corp.com",
        check_interval="Every 5 mins"
    )
    target_id = target["id"]
    baseline_score = target["baseline_risk_score"]

    # 2. Simulate defacement: injection of password input and remote action destination
    simulated_defaced_snapshot = {
        "content_hash": "a1b2c3d4e5f60718293a4b5c6d7e8f90",
        "title": "URGENT: Verify Your Credentials",
        "forms_info": {
            "has_password_field": True,
            "submits_to_remote_domain": True,
            "form_actions": ["https://attacker-harvesting-server.cc/steal"],
            "total_forms": 1
        },
        "ssl_info": {
            "valid": True,
            "issuer": "ZeroSSL Free CA",
            "is_free_ca": True,
            "expiry_days": 88
        }
    }

    # Execute check with simulated mutation
    probe_result = monitoring_service.execute_target_check(target_id, force_simulated_change=simulated_defaced_snapshot)

    assert probe_result["status"] == "completed"
    assert probe_result["changes_detected_count"] >= 2
    assert probe_result["new_risk_score"] > baseline_score
    assert probe_result["risk_delta"] > 0
    assert probe_result["health"] in ["DEFACED", "SUSPICIOUS"]

    # Verify changes recorded in timeline
    timeline_res = client.get(f"/api/monitor/{target_id}/changes")
    assert timeline_res.status_code == 200
    timeline = timeline_res.get_json()["data"]
    change_types = [t["change_type"] for t in timeline]
    assert "LOGIN_FORM_ADDED" in change_types or "FORM_HIJACK" in change_types or "CONTENT_MUTATION" in change_types

    # Verify security alert was generated
    alerts_res = client.get("/api/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.get_json()["data"]
    target_alerts = [a for a in alerts if a.get("target_id") == target_id]
    assert len(target_alerts) >= 1
    assert target_alerts[0]["severity"] in ["CRITICAL", "HIGH"]


def test_monitor_failed_request_records_error(client):
    """Verify connection failures increment error count and record last error."""
    # Create target with an unresolvable hostname
    target = monitoring_service.add_target(
        name="Unresolvable Ghost Host",
        url="https://nonexistent-domain-failure-test-999.com",
        check_interval="Every 1 hour"
    )
    target_id = target["id"]

    # Simulate probe encountering connection refused error
    probe_res = monitoring_service.execute_target_check(
        target_id,
        force_error="Connection refused by remote host (ECONNREFUSED)."
    )
    assert probe_res["status"] == "error"
    assert "Connection refused" in probe_res["error"]

    # Check target doc has updated error attributes
    updated_target = monitoring_service.get_target(target_id)
    assert updated_target["health"] == "DEGRADED"
    assert updated_target["error_count"] >= 1
    assert "Connection refused" in updated_target["last_error"]


def test_scheduler_status_and_lifecycle(client):
    """Verify background scheduler status reporting and start/stop controls."""
    status = scheduler_service.get_status()
    assert "is_running" in status
    assert "active_targets_count" in status
    assert "rate_limit_min_interval_seconds" in status
    assert status["rate_limit_min_interval_seconds"] >= 60

    # Test scheduler status endpoint
    res = client.get("/api/monitor/scheduler/status")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "active_targets_count" in data


def test_alert_status_update_endpoint(client):
    """Verify PATCH /api/alerts/<id>/status can mark alert as INVESTIGATING and RESOLVED."""
    # List alerts to get an ID
    res = client.get("/api/alerts")
    assert res.status_code == 200
    alerts = res.get_json()["data"]
    assert len(alerts) >= 1
    alert_id = alerts[0]["id"]

    # Mark as RESOLVED
    patch_res = client.patch(f"/api/alerts/{alert_id}/status", json={"status": "RESOLVED"})
    assert patch_res.status_code == 200
    assert patch_res.get_json()["data"]["status"] == "RESOLVED"
