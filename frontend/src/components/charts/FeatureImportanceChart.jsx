import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

export default function FeatureImportanceChart({ features = [] }) {
  // Normalize and sort features by absolute impact
  const sorted = [...features]
    .map((f) => ({
      ...f,
      displayLabel: f.human_label || f.feature || f.feature_name || 'Feature',
    }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 10); // Display top 10 most impactful features

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isRisk = data.impact > 0;
      return (
        <div className="bg-cyber-card border border-cyber-border rounded-lg p-3 shadow-xl max-w-xs text-xs font-mono">
          <p className="font-bold text-slate-200 mb-1">{data.displayLabel}</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-400">SHAP Impact:</span>
            <span className={`font-bold ${isRisk ? 'text-red-400' : 'text-emerald-400'}`}>
              {isRisk ? `+${data.impact}` : data.impact}
            </span>
          </div>
          {data.measured_value !== undefined && (
            <div className="text-[11px] text-cyan-300 mb-1">
              Measured Value: {String(data.measured_value)}
            </div>
          )}
          <p className="text-[11px] text-cyber-muted font-sans leading-relaxed">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={sorted}
          margin={{ top: 10, right: 30, left: 180, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2b52" horizontal={false} />
          <XAxis
            type="number"
            stroke="#8194b3"
            fontSize={11}
            domain={[-0.3, 0.45]}
            tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}`}
          />
          <YAxis
            type="category"
            dataKey="displayLabel"
            stroke="#cbd5e1"
            fontSize={11}
            tickLine={false}
            width={175}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.impact > 0 ? '#ef4444' : '#10b981'}
                fillOpacity={0.88}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
