import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  FileSearch,
  Cpu,
  Camera,
  Activity,
  Bot,
  Globe2,
  BellRing,
  History,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const { t } = useLanguage();
  const { currentScan } = useApp();

  const navigation = [
    { name: t.nav.home, path: '/', icon: Search, badge: null },
    { name: t.nav.scanResults, path: '/results', icon: FileSearch, badge: currentScan ? 'Latest' : null },
    { name: t.nav.xai, path: '/xai', icon: Cpu, badge: 'SHAP' },
    { name: t.nav.screenshot, path: '/screenshot', icon: Camera, badge: 'Vision' },
    { name: t.nav.riskDashboard, path: '/dashboard', icon: Activity, badge: 'Live' },
    { name: t.nav.assistant, path: '/assistant', icon: Bot, badge: 'EN / தமிழ்' },
    { name: t.nav.monitoring, path: '/monitoring', icon: Globe2, badge: null },
    { name: t.nav.alerts, path: '/alerts', icon: BellRing, badge: '3', badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { name: t.nav.history, path: '/history', icon: History, badge: null },
    { name: t.nav.about, path: '/about', icon: BookOpen, badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-cyber-darkest/95 lg:bg-cyber-darkest border-r border-cyber-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Logo Area in Sidebar for clean header sync */}
        <div className="p-4 border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span className="font-mono font-bold text-sm tracking-widest text-slate-200">
              SECURITY MATRIX
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            v1.0
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Navigation Menu
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border-l-4 border-cyan-400 shadow-sm shadow-cyan-900/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-cyber-card/60'
                  }`
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 flex-shrink-0 group-hover:text-cyan-400 transition-colors" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      item.badgeColor || 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Cyber Threat Status footer */}
        <div className="p-3 border-t border-cyber-border bg-cyber-card/30">
          <div className="p-2.5 rounded-lg border border-cyan-500/20 bg-cyber-card/80">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>AI Engine</span>
              <span className="text-emerald-400">ACTIVE</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full w-[94%]" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-cyber-muted mt-1.5 font-mono">
              <span>94.2% Precision</span>
              <span>XGBoost + CNN</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

