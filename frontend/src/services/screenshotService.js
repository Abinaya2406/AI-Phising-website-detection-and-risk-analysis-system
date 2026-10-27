import { apiRequest, getDemoMode, getApiBaseUrl } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { DEMO_SCREENSHOT_ANALYSIS } from './mockData';

/**
 * Upload a screenshot or trigger a remote headless browser screenshot analysis
 */
export async function analyzeScreenshot({ file, targetUrl }) {
  if (!getDemoMode()) {
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (targetUrl) {
        formData.append('targetUrl', targetUrl);
      }

      const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.SCREENSHOT_ANALYZE}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Screenshot analysis failed (${res.status})`);
      }
      const data = await res.json();
      return { ...data, isDemo: false };
    } catch (err) {
      console.warn('Backend screenshot analysis failed, using demo simulation:', err.message);
    }
  }

  // Demo fallback
  await new Promise((resolve) => setTimeout(resolve, 1600));

  let previewUrl = DEMO_SCREENSHOT_ANALYSIS.heatmapUrl;
  if (file) {
    try {
      previewUrl = URL.createObjectURL(file);
    } catch (_) {}
  }

  return {
    ...DEMO_SCREENSHOT_ANALYSIS,
    url: targetUrl || DEMO_SCREENSHOT_ANALYSIS.url,
    uploadedFileName: file ? file.name : null,
    previewUrl,
    isDemo: true,
  };
}

