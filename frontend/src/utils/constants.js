// Constants for PhishGuard AI

export const RISK_LEVELS = {
  LOW: {
    key: 'low',
    label: 'Low',
    min: 0,
    max: 29,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    hex: '#10b981',
    description: 'Minimal risk indicators observed.',
  },
  MEDIUM: {
    key: 'medium',
    label: 'Medium',
    min: 30,
    max: 59,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    hex: '#f59e0b',
    description: 'Elevated or suspicious indicators requiring caution.',
  },
  HIGH: {
    key: 'high',
    label: 'High',
    min: 60,
    max: 79,
    color: 'orange',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    hex: '#f97316',
    description: 'Strong phishing signatures or deceptive patterns detected.',
  },
  CRITICAL: {
    key: 'critical',
    label: 'Critical',
    min: 80,
    max: 100,
    color: 'red',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
    hex: '#ef4444',
    description: 'Severe credential harvesting, brand impersonation, or confirmed malicious payload.',
  },
  // Backwards compatibility aliases
  SAFE: {
    key: 'low',
    label: 'Safe',
    min: 0,
    max: 29,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    hex: '#10b981',
    description: 'Minimal risk indicators observed.',
  },
  SUSPICIOUS: {
    key: 'medium',
    label: 'Suspicious',
    min: 30,
    max: 59,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    hex: '#f59e0b',
    description: 'Elevated or suspicious indicators requiring caution.',
  },
  MALICIOUS: {
    key: 'critical',
    label: 'Malicious Phishing',
    min: 70,
    max: 100,
    color: 'red',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
    hex: '#ef4444',
    description: 'High confidence phishing signatures, brand deception, or credential theft vectors found.',
  },
};

export const DEFAULT_THRESHOLDS = {
  low: { min: 0, max: 29, label: 'Low', description: 'Minimal risk indicators observed.' },
  medium: { min: 30, max: 59, label: 'Medium', description: 'Elevated or suspicious indicators requiring caution.' },
  high: { min: 60, max: 79, label: 'High', description: 'Strong phishing signatures or deceptive patterns detected.' },
  critical: { min: 80, max: 100, label: 'Critical', description: 'Severe credential harvesting, brand impersonation, or confirmed malicious payload.' }
};

export function getRiskCategory(score, thresholds = null) {
  const num = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const th = thresholds || DEFAULT_THRESHOLDS;
  
  if (num <= (th.low?.max ?? 29)) {
    return RISK_LEVELS.LOW;
  }
  if (num <= (th.medium?.max ?? 59)) {
    return RISK_LEVELS.MEDIUM;
  }
  if (num <= (th.high?.max ?? 79)) {
    return RISK_LEVELS.HIGH;
  }
  return RISK_LEVELS.CRITICAL;
}

export const EVIDENCE_DIMENSIONS = [
  { key: 'url_lexical', title: 'URL Classification & Lexical', weight: 0.30, icon: 'Key' },
  { key: 'domain_intelligence', title: 'Domain & Cryptographic Infrastructure', weight: 0.25, icon: 'Lock' },
  { key: 'visual_impersonation', title: 'Visual Forensics & Brand Match', weight: 0.20, icon: 'Camera' },
  { key: 'page_content', title: 'Page Content & DOM Heuristics', weight: 0.15, icon: 'Globe' },
  { key: 'redirect_routing', title: 'Redirect & Network Routing', weight: 0.10, icon: 'Server' },
];

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
  SCAN_COMPARE: '/scan/compare',
  RISK_THRESHOLDS: '/risk/thresholds',
  EVALUATE_THRESHOLDS: '/risk/evaluate-thresholds',
  XAI_ANALYSIS: (id) => `/xai/explain/${id}`,
  SCREENSHOT_ANALYZE: '/screenshot/analyze',
  RISK_METRICS: '/risk/metrics',
  ASSISTANT_CHAT: '/assistant/chat',
  MONITOR_LIST: '/monitoring/targets',
  MONITOR_ADD: '/monitoring/targets',
  MONITOR_REMOVE: (id) => `/monitoring/targets/${id}`,
  MONITOR_ALERTS: '/monitoring/alerts',
};
