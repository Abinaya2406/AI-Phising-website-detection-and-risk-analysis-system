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
│   ├── tests/                              # Automated Pytest Suite (43 Tests)
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

#### Run Backend Test Suite (43 Tests)
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

# Run Production Build
npm run build
```
> The web application opens on **`http://localhost:5173`**.

---

## 🧠 Feature 1: Explainable AI (XAI) — Why Is This Website Dangerous?

PhishGuard AI incorporates native model interpretability so security analysts and users understand *why* a website was classified as dangerous:
- **Baseline Machine Learning:** Trained Scikit-Learn `RandomForestClassifier` on 16 lexical, domain, syntax, and credential URL features.
- **SHAP Integration:** Native `shap.TreeExplainer` calculates exact Shapley values ($\phi_i$) for every feature, decomposing the delta from the base value $E[f(X)]$ to the predicted probability.
- **Directional Separation:** Quantifies and visualizes both **Risk-Increasing Factors (+Risk)** and **Risk-Mitigating Factors (-Risk)**.
- **Physical Evidence Separation:** Strictly separates model-based attributions from measured, empirical URL evidence (e.g. actual character length, subdomain depth, detected port, credential tokens).
- **LIME & Decision Paths:** Provides token-level attention weights for sensitive keywords and transparent decision tree node traversal.
- **Persistence:** Stored in MongoDB collection `risk_assessments` and pre-computed during `POST /api/scan`.
- **UI Dashboard:** Interactive Recharts horizontal bar chart, dual positive/negative evidence cards, and clear methodology disclaimers.

---

## 👁️ Feature 2: Screenshot Phishing Detection & Brand Impersonation Analysis

Feature 2 provides visual and structural forensic inspection of web page screenshots:
- **Multi-Format Image Ingestion:** Secure upload for PNG, JPG, JPEG, and WebP (up to 10MB) with strict magic-bytes signature verification and Pillow decompression checks.
- **Perceptual Hashing:** Generates 64-bit Difference Hashes (dHash), Average Hashes (aHash), and 2D DCT Perceptual Hashes (pHash) to compute Hamming distances invariant to minor compression artifacts.
- **Dominant Color Palette Clustering:** K-Means clustering extracts primary and accent color centroids in RGB space, computing weighted proximity to corporate brand palettes.
- **Verified Benchmark Reference Database:** Built-in verified reference profiles for high-profile spoofed brands (PayPal, Microsoft 365, Google LLC, JPMorgan Chase, Apple Inc., Amazon.com).
- **Canonical Domain Impersonation Gate:** Compares destination URL against the brand's verified canonical domain whitelist. Distinguishes authentic login portals from dangerous domain impersonators.
- **Textual & Urgency Detection:** Identifies credential harvesting prompts and psychological coercion triggers ("account suspended", "verify immediately", "unauthorized activity").
- **Isolated Headless Live Capture:** Server-side viewport snapshot synthesis for verified safe URLs, enforced with strict SSRF defense, 5s timeout, and 3-hop redirect inspection.
- **Transparent Limitations:** Clearly documents vision boundaries, noting that dynamic JavaScript canvas obfuscation and iframe overlays require runtime sandbox execution.

---

## ⚖️ Feature 3: Adaptive Phishing Risk Scoring & Evidence Breakdown

PhishGuard AI features an adaptive multi-vector risk scoring engine and evidence breakdown architecture:
- **Calibrated Multi-Evidence Fusion (0-100 Score):** Synthesizes five orthogonal cybersecurity dimensions:
  1. `url_lexical` (30% weight): Structural entropy, punycode homoglyphs, subdomain depth, raw IP hostnames, credential parameters.
  2. `domain_intelligence` (25% weight): SSL certificate validity, ephemeral Free CA vs enterprise EV/OV, certificate age, DNS resolution status, risky TLDs.
  3. `visual_impersonation` (20% weight): Perceptual visual layout match, color palette proximity, and canonical domain spoofing verification.
  4. `page_content` (15% weight): Sensitive password inputs, cross-origin form action destinations, and external favicon leeching.
  5. `redirect_routing` (10% weight): Redirection hop counts, open redirect `//` path tokens, and intermediate hop safety.
- **Strict 4-Tier Risk Categorization:**
  - **Low (0 - 29):** Minimal risk indicators observed; verified benign platforms.
  - **Medium (30 - 59):** Elevated or suspicious anomalies requiring caution.
  - **High (60 - 79):** Strong phishing signatures or deceptive structural patterns detected.
  - **Critical (80 - 100):** Severe credential harvesting, brand impersonation, or confirmed malicious payload.
- **Handling Missing / Unavailable Information:**
  - In accordance with zero-trust principles, **unobserved features are NEVER treated as proof of safety**.
  - Weights of observed dimensions are dynamically re-normalized.
  - Computes `evidence_completeness_pct` and attaches an explicit epistemic **Uncertainty Margin (e.g. ±8 pts)**.
  - Enforces a baseline safety floor so unobserved sites cannot masquerade as 0% safe without empirical inspection.
- **Explicit Probability vs Risk Score Separation:**
  - Clearly distinguishes statistical **Model Probability (0-100%)** from the **Overall Composite Risk Score (0-100)**.
  - Enforces transparent methodology disclaimers: neither metric represents a guaranteed probability of compromise or absolute safety.
- **Scan Comparison & Delta Tracking:**
  - Dedicated `/api/scan/compare` endpoint compares any two historical scans side-by-side.
  - Quantifies risk score delta ($\Delta Score$), trend direction, newly surfaced risk factors, resolved risk factors, and cryptographic SSL changes.
- **Configurable Thresholds & Validation Benchmark:**
  - Endpoints `/api/risk/thresholds` and `/api/risk/evaluate-thresholds` allow security teams to tune category boundaries and evaluate precision, recall, F1-score, and false-positive rates on a ground-truth labeled benchmark dataset.
- **Frontend Integration:**
  - `ScanResultsPage`: Risk gauge with 4 categories, Model Prob vs Adaptive Score comparison box, and full `EvidenceBreakdownCard`.
  - `AdaptiveRiskDashboard`: 4-tier KPI metrics, Evidence Dimension Telemetry, and live Threshold Calibration & Benchmark Evaluator.
  - `ScanHistoryPage`: 4-tier category badges and multi-select side-by-side scan comparison.

---

## 🤖 Feature 4: Tamil and English AI Security Assistant

PhishGuard AI features an enterprise-grade **Bilingual AI Cybersecurity Intelligence Assistant** engineered to provide transparent, context-aware threat advisory in both **English** and **Tamil (தமிழ்)**:

- **Scan-Grounded Contextual Reasoning:**
  - Users can select any completed scan record or ask questions about a current target URL.
  - The assistant extracts and synthesizes the website's exact physical scan evidence (cryptographic SSL certificates, domain intelligence, brand impersonation vectors, DOM password form behavior, and third-party threat feeds).
- **Core Forensic Inquiries Supported:**
  1. **"Why is this website dangerous?" / "இந்த இணையதளம் ஏன் ஆபத்தானது?"**:
     - Decomposes verified physical threat signals (e.g., active password harvesting forms posting cross-origin, Free DV certificate abuse, high character entropy, or confirmed blocklist hits).
  2. **"Why did the risk score increase?" / "இடர் மதிப்பீடு ஏன் அதிகரித்தது?"**:
     - Explains the multi-vector adaptive score escalation across the 5 orthogonal dimensions, breaking down each vector's weight contribution.
  3. **"How can I identify the official website?" / "அதிகாரப்பூர்வ இணையதளத்தை எவ்வாறு கண்டறிவது?"**:
     - Verifies canonical root domains against genuine corporate reference registries (PayPal, Microsoft 365, Google, Chase, SBI, HDFC).
     - Educates users on spotting deceptive lookalike subdomains, inspecting OV/EV certificates, and avoiding sponsored search ads.
  4. **"What should I do if I entered my password?" / "எனது கடவுச்சொல்லை உள்ளிட்டிருந்தால் நான் என்ன செய்ய வேண்டும்?"**:
     - Delivers an actionable 5-step emergency incident response containment protocol: immediate password reset on the canonical portal, revocation of active OAuth sessions, 2FA/MFA audit, banking/card freeze notifications, and cybercrime reporting (1930 / cybercrime.gov.in).
  5. **"What precautions should I take?" / "நான் என்ன முன்னெச்சரிக்கை நடவடிக்கைகளை எடுக்க வேண்டும்?"**:
     - Provides clear, risk-calibrated defensive measures tailored to the site's classification category.
- **Strict Credential Safety Guardrails:**
  - **Zero Credential Collection Policy**: The assistant **NEVER** solicits, collects, or stores passwords, OTPs, PINs, or private tokens.
  - If a user inadvertently pastes credentials or secret tokens, the assistant immediately intercepts the message, refuses credential acceptance, and triggers the emergency compromise containment protocol.
- **Epistemic Uncertainty & Anti-Hallucination:**
  - Strictly distinguishes measured physical observations from unobserved attributes.
  - In accordance with Zero-Trust principles, **absence of an observed flag is never treated as proof of safety**.
  - Clearly computes and displays an explicit Epistemic Uncertainty Note (e.g. `±8 pts Uncertainty Margin | 85% Evidence Completeness`).
- **Dual Engine Architecture (External AI + Rule-Based Fallback):**
  - **External AI Integration (Optional)**: Supports Google Gemini (`gemini-1.5-flash`) or OpenAI (`gpt-4o-mini`) via secure server-side environment variables (`GEMINI_API_KEY`, `OPENAI_API_KEY`, or `AI_API_KEY`). Keys are never exposed to the frontend.
  - **Forensic Rule-Based Evidence Engine**: Operates completely offline without external API keys or network dependencies, providing comprehensive, grammatically natural Tamil and English guidance.
- **Frontend Chat Interface:**
  - Dedicated **`SecurityAssistantPage`** featuring dual-pill language selector (English <-> தமிழ்), active scan context picker and status banner, contextual prompt suggestion chips, markdown rendering, evidence pills, precaution checklists, and copy controls.
  - Seamlessly linked from **`ScanResultsPage`** via the "Ask Assistant" action button and an interactive AI Security Consultation card.

---

## 📡 Complete Backend API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service liveness probe and database connectivity state |
| `POST` | `/api/scan` & `/api/scan/url` | Evaluates URL, extracts heuristics, and returns risk assessment |
| `GET` | `/api/scan/<id>` | Retrieves specific scan intelligence document |
| `POST` | `/api/scan/compare` | Evaluates threat delta, category shift, and factor variance between 2 scans |
| `GET` | `/api/history` | Fetches historical scan registry |
| `GET` | `/api/risk/metrics` | Returns 24h SOC metrics, 4-tier category distribution, and dimension telemetry |
| `GET` / `POST` | `/api/risk/thresholds` | Retrieves or updates 4-tier classification category thresholds |
| `POST` | `/api/risk/evaluate-thresholds` | Evaluates category thresholds against ground-truth validation dataset |
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
| `GET` | `/api/assistant/presets` | Context-aware suggested prompt questions in English & Tamil |

---

## 🔒 Cybersecurity Defense Controls

1. **SSRF Prevention:** Disallows loopback (`127.0.0.1`), link-local (`169.254.169.254`), private RFC1918 blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and non-HTTP schemes. Validates DNS pre-resolution and inspects all redirect hops.
2. **File Upload Security:** Magic bytes inspection, whitelisted extensions (`png`, `jpg`, `jpeg`, `webp`), 10MB ceiling, and cryptographic UUID4 sanitization.
3. **Restricted CORS:** Whitelists allowed frontend origins via `CORS_ORIGINS`.
4. **Credential Safety:** Never posts credentials or executes unverified forms against external domains.
