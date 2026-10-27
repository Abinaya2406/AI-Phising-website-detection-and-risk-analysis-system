import { apiRequest, getDemoMode } from './api';
import { API_ENDPOINTS } from '../utils/constants';
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
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    ...DEMO_RISK_METRICS,
    timeframe,
    isDemo: true,
  };
}

