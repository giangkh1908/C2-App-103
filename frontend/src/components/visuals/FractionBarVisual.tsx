'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function FractionBarVisual({
  primaryCount,
  secondaryCount,
}: VisualProps) {
  const filled = Math.max(0, Math.min(primaryCount, secondaryCount));
  const total = Math.max(1, secondaryCount);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Phân số
      </span>

      <svg viewBox="0 0 320 70" className="w-full max-w-md">
        {Array.from({ length: total }, (_, i) => {
          const x = i * (320 / total);
          const w = 320 / total;
          const filled2 = i < filled;
          return (
            <rect
              key={i}
              x={x + 0.5}
              y={8}
              width={w - 1}
              height={36}
              rx={2}
              fill={filled2 ? '#3b82f6' : '#e2e8f0'}
              stroke={filled2 ? '#2563eb' : '#cbd5e1'}
              strokeWidth={1}
            />
          );
        })}
        <text
          x={160}
          y={60}
          textAnchor="middle"
          className="fill-slate-700 text-[13px] font-bold"
          fontFamily="sans-serif"
        >
          {filled}/{total}
        </text>
      </svg>

      <div className="flex gap-3 text-[11px] font-semibold text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
          Đã chọn: {filled}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-slate-200 border border-slate-300" />
          Tổng: {total}
        </span>
      </div>
    </div>
  );
}
