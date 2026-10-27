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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getXAIExplanation } from '../services/xaiService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart';

export default function XAIAnalysisPage() {
  const [searchParams] = useSearchParams();
  const scanId = searchParams.get('id');
  const { currentScan } = useApp();
  const [xaiData, setXaiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const id = scanId || currentScan?.id;
        const res = await getXAIExplanation(id);
        if (active) setXaiData(res);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [scanId, currentScan]);

  if (loading) {
    return <LoadingSpinner text="Deconstructing AI Model Decision Path..." subtext="Calculating SHAP Shapley values and LIME perturbations" />;
  }

  if (!xaiData) {
    return (
      <Card className="text-center py-12">
        <Cpu className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-100">No Explainability Data</h2>
        <p className="text-xs text-cyber-muted mt-1 max-w-sm mx-auto mb-6">
          Scan a target URL first to visualize neural decision explanations.
        </p>
        <Link to="/">
          <Button variant="primary">Go to Scanner</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-cyber-card border border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cyan" size="sm">
              Model Interpretability
            </Badge>
            {xaiData.isDemo && <DemoBadge />}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-cyan-400" />
            Explainable AI (XAI) Model Audit
          </h1>
          <p className="text-xs text-cyber-muted mt-1 font-mono">
            Target: <span className="text-slate-300 font-semibold">{xaiData.url}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-cyber-darkest/70 p-3 rounded-xl border border-cyber-border font-mono text-xs">
          <div>
            <span className="text-cyber-muted block">Ensemble Model:</span>
            <span className="text-cyan-400 font-bold">{xaiData.modelUsed}</span>
          </div>
          <div className="sm:border-l sm:border-cyber-border sm:pl-3">
            <span className="text-cyber-muted block">Confidence Score:</span>
            <span className="text-red-400 font-bold">{(xaiData.predictionScore * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Natural Language Explanation Box */}
      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
        <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-200 leading-relaxed font-sans">
          <strong className="text-cyan-300 font-semibold uppercase tracking-wider block mb-1">
            Executive AI Rationale
          </strong>
          {xaiData.summaryText}
        </div>
      </div>

      {/* Grid: SHAP Chart & LIME Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SHAP Chart (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="SHAP (SHapley Additive exPlanations)"
            subtitle="Global & local feature contributions pushing the prediction toward Phishing (+) or Safe (-)"
            icon={TrendingUp}
            action={
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> +Risk
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> -Risk (Safe)
                </span>
              </div>
            }
          >
            <FeatureImportanceChart features={xaiData.shapFeatures} />
          </Card>
        </div>

        {/* LIME Local Token Impact (1 Col) */}
        <div>
          <Card
            title="LIME Token Attribution"
            subtitle="Lexical substrings with highest attention weight"
            icon={Layers}
          >
            <div className="space-y-3 font-mono text-xs">
              {xaiData.limeWeights.map((lw, idx) => (
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

      {/* Decision Tree Traversal Path */}
      <Card
        title="Rule-Based Decision Audit Tree"
        subtitle="Chronological inference rules satisfied by the inspected target"
        icon={GitBranch}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {xaiData.decisionTreePath.map((step, idx) => (
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

