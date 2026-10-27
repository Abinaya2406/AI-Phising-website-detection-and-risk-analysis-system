import React from 'react';
import { getRiskMeta } from '../../utils/formatters';

export default function RiskGauge({ score = 0, size = 180, showLabel = true, subtext }) {
  const meta = getRiskMeta(score);
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use 240 degrees arc for a speedo-gauge cyber look
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, score))) / 100;

  const getColor = () => {
    if (score <= 30) return '#10b981'; // emerald
    if (score <= 69) return '#f59e0b'; // amber
    return '#ef4444'; // red
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
              filter: `drop-shadow(0 0 8px ${currentColor}88)`,
            }}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="text-4xl md:text-5xl font-extrabold font-mono tracking-tight transition-colors duration-500"
            style={{ color: currentColor }}
          >
            {score}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mt-1">
            Risk Score / 100
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="text-center mt-2">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors"
            style={{
              backgroundColor: `${currentColor}18`,
              borderColor: `${currentColor}55`,
              color: currentColor,
            }}
          >
            {meta.label}
          </div>
          {subtext && <p className="text-xs text-cyber-muted mt-1 max-w-xs">{subtext}</p>}
        </div>
      )}
    </div>
  );
}

