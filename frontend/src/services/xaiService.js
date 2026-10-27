import { apiRequest, getDemoMode } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { DEMO_XAI_EXPLANATION } from './mockData';

/**
 * Fetch explainability data for a specific scan ID
 */
export async function getXAIExplanation(scanId) {
  if (!getDemoMode()) {
    try {
      const result = await apiRequest(API_ENDPOINTS.XAI_ANALYSIS(scanId));
      return { ...result, isDemo: false };
    } catch (err) {
      console.warn('Backend XAI explanation failed, returning demo explanation:', err.message);
    }
  }

  // Demo fallback
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    ...DEMO_XAI_EXPLANATION,
    scanId: scanId || DEMO_XAI_EXPLANATION.scanId,
    isDemo: true,
  };
}

