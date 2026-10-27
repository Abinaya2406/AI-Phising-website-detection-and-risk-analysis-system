"""Integration tests for Bilingual AI Security Assistant."""

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

