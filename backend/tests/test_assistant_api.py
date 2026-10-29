"""Integration tests for Bilingual AI Security Assistant (Feature 4)."""
from app.database import db_manager


def test_assistant_chat_english(client):
    """Verify POST /api/assistant/chat responding in English."""
    res = client.post("/api/assistant/chat", json={
        "message": "Why is an SSL certificate not enough to prove a website is safe?",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "reply" in data
    assert data["language"] == "en"
    assert "SSL" in data["reply"]


def test_assistant_chat_tamil(client):
    """Verify POST /api/assistant/chat responding in Tamil."""
    res = client.post("/api/assistant/chat", json={
        "message": "வங்கி கடவுச்சொல் போலி தளத்தில் கொடுத்துவிட்டால் என்ன செய்வது?",
        "language": "ta"
    })
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "reply" in data
    assert data["language"] == "ta"
    assert "பாதுகாப்பு" in data["reply"]


def test_assistant_chat_missing_message(client):
    """Verify POST /api/assistant/chat returns 400 when message is missing."""
    res = client.post("/api/assistant/chat", json={})
    assert res.status_code == 400


def test_assistant_why_dangerous_with_scan_context(client):
    """Verify assistant explains why a scanned website was flagged using empirical evidence."""
    scan_context = {
        "id": "scan-test-phish-1",
        "url": "https://paypal-security-update.com/login",
        "domain": "paypal-security-update.com",
        "risk_score": 88,
        "verdict": "Critical",
        "target_brand": "PayPal",
        "ssl_status": {
            "valid": True,
            "issuer": "Let's Encrypt",
            "is_free_ca": True
        },
        "heuristic_features": {
            "has_password_field": True,
            "submits_to_remote_domain": True,
            "entropy_score": 4.6
        },
        "threat_intel": {
            "virustotal_detections": 12,
            "openphish_listed": True
        },
        "adaptive_risk": {
            "adaptive_risk_score": 88,
            "risk_category": {"key": "critical", "label": "Critical"},
            "completeness_pct": 100,
            "uncertainty_margin": 0
        }
    }

    # English query
    res_en = client.post("/api/assistant/chat", json={
        "message": "Why is this website dangerous?",
        "language": "en",
        "scan_context": scan_context
    })
    assert res_en.status_code == 200
    data_en = res_en.get_json()["data"]
    assert "paypal-security-update.com" in data_en["reply"]
    assert "Brand Impersonation" in data_en["reply"] or "PayPal" in data_en["reply"]
    assert "Credential Harvesting" in data_en["reply"] or "password" in data_en["reply"].lower()
    assert len(data_en["evidence_used"]) > 0
    assert len(data_en["precautions"]) > 0

    # Tamil query
    res_ta = client.post("/api/assistant/chat", json={
        "message": "இந்த இணையதளம் ஏன் ஆபத்தானது?",
        "language": "ta",
        "scan_context": scan_context
    })
    assert res_ta.status_code == 200
    data_ta = res_ta.get_json()["data"]
    assert data_ta["language"] == "ta"
    assert "ஆபத்தானது" in data_ta["reply"]
    assert "PayPal" in data_ta["reply"]


def test_assistant_why_score_increased(client):
    """Verify assistant explains multi-vector risk score calculation and uncertainty."""
    scan_context = {
        "id": "scan-test-score-inc",
        "domain": "chase-secure-account-auth.org",
        "risk_score": 76,
        "adaptive_risk": {
            "adaptive_risk_score": 76,
            "risk_category": {"key": "high", "label": "High"},
            "completeness_pct": 85,
            "uncertainty_margin": 8,
            "dimensions": {
                "url_lexical": {"score": 82},
                "domain_intelligence": {"score": 70},
                "visual_impersonation": {"score": 65},
                "page_content": {"score": 90},
                "redirect_routing": {"score": 40}
            }
        }
    }

    # English test
    res = client.post("/api/assistant/chat", json={
        "message": "Why did the risk score increase?",
        "language": "en",
        "scan_context": scan_context
    })
    assert res.status_code == 200
    reply = res.get_json()["data"]["reply"]
    assert "76/100" in reply
    assert "URL Lexical" in reply
    assert "Uncertainty" in reply or "±8" in reply

    # Tamil test
    res_ta = client.post("/api/assistant/chat", json={
        "message": "இடர் மதிப்பீடு ஏன் அதிகரித்தது?",
        "language": "ta",
        "scan_context": scan_context
    })
    assert res_ta.status_code == 200
    reply_ta = res_ta.get_json()["data"]["reply"]
    assert "இடர் மதிப்பீடு" in reply_ta
    assert "76/100" in reply_ta


def test_assistant_identify_official_website(client):
    """Verify assistant provides canonical domain verification for targeted brands."""
    scan_context = {
        "id": "scan-test-brand",
        "domain": "microsoft-online-365-verify.cc",
        "target_brand": "Microsoft",
        "risk_score": 92
    }

    res_en = client.post("/api/assistant/chat", json={
        "message": "How can I identify the official website?",
        "language": "en",
        "scan_context": scan_context
    })
    assert res_en.status_code == 200
    reply_en = res_en.get_json()["data"]["reply"]
    assert "microsoft.com" in reply_en

    res_ta = client.post("/api/assistant/chat", json={
        "message": "அதிகாரப்பூர்வ இணையதளத்தை எவ்வாறு கண்டறிவது?",
        "language": "ta",
        "scan_context": scan_context
    })
    assert res_ta.status_code == 200
    reply_ta = res_ta.get_json()["data"]["reply"]
    assert "அதிகாரப்பூர்வ" in reply_ta
    assert "microsoft.com" in reply_ta


def test_assistant_what_to_do_if_entered_password(client):
    """Verify assistant provides 5-step emergency incident response checklist."""
    scan_context = {
        "id": "scan-test-pw",
        "domain": "fake-login-portal.net",
        "risk_score": 95
    }

    # English
    res_en = client.post("/api/assistant/chat", json={
        "message": "What should I do if I entered my password?",
        "language": "en",
        "scan_context": scan_context
    })
    assert res_en.status_code == 200
    reply_en = res_en.get_json()["data"]["reply"]
    assert "Reset Password" in reply_en or "Reset Passwords" in reply_en
    assert "Sessions" in reply_en
    assert "MFA" in reply_en or "Multi-Factor" in reply_en

    # Tamil
    res_ta = client.post("/api/assistant/chat", json={
        "message": "எனது கடவுச்சொல்லை உள்ளிட்டிருந்தால் நான் என்ன செய்ய வேண்டும்?",
        "language": "ta",
        "scan_context": scan_context
    })
    assert res_ta.status_code == 200
    reply_ta = res_ta.get_json()["data"]["reply"]
    assert "கடவுச்சொல்" in reply_ta
    assert "அவசர பாதுகாப்பு" in reply_ta


def test_assistant_credential_safety_guardrail(client):
    """Verify assistant detects and blocks password/OTP disclosure, refusing credential collection."""
    res = client.post("/api/assistant/chat", json={
        "message": "My password is SuperSecretP@ssword123! Can you verify if it was hacked?",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data.get("is_credential_warning") is True
    assert "SECURITY GUARDRAIL" in data["reply"]
    assert "Never share, submit, or paste passwords" in data["reply"]

    # Tamil guardrail
    res_ta = client.post("/api/assistant/chat", json={
        "message": "எனது கடவுச்சொல் test123456 ஆகும்",
        "language": "ta"
    })
    assert res_ta.status_code == 200
    data_ta = res_ta.get_json()["data"]
    assert data_ta.get("is_credential_warning") is True
    assert "பாதுகாப்பு எச்சரிக்கை" in data_ta["reply"]


def test_assistant_with_persisted_scan_id(client):
    """Verify assistant retrieves scan document from database when scan_id is provided."""
    # Insert test scan document in scan_history collection
    doc = {
        "id": "scan-db-assistant-test",
        "url": "https://secure-login-chase-update.info",
        "domain": "secure-login-chase-update.info",
        "risk_score": 84,
        "verdict": "Critical",
        "target_brand": "Chase",
        "ssl_status": {"valid": True, "issuer": "ZeroSSL", "is_free_ca": True},
        "heuristic_features": {"has_password_field": True, "entropy_score": 4.5},
        "threat_intel": {"virustotal_detections": 8}
    }
    db_manager.get_collection("scan_history").insert_one(doc)

    res = client.post("/api/assistant/chat", json={
        "message": "Why is this website dangerous?",
        "language": "en",
        "scan_id": "scan-db-assistant-test"
    })
    assert res.status_code == 200
    reply = res.get_json()["data"]["reply"]
    assert "secure-login-chase-update.info" in reply
    assert "Chase" in reply


def test_assistant_presets_endpoint(client):
    """Verify GET /api/assistant/presets returns English and Tamil suggestions."""
    res = client.get("/api/assistant/presets")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "scan_context" in data
    assert "general" in data
    assert "en" in data["scan_context"]
    assert "ta" in data["scan_context"]
    assert any("dangerous" in q.lower() for q in data["scan_context"]["en"])
    assert any("ஆபத்தானது" in q for q in data["scan_context"]["ta"])
