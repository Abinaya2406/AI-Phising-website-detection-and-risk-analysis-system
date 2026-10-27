# PhishGuard AI: AI-Powered Phishing Website Detection and Risk Analysis System

> **An Enterprise-Grade, Full-Stack Cybersecurity Intelligence Platform.**
> - **Frontend:** React 18, Vite, Tailwind CSS, React Router, Recharts, Lucide Icons.
> - **Backend:** Modular Python Flask REST API, Scikit-Learn ML, MongoDB persistence, SSRF defense, and Explainable AI (XAI).

---

## 🛡️ Project Overview

**PhishGuard AI** is a multi-layered cybersecurity defense system engineered to detect zero-day phishing websites, brand impersonation clones, and credential theft vectors. It provides transparent **Explainable AI (SHAP & LIME)**, **Deep Siamese Screenshot Vision**, **Continuous Domain Integrity Monitoring**, and a **Bilingual AI Security Assistant (Tamil & English)**.

---

## 📁 Repository Structure

```
AI-Phising-website-detection-and-risk-analysis-system/
├── backend/                                # Python Flask REST API Service
│   ├── app/
│   │   ├── __init__.py                     # Application Factory create_app()
│   │   ├── config.py                       # Environment configuration classes
│   │   ├── database.py                     # MongoDB manager & in-memory fallback
│   │   ├── models/                         # Document models & schemas
│   │   │   ├── alert.py                    # AlertModel
│   │   │   ├── monitor.py                  # MonitoringConfigModel, WebsiteChangeHistoryModel
│   │   │   ├── scan.py                     # ScanHistoryModel, RiskAssessmentModel
│   │   │   └── screenshot.py               # ScreenshotModel
│   │   ├── routes/                         # Modular Flask Blueprints
│   │   │   ├── alert_routes.py             # GET /api/alerts
│   │   │   ├── assistant_routes.py         # POST /api/assistant/chat (Bilingual)
│   │   │   ├── health_routes.py            # GET /api/health
│   │   │   ├── monitor_routes.py           # /api/monitor (CRUD & change history)
│   │   │   ├── scan_routes.py              # POST /api/scan, GET /api/scan/<id>, history
│   │   │   ├── vision_routes.py            # POST /api/screenshot/analyze
│   │   │   └── xai_routes.py               # POST /api/assistant/explain, /api/xai/explain/<id>
│   │   ├── services/                       # Core Analytical Engines
│   │   │   ├── assistant_service.py        # Bilingual (Tamil & English) AI chatbot
│   │   │   ├── ml_service.py               # Scikit-learn feature extraction & model
│   │   │   ├── monitoring_service.py       # Continuous watchdog & DOM diffing
│   │   │   ├── risk_service.py             # Heuristic + SSL + DNS risk score aggregator
│   │   │   ├── screenshot_service.py       # Perceptual similarity & OCR analysis
│   │   │   └── xai_service.py              # SHAP values & LIME token weights
│   │   └── utils/
│   │       ├── exceptions.py               # Custom domain exceptions
│   │       ├── file_security.py            # Upload verification & magic bytes
│   │       ├── logger.py                   # Structured audit logging
│   │       ├── responses.py                # Uniform JSON API envelopes
│   │       └── security.py                 # SSRF prevention & redirect hop validation
│   ├── tests/                              # Automated Pytest Suite (25 Tests)
│   ├── uploads/                            # Quarantined screenshot uploads
│   ├── .env.example
│   ├── .env
│   ├── requirements.txt
│   └── run.py                              # Server entrypoint
│
├── frontend/                               # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/                     # Reusable Cyber UI components & charts
│   │   ├── context/                        # Global state & LanguageContext (EN/TA)
│   │   ├── pages/                          # The 10 Core Application Pages
│   │   ├── services/                       # API clients with fallback simulation
│   │   ├── utils/                          # Validators & formatters
│   │   ├── App.jsx                         # Main router
│   │   └── main.jsx
│   ├── .env
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## ⚡ Quickstart Guide

### 1. Running the Python Backend

```powershell
# Navigate into backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt

# Start the Flask API server
python run.py
```
> The API server starts on **`http://localhost:8000/api`**.

#### Run Backend Test Suite (25 Tests)
```powershell
pytest -v
```

---

### 2. Running the React Frontend

```powershell
# Navigate into frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
> The web application opens on **`http://localhost:5173`**.

---

## 📡 Complete Backend API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service liveness probe and database connectivity state |
| `POST` | `/api/scan` & `/api/scan/url` | Evaluates URL, extracts heuristics, and returns risk assessment |
| `GET` | `/api/scan/<id>` | Retrieves specific scan intelligence document |
| `GET` | `/api/history` | Fetches historical scan registry |
| `GET` | `/api/risk/metrics` | Returns 24h SOC metrics, attack vector share, and brand leaderboard |
| `POST` | `/api/assistant/explain` | Computes SHAP feature contributions, LIME weights, and decision path |
| `GET` | `/api/xai/explain/<id>` | Retrieves explainability record for an existing scan ID |
| `POST` | `/api/screenshot/analyze` | Analyzes uploaded image (PNG/JPG/WebP) or remote URL |
| `GET` | `/api/monitor` | Lists monitored web assets and uptime |
| `POST` | `/api/monitor` | Enrolls a new target domain into 24/7 watchdog |
| `PATCH` | `/api/monitor/<id>` | Updates check frequency, status, or asset name |
| `DELETE` | `/api/monitor/<id>` | Removes target from continuous monitoring |
| `GET` | `/api/monitor/<id>/changes` | Retrieves DOM alteration logs and hash diffs |
| `GET` | `/api/alerts` | Lists defacement, impersonation, and SSL expiration alerts |
| `POST` | `/api/assistant/chat` | Bilingual conversational AI advisor (**English** & **Tamil**) |

---

## 🔒 Cybersecurity Defense Controls

1. **SSRF Prevention:** Disallows loopback (`127.0.0.1`), link-local (`169.254.169.254`), private RFC1918 blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and non-HTTP schemes. Validates DNS pre-resolution and inspects all redirect hops.
2. **File Upload Security:** Magic bytes inspection, whitelisted extensions (`png`, `jpg`, `jpeg`, `webp`), 10MB ceiling, and cryptographic UUID4 sanitization.
3. **Restricted CORS:** Whitelists allowed frontend origins via `CORS_ORIGINS`.
4. **Credential Safety:** Never posts credentials or executes unverified forms against external domains.
