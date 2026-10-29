import React, { useState, useEffect } from 'react';
import {
  X,
  GitCompare,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Lock,
  Globe,
  RefreshCw,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { compareScans, getScanHistory } from '../../services/scanService';
import { formatDate } from '../../utils/formatters';

export default function ScanComparisonModal({
  isOpen,
  onClose,
  initialScanA = null,
  initialScanB = null,
}) {
  const [scanAId, setScanAId] = useState(initialScanA?.id || '');
  const [scanBId, setScanBId] = useState(initialScanB?.id || '');
  const [history, setHistory] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      if (initialScanA?.id) setScanAId(initialScanA.id);
      if (initialScanB?.id) setScanBId(initialScanB.id);
    }
  }, [isOpen, initialScanA, initialScanB]);

  const loadHistory = async () => {
    try {
      const data = await getScanHistory();
      const list = Array.isArray(data) ? data : data?.data || [];
      setHistory(list);
      if (!scanAId && list.length > 0) setScanAId(list[0].id);
      if (!scanBId && list.length > 1) setScanBId(list[1].id);
    } catch (e) {
      console.error(e);
    }
  };

  const runComparison = async (idA, idB) => {
    if (!idA || !idB) return;
    setLoading(true);
    setError(null);
    try {
      const res = await compareScans(idA, idB);
      const data = res?.data || res;
      setComparison(data);
    } catch (err) {
      setError(err.message || 'Failed to compare scans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scanAId && scanBId && isOpen) {
      runComparison(scanAId, scanBId);
    }
  }, [scanAId, scanBId, isOpen]);

  if (!isOpen) return null;

  const isEscalation = (comparison?.score_delta ?? 0) > 0;
  const isReduction = (comparison?.score_delta ?? 0) < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-cyber-card border border-cyber-border shadow-2xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyber-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Side-by-Side Threat Delta & Scan Comparison
              </h2>
              <p className="text-xs text-cyber-muted">
                Analyze variance in adaptive risk score, category shift, and newly surfaced factors.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-cyber-darkest transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-cyber-darkest/60 border border-cyber-border">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Base Scan (Scan A)
            </label>
            <select
              value={scanAId}
              onChange={(e) => setScanAId(e.target.value)}
              className="w-full text-xs font-mono bg-cyber-darkest border border-cyber-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {history.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.domain || s.url} ({s.id}) — Score: {s.risk_score ?? s.riskScore ?? 'N/A'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Comparison Target (Scan B)
            </label>
            <select
              value={scanBId}
              onChange={(e) => setScanBId(e.target.value)}
              className="w-full text-xs font-mono bg-cyber-darkest border border-cyber-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {history.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.domain || s.url} ({s.id}) — Score: {s.risk_score ?? s.riskScore ?? 'N/A'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Computing Multi-Vector Threat Delta..." />
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center">
            {error}
          </div>
        ) : comparison ? (
          <div className="space-y-6">
            {/* Score Delta Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isEscalation
                  ? 'bg-red-500/10 border-red-500/30 text-red-200'
                  : isReduction
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyber-darkest/60">
                  {isEscalation ? (
                    <TrendingUp className="w-6 h-6 text-red-400" />
                  ) : isReduction ? (
                    <TrendingDown className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <RefreshCw className="w-6 h-6 text-cyan-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold">
                    Risk Trend: {comparison.trend?.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm font-semibold">{comparison.trend_summary}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase font-mono text-slate-400">Score Delta</div>
                <div
                  className={`text-2xl font-extrabold font-mono ${
                    isEscalation ? 'text-red-400' : isReduction ? 'text-emerald-400' : 'text-cyan-400'
                  }`}
                >
                  {comparison.score_delta > 0 ? `+${comparison.score_delta}` : comparison.score_delta} pts
                </div>
              </div>
            </div>

            {/* Side-by-Side Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Scan A */}
              <div className="p-4 rounded-xl bg-cyber-darkest/50 border border-cyber-border space-y-2">
                <div className="text-[11px] font-mono text-cyber-muted uppercase">Base Scan (A)</div>
                <div className="text-sm font-bold text-slate-100 font-mono truncate">
                  {comparison.scan_a?.url}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-cyber-border">
                  <span className="text-xs text-slate-400 font-mono">Score:</span>
                  <span className="text-xl font-bold font-mono text-cyan-400">
                    {comparison.scan_a?.score}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-200">{comparison.scan_a?.category}</span>
                </div>
              </div>

              {/* Scan B */}
              <div className="p-4 rounded-xl bg-cyber-darkest/50 border border-cyber-border space-y-2">
                <div className="text-[11px] font-mono text-cyber-muted uppercase">Comparison Target (B)</div>
                <div className="text-sm font-bold text-slate-100 font-mono truncate">
                  {comparison.scan_b?.url}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-cyber-border">
                  <span className="text-xs text-slate-400 font-mono">Score:</span>
                  <span
                    className={`text-xl font-bold font-mono ${
                      isEscalation ? 'text-red-400' : isReduction ? 'text-emerald-400' : 'text-cyan-400'
                    }`}
                  >
                    {comparison.scan_b?.score}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-200">{comparison.scan_b?.category}</span>
                </div>
              </div>
            </div>

            {/* 5-Dimension Score Shift Comparison */}
            {comparison.dimension_comparison && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Dimension Score Variance
                </h4>
                <div className="space-y-2">
                  {Object.entries(comparison.dimension_comparison).map(([dimKey, dimData]) => (
                    <div
                      key={dimKey}
                      className="p-3 rounded-lg bg-cyber-darkest/40 border border-cyber-border flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-slate-200">{dimData.title}</span>
                      <div className="flex items-center gap-4 font-mono">
                        <span className="text-slate-400">A: {dimData.scan_a_score}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-slate-200 font-bold">B: {dimData.scan_b_score}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            dimData.delta > 0
                              ? 'bg-red-500/10 text-red-400'
                              : dimData.delta < 0
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {dimData.delta > 0 ? `+${dimData.delta}` : dimData.delta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Newly Surfaced Risk Factors */}
            {comparison.new_risk_factors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Newly Surfaced Risk Factors in Scan B ({comparison.new_risk_factors.length})
                </h4>
                <div className="space-y-1.5">
                  {comparison.new_risk_factors.map((f, i) => (
                    <div
                      key={f.id || i}
                      className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-200 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-red-300">{f.name}</div>
                        <div className="text-[11px] text-red-200/80">{f.explanation}</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-red-400 shrink-0">
                        +{f.impact} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Risk Factors */}
            {comparison.resolved_risk_factors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Resolved Risk Factors ({comparison.resolved_risk_factors.length})
                </h4>
                <div className="space-y-1.5">
                  {comparison.resolved_risk_factors.map((f, i) => (
                    <div
                      key={f.id || i}
                      className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-emerald-300">{f.name}</div>
                        <div className="text-[11px] text-emerald-200/80">{f.explanation}</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                        {f.impact} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-cyber-border">
          <Button variant="secondary" onClick={onClose}>
            Close Comparison
          </Button>
        </div>
      </div>
    </div>
  );
}
