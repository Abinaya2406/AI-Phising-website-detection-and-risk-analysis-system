# PhishGuard AI: AI-Powered Phishing Website Detection and Risk Analysis System

> **A Next-Generation Cybersecurity Frontend Dashboard engineered with React, Vite, Tailwind CSS, React Router, and Recharts.**

---

## 🛡️ Project Overview

**PhishGuard AI** is a comprehensive, production-grade cybersecurity intelligence platform designed to detect, deconstruct, and monitor malicious phishing websites and brand impersonation attacks. It features transparent **Explainable AI (SHAP & LIME)**, **Deep Siamese Screenshot Vision**, **Continuous Domain Watchdog Monitoring**, and a **Bilingual AI Security Assistant (Tamil & English)**.

---

## ⚡ Technology Stack

- **Core Framework:** React 18 + Vite
- **Styling & Cyber Theme:** Tailwind CSS (Dark Navy `#050a14` palette with Electric Blue & Cyan accents `#06b6d4`)
- **Routing:** React Router v6
- **Data Visualizations:** Recharts (Area time-series, SHAP horizontal bar charts, Donut breakdown)
- **Icons:** Lucide React
- **HTTP Client:** Fetch API with custom interceptors, abort controllers, and graceful Demo Mode fallback

---

## 📁 Project Structure

```
AI-Phising-website-detection-and-risk-analysis-system/
├── frontend/                               # Complete Frontend Application
│   ├── public/                             # Public static assets
│   ├── src/
│   │   ├── assets/                         # SVG icons, logo vectors
│   │   ├── components/
│   │   │   ├── charts/                     # Recharts data visualization components
│   │   │   │   ├── CategoryBreakdownChart.jsx
│   │   │   │   ├── FeatureImportanceChart.jsx
│   │   │   │   └── ThreatTrendChart.jsx
│   │   │   ├── common/                     # Reusable Cyber UI atoms & molecules
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── DemoBadge.jsx           # Explicit [DEMO DATA] indicator
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── RiskGauge.jsx           # Circular speedo SVG risk gauge
│   │   │   │   └── StatusIndicator.jsx     # Glowing status dots
│   │   │   ├── layout/                     # Persistent shell & navigation
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Header.jsx              # Status bar, demo toggle, language selector
│   │   │   │   ├── Layout.jsx
│   │   │   │   └── Sidebar.jsx             # 10 Navigation routes with active states
│   │   │   └── scanner/                    # URL input & testing chip samples
│   │   │       └── UrlInputForm.jsx
│   │   ├── context/
│   │   │   ├── AppContext.jsx              # Global scan state & backend health
│   │   │   └── LanguageContext.jsx         # Bilingual English / தமிழ் switcher
│   │   ├── pages/                          # The 10 Core Pages
│   │   │   ├── HomePage.jsx                # 1. URL Scanner & Threat Feed
│   │   │   ├── ScanResultsPage.jsx         # 2. In-depth Heuristic Verdict & Breakdown
│   │   │   ├── XAIAnalysisPage.jsx         # 3. Explainable AI (SHAP, LIME, Decision Tree)
│   │   │   ├── ScreenshotAnalysisPage.jsx  # 4. Computer Vision & OCR Layout Matching
│   │   │   ├── AdaptiveRiskDashboard.jsx   # 5. SOC Threat Dashboard & Analytics
│   │   │   ├── SecurityAssistantPage.jsx   # 6. Bilingual AI Assistant (Tamil / English)
│   │   │   ├── WebsiteMonitoringPage.jsx   # 7. 24/7 Asset Monitoring & Watchlist
│   │   │   ├── MonitoringHistoryAlertsPage.jsx # 8. Defacement & Incident Alerts
│   │   │   ├── ScanHistoryPage.jsx         # 9. Archived Scans & JSON Export
│   │   │   ├── AboutAwarenessPage.jsx      # 10. Architecture & Security Awareness Quiz
│   │   │   └── NotFoundPage.jsx            # 404 Security Barrier
│   │   ├── services/                       # API Services & Mock Fallbacks
│   │   │   ├── api.js                      # Base client & Demo Mode controller
│   │   │   ├── assistantService.js         # Bilingual Chatbot logic
│   │   │   ├── mockData.js                 # Labeled realistic cyber threat demo datasets
│   │   │   ├── monitoringService.js        # Monitored targets & alert endpoints
│   │   │   ├── riskService.js              # Aggregated risk metrics
│   │   │   ├── scanService.js              # URL scan & historical cache
│   │   │   ├── screenshotService.js        # Headless & screenshot upload API
│   │   │   └── xaiService.js               # SHAP/LIME calculation endpoints
│   │   ├── utils/
│   │   │   ├── constants.js                # Risk thresholds & API routes
│   │   │   ├── formatters.js               # Dates, URLs, risk levels
│   │   │   └── validators.js               # URL & Image validation
│   │   ├── App.jsx                         # Main Router configuration
│   │   ├── index.css                       # Cyber dark theme & scanlines
│   │   └── main.jsx                        # React root entrypoint
│   ├── .env                                # Local environment config
│   ├── .env.example                        # Template for backend URL
│   ├── index.html                          # HTML shell with Google Fonts
│   ├── package.json                        # Dependencies & build scripts
│   ├── postcss.config.js                   # PostCSS pipeline
│   ├── tailwind.config.js                  # Custom cyber color theme
│   └── vite.config.js                      # Vite bundler config
├── .gitignore                              # Git exclusion rules
└── README.md                               # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended, tested on v26.5.1)
- npm or pnpm

### 1. Installation
Navigate into the `frontend` directory and install dependencies:
```bash
cd frontend
npm install
```

### 2. Configure Backend URL
Copy the environment template if needed and configure your backend endpoint:
```bash
cp .env.example .env
```
Inside `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_ENABLE_DEMO_MODE=true
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:5173
```

### 4. Build for Production
```bash
npm run build
```
The compiled, production-ready static assets will be created in `frontend/dist/`.

---

## 🖥️ 10 Dedicated Pages & Capabilities

| Page | Route | Description |
|---|---|---|
| **1. Home & Scanner** | `/` | Hero section, URL scanner input with test chips, live threat stream table |
| **2. Scan Results** | `/results` | Circular risk gauge (0-100), SSL analysis, domain age, registrar, and DOM form targets |
| **3. Explainable AI** | `/xai` | Interactive SHAP feature importance bar chart, LIME token weights, and decision rules |
| **4. Screenshot Vision** | `/screenshot` | Siamese CNN visual comparison, OCR text extraction, and brand emblem matching |
| **5. Risk Dashboard** | `/dashboard` | SOC overview, 24h threat trend area chart, attack distribution, top targeted brands |
| **6. AI Security Assistant** | `/assistant` | Bilingual conversational AI advisor in **English** and **Tamil (தமிழ்)** |
| **7. Website Monitoring** | `/monitoring` | 24/7 domain integrity watcher, ping interval setup, uptime and SSL expiry tracker |
| **8. Monitoring Alerts** | `/alerts` | Incident response triage, severity filters (Critical/High/Med), resolution workflow |
| **9. Scan History** | `/history` | Historical audit registry, search filter by brand/URL, and one-click JSON export |
| **10. About & Awareness** | `/about` | Technical architecture, attack vector encyclopedia, and interactive awareness quiz |

---

## 🔌 Backend API Integration Points

PhishGuard AI Frontend is architected with clear integration points ready for your backend implementation (e.g. FastAPI / Flask / Express):

- `POST /api/scan/url` — Analyzes target URL and calculates multi-heuristic risk
- `GET /api/scan/:id` — Fetches full details for a previous scan
- `GET /api/history` — Fetches global scan history
- `GET /api/xai/explain/:id` — Computes SHAP values, LIME token weights, and decision tree rules
- `POST /api/screenshot/analyze` — Receives image upload or URL for headless screenshot analysis
- `GET /api/risk/metrics` — Returns 24h threat distribution metrics and targeted brand shares
- `POST /api/assistant/chat` — Accepts `{ message, language }` and returns contextual security advice
- `GET /api/monitoring/targets` — Lists monitored domains with uptime and health
- `POST /api/monitoring/targets` — Enrolls a new target domain into the watcher
- `GET /api/monitoring/alerts` — Retrieves defacement, SSL, and impersonation incidents

> **Note on Demo Mode:** When the backend server is offline or when `Demo Mode: ON` is toggled in the header, the UI smoothly displays realistic, clearly labeled simulated telemetry without breaking the interface.

---

## 🎨 Cybersecurity UI Highlights
- **High-contrast Dark Navy Background:** `#050a14` and `#0e182e`
- **Cyan & Electric Blue Accents:** `#06b6d4` and `#2563eb` with CSS glow filters
- **Responsive Layout:** Mobile drawer sidebar, fluid grid cards, accessible contrast, semantic tags
- **Data Integrity:** Clear `[DEMO DATA]` badges to ensure transparency prior to backend connection

