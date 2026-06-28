'use client';

import React from 'react';

import { type VisualProps } from './shared';

export default function MeanBalanceVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'phần tử',
  itemsLabel = 'giá trị',
}: VisualProps) {
  const count = primaryCount || 1;
  const values = Array.from({ length: count }, (_, i) => {
    if (i === 0) return secondaryCount;
    if (i === count - 1) return totalCount - secondaryCount * (count - 1);
    return secondaryCount;
  });

  const sum = values.reduce((a, b) => a + b, 0);
  const average = count > 0 ? sum / count : 0;
  const maxVal = Math.max(...values, average, 1);
  const barMaxH = 80;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
        Trung bình — {count} {groupsLabel}
      </span>

      <svg viewBox="0 0 320 160" className="w-full max-w-md">
        {/* Balance beam */}
        <rect x="40" y="100" width="240" height="4" rx="2" fill="#94a3b8" />

        {/* Fulcrum triangle */}
        <polygon points="160,104 150,124 170,124" fill="#64748b" />

        {/* Bars */}
        {values.map((val, i) => {
          const h = maxVal > 0 ? (val / maxVal) * barMaxH : 0;
          const x = 50 + i * (240 / Math.max(count, 1));
          const w = Math.max(240 / Math.max(count, 1) - 8, 12);
          return (
            <g key={i}>
              <rect
                x={x}
                y={100 - h}
                width={w}
                height={h}
                rx="3"
                fill="#fda4af"
                stroke="#e11d48"
                strokeWidth="1.5"
              />
              <text
                x={x + w / 2}
                y={100 - h - 6}
                textAnchor="middle"
                className="fill-rose-600 text-[10px] font-bold"
                fontFamily="sans-serif"
              >
                {val}
              </text>
              <text
                x={x + w / 2}
                y={118}
                textAnchor="middle"
                className="fill-slate-400 text-[8px]"
                fontFamily="sans-serif"
              >
                {itemsLabel} {i + 1}
              </text>
            </g>
          );
        })}

        {/* Average line */}
        {maxVal > 0 && (
          <g>
            <line
              x1="40"
              y1={100 - (average / maxVal) * barMaxH}
              x2="280"
              y2={100 - (average / maxVal) * barMaxH}
              stroke="#e11d48"
              strokeWidth="2"
              strokeDasharray="6,3"
            />
            <text
              x="288"
              y={100 - (average / maxVal) * barMaxH + 4}
              className="fill-rose-600 text-[10px] font-bold"
              fontFamily="sans-serif"
            >
              TB={average % 1 === 0 ? average : average.toFixed(1)}
            </text>
          </g>
        )}

        {/* Balance point indicator */}
        <circle cx="160" cy="128" r="5" fill="#e11d48" />
        <text
          x="160"
          y="142"
          textAnchor="middle"
          className="fill-rose-600 text-[9px] font-bold"
          fontFamily="sans-serif"
        >
          Điểm cân bằng
        </text>
      </svg>

      <div className="text-xs font-semibold text-slate-600 text-center">
        <span className="text-rose-600">
          {values.join(' + ')} = {sum}
        </span>
        <span className="text-slate-400 mx-1">→</span>
        <span>
          {sum} ÷ {count} ={' '}
        </span>
        <span className="text-rose-700 font-bold">
          {average % 1 === 0 ? average : average.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
