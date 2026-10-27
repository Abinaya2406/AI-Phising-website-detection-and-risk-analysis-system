import { apiRequest, getDemoMode } from './api';
import { API_ENDPOINTS } from '../utils/constants';
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
  await new Promise((resolve) => setTimeout(resolve, 1400)); // simulate realistic AI analysis latency

  const existingScans = getStoredScans();
  const lowerUrl = url.toLowerCase();

  // Pick or synthesize a demo scan result based on heuristics
  let riskScore = 85;
  let verdict = 'Malicious Phishing';
  let attackType = 'Credential Harvesting';
  let targetBrand = 'Unknown / Suspicious Domain';

  if (lowerUrl.includes('google') || lowerUrl.includes('github') || lowerUrl.includes('wikipedia') || lowerUrl.includes('gov')) {
    riskScore = 5;
    verdict = 'Safe';
    attackType = 'None';
    targetBrand = 'Legitimate Service';
  } else if (lowerUrl.includes('paypal') || lowerUrl.includes('chase') || lowerUrl.includes('bank') || lowerUrl.includes('secure')) {
    riskScore = 93;
    verdict = 'Malicious Phishing';
    attackType = 'Brand Impersonation & Credential Harvesting';
    targetBrand = lowerUrl.includes('paypal') ? 'PayPal' : 'Financial Institution';
  } else if (lowerUrl.includes('verify') || lowerUrl.includes('login') || lowerUrl.includes('update')) {
    riskScore = 65;
    verdict = 'Suspicious';
    attackType = 'Zero-Day Phishing Domain';
    targetBrand = 'Generic Authentication Portal';
  } else {
    // Arbitrary safe/suspicious range
    riskScore = 18;
    verdict = 'Safe';
    attackType = 'None';
    targetBrand = 'Unflagged Website';
  }

  let hostname = '';
  try {
    hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
  } catch {
    hostname = url;
  }

  const newScan = {
    id: `scan-${Date.now().toString().slice(-4)}`,
    url,
    domain: hostname,
    status: 'completed',
    riskScore,
    verdict,
    attackType,
    targetBrand,
    timestamp: new Date().toISOString(),
    isDemo: true,
    sslStatus: {
      valid: true,
      issuer: riskScore > 60 ? "Let's Encrypt Authority X3" : 'DigiCert Global Root G2',
      ageDays: riskScore > 60 ? 3 : 240,
      expiryDays: riskScore > 60 ? 87 : 365,
      isFreeCA: riskScore > 60,
    },
    dnsInfo: {
      ip: '198.51.100.' + Math.floor(Math.random() * 200 + 10),
      country: riskScore > 60 ? 'RU' : 'US',
      asn: riskScore > 60 ? 'AS49981 OffShore Host' : 'AS15169 Google LLC',
      registrar: riskScore > 60 ? 'NameCheap / Privacy Protected' : 'MarkMonitor',
      creationDate: riskScore > 60 ? new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0] : '2015-04-12',
    },
    heuristicFeatures: {
      urlLength: url.length,
      hasIpInUrl: /^\d+\.\d+\.\d+\.\d+/.test(hostname),
      hasAtSymbol: url.includes('@'),
      doubleSlashRedirect: url.lastIndexOf('//') > 7,
      subdomainsCount: (hostname.match(/\./g) || []).length,
      suspiciousKeywords: ['verify', 'secure', 'login', 'account', 'banking'].filter((k) => lowerUrl.includes(k)),
      entropyScore: +(3.2 + (riskScore / 100) * 1.8).toFixed(2),
      externalFavicon: riskScore > 50,
      hasPasswordField: riskScore > 50,
      submitsToRemoteDomain: riskScore > 60,
    },
    threatIntel: {
      virustotalDetections: riskScore > 70 ? 12 : riskScore > 40 ? 2 : 0,
      googleSafeBrowsing: riskScore > 70 ? 'Flagged (Phishing)' : 'Clean',
      openPhishListed: riskScore > 70,
      phishTankVerified: riskScore > 75,
    },
  };

  const updatedScans = [newScan, ...existingScans];
  saveStoredScans(updatedScans);

  return newScan;
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

