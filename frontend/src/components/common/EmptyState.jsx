import React from 'react';
import { ShieldAlert } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = ShieldAlert,
  title = 'No Data Found',
  description = 'No intelligence records match your search or filter criteria.',
  actionText,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-dashed border-cyber-border bg-cyber-card/40 ${className}`}
    >
      <div className="p-4 rounded-2xl bg-cyber-border/40 text-cyan-400 mb-4 border border-cyan-500/20">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-slate-200 mb-1">{title}</h4>
      <p className="text-sm text-cyber-muted max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

