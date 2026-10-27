import React from 'react';
import { Shield } from 'lucide-react';

export default function LoadingSpinner({ text = 'Analyzing Threat Vectors...', subtext = 'Computing deep lexical, heuristic, and neural indicators' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative mb-6">
        {/* Outer glowing pulsing ring */}
        <div className="w-20 h-20 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-cyan-400 animate-pulse">
          <Shield className="w-8 h-8" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-slate-100 tracking-wide">{text}</h3>
      {subtext && <p className="text-xs text-cyber-muted mt-1 max-w-sm">{subtext}</p>}
    </div>
  );
}

