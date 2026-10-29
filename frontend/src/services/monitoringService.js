import { apiRequest, getDemoMode } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { DEMO_MONITORING_TARGETS, DEMO_MONITORING_ALERTS } from './mockData';

const TARGETS_STORAGE_KEY = 'phishguard_monitored_targets';
const ALERTS_STORAGE_KEY = 'phishguard_monitoring_alerts';

const getStoredTargets = () => {
  try {
    const raw = localStorage.getItem(TARGETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEMO_MONITORING_TARGETS;
  } catch {
    return DEMO_MONITORING_TARGETS;
  }
};

const getStoredAlerts = () => {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEMO_MONITORING_ALERTS;
  } catch {
    return DEMO_MONITORING_ALERTS;
  }
};

export async function getMonitoredTargets() {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.MONITOR_LIST);
      return data;
    } catch (err) {
      console.warn('Backend targets failed, using demo targets:', err.message);
    }
  }

  return getStoredTargets();
}

export async function addMonitoredTarget(targetData) {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.MONITOR_ADD, {
        method: 'POST',
        body: JSON.stringify(targetData),
      });
      return data;
    } catch (err) {
      console.warn('Backend add target failed, saving locally:', err.message);
    }
  }

  const existing = getStoredTargets();
  const newTarget = {
    id: `mon-${Date.now()}`,
    name: targetData.name || 'Monitored Service',
    url: targetData.url,
    domain: new URL(targetData.url).hostname,
    check_interval: targetData.checkInterval || targetData.check_interval || 'Every 5 mins',
    interval_seconds: 300,
    status: 'ACTIVE',
    health: 'HEALTHY',
    baseline_risk_score: 15,
    current_risk_score: 15,
    previous_risk_score: 15,
    risk_delta: 0,
    last_checked: new Date().toISOString(),
    next_check: new Date(Date.now() + 300000).toISOString(),
    total_checks: 1,
    error_count: 0,
    alerts_count: 0,
    isDemo: true,
  };

  const updated = [newTarget, ...existing];
  localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(updated));
  return newTarget;
}

export async function removeMonitoredTarget(id) {
  if (!getDemoMode()) {
    try {
      await apiRequest(API_ENDPOINTS.MONITOR_REMOVE(id), { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend remove target failed, deleting locally:', err.message);
    }
  }

  const existing = getStoredTargets();
  const updated = existing.filter((t) => t.id !== id);
  localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function pauseMonitoredTarget(id) {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.MONITOR_PAUSE(id), { method: 'POST' });
      return data;
    } catch (err) {
      console.warn('Backend pause target failed:', err.message);
    }
  }

  const existing = getStoredTargets();
  const updated = existing.map((t) => (t.id === id ? { ...t, status: 'PAUSED' } : t));
  localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(updated));
  return updated.find((t) => t.id === id);
}

export async function resumeMonitoredTarget(id) {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.MONITOR_RESUME(id), { method: 'POST' });
      return data;
    } catch (err) {
      console.warn('Backend resume target failed:', err.message);
    }
  }

  const existing = getStoredTargets();
  const updated = existing.map((t) => (t.id === id ? { ...t, status: 'ACTIVE' } : t));
  localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(updated));
  return updated.find((t) => t.id === id);
}

export async function checkMonitoredTargetNow(id) {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.MONITOR_CHECK_NOW(id), { method: 'POST' });
      return data;
    } catch (err) {
      console.warn('Backend check target now failed:', err.message);
    }
  }

  const existing = getStoredTargets();
  const now = new Date().toISOString();
  const updated = existing.map((t) =>
    t.id === id ? { ...t, last_checked: now, total_checks: (t.total_checks || 0) + 1 } : t
  );
  localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(updated));
  return { status: 'completed', target_id: id, changes_detected_count: 0, risk_delta: 0 };
}

export async function getMonitoredTargetDetails(id) {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.MONITOR_DETAILS(id));
      return data;
    } catch (err) {
      console.warn('Backend get target details failed:', err.message);
    }
  }

  const existing = getStoredTargets();
  return existing.find((t) => t.id === id) || null;
}

export async function getMonitoredTargetChanges(id) {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.MONITOR_CHANGES(id));
      return data;
    } catch (err) {
      console.warn('Backend get changes failed:', err.message);
    }
  }

  return [
    {
      id: `chg-${Date.now()}`,
      target_id: id,
      change_type: 'BASELINE_CAPTURED',
      severity: 'LOW',
      description: 'Initial cryptographic DOM baseline and SSL certificates recorded.',
      previous_risk_score: 15,
      new_risk_score: 15,
      risk_delta: 0,
      detected_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];
}

export async function getMonitoredTargetSnapshots(id) {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.MONITOR_SNAPSHOTS(id));
      return data;
    } catch (err) {
      console.warn('Backend get snapshots failed:', err.message);
    }
  }

  return [];
}

export async function getSchedulerStatus() {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.MONITOR_SCHEDULER_STATUS);
      return data;
    } catch (err) {
      console.warn('Backend get scheduler status failed:', err.message);
    }
  }

  return {
    is_running: true,
    total_probes_run: 12,
    rate_limit_min_interval: 60,
    check_frequency: 10,
    last_heartbeat: new Date().toISOString(),
  };
}

export async function toggleScheduler(action = 'start') {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.MONITOR_SCHEDULER_TOGGLE, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      return data;
    } catch (err) {
      console.warn('Backend toggle scheduler failed:', err.message);
    }
  }

  return { is_running: action === 'start' };
}

export async function getMonitoringAlerts() {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.MONITOR_ALERTS);
      return data;
    } catch (err) {
      console.warn('Backend alerts failed, using demo alerts:', err.message);
    }
  }

  return getStoredAlerts();
}

export async function updateAlertStatus(alertId, newStatus) {
  if (!getDemoMode()) {
    try {
      const data = await apiRequest(API_ENDPOINTS.ALERT_UPDATE_STATUS(alertId), {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      return data;
    } catch (err) {
      console.warn('Backend update alert status failed:', err.message);
    }
  }

  const alerts = getStoredAlerts();
  const updated = alerts.map((a) =>
    a.id === alertId ? { ...a, status: newStatus.toUpperCase() } : a
  );
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
  return updated.find((a) => a.id === alertId);
}

export async function acknowledgeAlert(alertId) {
  return updateAlertStatus(alertId, 'RESOLVED');
}
