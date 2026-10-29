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
  AlertTriangle,
  Activity,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Eye,
  X,
  Zap,
  TrendingUp,
  TrendingDown,
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
  pauseMonitoredTarget,
  resumeMonitoredTarget,
  checkMonitoredTargetNow,
  getMonitoredTargetChanges,
  getMonitoredTargetSnapshots,
  getSchedulerStatus,
  toggleScheduler,
} from '../services/monitoringService';
import { isValidUrl, normalizeUrl } from '../utils/validators';
import { formatTimeAgo, formatDate } from '../utils/formatters';

export default function WebsiteMonitoringPage() {
  const [searchParams] = useSearchParams();
  const prefillUrl = searchParams.get('add') || '';

  const [targets, setTargets] = useState([]);
  const [scheduler, setScheduler] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(Boolean(prefillUrl));

  // Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState(prefillUrl);
  const [interval, setInterval] = useState('Every 5 mins');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Inspector Drawer State
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [targetChanges, setTargetChanges] = useState([]);
  const [targetSnapshots, setTargetSnapshots] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [inspectTab, setInspectTab] = useState('timeline'); // 'timeline' | 'snapshots'
  const [probingId, setProbingId] = useState(null);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [targetsData, schedData] = await Promise.all([
        getMonitoredTargets(),
        getSchedulerStatus(),
      ]);
      setTargets(targetsData || []);
      setScheduler(schedData || null);
    } catch (e) {
      console.error('Failed to load monitoring telemetry:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh scheduler heartbeat and target health every 15 seconds
    const intervalId = setInterval(() => {
      loadData(true);
    }, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const handleAddTarget = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!url.trim()) {
      setFormError('Please enter a target URL to monitor.');
      return;
    }

    if (!isValidUrl(url)) {
      setFormError('Please enter a valid HTTP/HTTPS URL.');
      return;
    }

    setSubmitting(true);
    try {
      const normalized = normalizeUrl(url);
      await addMonitoredTarget({
        name: name.trim() || normalized,
        url: normalized,
        check_interval: interval,
      });
      setName('');
      setUrl('');
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to add target.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    if (confirm('Are you sure you want to stop monitoring this domain and delete historical snapshots?')) {
      await removeMonitoredTarget(id);
      if (selectedTarget?.id === id) {
        setSelectedTarget(null);
      }
      await loadData();
    }
  };

  const handlePause = async (id) => {
    await pauseMonitoredTarget(id);
    await loadData(true);
  };

  const handleResume = async (id) => {
    await resumeMonitoredTarget(id);
    await loadData(true);
  };

  const handleCheckNow = async (id) => {
    setProbingId(id);
    try {
      await checkMonitoredTargetNow(id);
      await loadData(true);
      if (selectedTarget?.id === id) {
        openInspector(selectedTarget);
      }
    } catch (err) {
      console.error('Probe failed:', err);
    } finally {
      setProbingId(null);
    }
  };

  const handleToggleScheduler = async () => {
    const nextAction = scheduler?.is_running ? 'stop' : 'start';
    const updated = await toggleScheduler(nextAction);
    setScheduler((prev) => ({ ...prev, is_running: updated?.is_running ?? !prev?.is_running }));
  };

  const openInspector = async (target) => {
    setSelectedTarget(target);
    setHistoryLoading(true);
    try {
      const [changes, snaps] = await Promise.all([
        getMonitoredTargetChanges(target.id),
        getMonitoredTargetSnapshots(target.id),
      ]);
      setTargetChanges(changes || []);
      setTargetSnapshots(snaps || []);
    } catch (err) {
      console.error('Failed to load target history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" size="sm">
              Continuous Watchdog Engine
            </Badge>
            <DemoBadge />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Globe2 className="w-6 h-6 text-cyan-400" />
            Website Change Monitoring & Historical Risk Analysis
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            Daemon background scheduler actively polling enrolled web assets for unauthorized DOM mutations, credential harvesting form injections, SSL degradation, and visual brand defacement.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadData(true)}
            loading={refreshing}
          >
            Sync
          </Button>
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={() => setShowAddModal(true)}
          >
            Add Monitored Asset
          </Button>
        </div>
      </div>

      {/* Real-time Background Scheduler Telemetry Card */}
      <div className="p-4 rounded-xl bg-cyber-darkest/90 border border-cyber-border/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${scheduler?.is_running ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
            <Activity className={`w-5 h-5 ${scheduler?.is_running ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-200">
                BACKGROUND SCHEDULER DAEMON:
              </span>
              <Badge
                variant={scheduler?.is_running ? 'safe' : 'warning'}
                size="xs"
              >
                {scheduler?.is_running ? 'RUNNING (POLLING QUEUE)' : 'SUSPENDED'}
              </Badge>
            </div>
            <p className="text-[11px] text-cyber-muted font-mono mt-0.5">
              Poll Interval: {scheduler?.check_frequency || 10}s | Rate Limit Floor: {scheduler?.rate_limit_min_interval || 60}s | Total Automated Probes: <span className="text-cyan-400 font-bold">{scheduler?.total_probes_run || 0}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={scheduler?.is_running ? 'secondary' : 'primary'}
            size="sm"
            icon={scheduler?.is_running ? Pause : Play}
            onClick={handleToggleScheduler}
          >
            {scheduler?.is_running ? 'Pause Scheduler' : 'Start Scheduler'}
          </Button>
        </div>
      </div>

      {/* Add Target Drawer / Inline Modal */}
      {showAddModal && (
        <Card
          title="Enroll Website for Continuous Monitoring"
          subtitle="Establish cryptographic baseline snapshot, redirect bounds, and periodic integrity probe schedule"
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
                  placeholder="e.g. Corporate Login Portal"
                  className="w-full px-3 py-2 rounded-lg bg-cyber-darkest border border-cyber-border text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Target URL (HTTPS)</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://auth.company-example.com"
                  className="w-full px-3 py-2 rounded-lg bg-cyber-darkest border border-cyber-border text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Probe Frequency</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cyber-darkest border border-cyber-border text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
                >
                  <option>Every 1 min</option>
                  <option>Every 5 mins</option>
                  <option>Every 15 mins</option>
                  <option>Every 1 hour</option>
                  <option>Every 6 hours</option>
                  <option>Every 24 hours</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-[11px] font-mono text-cyan-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Trust SSRF Defense:</strong> Outbound probes strictly revalidate destination IPs, DNS entries, and intermediate redirect hops against loopback, private RFC1918, and metadata endpoints.
              </span>
            </div>

            {formError && (
              <p className="text-red-400 text-xs font-mono bg-red-950/20 p-2.5 rounded border border-red-900/40">
                {formError}
              </p>
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
                Enroll & Capture Baseline
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <LoadingSpinner text="Querying Continuous Monitoring Roster & Snapshots..." />
      ) : (
        /* Monitored Assets Table */
        <Card
          title={`Enrolled Assets Under Watch (${targets.length})`}
          subtitle="Real-time baseline divergence, risk score tracking, and automated probe telemetry"
          icon={ShieldCheck}
          action={
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadData(true)}
              loading={refreshing}
            >
              Refresh
            </Button>
          }
        >
          {targets.length === 0 ? (
            <div className="py-12 text-center font-mono">
              <Globe2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-bold">No websites currently enrolled in continuous monitoring</p>
              <p className="text-xs text-cyber-muted mt-1">Enroll an asset to detect credential form hijacking, defacement mutations, and SSL anomalies.</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                icon={PlusCircle}
                onClick={() => setShowAddModal(true)}
              >
                Add First Website
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-cyber-border text-slate-400 uppercase text-[11px] tracking-wider">
                    <th className="pb-3 px-3">Monitored Service</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Health State</th>
                    <th className="pb-3 px-3">Risk Telemetry</th>
                    <th className="pb-3 px-3">Last Probed</th>
                    <th className="pb-3 px-3">Next Scheduled</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/40">
                  {targets.map((t) => {
                    const isPaused = t.status === 'PAUSED';
                    const isDegraded = t.health === 'DEGRADED';
                    const isMutated = t.health === 'MUTATED' || t.health === 'DEFACED' || (t.alerts_count || 0) > 0;
                    const delta = t.risk_delta ?? (t.current_risk_score - (t.previous_risk_score ?? t.baseline_risk_score));
                    const score = t.current_risk_score ?? t.baseline_risk_score ?? 15;

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-cyber-cardHover/50 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100">{t.name}</span>
                            <a
                              href={t.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-cyan-400 transition-colors"
                              title="Visit live target"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <div className="text-[11px] text-cyber-muted truncate max-w-xs">{t.url}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Interval: {t.check_interval || 'Every 5 mins'} | Probes: {t.total_checks ?? 1}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <StatusIndicator
                            status={isPaused ? 'offline' : isDegraded ? 'warning' : 'online'}
                            text={t.status || 'ACTIVE'}
                          />
                        </td>

                        <td className="py-3 px-3">
                          <Badge
                            variant={isDegraded ? 'warning' : isMutated ? 'danger' : 'safe'}
                            size="xs"
                          >
                            {t.health || 'HEALTHY'}
                          </Badge>
                          {t.last_error && (
                            <div className="text-[10px] text-red-400 truncate max-w-[140px] mt-0.5" title={t.last_error}>
                              Err: {t.last_error}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className={score >= 70 ? 'text-red-400' : score >= 40 ? 'text-amber-400' : 'text-emerald-400'}>
                              {score}/100
                            </span>
                            {delta !== 0 && (
                              <span className={`text-[10px] flex items-center ${delta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {delta > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                {delta > 0 ? `+${delta}` : delta}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Base: {t.baseline_risk_score ?? 15}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-300 text-[11px]">
                          {formatTimeAgo(t.last_checked || t.created_at)}
                        </td>

                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {isPaused ? (
                            <span className="text-slate-500 italic">Paused</span>
                          ) : (
                            formatTimeAgo(t.next_check)
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Probe Now */}
                            <button
                              onClick={() => handleCheckNow(t.id)}
                              disabled={probingId === t.id}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors"
                              title="Execute Integrity Probe Now"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${probingId === t.id ? 'animate-spin text-cyan-400' : ''}`} />
                            </button>

                            {/* Pause / Resume */}
                            {isPaused ? (
                              <button
                                onClick={() => handleResume(t.id)}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                                title="Resume Monitoring"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePause(t.id)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                                title="Pause Monitoring"
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Inspector Timeline */}
                            <button
                              onClick={() => openInspector(t)}
                              className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
                              title="Inspect Timeline & Historical Snapshots"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleRemove(t.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Remove Target"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Target Details, Timeline & Snapshot History Modal Drawer */}
      {selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] bg-cyber-card border border-cyber-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-cyber-border flex items-start justify-between bg-cyber-darkest/70">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="cyan" size="xs">
                    Historical Risk Telemetry
                  </Badge>
                  <Badge
                    variant={selectedTarget.health === 'HEALTHY' ? 'safe' : 'danger'}
                    size="xs"
                  >
                    {selectedTarget.health}
                  </Badge>
                </div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  {selectedTarget.name}
                </h2>
                <div className="flex items-center gap-2 font-mono text-xs text-cyber-muted mt-1">
                  <span>{selectedTarget.url}</span>
                  <span>•</span>
                  <span>Baseline Score: {selectedTarget.baseline_risk_score ?? 15}</span>
                  <span>•</span>
                  <span>Current Score: {selectedTarget.current_risk_score ?? 15}</span>
                  {selectedTarget.risk_delta ? (
                    <span className={selectedTarget.risk_delta > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      (Δ {selectedTarget.risk_delta > 0 ? `+${selectedTarget.risk_delta}` : selectedTarget.risk_delta})
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="xs"
                  icon={RefreshCw}
                  loading={probingId === selectedTarget.id}
                  onClick={() => handleCheckNow(selectedTarget.id)}
                >
                  Probe Now
                </Button>
                <button
                  onClick={() => setSelectedTarget(null)}
                  className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-cyber-darkest transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-cyber-border bg-cyber-darkest/40 px-5">
              <button
                onClick={() => setInspectTab('timeline')}
                className={`py-3 px-4 font-mono text-xs border-b-2 font-bold transition-colors ${
                  inspectTab === 'timeline'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Change Events Timeline ({targetChanges.length})
              </button>
              <button
                onClick={() => setInspectTab('snapshots')}
                className={`py-3 px-4 font-mono text-xs border-b-2 font-bold transition-colors ${
                  inspectTab === 'snapshots'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Snapshot Archives ({targetSnapshots.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs space-y-4">
              {historyLoading ? (
                <LoadingSpinner text="Retrieving snapshot history and mutation logs..." />
              ) : inspectTab === 'timeline' ? (
                /* Timeline View */
                targetChanges.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="font-bold">No suspicious mutations detected</p>
                    <p className="text-[11px] text-cyber-muted mt-1">Target is matching baseline snapshot criteria with zero security escalations.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyber-border">
                    {targetChanges.map((chg) => {
                      const isBaseline = chg.change_type === 'BASELINE_CAPTURED';
                      const isCritical = chg.severity === 'CRITICAL';
                      const isHigh = chg.severity === 'HIGH';

                      return (
                        <div key={chg.id || chg._id} className="relative group">
                          {/* Node Icon */}
                          <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-cyber-darkest ${
                            isBaseline ? 'border-cyan-400' : isCritical ? 'border-red-500 bg-red-500/20' : isHigh ? 'border-orange-500 bg-orange-500/20' : 'border-amber-400'
                          }`} />

                          <div className="p-4 rounded-xl bg-cyber-darkest border border-cyber-border group-hover:border-cyber-border/80 transition-colors">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={isBaseline ? 'cyan' : isCritical ? 'danger' : isHigh ? 'warning' : 'neutral'}
                                  size="xs"
                                >
                                  {chg.change_type}
                                </Badge>
                                <span className="text-slate-300 font-bold">{chg.description}</span>
                              </div>
                              <span className="text-[11px] text-slate-500">
                                {formatDate(chg.detected_at)} ({formatTimeAgo(chg.detected_at)})
                              </span>
                            </div>

                            {/* Risk Delta Telemetry */}
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-lg border border-cyber-border/40">
                              <span>Previous Risk: <strong className="text-slate-200">{chg.previous_risk_score}</strong></span>
                              <span>→</span>
                              <span>New Risk: <strong className={chg.new_risk_score >= 60 ? 'text-red-400' : 'text-slate-200'}>{chg.new_risk_score}</strong></span>
                              {chg.risk_delta ? (
                                <span className={chg.risk_delta > 0 ? 'text-red-400 font-bold ml-auto' : 'text-emerald-400 font-bold ml-auto'}>
                                  Risk Escalation: {chg.risk_delta > 0 ? `+${chg.risk_delta}` : chg.risk_delta}
                                </span>
                              ) : null}
                            </div>

                            {/* Diff Details */}
                            {chg.diff_details && Object.keys(chg.diff_details).length > 0 && (
                              <div className="mt-3 text-[11px] font-mono text-slate-400">
                                <div className="text-slate-500 uppercase text-[10px] tracking-wider mb-1">Divergence Forensics:</div>
                                <pre className="bg-cyber-darkest/90 p-2.5 rounded border border-cyber-border/60 text-cyan-300 overflow-x-auto text-[10px]">
                                  {JSON.stringify(chg.diff_details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Snapshots View */
                targetSnapshots.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <p>No snapshot archives stored yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {targetSnapshots.map((snap, idx) => (
                      <div
                        key={snap.id || snap._id || idx}
                        className="p-3.5 rounded-xl bg-cyber-darkest border border-cyber-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-200 font-bold">{snap.title || 'Untitled Document'}</span>
                            <Badge variant="neutral" size="xs">
                              HTTP {snap.status_code || 200}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-cyber-muted space-x-2">
                            <span>Hash: <code className="text-cyan-400">{snap.content_hash ? snap.content_hash.substring(0, 16) : 'N/A'}...</code></span>
                            <span>•</span>
                            <span>Forms: {snap.forms_info?.total_forms ?? 0}</span>
                            <span>•</span>
                            <span>SSL: {snap.ssl_info?.issuer || 'Verified'}</span>
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs text-slate-400">
                          <div>Risk: <strong className="text-slate-200">{snap.risk_score}</strong> ({snap.risk_category || 'Low'})</div>
                          <div className="text-[10px] text-slate-500">{formatDate(snap.captured_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-cyber-border bg-cyber-darkest/90 flex justify-between items-center text-xs text-cyber-muted font-mono">
              <span>Target ID: <code className="text-slate-400">{selectedTarget.id}</code></span>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setSelectedTarget(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
