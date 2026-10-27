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
  // Sort features by absolute impact
  const sorted = [...features].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isRisk = data.impact > 0;
      return (
        <div className="bg-cyber-card border border-cyber-border rounded-lg p-3 shadow-xl max-w-xs text-xs font-mono">
          <p className="font-bold text-slate-200 mb-1">{data.feature}</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-400">SHAP Value:</span>
            <span className={`font-bold ${isRisk ? 'text-red-400' : 'text-emerald-400'}`}>
              {isRisk ? `+${data.impact}` : data.impact}
            </span>
          </div>
          <p className="text-[11px] text-cyber-muted">{data.description}</p>
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
          margin={{ top: 10, right: 30, left: 140, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2b52" horizontal={false} />
          <XAxis
            type="number"
            stroke="#8194b3"
            fontSize={11}
            domain={[-0.1, 0.4]}
            tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}`}
          />
          <YAxis
            type="category"
            dataKey="feature"
            stroke="#cbd5e1"
            fontSize={11}
            tickLine={false}
            width={130}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.impact > 0 ? '#ef4444' : '#10b981'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

