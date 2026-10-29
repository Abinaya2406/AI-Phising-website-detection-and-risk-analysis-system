import { apiRequest, getDemoMode } from './api';
import { API_ENDPOINTS, DEFAULT_THRESHOLDS } from '../utils/constants';
import { DEMO_RISK_METRICS } from './mockData';

/**
 * Fetch high-level dynamic cybersecurity risk dashboard metrics
 */
export async function getRiskMetrics(timeframe = '24h') {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(`${API_ENDPOINTS.RISK_METRICS}?timeframe=${timeframe}`);
      return { ...data, isDemo: false };
    } catch (err) {
      console.warn('Backend risk metrics failed, using demo data:', err.message);
    }
  }

  // Demo fallback
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    ...DEMO_RISK_METRICS,
    timeframe,
    isDemo: true,
  };
}

/**
 * Retrieve active 4-tier risk classification thresholds
 */
export async function getRiskThresholds() {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.RISK_THRESHOLDS);
      return data?.thresholds || DEFAULT_THRESHOLDS;
    } catch (err) {
      console.warn('Backend thresholds retrieval failed, using defaults:', err.message);
    }
  }

  return DEFAULT_THRESHOLDS;
}

/**
 * Update 4-tier risk classification thresholds
 */
export async function updateRiskThresholds(thresholds) {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.RISK_THRESHOLDS, {
        method: 'POST',
        body: JSON.stringify({ thresholds }),
      });
      return data?.thresholds || thresholds;
    } catch (err) {
      console.warn('Backend thresholds update failed:', err.message);
      throw err;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 400));
  return thresholds;
}

/**
 * Evaluate category thresholds against empirical validation dataset
 */
export async function evaluateThresholds(customThresholds = null) {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.EVALUATE_THRESHOLDS, {
        method: 'POST',
        body: JSON.stringify({ thresholds: customThresholds }),
      });
      return data;
    } catch (err) {
      console.warn('Backend threshold evaluation failed, using benchmark demo:', err.message);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    thresholds_evaluated: customThresholds || DEFAULT_THRESHOLDS,
    metrics: {
      total_samples: 10,
      accuracy: 0.90,
      precision: 0.92,
      recall: 0.95,
      f1_score: 0.935,
      false_positive_rate: 0.05,
      true_positives: 5,
      false_positives: 0,
      true_negatives: 4,
      false_negatives: 1,
    },
    category_distribution: {
      low: 4,
      medium: 1,
      high: 1,
      critical: 4,
    },
    sample_results: [
      { url: 'https://paypal-security-update.com/auth', score: 92, ground_truth_category: 'critical', predicted_category: 'critical', is_match: true },
      { url: 'https://www.paypal.com/signin', score: 4, ground_truth_category: 'low', predicted_category: 'low', is_match: true },
      { url: 'https://accounts.google.com/ServiceLogin', score: 5, ground_truth_category: 'low', predicted_category: 'low', is_match: true },
      { url: 'https://secure-login-portal.xyz/billing', score: 75, ground_truth_category: 'high', predicted_category: 'high', is_match: true },
      { url: 'https://github.com/torvalds/linux', score: 2, ground_truth_category: 'low', predicted_category: 'low', is_match: true },
    ]
  };
}
