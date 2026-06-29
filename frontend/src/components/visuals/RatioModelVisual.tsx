'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function RatioModelVisual({
  primaryCount,
  secondaryCount,
  groupsLabel = 'phần',
}: VisualProps) {
  const a = Math.max(0, primaryCount);
  const b = Math.max(0, secondaryCount);
  const total = a + b;
  const barW = 300;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
        Tỉ số
      </span>

      <svg viewBox="0 0 320 50" className="w-full max-w-md">
        {total > 0 && (
          <>
            <rect
              x={10}
              y={6}
              width={(a / total) * barW}
              height={28}
              rx={4}
              fill="#6366f1"
            />
            <rect
              x={10 + (a / total) * barW}
              y={6}
              width={(b / total) * barW}
              height={28}
              rx={4}
              fill="#c7d2fe"
            />
          </>
        )}
        {total === 0 && (
          <rect x={10} y={6} width={barW} height={28} rx={4} fill="#e2e8f0" />
        )}

        {a > 0 && (
          <text
            x={10 + ((a / total) * barW) / 2}
            y={24}
            textAnchor="middle"
            className="fill-white text-[11px] font-bold"
            fontFamily="sans-serif"
          >
            {a}
          </text>
        )}
        {b > 0 && (
          <text
            x={10 + (a / total) * barW + ((b / total) * barW) / 2}
            y={24}
            textAnchor="middle"
            className="fill-indigo-700 text-[11px] font-bold"
            fontFamily="sans-serif"
          >
            {b}
          </text>
        )}
      </svg>

      <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-indigo-500" />
          {a} {groupsLabel}
        </span>
        <span className="text-indigo-400">:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-indigo-200 border border-indigo-300" />
          {b} {groupsLabel}
        </span>
        <span className="text-slate-400 mx-1">|</span>
        <span className="text-slate-500">
          Tỉ số = {b !== 0 ? (a / b).toFixed(2) : '∞'}
        </span>
      </div>

      <div className="text-[11px] font-semibold text-slate-500">
        {a} : {b} (tổng: {total})
      </div>
    </div>
  );
}
