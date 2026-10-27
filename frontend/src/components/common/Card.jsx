import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  className = '',
  glow = false,
  noPadding = false,
  ...props
}) {
  return (
    <div
      className={`bg-cyber-card/90 backdrop-blur-md rounded-xl border border-cyber-border hover:border-cyber-border/80 transition-all duration-300 relative overflow-hidden ${
        glow ? 'border-cyan-500/30 shadow-cyan-glow' : 'shadow-lg shadow-black/40'
      } ${className}`}
      {...props}
    >
      {(title || Icon || badge || action) && (
        <div className="px-5 py-4 border-b border-cyber-border/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-sm md:text-base tracking-wide truncate">
                  {title}
                </h3>
                {badge}
              </div>
              {subtitle && <p className="text-xs text-cyber-muted mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

