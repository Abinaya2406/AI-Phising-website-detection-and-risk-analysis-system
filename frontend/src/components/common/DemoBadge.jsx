import React from 'react';
import { Info } from 'lucide-react';
import Badge from './Badge';

export default function DemoBadge({ className = '', tooltip = 'Simulated sandbox data. Connect your backend API to stream real-time inferences.' }) {
  return (
    <div className={`inline-flex items-center group relative cursor-help ${className}`}>
      <Badge variant="demo" size="xs">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        DEMO DATA
      </Badge>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 w-64 pointer-events-none">
        <div className="bg-cyber-card border border-yellow-400/30 text-yellow-200 text-xs rounded-lg p-2.5 shadow-xl shadow-black/80 text-center">
          <div className="flex items-center justify-center gap-1.5 font-bold mb-1 text-yellow-300">
            <Info className="w-3.5 h-3.5" /> Demo Intelligence
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">{tooltip}</p>
        </div>
        <div className="w-2 h-2 bg-cyber-card border-r border-b border-yellow-400/30 transform rotate-45 -mt-1" />
      </div>
    </div>
  );
}

