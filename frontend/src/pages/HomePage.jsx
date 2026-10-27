import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Cpu,
  Camera,
  Activity,
  Globe,
  Radio,
  Lock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { scanUrl } from '../services/scanService';
import UrlInputForm from '../components/scanner/UrlInputForm';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import DemoBadge from '../components/common/DemoBadge';
import { formatTimeAgo, truncateString } from '../utils/formatters';

export default function HomePage() {
  const { t } = useLanguage();
  const { setCurrentScan, scanHistory, setScanHistory } = useApp();
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const navigate = useNavigate();

  const handleScan = async (url) => {
    setIsScanning(true);
    setScanError('');
    try {
      const result = await scanUrl(url);
      setCurrentScan(result);
      setScanHistory((prev) => [result, ...prev.filter((p) => p.id !== result.id)]);
      navigate(`/results?id=${result.id}`);
    } catch (err) {
      setScanError(err.message || 'Scan failed. Please verify the URL and backend connection.');
    } finally {
      setIsScanning(false);
    }
  };

  const featureCards = [
    {
      title: 'Deep Siamese Vision',
      desc: 'Screenshot perceptual hashing and logo OCR matching against 500+ protected enterprise brands.',
      icon: Camera,
      link: '/screenshot',
      badge: 'CNN Engine',
    },
    {
      title: 'Explainable AI (XAI)',
      desc: 'Transparent SHAP and LIME feature contributions. Understand exactly why a domain is flagged.',
      icon: Cpu,
      link: '/xai',
      badge: 'Interpretability',
    },
    {
      title: 'Tamil & English Defense',
      desc: 'Bilingual AI security assistant providing real-time incident guidance and threat mitigation in தமிழ் and English.',
      icon: Globe,
      link: '/assistant',
      badge: 'Bilingual',
    },
    {
      title: 'Continuous Monitoring',
      desc: 'Real-time watcher for domain defacement, rogue subdomains, and DNS typosquatting spawns.',
      icon: Activity,
      link: '/monitoring',
      badge: '24/7 Intel',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold tracking-wide mb-5">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{t.hero.badge}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
          AI-Powered Phishing Detection &{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
            Risk Analysis
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t.hero.subtitle}
        </p>

        {/* URL Scanner Box */}
        <div className="mt-8 max-w-3xl mx-auto">
          <UrlInputForm onScan={handleScan} isLoading={isScanning} />
          {scanError && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-left">
              <strong>Error:</strong> {scanError}
            </div>
          )}
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Core AI Detection Modules
            </h2>
            <p className="text-xs text-cyber-muted">Multi-layered defensive telemetry</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureCards.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Link
                key={idx}
                to={feat.link}
                className="group p-5 rounded-xl bg-cyber-card border border-cyber-border hover:border-cyan-500/40 hover:shadow-cyan-glow transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="cyan" size="xs">
                      {feat.badge}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-200 text-sm group-hover:text-cyan-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-cyber-border/50 flex items-center justify-between text-xs text-cyan-400 font-mono">
                  <span>Explore Module</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Real-time Threat Intelligence Feed */}
      <section>
        <Card
          title={t.hero.recentThreats}
          subtitle="Latest scanned endpoints inspected by PhishGuard AI neural pipeline"
          icon={ShieldAlert}
          action={
            <div className="flex items-center gap-3">
              <DemoBadge />
              <Link
                to="/history"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
              >
                Full History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-cyber-border text-slate-400 uppercase text-[11px] tracking-wider">
                  <th className="pb-3 px-3">Target Domain & URL</th>
                  <th className="pb-3 px-3">Risk Score</th>
                  <th className="pb-3 px-3">Verdict</th>
                  <th className="pb-3 px-3">Attack Vector</th>
                  <th className="pb-3 px-3">Detected At</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                {scanHistory.slice(0, 5).map((scan) => {
                  const isHigh = scan.riskScore > 69;
                  const isMedium = scan.riskScore > 30 && scan.riskScore <= 69;
                  return (
                    <tr
                      key={scan.id}
                      className="hover:bg-cyber-cardHover/50 transition-colors group"
                    >
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-semibold text-slate-200 truncate">
                          {scan.domain}
                        </div>
                        <div className="text-[11px] text-cyber-muted truncate">{scan.url}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold text-sm ${
                            isHigh
                              ? 'text-red-400'
                              : isMedium
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {scan.riskScore}
                          <span className="text-[10px] text-slate-500">/100</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={isHigh ? 'danger' : isMedium ? 'warning' : 'safe'}
                          size="xs"
                        >
                          {scan.verdict}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {scan.attackType || 'Standard Inspection'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {formatTimeAgo(scan.timestamp)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentScan(scan);
                            navigate(`/results?id=${scan.id}`);
                          }}
                          className="px-2.5 py-1 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs transition-colors inline-flex items-center gap-1"
                        >
                          Details <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

