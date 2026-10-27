import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Globe,
  Server,
  Key,
  Copy,
  Check,
  Cpu,
  Camera,
  Activity,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getScanDetails } from '../services/scanService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import RiskGauge from '../components/common/RiskGauge';
import DemoBadge from '../components/common/DemoBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/formatters';

export default function ScanResultsPage() {
  const [searchParams] = useSearchParams();
  const scanId = searchParams.get('id');
  const { currentScan, setCurrentScan } = useApp();
  const [scan, setScan] = useState(currentScan);
  const [loading, setLoading] = useState(!currentScan && Boolean(scanId));
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (scanId) {
        setLoading(true);
        try {
          const data = await getScanDetails(scanId);
          if (active) {
            setScan(data);
            setCurrentScan(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          if (active) setLoading(false);
        }
      }
    }
    loadData();
    return () => { active = false; };
  }, [scanId]);

  if (loading) {
    return <LoadingSpinner text="Retrieving Threat Intelligence..." />;
  }

  if (!scan) {
    return (
      <Card className="text-center py-12">
        <ShieldAlert className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-100">No Scan Results Selected</h2>
        <p className="text-xs text-cyber-muted mt-1 max-w-sm mx-auto mb-6">
          Submit a URL on the home page scanner or pick a scan from history to inspect results.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Go to URL Scanner
        </Button>
      </Card>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(scan.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPhishing = scan.riskScore > 69;
  const isSuspicious = scan.riskScore > 30 && scan.riskScore <= 69;

  return (
    <div className="space-y-6">
      {/* Top Banner / Verdict Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={isPhishing ? 'danger' : isSuspicious ? 'warning' : 'safe'} size="md">
              {scan.verdict}
            </Badge>
            {scan.isDemo && <DemoBadge />}
            <span className="text-xs font-mono text-slate-400">
              Scanned: {formatDate(scan.timestamp)}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 font-mono break-all">
            {scan.domain}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-cyber-muted font-mono">
            <span className="truncate max-w-xl">{scan.url}</span>
            <button
              onClick={handleCopy}
              className="p-1 hover:text-cyan-400 text-slate-400 transition-colors"
              title="Copy URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={Cpu}
            onClick={() => navigate(`/xai?id=${scan.id || ''}&url=${encodeURIComponent(scan.url || '')}`)}
          >
            Explain with XAI
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Camera}
            onClick={() => navigate(`/screenshot?url=${encodeURIComponent(scan.url)}`)}
          >
            Visual Vision
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Activity}
            onClick={() => navigate(`/monitoring?add=${encodeURIComponent(scan.url)}`)}
          >
            Monitor URL
          </Button>
        </div>
      </div>

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Risk Gauge & Target Brand */}
        <Card
          title="Risk Assessment"
          subtitle="Synthesized multi-heuristic model score"
          icon={ShieldAlert}
          className="flex flex-col justify-between"
        >
          <div className="py-4">
            <RiskGauge score={scan.riskScore} size={200} />
          </div>

          <div className="mt-4 pt-4 border-t border-cyber-border/70 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-cyber-muted">Targeted Entity:</span>
              <span className="font-semibold text-slate-200">{scan.targetBrand || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cyber-muted">Primary Threat:</span>
              <span className="font-semibold text-red-300">{scan.attackType || 'Clean'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cyber-muted">Status:</span>
              <span className="text-emerald-400 uppercase font-semibold">Analyzed</span>
            </div>
          </div>
        </Card>

        {/* Center Column: SSL & Infrastructure Telemetry */}
        <Card
          title="SSL & Domain Infrastructure"
          subtitle="Registration and cryptographic attributes"
          icon={Lock}
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 rounded-lg bg-cyber-darkest/70 border border-cyber-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" /> SSL Certificate
                </span>
                <Badge variant={scan.sslStatus?.isFreeCA ? 'warning' : 'safe'} size="xs">
                  {scan.sslStatus?.isFreeCA ? 'Automated / Free CA' : 'Enterprise EV/OV'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-cyber-muted">
                <div>
                  <span className="text-slate-400">Issuer:</span> {scan.sslStatus?.issuer || 'Unknown'}
                </div>
                <div>
                  <span className="text-slate-400">Cert Age:</span> {scan.sslStatus?.ageDays || 0} days
                </div>
                <div>
                  <span className="text-slate-400">Expires in:</span> {scan.sslStatus?.expiryDays || 0} days
                </div>
                <div>
                  <span className="text-slate-400">Valid:</span>{' '}
                  <span className={scan.sslStatus?.valid ? 'text-emerald-400' : 'text-red-400'}>
                    {scan.sslStatus?.valid ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyber-darkest/70 border border-cyber-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" /> DNS & Hosting Details
                </span>
                <span className="text-[10px] text-cyan-400 font-bold">{scan.dnsInfo?.country || 'N/A'}</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-cyber-muted">
                <div className="flex justify-between">
                  <span className="text-slate-400">Resolved IP:</span>
                  <span className="text-slate-200">{scan.dnsInfo?.ip || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ASN:</span>
                  <span className="text-slate-200">{scan.dnsInfo?.asn || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registrar:</span>
                  <span className="text-slate-200">{scan.dnsInfo?.registrar || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Created:</span>
                  <span className="text-slate-200">{scan.dnsInfo?.creationDate || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column: DOM, Form Hijack & Threat Intel Feeds */}
        <Card
          title="DOM & Intelligence Feeds"
          subtitle="Form interception and third-party reputation"
          icon={Key}
        >
          <div className="space-y-4 font-mono text-xs">
            {/* DOM Form Indicators */}
            <div className="p-3 rounded-lg bg-cyber-darkest/70 border border-cyber-border space-y-2">
              <div className="font-semibold text-slate-300 mb-1">DOM Behavioral Patterns</div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Password Input:</span>
                <span className={scan.heuristicFeatures?.hasPasswordField ? 'text-red-400 font-bold' : 'text-slate-400'}>
                  {scan.heuristicFeatures?.hasPasswordField ? 'Present (Sensitive)' : 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Form Action Target:</span>
                <span className={scan.heuristicFeatures?.submitsToRemoteDomain ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {scan.heuristicFeatures?.submitsToRemoteDomain ? 'External Untrusted Host' : 'Canonical Host'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Entropy Score:</span>
                <span className="text-slate-200">{scan.heuristicFeatures?.entropyScore || '3.5'} / 5.0</span>
              </div>
            </div>

            {/* Third-Party Reputation Feeds */}
            <div className="p-3 rounded-lg bg-cyber-darkest/70 border border-cyber-border space-y-2">
              <div className="font-semibold text-slate-300 mb-1">Global Threat Feeds</div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">VirusTotal Engines:</span>
                <span className={scan.threatIntel?.virustotalDetections > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {scan.threatIntel?.virustotalDetections || 0} detections
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Google Safe Browsing:</span>
                <span className={scan.threatIntel?.googleSafeBrowsing?.includes('Flagged') ? 'text-red-400' : 'text-emerald-400'}>
                  {scan.threatIntel?.googleSafeBrowsing || 'Clean'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">OpenPhish Listed:</span>
                <span className={scan.threatIntel?.openPhishListed ? 'text-red-400 font-bold' : 'text-slate-400'}>
                  {scan.threatIntel?.openPhishListed ? 'VERIFIED POSITIVE' : 'Not Listed'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

