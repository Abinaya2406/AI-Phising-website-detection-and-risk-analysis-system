import { apiRequest, getDemoMode, getApiBaseUrl } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { DEMO_SCREENSHOT_ANALYSIS } from './mockData';

/**
 * Upload a screenshot or trigger a remote headless browser screenshot analysis
 */
export async function analyzeScreenshot({ file, targetUrl }) {
  if (!getDemoMode()) {
    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        if (targetUrl) {
          formData.append('targetUrl', targetUrl);
        }
        res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.SCREENSHOT_ANALYZE}`, {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.SCREENSHOT_ANALYZE}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ targetUrl }),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || errJson?.message || `Screenshot analysis failed (${res.status})`;
        throw new Error(errMsg);
      }

      const json = await res.json();
      const payload = json.data || json;

      let preview = payload.previewUrl || payload.preview_url;
      if (preview && preview.startsWith('/api')) {
        preview = `${getApiBaseUrl()}${preview}`;
      } else if (file) {
        try {
          preview = URL.createObjectURL(file);
        } catch (_) {}
      }

      return {
        ...payload,
        previewUrl: preview,
        isDemo: false,
      };
    } catch (err) {
      console.warn('Backend screenshot analysis error:', err.message);
      throw err;
    }
  }

  // Demo fallback
  await new Promise((resolve) => setTimeout(resolve, 1400));

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

/**
 * Retrieve verified reference brand benchmark profiles
 */
export async function getReferenceBrands() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/screenshot/reference-brands`);
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch (e) {
    console.warn('Could not load reference brands:', e.message);
  }
  return [];
}
