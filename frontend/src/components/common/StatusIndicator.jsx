import React from 'react';

export default function StatusIndicator({ status = 'online', text, pulse = true, size = 'sm' }) {
  const statusStyles = {
    online: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
    offline: 'bg-slate-500 shadow-none',
    danger: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
    warning: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
    scanning: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
  };

  return (
    <div className="inline-flex items-center gap-2 font-mono text-xs">
      <span className="relative flex items-center justify-center">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
              statusStyles[status] || statusStyles.online
            }`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${dotSizes[size] || dotSizes.sm} ${
            statusStyles[status] || statusStyles.online
          }`}
        />
      </span>
      {text && <span className="text-slate-300 capitalize">{text}</span>}
    </div>
  );
}

