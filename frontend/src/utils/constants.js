// Constants for PhishGuard AI

export const RISK_LEVELS = {
  SAFE: {
    label: 'Safe',
    min: 0,
    max: 30,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    hex: '#10b981',
    description: 'No significant phishing indicators or malicious signatures detected.',
  },
  SUSPICIOUS: {
    label: 'Suspicious',
    min: 31,
    max: 69,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    hex: '#f59e0b',
    description: 'Anomalous structural patterns or unverified certificate observed. Caution advised.',
  },
  MALICIOUS: {
    label: 'Malicious Phishing',
    min: 70,
    max: 100,
    color: 'red',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
    hex: '#ef4444',
    description: 'High confidence phishing signatures, brand deception, or credential theft vectors found.',
  },
};

export const ATTACK_CATEGORIES = [
  'Brand Impersonation',
  'Credential Harvesting',
  'Typosquatting & Homoglyphs',
  'Zero-Day Phishing Domain',
  'Form Hijacking & Sensitive Data Interception',
  'Subdomain Obfuscation',
  'Phishing Kit Signature',
];

export const LANGUAGES = {
  EN: 'en',
  TA: 'ta',
};

export const API_ENDPOINTS = {
  HEALTH: '/health',
  SCAN_URL: '/scan/url',
  SCAN_BATCH: '/scan/batch',
  SCAN_DETAILS: (id) => `/scan/${id}`,
  SCAN_HISTORY: '/history',
  XAI_ANALYSIS: (id) => `/xai/explain/${id}`,
  SCREENSHOT_ANALYZE: '/screenshot/analyze',
  RISK_METRICS: '/risk/metrics',
  ASSISTANT_CHAT: '/assistant/chat',
  MONITOR_LIST: '/monitoring/targets',
  MONITOR_ADD: '/monitoring/targets',
  MONITOR_REMOVE: (id) => `/monitoring/targets/${id}`,
  MONITOR_ALERTS: '/monitoring/alerts',
};

