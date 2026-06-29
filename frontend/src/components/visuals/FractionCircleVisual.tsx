'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function FractionCircleVisual({
  primaryCount,
  secondaryCount,
}: VisualProps) {
  const filled = Math.max(0, Math.min(primaryCount, secondaryCount));
  const total = Math.max(1, secondaryCount);
  const cx = 100;
  const cy = 100;
  const r = 80;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(startAngle: number, endAngle: number) {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  }

  const sliceAngle = 360 / total;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
        Phân số
      </span>

      <svg viewBox="0 0 200 200" className="w-full max-w-[220px]">
        {Array.from({ length: total }, (_, i) => {
          const start = i * sliceAngle;
          const end = (i + 1) * sliceAngle;
          const isFilled = i < filled;
          return (
            <path
              key={i}
              d={describeArc(start, end)}
              fill={isFilled ? '#22c55e' : '#e2e8f0'}
              stroke="#fff"
              strokeWidth={2}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={24} fill="white" />
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-800 text-[13px] font-bold"
          fontFamily="sans-serif"
        >
          {filled}/{total}
        </text>
      </svg>

      <div className="flex gap-3 text-[11px] font-semibold text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          Đã chọn: {filled}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-slate-200 border border-slate-300" />
          Tổng: {total}
        </span>
      </div>
    </div>
  );
}
