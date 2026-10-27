import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Radio, Globe, Terminal, Server, Sliders, Menu, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import StatusIndicator from '../common/StatusIndicator';

export default function Header({ isMobileOpen, setIsMobileOpen }) {
  const { lang, toggleLanguage, t } = useLanguage();
  const { isDemoMode, toggleDemoMode, backendHealth, apiBaseUrl } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-cyber-darkest/90 backdrop-blur-md border-b border-cyber-border px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Mobile Menu Button + Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="lg:hidden p-2 rounded-lg bg-cyber-card border border-cyber-border text-slate-300 hover:text-cyan-400"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400 group-hover:shadow-cyan-glow transition-all">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base md:text-lg tracking-wider text-slate-100 font-mono">
                PHISH<span className="text-cyan-400">GUARD</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30">
                AI
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-cyber-muted tracking-tight">
              Phishing Detection & Threat Analysis
            </p>
          </div>
        </Link>
      </div>

      {/* Controls & Status Center */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Backend API Connection status badge */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-xs font-mono"
          title={`Configured endpoint: ${apiBaseUrl}`}
        >
          <Server className="w-3.5 h-3.5 text-cyber-muted" />
          <span className="text-cyber-muted">API:</span>
          {backendHealth === 'connected' ? (
            <StatusIndicator status="online" text="Live" />
          ) : (
            <StatusIndicator status="offline" text="Offline (Mock)" pulse={false} />
          )}
        </div>

        {/* Demo Mode Toggle Switch */}
        <button
          type="button"
          onClick={toggleDemoMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            isDemoMode
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-cyber-card border-cyber-border text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle between Simulated Sandbox Demo Mode and Live Backend calls"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Demo Mode:</span>
          <span className="font-mono font-bold">{isDemoMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* Language Selector: English / தமிழ் */}
        <button
          type="button"
          onClick={() => toggleLanguage()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide transition-all"
          title="Switch UI and AI Assistant between English and Tamil"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
        </button>
      </div>
    </header>
  );
}

