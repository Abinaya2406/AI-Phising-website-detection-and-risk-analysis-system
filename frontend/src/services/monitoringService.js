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
    checkInterval: targetData.checkInterval || 'Every 5 mins',
    status: 'ACTIVE',
    health: 'HEALTHY',
    lastChecked: new Date().toISOString(),
    uptime: '100%',
    sslDaysLeft: 90,
    alertsTriggered: 0,
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

export async function acknowledgeAlert(alertId) {
  const alerts = getStoredAlerts();
  const updated = alerts.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED' } : a));
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

