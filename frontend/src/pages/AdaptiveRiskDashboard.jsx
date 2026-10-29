import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  PieChart as PieIcon,
  Globe,
  RefreshCw,
  Award,
  Sliders,
  CheckCircle,
  GitCompare,
  Key,
  Lock,
  Camera,
  Server,
  Layers,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ThreatTrendChart from '../components/charts/ThreatTrendChart';
import CategoryBreakdownChart from '../components/charts/CategoryBreakdownChart';
import ScanComparisonModal from '../components/scanner/ScanComparisonModal';
import {
  getRiskMetrics,
  getRiskThresholds,
  updateRiskThresholds,
  evaluateThresholds,
} from '../services/riskService';
import { DEFAULT_THRESHOLDS } from '../utils/constants';

const DIM_ICONS = {
  url_lexical: Key,
  domain_intelligence: Lock,
  visual_impersonation: Camera,
  page_content: Globe,
  redirect_routing: Server,
};

export default function AdaptiveRiskDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');

  // Configurable thresholds state
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [evalResult, setEvalResult] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Compare Modal
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const fetchMetrics = async (tf) => {
    setLoading(true);
    try {
      const data = await getRiskMetrics(tf);
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadThresholds = async () => {
    try {
      const th = await getRiskThresholds();
      if (th) setThresholds(th);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMetrics(timeframe);
    loadThresholds();
  }, [timeframe]);

  const handleEvaluateThresholds = async () => {
    setEvalLoading(true);
    setSaveStatus(null);
    try {
      const res = await evaluateThresholds(thresholds);
      setEvalResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setEvalLoading(false);
    }
  };

  const handleSaveThresholds = async () => {
    setSaveStatus('saving');
    try {
      await updateRiskThresholds(thresholds);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
      fetchMetrics(timeframe);
    } catch (e) {
      setSaveStatus('error');
    }
  };

  if (loading && !metrics) {
    return <LoadingSpinner text="Aggregating Threat Landscape Telemetry..." />;
  }

  const summary = metrics?.summary || {};

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" size="sm">
              Global Cybersecurity Telemetry
            </Badge>
            <DemoBadge />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-400" />
            Adaptive Phishing Risk Dashboard
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            Multi-evidence risk aggregation, 4-tier category classification, and benchmark threshold calibration.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={GitCompare}
            onClick={() => setCompareModalOpen(true)}
          >
            Compare Scans
          </Button>

          <div className="flex rounded-lg bg-cyber-darkest border border-cyber-border p-1 text-xs font-mono">
            {['24h', '7d', '30d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchMetrics(timeframe)}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 4-Tier Classification Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Critical */}
        <div className="p-4 rounded-xl bg-cyber-card border border-red-500/30 bg-red-950/10">
          <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
            <span className="text-red-400 font-bold">Critical (80-100)</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-red-400 font-mono">
            {summary.criticalCount?.toLocaleString() || '195'}
          </div>
          <span className="text-[10px] text-red-400/80 font-mono mt-1 block">Active Impersonations</span>
        </div>

        {/* High */}
        <div className="p-4 rounded-xl bg-cyber-card border border-orange-500/30 bg-orange-950/10">
          <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
            <span className="text-orange-400 font-bold">High (60-79)</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-orange-400 font-mono">
            {summary.highCount?.toLocaleString() || '187'}
          </div>
          <span className="text-[10px] text-orange-300/80 font-mono mt-1 block">Strong Phish Signatures</span>
        </div>

        {/* Medium */}
        <div className="p-4 rounded-xl bg-cyber-card border border-amber-500/30 bg-amber-950/10">
          <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
            <span className="text-amber-400 font-bold">Medium (30-59)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">
            {summary.mediumCount?.toLocaleString() || '219'}
          </div>
          <span className="text-[10px] text-amber-300/80 font-mono mt-1 block">Suspicious Inconclusive</span>
        </div>

        {/* Low */}
        <div className="p-4 rounded-xl bg-cyber-card border border-emerald-500/30 bg-emerald-950/10">
          <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
            <span className="text-emerald-400 font-bold">Low (0-29)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-mono">
            {summary.lowCount?.toLocaleString() || '819'}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono mt-1 block">Clean Verified Sites</span>
        </div>
      </div>

      {/* 5-Dimension Telemetry Strip */}
      <Card
        title="Evidence Dimension Telemetry"
        subtitle="Average threat scores and baseline weights across the 5 orthogonal analytical vectors"
        icon={Layers}
      >
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {(metrics?.evidenceDimensions || [
            { dimension: 'URL Lexical', avgScore: 42.5, weight: 30, key: 'url_lexical' },
            { dimension: 'Domain Intel', avgScore: 38.1, weight: 25, key: 'domain_intelligence' },
            { dimension: 'Visual Match', avgScore: 29.4, weight: 20, key: 'visual_impersonation' },
            { dimension: 'Page Content', avgScore: 33.7, weight: 15, key: 'page_content' },
            { dimension: 'Redirect Routing', avgScore: 18.2, weight: 10, key: 'redirect_routing' },
          ]).map((dim) => {
            const Icon = DIM_ICONS[dim.key] || Globe;
            return (
              <div
                key={dim.key}
                className="p-3.5 rounded-xl bg-cyber-darkest/60 border border-cyber-border space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {dim.avgScore} / 100
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-100">{dim.dimension}</div>
                <div className="text-[10px] text-cyber-muted">Weight: {dim.weight}%</div>
                <div className="w-full h-1.5 bg-cyber-darkest rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${dim.avgScore}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Feature 3: Configurable Category Thresholds & Validation Evaluator */}
      <Card
        title="Configurable Category Thresholds & Empirical Validation"
        subtitle="Adjust category boundaries and evaluate against the labeled ground-truth benchmark dataset"
        icon={Sliders}
      >
        <div className="space-y-6">
          {/* Sliders / Cutoff Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-cyber-darkest/60 border border-cyber-border space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase">Low Risk Upper Max</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={thresholds.low?.max ?? 29}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      low: { ...thresholds.low, max: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-20 px-2 py-1 bg-cyber-darkest border border-cyber-border rounded text-sm font-mono text-emerald-400"
                />
                <span className="text-xs font-mono text-slate-400">0 to {thresholds.low?.max}</span>
              </div>
              <p className="text-[10px] text-cyber-muted">{thresholds.low?.description}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-cyber-darkest/60 border border-cyber-border space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase">Medium Risk Max</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="30"
                  max="65"
                  value={thresholds.medium?.max ?? 59}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      medium: { ...thresholds.medium, max: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-20 px-2 py-1 bg-cyber-darkest border border-cyber-border rounded text-sm font-mono text-amber-400"
                />
                <span className="text-xs font-mono text-slate-400">
                  {(thresholds.low?.max ?? 29) + 1} to {thresholds.medium?.max}
                </span>
              </div>
              <p className="text-[10px] text-cyber-muted">{thresholds.medium?.description}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-cyber-darkest/60 border border-cyber-border space-y-2">
              <span className="text-xs font-bold text-orange-400 uppercase">High Risk Max</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="60"
                  max="85"
                  value={thresholds.high?.max ?? 79}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      high: { ...thresholds.high, max: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-20 px-2 py-1 bg-cyber-darkest border border-cyber-border rounded text-sm font-mono text-orange-400"
                />
                <span className="text-xs font-mono text-slate-400">
                  {(thresholds.medium?.max ?? 59) + 1} to {thresholds.high?.max}
                </span>
              </div>
              <p className="text-[10px] text-cyber-muted">{thresholds.high?.description}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-cyber-darkest/60 border border-cyber-border space-y-2">
              <span className="text-xs font-bold text-red-400 uppercase">Critical Threshold</span>
              <div className="flex items-center gap-2">
                <span className="w-20 px-2 py-1 bg-cyber-darkest/80 border border-cyber-border rounded text-sm font-mono text-red-400 text-center">
                  {(thresholds.high?.max ?? 79) + 1}
                </span>
                <span className="text-xs font-mono text-slate-400">to 100</span>
              </div>
              <p className="text-[10px] text-cyber-muted">{thresholds.critical?.description}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                onClick={handleEvaluateThresholds}
                loading={evalLoading}
              >
                Evaluate on Validation Set
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveThresholds}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving'
                  ? 'Saving...'
                  : saveStatus === 'saved'
                  ? 'Saved Active Thresholds ✓'
                  : 'Save Thresholds'}
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setThresholds(DEFAULT_THRESHOLDS);
                setEvalResult(null);
              }}
            >
              Reset to Recommended
            </Button>
          </div>

          {/* Benchmark Evaluation Results */}
          {evalResult && (
            <div className="p-4 rounded-xl bg-cyber-darkest/80 border border-cyber-border space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-cyber-border pb-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Validation Benchmark Metrics (10 Labeled Samples)
                </span>
                <Badge variant="cyan" size="xs">
                  Ground Truth Calibrated
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-cyber-card border border-cyber-border text-center">
                  <span className="text-cyber-muted block text-[10px]">ACCURACY</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {Math.round((evalResult.metrics?.accuracy ?? 0) * 100)}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-cyber-card border border-cyber-border text-center">
                  <span className="text-cyber-muted block text-[10px]">PRECISION</span>
                  <span className="text-lg font-bold text-cyan-400">
                    {Math.round((evalResult.metrics?.precision ?? 0) * 100)}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-cyber-card border border-cyber-border text-center">
                  <span className="text-cyber-muted block text-[10px]">RECALL</span>
                  <span className="text-lg font-bold text-cyan-400">
                    {Math.round((evalResult.metrics?.recall ?? 0) * 100)}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-cyber-card border border-cyber-border text-center">
                  <span className="text-cyber-muted block text-[10px]">F1-SCORE</span>
                  <span className="text-lg font-bold text-purple-400">
                    {evalResult.metrics?.f1_score ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-cyber-card border border-cyber-border text-center">
                  <span className="text-cyber-muted block text-[10px]">FALSE POSITIVES</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {evalResult.metrics?.false_positives ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Threat Trend Area Chart */}
      <Card
        title="24-Hour Phishing Threat Trajectory"
        subtitle="Distribution of safe vs suspicious vs malicious site discoveries over time"
        icon={TrendingUp}
      >
        <ThreatTrendChart data={metrics?.trend24h || []} />
      </Card>

      {/* Grid: Attack Category Breakdown & Top Targeted Brands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Types Distribution */}
        <Card
          title="Attack Vector Distribution"
          subtitle="Proportion of detected phishing methodologies"
          icon={PieIcon}
        >
          <CategoryBreakdownChart data={metrics?.attackCategoryDistribution || []} />
        </Card>

        {/* Most Targeted Brands Leaderboard */}
        <Card
          title="Most Targeted Enterprise Brands"
          subtitle="Top entities impersonated in zero-day phishing campaigns"
          icon={Award}
        >
          <div className="space-y-3 font-mono text-xs">
            {metrics?.targetedBrandsTop?.map((brand, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-cyber-darkest/70 border border-cyber-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-200">{brand.brand}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{brand.count} domains</span>
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-[11px]">
                    {brand.share}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Scan Comparison Modal */}
      <ScanComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
      />
    </div>
  );
}
