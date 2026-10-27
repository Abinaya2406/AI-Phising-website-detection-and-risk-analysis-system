import { RISK_LEVELS } from './constants';

export const getRiskMeta = (score) => {
  const numeric = Math.min(100, Math.max(0, Number(score) || 0));
  if (numeric <= RISK_LEVELS.SAFE.max) {
    return { ...RISK_LEVELS.SAFE, score: numeric };
  }
  if (numeric <= RISK_LEVELS.SUSPICIOUS.max) {
    return { ...RISK_LEVELS.SUSPICIOUS, score: numeric };
  }
  return { ...RISK_LEVELS.MALICIOUS, score: numeric };
};

export const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch (e) {
    return isoString;
  }
};

export const formatTimeAgo = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);

    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  } catch (e) {
    return isoString;
  }
};

export const truncateString = (str, length = 45) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

