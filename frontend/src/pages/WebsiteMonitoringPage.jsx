import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Globe2,
  PlusCircle,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  Lock,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusIndicator from '../components/common/StatusIndicator';
import {
  getMonitoredTargets,
  addMonitoredTarget,
  removeMonitoredTarget,
} from '../services/monitoringService';
import { isValidUrl, normalizeUrl } from '../utils/validators';
import { formatTimeAgo } from '../utils/formatters';

export default function WebsiteMonitoringPage() {
  const [searchParams] = useSearchParams();
  const prefillUrl = searchParams.get('add') || '';

  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(Boolean(prefillUrl));

  // Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState(prefillUrl);
  const [interval, setInterval] = useState('Every 5 mins');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTargets = async () => {
    setLoading(true);
    try {
      const data = await getMonitoredTargets();
      setTargets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
  }, []);

  const handleAddTarget = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!url.trim()) {
      setFormError('Please enter a target URL to monitor.');
      return;
    }

    if (!isValidUrl(url)) {
      setFormError('Please enter a valid URL.');
      return;
    }

    setSubmitting(true);
    try {
      const normalized = normalizeUrl(url);
      await addMonitoredTarget({
        name: name.trim() || normalized,
        url: normalized,
        checkInterval: interval,
      });
      setName('');
      setUrl('');
      setShowAddModal(false);
      await loadTargets();
    } catch (err) {
      setFormError(err.message || 'Failed to add target.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    if (confirm('Are you sure you want to stop monitoring this domain?')) {
      await removeMonitoredTarget(id);
      await loadTargets();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" size="sm">
              Continuous Domain Watcher
            </Badge>
            <DemoBadge />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Globe2 className="w-6 h-6 text-cyan-400" />
            Brand Asset & Webpage Continuous Monitoring
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            Automated integrity probes alerting against DNS spoofing, DOM mutations, and fraudulent impersonator spawns.
          </p>
        </div>

        <Button
          variant="primary"
          icon={PlusCircle}
          onClick={() => setShowAddModal(true)}
        >
          Add Monitored Asset
        </Button>
      </div>

      {/* Add Target Drawer / Inline Modal */}
      {showAddModal && (
        <Card
          title="Configure New Monitored Website"
          subtitle="Establish automated polling interval and defacement telemetry"
          icon={PlusCircle}
          action={
            <button
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-200 text-xs font-mono"
            >
              Cancel
            </button>
          }
        >
          <form onSubmit={handleAddTarget} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Asset Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Customer SSO Portal"
                  className="w-full px-3 py-2 rounded-lg bg-cyber-darkest border border-cyber-border text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Target URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://auth.mycompany.com"
                  className="w-full px-3 py-2 rounded-lg bg-cyber-darkest border border-cyber-border text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Check Frequency</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cyber-darkest border border-cyber-border text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
                >
                  <option>Every 1 min</option>
                  <option>Every 5 mins</option>
                  <option>Every 15 mins</option>
                  <option>Every 1 hour</option>
                </select>
              </div>
            </div>

            {formError && (
              <p className="text-red-400 text-xs font-mono">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddModal(false)}
              >
                Close
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={submitting}
              >
                Start Monitoring
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <LoadingSpinner text="Retrieving Monitored Assets..." />
      ) : (
        /* Monitored Assets Table / Cards */
        <Card
          title={`Active Monitoring Roster (${targets.length})`}
          subtitle="Real-time uptime and integrity status"
          icon={ShieldCheck}
          action={
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={loadTargets}
            >
              Refresh Status
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-cyber-border text-slate-400 uppercase text-[11px] tracking-wider">
                  <th className="pb-3 px-3">Monitored Service</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Health Audit</th>
                  <th className="pb-3 px-3">Uptime</th>
                  <th className="pb-3 px-3">SSL Cert</th>
                  <th className="pb-3 px-3">Last Ping</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                {targets.map((t) => {
                  const isAlert = t.status === 'ALERTING' || t.health.includes('DEFACED') || t.health.includes('SUSPICIOUS');
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-cyber-cardHover/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-100">{t.name}</div>
                        <div className="text-[11px] text-cyber-muted truncate max-w-xs">{t.url}</div>
                      </td>
                      <td className="py-3 px-3">
                        <StatusIndicator
                          status={t.status === 'ACTIVE' ? 'online' : t.status === 'ALERTING' ? 'danger' : 'offline'}
                          text={t.status}
                          pulse={t.status === 'ALERTING'}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={isAlert ? 'danger' : 'safe'}
                          size="xs"
                        >
                          {t.health}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-bold">{t.uptime}</td>
                      <td className="py-3 px-3">
                        <span className={t.sslDaysLeft < 15 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {t.sslDaysLeft} days left
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {formatTimeAgo(t.lastChecked)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRemove(t.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          title="Remove monitor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

