import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function ThreatTrendChart({ data = [] }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-cyber-card border border-cyber-border rounded-lg p-3 shadow-xl font-mono text-xs">
          <p className="text-slate-300 font-bold mb-1.5 border-b border-cyber-border pb-1">
            Time: {label}
          </p>
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
              <span className="capitalize" style={{ color: item.color }}>
                {item.name}:
              </span>
              <span className="font-bold text-slate-100">{item.value} sites</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="maliciousGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="suspiciousGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="safeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2b52" vertical={false} />
          <XAxis dataKey="time" stroke="#8194b3" fontSize={11} tickLine={false} />
          <YAxis stroke="#8194b3" fontSize={11} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontFamily: 'monospace' }}
          />
          <Area
            type="monotone"
            dataKey="malicious"
            name="Phishing Threats"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#maliciousGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="suspicious"
            name="Suspicious Anomaly"
            stroke="#f59e0b"
            fillOpacity={1}
            fill="url(#suspiciousGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="safe"
            name="Legitimate Sites"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#safeGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

