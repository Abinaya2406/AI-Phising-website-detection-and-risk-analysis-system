import React from 'react';
import { ShieldCheck, Heart, Terminal } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-cyber-border/70 bg-cyber-darkest px-4 lg:px-8 py-6 text-xs text-cyber-muted mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-300">
            PhishGuard AI — Advanced Cybersecurity Phishing Detection System
          </span>
        </div>
        <div className="flex items-center gap-6 font-mono text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Multi-Source Risk Scoring
          </span>
          <span className="text-slate-500">•</span>
          <span>Zero-Day Heuristics</span>
          <span className="text-slate-500">•</span>
          <span>Bilingual AI Defense</span>
        </div>
      </div>
    </footer>
  );
}

