import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';
import EmptyState from '../components/common/EmptyState';
import { useApp } from '../context/AppContext';
import { getScanHistory, clearScanHistory } from '../services/scanService';
import { formatDate, formatTimeAgo } from '../utils/formatters';

export default function ScanHistoryPage() {
  const { setCurrentScan } = useApp();
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('ALL');
  const navigate = useNavigate();

  const loadHistory = async () => {
    const data = await getScanHistory();
    setHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = () => {
    if (confirm('Clear all historical scan entries from local cache?')) {
      clearScanHistory();
      setHistory([]);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `phishguard_scans_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filtered = history.filter((item) => {
    const matchesSearch =
      item.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.targetBrand && item.targetBrand.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (verdictFilter === 'PHISHING' && item.riskScore <= 69) return false;
    if (verdictFilter === 'SUSPICIOUS' && (item.riskScore < 31 || item.riskScore > 69)) return false;
    if (verdictFilter === 'SAFE' && item.riskScore > 30) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" size="sm">
              Archived Telemetry
            </Badge>
            <DemoBadge />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <History className="w-6 h-6 text-cyan-400" />
            Historical Scan Registry
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            Audit logs and records of all previously evaluated targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportJSON}
            disabled={history.length === 0}
          >
            Export JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={handleClear}
            disabled={history.length === 0}
          >
            Clear Registry
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-cyber-darkest/80 border border-cyber-border font-mono text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search domain, URL, or targeted brand..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-cyber-card border border-cyber-border text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Verdict:</span>
          {['ALL', 'PHISHING', 'SUSPICIOUS', 'SAFE'].map((vf) => (
            <button
              key={vf}
              onClick={() => setVerdictFilter(vf)}
              className={`px-2.5 py-1 rounded transition-colors ${
                verdictFilter === vf
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {vf}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Scans Match Filter"
          description="Try broadening your search term or filter criteria, or run a new scan from the homepage."
          actionText="Run New Scan"
          onAction={() => navigate('/')}
        />
      ) : (
        /* History Table */
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-cyber-border text-slate-400 uppercase text-[11px] tracking-wider bg-cyber-card/60">
                  <th className="py-3 px-4">Target Website</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4">Brand / Attack Vector</th>
                  <th className="py-3 px-4">Scanned Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                {filtered.map((item) => {
                  const isHigh = item.riskScore > 69;
                  const isMedium = item.riskScore > 30 && item.riskScore <= 69;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-cyber-cardHover/40 transition-colors"
                    >
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-slate-100 truncate">{item.domain}</div>
                        <div className="text-[11px] text-cyber-muted truncate">{item.url}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            isHigh ? 'text-red-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {item.riskScore}
                          <span className="text-[10px] text-slate-500">/100</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={isHigh ? 'danger' : isMedium ? 'warning' : 'safe'}
                          size="xs"
                        >
                          {item.verdict}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>{item.targetBrand || 'Generic'}</div>
                        <div className="text-[10px] text-cyber-muted">{item.attackType || 'Standard'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        <div>{formatTimeAgo(item.timestamp)}</div>
                        <div className="text-[10px] text-slate-500">{formatDate(item.timestamp)}</div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentScan(item);
                            navigate(`/results?id=${item.id}`);
                          }}
                          className="px-2.5 py-1 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs transition-colors"
                        >
                          Results
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentScan(item);
                            navigate(`/xai?id=${item.id}`);
                          }}
                          className="px-2.5 py-1 rounded border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs transition-colors"
                        >
                          XAI
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

