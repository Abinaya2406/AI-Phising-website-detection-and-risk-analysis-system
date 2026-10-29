import React, { useState } from 'react';
import {
  Key,
  Lock,
  Camera,
  Globe,
  Server,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Shield,
  Layers,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

const DIMENSION_ICONS = {
  url_lexical: Key,
  domain_intelligence: Lock,
  visual_impersonation: Camera,
  page_content: Globe,
  redirect_routing: Server,
};

export default function EvidenceBreakdownCard({ adaptiveRisk, className = '' }) {
  const [selectedDimension, setSelectedDimension] = useState('all');

  if (!adaptiveRisk) {
    return (
      <Card className="text-center py-8">
        <Info className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
        <p className="text-sm text-slate-300 font-medium">Adaptive Risk Telemetry Not Generated</p>
        <p className="text-xs text-cyber-muted mt-1">Submit a URL to compute multi-vector evidence breakdown.</p>
      </Card>
    );
  }

  const {
    adaptive_risk_score,
    risk_category,
    model_probability,
    completeness_pct = 100,
    uncertainty_margin = 0,
    dimension_scores = {},
    evidence_breakdown = [],
    disclaimer,
  } = adaptiveRisk;

  // Filter factors by tab
  const filteredFactors = selectedDimension === 'all'
    ? evidence_breakdown
    : evidence_breakdown.filter((f) => f.dimension === selectedDimension);

  const missingDimensions = Object.entries(dimension_scores).filter(
    ([, data]) => data.availability === 'UNAVAILABLE' || data.availability === 'PARTIAL'
  );

  return (
    <Card className={`space-y-6 ${className}`}>
      {/* Header with Title and Completeness Telemetry */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Layers className="w-4 h-4" />
            </span>
            <Badge variant="cyan" size="sm">
              Feature 3: Adaptive Risk Synthesis
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Adaptive Phishing Risk & Evidence Breakdown
          </h3>
          <p className="text-xs text-cyber-muted mt-0.5">
            Calibrated multi-source evidence fusion across 5 orthogonal cybersecurity dimensions.
          </p>
        </div>

        {/* Telemetry pill */}
        <div className="flex items-center gap-3 bg-cyber-darkest/70 border border-cyber-border px-3.5 py-2 rounded-xl text-xs font-mono">
          <div>
            <div className="text-[10px] text-cyber-muted uppercase">Evidence Completeness</div>
            <div className="text-sm font-bold text-cyan-300">{completeness_pct}%</div>
          </div>
          <div className="w-px h-6 bg-cyber-border" />
          <div>
            <div className="text-[10px] text-cyber-muted uppercase">Epistemic Margin</div>
            <div className="text-sm font-bold text-amber-400">±{uncertainty_margin} pts</div>
          </div>
        </div>
      </div>

      {/* Model Probability vs Overall Risk Score Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-cyber-darkest/60 border border-cyber-border/80">
        <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-cyber-border pb-3 md:pb-0 md:pr-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              Model Probability (Statistical ML)
            </span>
            <span className="text-base font-bold font-mono text-cyan-400">
              {model_probability != null ? `${model_probability}%` : 'N/A'}
            </span>
          </div>
          <p className="text-[11px] text-cyber-muted leading-relaxed">
            Inferred strictly from structural and lexical character distributions using trained Random Forest & SHAP.
          </p>
        </div>

        <div className="space-y-1.5 md:pl-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              Overall Adaptive Risk Score
            </span>
            <span className="text-base font-bold font-mono text-purple-400">
              {adaptive_risk_score} / 100
            </span>
          </div>
          <p className="text-[11px] text-cyber-muted leading-relaxed">
            Synthesized multi-factor index combining domain age, SSL, visual forensics, and redirect routing, normalized for missing evidence.
          </p>
        </div>
      </div>

      {/* 5-Dimension Overview Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-cyber-muted">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
            Orthogonal Dimension Breakdown
          </span>
          <span>Effective Weights Re-normalized</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {Object.entries(dimension_scores).map(([dimKey, dimData]) => {
            const Icon = DIMENSION_ICONS[dimKey] || Globe;
            const isObserved = dimData.availability === 'OBSERVED';
            const isPartial = dimData.availability === 'PARTIAL';
            const score = dimData.score ?? 0;

            const scoreColor = score >= 70 ? 'text-red-400' : score >= 30 ? 'text-amber-400' : 'text-emerald-400';
            const barBg = score >= 70 ? 'bg-red-500' : score >= 30 ? 'bg-amber-500' : 'bg-emerald-500';

            return (
              <div
                key={dimKey}
                onClick={() => setSelectedDimension(selectedDimension === dimKey ? 'all' : dimKey)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedDimension === dimKey
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-cyber-darkest/40 border-cyber-border hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span className={`font-mono font-bold ${scoreColor}`}>
                    {isObserved || isPartial ? score : 'N/A'}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-slate-200 truncate" title={dimData.title}>
                  {dimData.title?.split('&')[0] || dimKey}
                </div>
                <div className="flex items-center justify-between text-[10px] text-cyber-muted mt-1">
                  <span>Wt: {Math.round((dimData.effective_weight || dimData.base_weight) * 100)}%</span>
                  <span
                    className={`font-mono text-[9px] px-1 py-0.2 rounded ${
                      isObserved
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : isPartial
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-slate-400 bg-slate-500/10'
                    }`}
                  >
                    {dimData.availability || 'OBSERVED'}
                  </span>
                </div>
                {/* Score bar */}
                <div className="w-full h-1 bg-cyber-darkest rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${barBg} transition-all duration-700`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Missing Evidence Notice */}
      {missingDimensions.length > 0 && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-semibold text-amber-300">
              Unobserved Surface Notice (Zero-Trust Guardrail):
            </span>
            <p className="text-amber-200/90 leading-relaxed">
              {missingDimensions.map(([k, d]) => d.title).join(', ')} could not be actively collected.
              Missing intelligence was <strong>not treated as proof of safety</strong>; observed feature weights were dynamically re-normalized and an epistemic uncertainty band of ±{uncertainty_margin} pts was attached.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs for Factors */}
      <div className="flex items-center justify-between border-b border-cyber-border pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedDimension('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedDimension === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-cyber-darkest'
            }`}
          >
            All Evidence ({evidence_breakdown.length})
          </button>
          {Object.entries(dimension_scores).map(([dimKey, dimData]) => (
            <button
              key={dimKey}
              onClick={() => setSelectedDimension(dimKey)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedDimension === dimKey
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-cyber-darkest'
              }`}
            >
              {dimData.title?.split(' ')[0]}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-cyber-muted font-mono">
          Showing {filteredFactors.length} factors
        </span>
      </div>

      {/* Factors List */}
      <div className="space-y-3">
        {filteredFactors.length === 0 ? (
          <div className="text-center py-6 text-xs text-cyber-muted">
            No specific evidence factors recorded in this dimension.
          </div>
        ) : (
          filteredFactors.map((factor, idx) => {
            const isIncreases = factor.influence === 'INCREASES_RISK';
            const isMitigates = factor.influence === 'MITIGATES_RISK';
            const isUnavailable = factor.influence === 'UNAVAILABLE' || factor.status === 'UNAVAILABLE';

            const impactBadgeColor = isIncreases
              ? 'bg-red-500/10 text-red-400 border-red-500/30'
              : isMitigates
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-500/10 text-slate-400 border-slate-500/30';

            const StatusIcon = isIncreases ? TrendingUp : isMitigates ? TrendingDown : HelpCircle;

            return (
              <div
                key={factor.id || idx}
                className="p-3.5 rounded-xl bg-cyber-darkest/50 border border-cyber-border hover:border-slate-600 transition-colors space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1 rounded-md text-xs font-mono font-bold flex items-center gap-1 border ${impactBadgeColor}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {factor.impact > 0 ? `+${factor.impact} pts` : factor.impact < 0 ? `${factor.impact} pts` : '0 pts'}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-100">{factor.name}</h4>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                      {factor.observed_value}
                    </span>
                    <span className="text-[11px] text-cyber-muted capitalize">
                      {factor.dimension?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans pl-1">
                  {factor.explanation}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Legal & Methodology Disclaimer */}
      {disclaimer && (
        <div className="p-3 rounded-lg bg-cyber-darkest/40 border border-cyber-border text-[11px] text-cyber-muted leading-relaxed flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>{disclaimer}</span>
        </div>
      )}
    </Card>
  );
}
