import React from 'react';
import { getRiskMeta } from '../../utils/formatters';

export default function RiskGauge({
  score = 0,
  size = 180,
  showLabel = true,
  subtext,
  completenessPct = null,
  uncertaintyMargin = null,
  thresholds = null
}) {
  const meta = getRiskMeta(score, thresholds);
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use 240 degrees arc for a speedo-gauge cyber look
  const arcLength = circumference * 0.75;
  const clampedScore = Math.min(100, Math.max(0, Number(score) || 0));
  const strokeDashoffset = arcLength - (arcLength * clampedScore) / 100;

  const getColor = () => {
    if (meta.key === 'low') return '#10b981';     // emerald
    if (meta.key === 'medium') return '#f59e0b';  // amber
    if (meta.key === 'high') return '#f97316';    // orange
    return '#ef4444';                             // red/critical
  };

  const currentColor = getColor();

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-[135deg]" viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#142548"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 10px ${currentColor}88)`,
            }}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="text-4xl md:text-5xl font-extrabold font-mono tracking-tight transition-colors duration-500"
            style={{ color: currentColor }}
          >
            {clampedScore}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mt-1">
            Risk Score / 100
          </span>
          {uncertaintyMargin != null && (
            <span className="text-[10px] font-mono text-cyan-400/80 mt-0.5">
              Uncertainty: ±{uncertaintyMargin}
            </span>
          )}
        </div>
      </div>

      {showLabel && (
        <div className="text-center mt-2 space-y-1">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors shadow-sm"
            style={{
              backgroundColor: `${currentColor}18`,
              borderColor: `${currentColor}55`,
              color: currentColor,
            }}
          >
            {meta.label} Category
          </div>
          {completenessPct != null && (
            <div className="text-[11px] font-mono text-slate-400">
              Evidence Completeness: <span className="text-slate-200 font-bold">{completenessPct}%</span>
            </div>
          )}
          {subtext && <p className="text-xs text-cyber-muted max-w-xs">{subtext}</p>}
        </div>
      )}
    </div>
  );
}
