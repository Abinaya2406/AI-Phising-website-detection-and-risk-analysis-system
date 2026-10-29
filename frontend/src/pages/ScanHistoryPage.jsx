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
  GitCompare,
  Key,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';
import EmptyState from '../components/common/EmptyState';
import ScanComparisonModal from '../components/scanner/ScanComparisonModal';
import { useApp } from '../context/AppContext';
import { getScanHistory, clearScanHistory } from '../services/scanService';
import { formatDate, formatTimeAgo, getRiskMeta } from '../utils/formatters';

export default function ScanHistoryPage() {
  const { setCurrentScan } = useApp();
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedScanIds, setSelectedScanIds] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const navigate = useNavigate();

  const loadHistory = async () => {
    const data = await getScanHistory();
    const list = Array.isArray(data) ? data : data?.data || [];
    setHistory(list);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = () => {
    if (confirm('Clear all historical scan entries from local cache?')) {
      clearScanHistory();
      setHistory([]);
      setSelectedScanIds([]);
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

  const toggleSelectScan = (id) => {
    setSelectedScanIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const filtered = history.filter((item) => {
    const domain = (item.domain || '').toLowerCase();
    const url = (item.url || '').toLowerCase();
    const brand = (item.target_brand || item.targetBrand || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = domain.includes(query) || url.includes(query) || brand.includes(query);
    if (!matchesSearch) return false;

    const score = item.adaptive_risk?.adaptive_risk_score ?? item.risk_score ?? item.riskScore ?? 0;
    const cat = item.adaptive_risk?.risk_category?.key || getRiskMeta(score).key;

    if (categoryFilter === 'CRITICAL' && cat !== 'critical') return false;
    if (categoryFilter === 'HIGH' && cat !== 'high') return false;
    if (categoryFilter === 'MEDIUM' && cat !== 'medium') return false;
    if (categoryFilter === 'LOW' && cat !== 'low') return false;

    return true;
  });

  const selectedScanA = history.find((s) => s.id === selectedScanIds[0]);
  const selectedScanB = history.find((s) => s.id === selectedScanIds[1]);

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
            Audit logs and multi-vector threat records of all previously evaluated targets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedScanIds.length === 2 && (
            <Button
              variant="primary"
              size="sm"
              icon={GitCompare}
              onClick={() => setCompareModalOpen(true)}
              className="animate-pulse"
            >
              Compare Selected (2)
            </Button>
          )}

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

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-xs">4-Tier Category:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded transition-colors text-xs ${
                categoryFilter === cat
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {selectedScanIds.length > 0 && (
        <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs flex items-center justify-between font-mono">
          <span className="text-cyan-300">
            {selectedScanIds.length} of 2 scans selected for comparison.
            {selectedScanIds.length === 1 && ' Select one more to compare.'}
          </span>
          <div className="flex items-center gap-2">
            {selectedScanIds.length === 2 && (
              <Button
                variant="primary"
                size="xs"
                icon={GitCompare}
                onClick={() => setCompareModalOpen(true)}
              >
                Launch Comparison
              </Button>
            )}
            <button
              onClick={() => setSelectedScanIds([])}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

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
                  <th className="py-3 px-3 w-10 text-center">Compare</th>
                  <th className="py-3 px-4">Target Website</th>
                  <th className="py-3 px-4">Adaptive Score</th>
                  <th className="py-3 px-4">ML Prob</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Brand / Attack Vector</th>
                  <th className="py-3 px-4">Scanned Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                {filtered.map((item) => {
                  const score = item.adaptive_risk?.adaptive_risk_score ?? item.risk_score ?? item.riskScore ?? 0;
                  const mlProb = item.adaptive_risk?.model_probability ?? (score > 50 ? Math.min(99, score + 4) : Math.max(1, score - 2));
                  const meta = getRiskMeta(score);
                  const catLabel = item.adaptive_risk?.risk_category?.label || meta.label;
                  const catKey = item.adaptive_risk?.risk_category?.key || meta.key;

                  const badgeVariant =
                    catKey === 'critical' ? 'danger' :
                    catKey === 'high' ? 'danger' :
                    catKey === 'medium' ? 'warning' : 'safe';

                  const isSelected = selectedScanIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-cyber-cardHover/40 transition-colors ${
                        isSelected ? 'bg-cyan-500/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectScan(item.id)}
                          className="rounded border-cyber-border bg-cyber-darkest text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-slate-100 truncate">{item.domain}</div>
                        <div className="text-[11px] text-cyber-muted truncate">{item.url}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold text-sm ${
                            catKey === 'critical'
                              ? 'text-red-400'
                              : catKey === 'high'
                              ? 'text-orange-400'
                              : catKey === 'medium'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {score}
                          <span className="text-[10px] text-slate-500">/100</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-400">
                        {mlProb}%
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={badgeVariant} size="xs">
                          {catLabel}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>{item.target_brand || item.targetBrand || 'Generic'}</div>
                        <div className="text-[10px] text-cyber-muted">{item.attack_type || item.attackType || 'Standard'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        <div>{formatTimeAgo(item.created_at || item.timestamp)}</div>
                        <div className="text-[10px] text-slate-500">{formatDate(item.created_at || item.timestamp)}</div>
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

      {/* Comparison Modal */}
      <ScanComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        initialScanA={selectedScanA}
        initialScanB={selectedScanB}
      />
    </div>
  );
}
