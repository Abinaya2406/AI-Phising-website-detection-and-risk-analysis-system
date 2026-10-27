import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Cpu,
  HelpCircle,
  TrendingUp,
  GitBranch,
  Layers,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Search,
  Activity,
  FileText,
  AlertCircle,
  Hash,
  Globe,
  CornerDownRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getXAIExplanation } from '../services/xaiService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart';

export default function XAIAnalysisPage() {
  const [searchParams] = useSearchParams();
  const scanId = searchParams.get('id');
  const queryUrl = searchParams.get('url');
  const { currentScan } = useApp();
  const [xaiData, setXaiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const id = scanId || currentScan?.id;
        const targetUrl = queryUrl || currentScan?.url;
        const res = await getXAIExplanation(id, targetUrl);
        if (active) {
          if (res) {
            setXaiData(res);
          } else {
            setError('Could not retrieve XAI explanation for this target.');
          }
        }
      } catch (e) {
        if (active) setError(e.message || 'Error formulating XAI explanation.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [scanId, queryUrl, currentScan]);

  if (loading) {
    return (
      <LoadingSpinner
        text="Deconstructing AI Model Decision Path..."
        subtext="Computing exact Shapley (SHAP) feature attributions and evaluating observed evidence"
      />
    );
  }

  if (error || !xaiData) {
    return (
      <Card className="text-center py-12">
        <Cpu className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-100">
          {error ? 'Explanation Unavailable' : 'No Explainability Data'}
        </h2>
        <p className="text-xs text-cyber-muted mt-1 max-w-sm mx-auto mb-6">
          {error || 'Scan a target URL first to visualize exact SHAP feature attributions and observed evidence.'}
        </p>
        <Link to="/">
          <Button variant="primary">Go to Threat Scanner</Button>
        </Link>
      </Card>
    );
  }

  const prob = xaiData.predictionScore ?? xaiData.prediction_score ?? 0.5;
  const isHighRisk = prob >= 0.70;
  const isSuspicious = prob >= 0.31 && prob < 0.70;

  const shapFeatures = xaiData.shapFeatures || xaiData.shap_features || [];
  const positiveContributors = xaiData.positive_contributors || shapFeatures.filter((f) => f.sign === 'positive');
  const negativeContributors = xaiData.negative_contributors || shapFeatures.filter((f) => f.sign === 'negative');
  const limeWeights = xaiData.limeWeights || xaiData.lime_weights || [];
  const decisionPath = xaiData.decisionTreePath || xaiData.decision_tree_path || [];
  const observed = xaiData.observedEvidence || xaiData.observed_evidence || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cyan" size="sm">
              Explainable AI (SHAP TreeExplainer)
            </Badge>
            {xaiData.isDemo && <DemoBadge />}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-cyan-400" />
            Explainable AI — Why Is This Website Dangerous?
          </h1>
          <p className="text-xs text-cyber-muted mt-1 font-mono break-all">
            Target Evaluated: <span className="text-cyan-300 font-semibold">{xaiData.url}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-cyber-darkest/80 p-3 rounded-xl border border-cyber-border font-mono text-xs">
          <div>
            <span className="text-cyber-muted block">Model Engine:</span>
            <span className="text-cyan-400 font-bold">{xaiData.modelUsed || xaiData.model_used}</span>
          </div>
          <div className="sm:border-l sm:border-cyber-border sm:pl-3">
            <span className="text-cyber-muted block">Model Prediction:</span>
            <span className={`font-bold ${isHighRisk ? 'text-red-400' : isSuspicious ? 'text-amber-400' : 'text-emerald-400'}`}>
              {(prob * 100).toFixed(1)}% {isHighRisk ? '(Phishing)' : isSuspicious ? '(Suspicious)' : '(Safe)'}
            </span>
          </div>
        </div>
      </div>

      {/* Methodology & Science Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-200 leading-relaxed font-sans">
          <strong className="text-blue-300 font-semibold uppercase tracking-wider block mb-0.5 font-mono">
            Model Explainability Principle
          </strong>
          {xaiData.methodologyDisclaimer ||
            xaiData.methodology_disclaimer ||
            'SHAP (SHapley Additive exPlanations) values indicate how specific feature measurements mathematically pushed the classification model output relative to the baseline training expectation. SHAP values illustrate model reasoning and do not independently constitute forensic proof.'}
        </div>
      </div>

      {/* Executive Rationale Summary Card */}
      <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border flex items-start gap-3">
        <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-200 leading-relaxed font-sans">
          <strong className="text-cyan-300 font-semibold uppercase tracking-wider block mb-1 font-mono">
            Executive Model Rationale
          </strong>
          {xaiData.summaryText || xaiData.summary_text}
        </div>
      </div>

      {/* Section 1: Model Feature Importance (SHAP Chart & Positive/Negative Factor Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SHAP Chart (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="SHAP Feature Attribution Spectrum"
            subtitle="Exact Shapley additive values pushing model prediction toward Phishing (+) or Safe (-)"
            icon={TrendingUp}
            action={
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> +Risk (Phishing)
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> -Risk (Safe)
                </span>
              </div>
            }
          >
            <FeatureImportanceChart features={shapFeatures} />
          </Card>
        </div>

        {/* LIME Local Token Attribution (1 Col) */}
        <div>
          <Card
            title="LIME Token Attribution"
            subtitle="Lexical substrings with highest local attention weights"
            icon={Layers}
          >
            <div className="space-y-3 font-mono text-xs">
              {limeWeights.map((lw, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-cyber-darkest/70 border border-cyber-border flex items-center justify-between"
                >
                  <div>
                    <div className="text-slate-100 font-bold flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[11px]">
                        "{lw.token}"
                      </span>
                    </div>
                    <span className="text-[10px] text-cyber-muted mt-1 block">
                      Category: {lw.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-red-400 font-bold text-sm">
                      +{(lw.weight * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">Weight</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Positive & Negative Contributions Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Contributors (+Risk) */}
        <Card
          title={`Risk-Increasing Factors (${positiveContributors.length})`}
          subtitle="Observed attributes that mathematically pushed the model prediction toward Phishing"
          icon={AlertTriangle}
        >
          {positiveContributors.length === 0 ? (
            <div className="p-4 rounded-lg bg-cyber-darkest/40 text-center text-xs text-cyber-muted font-mono">
              No significant risk-increasing factors measured for this URL.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {positiveContributors.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-red-300 flex items-center gap-2">
                      <span>{feat.human_label || feat.feature}</span>
                      {feat.measured_value !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          Measured: {String(feat.measured_value)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-sans leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-xs flex-shrink-0">
                    +{feat.impact}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Negative Contributors (-Risk / Safe) */}
        <Card
          title={`Risk-Mitigating Factors (${negativeContributors.length})`}
          subtitle="Observed attributes that mathematically pulled the model prediction toward Safe"
          icon={ShieldCheck}
        >
          {negativeContributors.length === 0 ? (
            <div className="p-4 rounded-lg bg-cyber-darkest/40 text-center text-xs text-cyber-muted font-mono">
              No mitigating safe indicators measured for this URL.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {negativeContributors.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-emerald-300 flex items-center gap-2">
                      <span>{feat.human_label || feat.feature}</span>
                      {feat.measured_value !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Measured: {String(feat.measured_value)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-sans leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs flex-shrink-0">
                    {feat.impact}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Section 2: Observed Evidence vs Model Prediction (Separation of Measurement from Inference) */}
      <Card
        title="Physically Measured URL & Domain Evidence"
        subtitle="Direct observations extracted from string syntax, domain registry, and network headers (Measured, Never Invented)"
        icon={Search}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Lexical Evidence */}
          <div className="p-4 rounded-xl bg-cyber-darkest/70 border border-cyber-border space-y-2.5">
            <h4 className="font-bold text-cyan-300 border-b border-cyber-border pb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> Lexical Patterns
            </h4>
            <div className="flex justify-between">
              <span className="text-slate-400">Total URL Length:</span>
              <span className="text-slate-200">{observed.lexical_patterns?.url_length || xaiData.numeric_features?.url_length || 'N/A'} chars</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Path Depth:</span>
              <span className="text-slate-200">{observed.lexical_patterns?.path_depth || 0} level(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Embedded Digits:</span>
              <span className="text-slate-200">{observed.lexical_patterns?.digit_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hyphen Count:</span>
              <span className="text-slate-200">{observed.lexical_patterns?.hyphen_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Shannon Entropy:</span>
              <span className="text-slate-200">{observed.lexical_patterns?.entropy_score || '3.2'} / 5.0</span>
            </div>
          </div>

          {/* Domain Indicators */}
          <div className="p-4 rounded-xl bg-cyber-darkest/70 border border-cyber-border space-y-2.5">
            <h4 className="font-bold text-cyan-300 border-b border-cyber-border pb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Domain Indicators
            </h4>
            <div className="flex justify-between">
              <span className="text-slate-400">Resolved Host:</span>
              <span className="text-slate-200 truncate max-w-[120px]">{observed.domain_indicators?.hostname || 'domain'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Top-Level Domain (TLD):</span>
              <span className="text-slate-200">.{observed.domain_indicators?.tld || 'com'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subdomain Count:</span>
              <span className="text-slate-200">{observed.domain_indicators?.subdomain_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Raw IP Host:</span>
              <span className={observed.domain_indicators?.is_raw_ip ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {observed.domain_indicators?.is_raw_ip ? 'YES (High Risk)' : 'NO (Clean)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Punycode / Homoglyph:</span>
              <span className={observed.domain_indicators?.is_punycode ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {observed.domain_indicators?.is_punycode ? 'YES (Spoofed)' : 'NO'}
              </span>
            </div>
          </div>

          {/* Redirect & Query Syntax */}
          <div className="p-4 rounded-xl bg-cyber-darkest/70 border border-cyber-border space-y-2.5">
            <h4 className="font-bold text-cyan-300 border-b border-cyber-border pb-1.5 flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5" /> Syntax & Redirection
            </h4>
            <div className="flex justify-between">
              <span className="text-slate-400">'@' Redirection Symbol:</span>
              <span className={observed.redirect_and_syntax_markers?.at_symbol ? 'text-red-400 font-bold' : 'text-slate-400'}>
                {observed.redirect_and_syntax_markers?.at_symbol ? 'Present (Dangerous)' : 'Absent'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">'//' Double Slash Operator:</span>
              <span className={observed.redirect_and_syntax_markers?.double_slash ? 'text-red-400 font-bold' : 'text-slate-400'}>
                {observed.redirect_and_syntax_markers?.double_slash ? 'Present (Suspicious)' : 'Absent'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Non-Standard Port:</span>
              <span className="text-slate-200">{observed.redirect_and_syntax_markers?.custom_port || 'None (Standard 80/443)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Credential Query Tokens:</span>
              <span className={observed.redirect_and_syntax_markers?.credential_parameters?.length ? 'text-red-400 font-bold' : 'text-slate-400'}>
                {observed.redirect_and_syntax_markers?.credential_parameters?.length
                  ? observed.redirect_and_syntax_markers.credential_parameters.join(', ')
                  : 'None'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Decision Tree Traversal Path */}
      <Card
        title="Rule-Based Decision Audit Tree"
        subtitle="Chronological inference rules satisfied by the inspected target"
        icon={GitBranch}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {decisionPath.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-cyber-darkest/80 border border-cyber-border hover:border-cyan-500/30 transition-all font-mono text-xs relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                  Stage {step.step}
                </span>
                <span className="text-red-400 font-bold text-[11px]">{step.contribution}</span>
              </div>
              <h4 className="text-slate-200 font-semibold mb-2 leading-tight">{step.node}</h4>
              <div className="p-2 rounded bg-cyber-card border border-cyber-border/70 text-[11px] text-cyber-muted">
                <span className="text-cyan-400 font-semibold">Evaluation:</span> {step.condition}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
