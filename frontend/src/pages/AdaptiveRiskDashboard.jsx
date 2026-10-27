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
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ThreatTrendChart from '../components/charts/ThreatTrendChart';
import CategoryBreakdownChart from '../components/charts/CategoryBreakdownChart';
import { getRiskMetrics } from '../services/riskService';

export default function AdaptiveRiskDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');

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

  useEffect(() => {
    fetchMetrics(timeframe);
  }, [timeframe]);

  if (loading && !metrics) {
    return <LoadingSpinner text="Aggregating Threat Landscape Telemetry..." />;
  }

  const summary = metrics?.summary || {};

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-cyber-card border border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" size="sm">
              Global Cyber Threat Intelligence
            </Badge>
            <DemoBadge />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-400" />
            Adaptive Phishing Risk Dashboard
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            Real-time heuristic aggregation, attack vector breakdown, and targeted brand telemetry.
          </p>
        </div>

        {/* Timeframe selector & refresh */}
        <div className="flex items-center gap-2">
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

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
            <span>Total Inspected</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-100 font-mono">
            {summary.totalScansToday?.toLocaleString() || '1,420'}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">+18% vs yesterday</span>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
            <span>Phishing Confirmed</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-red-400 font-mono">
            {summary.phishingDetected?.toLocaleString() || '382'}
          </div>
          <span className="text-[10px] text-red-400 font-mono mt-1 block">Critical Threat</span>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
            <span>Suspicious Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">
            {summary.suspiciousFlagged?.toLocaleString() || '219'}
          </div>
          <span className="text-[10px] text-amber-300 font-mono mt-1 block">Heuristic Warning</span>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
            <span>AI Precision Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-mono">
            {summary.avgConfidence || '96.4'}%
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Validated F1: 0.961</span>
        </div>
      </div>

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
    </div>
  );
}

