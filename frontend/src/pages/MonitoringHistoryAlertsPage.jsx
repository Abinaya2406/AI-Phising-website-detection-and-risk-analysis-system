import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  ExternalLink,
  Search,
  Check,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { getMonitoringAlerts, updateAlertStatus, acknowledgeAlert } from '../services/monitoringService';
import { formatDate, formatTimeAgo } from '../utils/formatters';

export default function MonitoringHistoryAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await getMonitoringAlerts();
      setAlerts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateAlertStatus(id, newStatus);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error('Failed to update alert status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = alerts.filter((a) => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="danger" size="sm">
              SOC Security Incident Log
            </Badge>
            <DemoBadge />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <BellRing className="w-6 h-6 text-red-400" />
            Monitoring Alerts & Defacement Incident History
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            Audit trail of unauthorized content alteration, credential harvesting form injections, SSL degradation, and probe connectivity failures.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchAlerts}
          loading={loading}
        >
          Sync Alerts
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-cyber-darkest/80 border border-cyber-border font-mono text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterSeverity === sev
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400">Status:</span>
          {['ALL', 'OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterStatus === st
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading Incident Logs & Change History..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Matching Incidents Found"
          description="All monitored domains are in healthy compliance with no active threat alerts matching your filter criteria."
        />
      ) : (
        /* Alerts List */
        <div className="space-y-4">
          {filtered.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';
            const isResolved = alert.status === 'RESOLVED';
            const timestamp = alert.created_at || alert.timestamp || new Date().toISOString();
            const targetName = alert.target_name || alert.targetName || alert.target_id || 'Monitored Target';

            return (
              <div
                key={alert.id || alert._id}
                className={`p-5 rounded-xl bg-cyber-card border transition-all ${
                  isResolved
                    ? 'border-cyber-border opacity-70'
                    : isCritical
                    ? 'border-red-500/40 shadow-danger-glow'
                    : isHigh
                    ? 'border-amber-500/40'
                    : 'border-cyber-border'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={isCritical ? 'danger' : isHigh ? 'warning' : 'info'}
                      size="xs"
                    >
                      {alert.severity}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {targetName}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-[11px] font-mono text-cyber-muted">
                      {formatTimeAgo(timestamp)} ({formatDate(timestamp)})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-slate-500 text-[11px]">Lifecycle:</span>
                    <select
                      value={alert.status || 'OPEN'}
                      disabled={updatingId === alert.id}
                      onChange={(e) => handleStatusChange(alert.id, e.target.value)}
                      className="px-2 py-1 rounded bg-cyber-darkest border border-cyber-border text-[11px] text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-100 mb-1">{alert.title}</h3>
                <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">
                  {alert.message}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-cyber-border/60 text-xs font-mono">
                  <span className="text-cyber-muted text-[11px]">ID: {alert.id || alert._id}</span>
                  {!isResolved ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(alert.id, 'RESOLVED')}
                      loading={updatingId === alert.id}
                    >
                      Mark as Resolved
                    </Button>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved & Closed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
