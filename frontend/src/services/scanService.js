import { apiRequest, getDemoMode } from './api';
import { API_ENDPOINTS, getRiskCategory } from '../utils/constants';
import { DEMO_SCANS } from './mockData';

// Local storage cache for scans performed during current session
const STORAGE_KEY = 'phishguard_scans_history';

const getStoredScans = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEMO_SCANS;
  } catch {
    return DEMO_SCANS;
  }
};

const saveStoredScans = (scans) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
  } catch (err) {
    console.error('Failed to save scans in local storage', err);
  }
};

/**
 * Scan a URL for phishing and malicious threats
 */
export async function scanUrl(url) {
  // If demo mode is not forced, attempt to contact the backend
  if (!getDemoMode()) {
    try {
      const result = await apiRequest(API_ENDPOINTS.SCAN_URL, {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      return { ...result, isDemo: false };
    } catch (err) {
      console.warn('Backend scan failed, fallback available if demo mode enabled:', err.message);
      throw err;
    }
  }

  // Demo Mode simulated scan
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const existingScans = getStoredScans();
  const lowerUrl = url.toLowerCase();

  let riskScore = 85;
  let attackType = 'Credential Harvesting';
  let targetBrand = 'Unknown / Suspicious Domain';
  let modelProb = 0.88;

  if (lowerUrl.includes('google') || lowerUrl.includes('github') || lowerUrl.includes('wikipedia') || lowerUrl.includes('gov')) {
    riskScore = 5;
    attackType = 'None (Legitimate)';
    targetBrand = 'Legitimate Service';
    modelProb = 0.04;
  } else if (lowerUrl.includes('paypal') || lowerUrl.includes('chase') || lowerUrl.includes('bank') || lowerUrl.includes('secure')) {
    riskScore = 93;
    attackType = 'Brand Impersonation & Credential Harvesting';
    targetBrand = lowerUrl.includes('paypal') ? 'PayPal Inc.' : 'JPMorgan Chase & Co.';
    modelProb = 0.94;
  } else if (lowerUrl.includes('verify') || lowerUrl.includes('login') || lowerUrl.includes('update')) {
    riskScore = 68;
    attackType = 'Zero-Day Phishing Domain';
    targetBrand = 'Generic Authentication Portal';
    modelProb = 0.72;
  } else {
    riskScore = 22;
    attackType = 'None (Legitimate)';
    targetBrand = 'Unflagged Website';
    modelProb = 0.18;
  }

  const category = getRiskCategory(riskScore);
  const verdict = category.label === 'Low' ? 'Safe' : category.label === 'Medium' ? 'Suspicious' : 'Malicious Phishing';

  let hostname = '';
  try {
    hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
  } catch {
    hostname = url;
  }

  const isPhishing = riskScore >= 60;

  const adaptiveRisk = {
    adaptive_risk_score: riskScore,
    risk_category: {
      key: category.key,
      label: category.label,
      score: riskScore,
      description: category.description,
      threshold_min: category.min,
      threshold_max: category.max,
    },
    model_probability: Math.round(modelProb * 100),
    confidence_pct: 94.5,
    completeness_pct: 85.0,
    uncertainty_margin: 6,
    disclaimer: 'Model probability represents statistical lexical pattern matching. Adaptive risk score is a composite index incorporating domain intelligence, SSL, visual forensics, and network routing. Neither metric guarantees an absolute probability of compromise or safety.',
    dimension_scores: {
      url_lexical: { score: Math.round(modelProb * 100), availability: 'OBSERVED', base_weight: 0.30, effective_weight: 0.35, title: 'URL Classification & Lexical', icon: 'Key' },
      domain_intelligence: { score: isPhishing ? 75 : 12, availability: 'OBSERVED', base_weight: 0.25, effective_weight: 0.29, title: 'Domain & Cryptographic Infrastructure', icon: 'Lock' },
      visual_impersonation: { score: isPhishing ? 88 : 5, availability: isPhishing ? 'OBSERVED' : 'UNAVAILABLE', base_weight: 0.20, effective_weight: isPhishing ? 0.24 : 0.0, title: 'Visual Forensics & Brand Impersonation', icon: 'Camera' },
      page_content: { score: isPhishing ? 80 : 15, availability: 'OBSERVED', base_weight: 0.15, effective_weight: 0.18, title: 'Page Content & DOM Heuristics', icon: 'Globe' },
      redirect_routing: { score: isPhishing ? 40 : 10, availability: 'OBSERVED', base_weight: 0.10, effective_weight: 0.12, title: 'Redirect & Network Routing', icon: 'Server' },
    },
    evidence_breakdown: [
      {
        id: 'lex_model_prob',
        name: 'RandomForest URL Classifier Inference',
        dimension: 'url_lexical',
        observed_value: `${Math.round(modelProb * 100)}% probability`,
        impact: isPhishing ? 28 : -15,
        influence: isPhishing ? 'INCREASES_RISK' : 'MITIGATES_RISK',
        status: isPhishing ? 'CRITICAL' : 'BENIGN',
        explanation: `Trained ML model classified URL lexical structure at ${Math.round(modelProb * 100)}% phishing probability.`
      },
      {
        id: 'dom_ssl',
        name: isPhishing ? 'Disposable Free CA SSL Certificate' : 'Cryptographically Valid EV/OV SSL',
        dimension: 'domain_intelligence',
        observed_value: isPhishing ? "Let's Encrypt (3 days old)" : 'DigiCert Global Root G2',
        impact: isPhishing ? 20 : -12,
        influence: isPhishing ? 'INCREASES_RISK' : 'MITIGATES_RISK',
        status: isPhishing ? 'ELEVATED' : 'BENIGN',
        explanation: isPhishing ? 'Domain uses automated free TLS provisioned 3 days ago.' : 'Legitimate extended verification certificate from trusted CA.'
      },
      {
        id: 'dom_heuristics',
        name: isPhishing ? 'Password Form Submits to Remote Origin' : 'Clean Form Submissions',
        dimension: 'page_content',
        observed_value: isPhishing ? 'Password input detected' : 'No credential inputs',
        impact: isPhishing ? 35 : -10,
        influence: isPhishing ? 'INCREASES_RISK' : 'MITIGATES_RISK',
        status: isPhishing ? 'CRITICAL' : 'BENIGN',
        explanation: isPhishing ? 'Sensitive password field detected submitting credentials to an external host.' : 'No sensitive password inputs detected.'
      }
    ]
  };

  const newScan = {
    id: `scan-${Date.now().toString().slice(-4)}`,
    url,
    domain: hostname,
    status: 'completed',
    risk_score: riskScore,
    riskScore: riskScore,
    verdict,
    attack_type: attackType,
    attackType,
    target_brand: targetBrand,
    targetBrand,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    isDemo: true,
    adaptive_risk: adaptiveRisk,
    ssl_status: {
      valid: true,
      issuer: isPhishing ? "Let's Encrypt Authority X3" : 'DigiCert Global Root G2',
      age_days: isPhishing ? 3 : 240,
      expiry_days: isPhishing ? 87 : 365,
      is_free_ca: isPhishing,
    },
    dns_info: {
      ip: '198.51.100.' + Math.floor(Math.random() * 200 + 10),
      country: isPhishing ? 'RU' : 'US',
      asn: isPhishing ? 'AS49981 OffShore Host' : 'AS15169 Google LLC',
      registrar: isPhishing ? 'NameCheap' : 'MarkMonitor',
      creation_date: isPhishing ? new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0] : '2015-04-12',
    },
    heuristic_features: {
      url_length: url.length,
      has_ip_in_url: /^\d+\.\d+\.\d+\.\d+/.test(hostname),
      has_at_symbol: url.includes('@'),
      double_slash_redirect: url.lastIndexOf('//') > 7,
      subdomain_count: (hostname.match(/\./g) || []).length,
      entropy_score: +(3.2 + (riskScore / 100) * 1.8).toFixed(2),
      external_favicon: isPhishing,
      has_password_field: isPhishing,
      submits_to_remote_domain: isPhishing,
    },
    threat_intel: {
      virustotal_detections: riskScore > 70 ? 12 : riskScore > 40 ? 2 : 0,
      google_safe_browsing: riskScore > 70 ? 'Flagged (Phishing)' : 'Clean',
      openphish_listed: riskScore > 70,
      phishtank_verified: riskScore > 75,
    },
  };

  const updatedScans = [newScan, ...existingScans];
  saveStoredScans(updatedScans);

  return newScan;
}

/**
 * Compare two scans to compute risk delta, category shift, and factor variance
 */
export async function compareScans(id1, id2) {
  if (!getDemoMode()) {
    try {
      const res = await apiRequest(API_ENDPOINTS.SCAN_COMPARE, {
        method: 'POST',
        body: JSON.stringify({ scan_id_1: id1, scan_id_2: id2 }),
      });
      return res;
    } catch (err) {
      console.warn('Backend scan comparison failed, evaluating in demo mode:', err.message);
    }
  }

  // Simulated comparison in demo mode
  const scans = getStoredScans();
  const scanA = scans.find((s) => s.id === id1) || scans[0];
  const scanB = scans.find((s) => s.id === id2) || scans[1] || scans[0];

  const scoreA = scanA?.adaptive_risk?.adaptive_risk_score ?? scanA?.risk_score ?? scanA?.riskScore ?? 0;
  const scoreB = scanB?.adaptive_risk?.adaptive_risk_score ?? scanB?.risk_score ?? scanB?.riskScore ?? 0;
  const delta = scoreB - scoreA;

  const catA = scanA?.adaptive_risk?.risk_category?.label || scanA?.verdict || 'Unknown';
  const catB = scanB?.adaptive_risk?.risk_category?.label || scanB?.verdict || 'Unknown';

  return {
    scan_a: {
      id: scanA?.id,
      url: scanA?.url,
      score: scoreA,
      category: catA,
      timestamp: scanA?.created_at || scanA?.timestamp,
    },
    scan_b: {
      id: scanB?.id,
      url: scanB?.url,
      score: scoreB,
      category: catB,
      timestamp: scanB?.created_at || scanB?.timestamp,
    },
    score_delta: delta,
    trend: delta > 15 ? 'SIGNIFICANTLY_INCREASED_THREAT' : delta < -15 ? 'SIGNIFICANTLY_REDUCED_THREAT' : 'STABLE',
    trend_summary: delta > 0 ? `Risk escalated by +${delta} points from ${catA} to ${catB}.` : `Risk reduced by ${Math.abs(delta)} points from ${catA} to ${catB}.`,
    dimension_comparison: {
      url_lexical: { title: 'URL Classification & Lexical', scan_a_score: scoreA > 50 ? 78 : 15, scan_b_score: scoreB > 50 ? 82 : 12, delta: (scoreB > 50 ? 82 : 12) - (scoreA > 50 ? 78 : 15) },
      domain_intelligence: { title: 'Domain & Cryptographic Infrastructure', scan_a_score: scoreA > 50 ? 65 : 10, scan_b_score: scoreB > 50 ? 75 : 8, delta: (scoreB > 50 ? 75 : 8) - (scoreA > 50 ? 65 : 10) },
      visual_impersonation: { title: 'Visual Forensics & Brand Match', scan_a_score: scoreA > 50 ? 85 : 0, scan_b_score: scoreB > 50 ? 90 : 0, delta: (scoreB > 50 ? 90 : 0) - (scoreA > 50 ? 85 : 0) },
      page_content: { title: 'Page Content & DOM Heuristics', scan_a_score: scoreA > 50 ? 70 : 10, scan_b_score: scoreB > 50 ? 80 : 5, delta: (scoreB > 50 ? 80 : 5) - (scoreA > 50 ? 70 : 10) },
      redirect_routing: { title: 'Redirect & Network Routing', scan_a_score: 10, scan_b_score: scoreB > 50 ? 35 : 5, delta: (scoreB > 50 ? 35 : 5) - 10 },
    },
    new_risk_factors: delta > 0 ? [
      { id: 'new_1', name: 'Brand Impersonation in Hostname', dimension: 'visual_impersonation', observed_value: 'PayPal Spoofing', impact: 40, explanation: 'Host deceptively mimics PayPal branding.' },
      { id: 'new_2', name: 'Password Field Submits to External Host', dimension: 'page_content', observed_value: 'Remote Action', impact: 35, explanation: 'Forms forward sensitive auth tokens to non-canonical server.' }
    ] : [],
    resolved_risk_factors: delta < 0 ? [
      { id: 'res_1', name: 'Suspicious Free TLS Certificate', dimension: 'domain_intelligence', observed_value: 'Resolved to DigiCert EV', impact: -25, explanation: 'Legitimate enterprise certificate verification established.' }
    ] : [],
    persistent_risks: [],
    infrastructure_delta: {
      ssl_changed: scanA?.ssl_status?.issuer !== scanB?.ssl_status?.issuer,
      ssl_a_issuer: scanA?.ssl_status?.issuer || 'Unknown',
      ssl_b_issuer: scanB?.ssl_status?.issuer || 'Unknown',
      domain_a: scanA?.domain,
      domain_b: scanB?.domain,
    }
  };
}

/**
 * Get scan history list
 */
export async function getScanHistory() {
  if (!getDemoMode()) {
    try {
      const res = await apiRequest(API_ENDPOINTS.SCAN_HISTORY);
      return res;
    } catch (err) {
      console.warn('Backend history failed, fallback to local demo data:', err.message);
    }
  }

  return getStoredScans();
}

/**
 * Get single scan details by ID
 */
export async function getScanDetails(id) {
  if (!getDemoMode()) {
    try {
      const res = await apiRequest(API_ENDPOINTS.SCAN_DETAILS(id));
      return res;
    } catch (err) {
      console.warn('Backend scan details failed, searching demo data:', err.message);
    }
  }

  const scans = getStoredScans();
  const match = scans.find((s) => s.id === id);
  if (match) return match;

  return DEMO_SCANS[0];
}

/**
 * Clear scan history
 */
export function clearScanHistory() {
  localStorage.removeItem(STORAGE_KEY);
  return [];
}
