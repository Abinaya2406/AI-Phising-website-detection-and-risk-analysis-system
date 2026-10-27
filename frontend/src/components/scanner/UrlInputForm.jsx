import React, { useState } from 'react';
import { Search, Globe, AlertCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import Button from '../common/Button';
import { isValidUrl, normalizeUrl } from '../../utils/validators';

export default function UrlInputForm({ onScan, isLoading = false, initialUrl = '' }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState('');

  const sampleTargets = [
    { label: 'PayPal Impersonator (Phishing)', url: 'https://security-verify-account-paypal.com/signin/webapps', type: 'danger' },
    { label: 'Chase Auth Clone (Phishing)', url: 'https://chase-online-secure-auth.net/portal/login.htm', type: 'danger' },
    { label: 'Azure Sharepoint Spoof (Suspicious)', url: 'https://storage-service-azure-sharepoint.app-verify.cc', type: 'warning' },
    { label: 'GitHub Official (Safe)', url: 'https://github.com/security/advisories', type: 'safe' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a website URL or domain name to analyze.');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (e.g., https://example-security.com or domain.com).');
      return;
    }

    const normalized = normalizeUrl(url);
    onScan(normalized);
  };

  const handleSelectSample = (sampleUrl) => {
    setUrl(sampleUrl);
    setError('');
    onScan(sampleUrl);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center rounded-2xl bg-cyber-card/90 border border-cyber-border focus-within:border-cyan-400 focus-within:shadow-cyan-glow transition-all p-2 shadow-2xl">
          <div className="flex items-center flex-1 px-3 py-2">
            <Globe className="w-5 h-5 text-cyan-400 flex-shrink-0 mr-3" />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter suspicious URL (e.g., https://verify-account-update.com/login)..."
              disabled={isLoading}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 font-mono text-sm sm:text-base focus:outline-none"
              aria-label="Website URL to scan"
            />
          </div>

          <div className="pt-2 sm:pt-0 sm:pl-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              icon={isLoading ? null : Zap}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Scanning...' : 'Scan URL'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs mt-2 px-3 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Quick Testing Samples */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-cyber-muted font-mono flex items-center gap-1 mr-1">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Test Samples:
        </span>
        {sampleTargets.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectSample(s.url)}
            disabled={isLoading}
            className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-all text-left ${
              s.type === 'danger'
                ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                : s.type === 'warning'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

