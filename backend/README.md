# PhishGuard AI: Backend Service

> **Enterprise-grade, modular Flask REST API with Scikit-Learn Machine Learning, MongoDB persistence, deep SSRF defense, and Explainable AI (XAI) threat modeling.**

---

## 🏛️ System Architecture

The PhishGuard AI backend provides the analytical backbone for phishing website detection, screenshot perceptual hashing, brand asset monitoring, and bilingual cybersecurity assistance.

```
backend/
├── app/
│   ├── __init__.py           # Application Factory create_app()
│   ├── config.py             # Environment configurations
│   ├── database.py           # MongoDB connection & fallback in-memory repository
│   ├── models/               # Data schemas
│   │   ├── alert.py
│   │   ├── monitor.py
│   │   ├── scan.py
│   │   └── screenshot.py
│   ├── routes/               # Modular Flask Blueprints
│   │   ├── alert_routes.py
│   │   ├── assistant_routes.py
│   │   ├── health_routes.py
│   │   ├── monitor_routes.py
│   │   ├── scan_routes.py
│   │   ├── vision_routes.py
│   │   └── xai_routes.py
│   ├── services/             # Core Cybersecurity Engines
│   │   ├── assistant_service.py # Bilingual (Tamil / English) chatbot
│   │   ├── ml_service.py     # Scikit-learn lexical feature extraction
│   │   ├── monitoring_service.py # DOM diffing & SSL watchdog
│   │   ├── risk_service.py   # Multi-heuristic risk score aggregator
│   │   ├── screenshot_service.py # Visual layout matching & OCR tokens
│   │   └── xai_service.py    # SHAP & LIME interpretability engine
│   └── utils/
│       ├── exceptions.py     # Custom security & domain exceptions
│       ├── file_security.py  # File signature & upload protection
│       ├── logger.py         # Structured logging
│       ├── responses.py      # Standardized JSON envelopes
│       └── security.py       # SSRF prevention & redirect hops validation
├── tests/                    # Comprehensive Pytest Suite
│   ├── conftest.py
│   ├── test_assistant_api.py
│   ├── test_monitor_api.py
│   ├── test_scan_api.py
│   ├── test_security.py
│   ├── test_vision_api.py
│   └── test_xai_api.py
├── uploads/                  # Quarantined upload directory
├── .env.example
├── .env
├── requirements.txt
└── run.py                    # Server Entrypoint
```

---

## 🚀 Setup & Execution

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.13.5)
- MongoDB instance (optional; if MongoDB is not running, the application gracefully activates an in-memory repository fallback for development/testing).

### 2. Virtual Environment Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Configure Environment
```powershell
cp .env.example .env
```
Key configuration values in `.env`:
```env
FLASK_ENV=development
PORT=8000
MONGO_URI=mongodb://localhost:27017/phishguard_db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
MAX_CONTENT_LENGTH=10485760
```

### 5. Start the Backend Server
```powershell
python run.py
```
The server will bind to `http://0.0.0.0:8000` (API root: `http://localhost:8000/api`).

### 6. Run Automated Test Suite
```powershell
pytest -v
```

---

## 🛡️ Cybersecurity & Defensive Hardening

### 1. Comprehensive SSRF Defense (`app/utils/security.py`)
- Outbound requests strictly forbid private RFC 1918 networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`), carrier-grade NAT (`100.64.0.0/10`), and multicast blocks.
- DNS pre-resolution verifies every resolved IPv4 and IPv6 address before initiating connection.
- URLs with embedded credentials (`http://user:pass@evil.com`) and non-HTTP schemes (`file://`, `ftp://`, `gopher://`) are immediately rejected.
- Outbound requests intercept every redirect hop to prevent redirect-based SSRF into private infrastructure.

### 2. Malicious Upload Defense (`app/utils/file_security.py`)
- Strict whitelist of image extensions: `.png`, `.jpg`, `.jpeg`, `.webp`.
- **Magic bytes verification**: Inspects raw file headers to prevent executable scripts or HTML masquerading as image files.
- Enforces strict 10MB file size ceiling.
- Sanitizes filenames using cryptographic UUID4 prefixes.

### 3. Restricted CORS Origin Enforcement
- Restricts cross-origin resource sharing to explicitly whitelisted frontend domains.

---

## 📑 API Endpoints Specification

### 1. Health Check
- `GET /api/health` — Liveness probe, database connection status, and service version.

### 2. Threat Scanning & History
- `POST /api/scan` (Alias: `POST /api/scan/url`) — Evaluates URL for phishing, returns risk score (0-100), verdict, SSL analysis, and DNS data.
- `GET /api/scan/<id>` — Retrieves full report for an individual scan.
- `GET /api/history` — Lists historical scan records.
- `GET /api/risk/metrics` — Dashboard aggregate metrics, 24-hour trends, and brand distribution.

### 3. Explainable AI (XAI)
- `POST /api/assistant/explain` — Generates SHAP feature impact values, LIME token weights, and decision tree logic for a target URL.
- `GET /api/xai/explain/<id>` — Retrieves XAI data for an existing scan ID.

### 4. Computer Vision & Screenshot Analysis
- `POST /api/screenshot/analyze` — Evaluates uploaded screenshot file or remote URL, extracts OCR tokens, and computes perceptual layout similarity against protected brands.

### 5. Website Continuous Monitoring & Change History
- `GET /api/monitor` (Alias: `GET /api/monitoring/targets`) — Lists monitored web assets.
- `POST /api/monitor` (Alias: `POST /api/monitoring/targets`) — Enrolls target domain into 24/7 monitoring.
- `PATCH /api/monitor/<id>` — Updates monitoring frequency or status.
- `DELETE /api/monitor/<id>` — Removes target from monitoring.
- `GET /api/monitor/<id>/changes` — Retrieves DOM mutation history and hash diffs.
- `GET /api/alerts` — Retrieves defacement and impersonation alerts.

### 6. Bilingual AI Security Assistant
- `POST /api/assistant/chat` — Contextual AI assistance in **English (`en`)** and **Tamil (`ta`)**.

