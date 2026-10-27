import { apiRequest, getDemoMode } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { DEMO_XAI_EXPLANATION } from './mockData';

/**
 * Fetch explainability data for a specific scan ID or URL.
 */
export async function getXAIExplanation(scanId, url = null) {
  if (!getDemoMode()) {
    try {
      let endpoint = scanId ? API_ENDPOINTS.XAI_ANALYSIS(scanId) : '/assistant/explain';
      let options = {};
      if (!scanId && url) {
        endpoint = '/assistant/explain';
        options = {
          method: 'POST',
          body: JSON.stringify({ url }),
        };
      }
      const response = await apiRequest(endpoint, options);
      const data = response?.data || response;
      return { ...data, isDemo: false };
    } catch (err) {
      console.warn('Backend XAI explanation failed, returning fallback explanation:', err.message);
    }
  }

  // Demo fallback
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    ...DEMO_XAI_EXPLANATION,
    scanId: scanId || DEMO_XAI_EXPLANATION.scanId,
    url: url || DEMO_XAI_EXPLANATION.url,
    isDemo: true,
  };
}
