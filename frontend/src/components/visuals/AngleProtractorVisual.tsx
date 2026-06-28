'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function AngleProtractorVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Góc',
  itemsLabel = 'độ',
}: VisualProps) {
  const angle = Math.max(0, Math.min(180, primaryCount));
  const cx = 150;
  const cy = 140;
  const r = 110;

  const angleRad = (angle * Math.PI) / 180;
  const endX = cx + r * Math.cos(angleRad);
  const endY = cy - r * Math.sin(angleRad);

  const ticks = Array.from({ length: 19 }, (_, i) => i * 10);

  const majorTicks = [0, 30, 60, 90, 120, 150, 180];

  const getArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy - radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy - radius * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Đo góc: {angle}°
      </span>

      <svg width="300" height="170" viewBox="0 0 300 170" className="bg-white rounded-xl border border-slate-200">
        {/* Protractor semi-circle */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="2"
        />

        {/* Tick marks */}
        {ticks.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const isMajor = majorTicks.includes(deg);
          const innerR = isMajor ? r - 14 : r - 8;
          const x1 = cx + innerR * Math.cos(rad);
          const y1 = cy - innerR * Math.sin(rad);
          const x2 = cx + r * Math.cos(rad);
          const y2 = cy - r * Math.sin(rad);
          return (
            <g key={deg}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isMajor ? '#64748b' : '#94a3b8'}
                strokeWidth={isMajor ? 2 : 1}
              />
              {isMajor && (
                <text
                  x={cx + (r - 22) * Math.cos(rad)}
                  y={cy - (r - 22) * Math.sin(rad)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[9px] font-bold fill-slate-500"
                >
                  {deg}°
                </text>
              )}
            </g>
          );
        })}

        {/* Angle arc */}
        {angle > 0 && (
          <path
            d={getArcPath(0, angle, 35)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
          />
        )}

        {/* Baseline */}
        <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="#64748b" strokeWidth="2" />

        {/* Angle line */}
        <line
          x1={cx} y1={cy} x2={endX} y2={endY}
          stroke="#ef4444"
          strokeWidth="2.5"
        />

        {/* Angle label */}
        {angle > 0 && (
          <text
            x={cx + 45 * Math.cos(angleRad / 2)}
            y={cy - 45 * Math.sin(angleRad / 2)}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[12px] font-black fill-blue-600"
          >
            {angle}°
          </text>
        )}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="4" fill="#3b82f6" />
      </svg>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
