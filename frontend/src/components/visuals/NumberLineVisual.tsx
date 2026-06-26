'use client';

import React from 'react';

interface NumberLineProps {
  primaryCount: number;
  secondaryCount: number;
  totalCount: number;
  groupsLabel?: string;
  itemsLabel?: string;
}

export default function NumberLineVisual({
  primaryCount,
  secondaryCount,
  totalCount,
}: NumberLineProps) {
  const maxVal = Math.max(totalCount, primaryCount + secondaryCount, 10);
  const range = Math.ceil(maxVal / 5) * 5;
  const start = 0;
  const ticks = Array.from({ length: range + 1 }, (_, i) => i);

  const pointerA = Math.min(primaryCount, range);
  const pointerB = Math.min(totalCount, range);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Đường số 0 → {range}
      </span>

      <svg viewBox={`0 0 ${range * 40 + 40} 80`} className="w-full max-w-md">
        {/* Line */}
        <line x1="20" y1="40" x2={range * 40 + 20} y2="40" stroke="#94a3b8" strokeWidth="2" />

        {/* Arrow */}
        <polygon
          points={`${range * 40 + 20},40 ${range * 40 + 10},34 ${range * 40 + 10},46`}
          fill="#94a3b8"
        />

        {/* Ticks */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={tick * 40 + 20}
              y1="34"
              x2={tick * 40 + 20}
              y2="46"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            <text
              x={tick * 40 + 20}
              y="60"
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
              fontFamily="sans-serif"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Pointer A (blue) */}
        <g>
          <circle cx={pointerA * 40 + 20} cy="20" r="8" fill="#3b82f6" opacity="0.9" />
          <text
            x={pointerA * 40 + 20}
            y="24"
            textAnchor="middle"
            className="fill-white text-[9px] font-bold"
            fontFamily="sans-serif"
          >
            {primaryCount}
          </text>
        </g>

        {/* Pointer B (green, result) */}
        {totalCount !== primaryCount && (
          <g>
            <circle cx={pointerB * 40 + 20} cy="12" r="8" fill="#22c55e" opacity="0.9" />
            <text
              x={pointerB * 40 + 20}
              y="16"
              textAnchor="middle"
              className="fill-white text-[9px] font-bold"
              fontFamily="sans-serif"
            >
              {totalCount}
            </text>
          </g>
        )}
      </svg>

      <div className="flex gap-4 text-[11px] font-semibold text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
          {primaryCount}
        </span>
        <span>=</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
          {totalCount}
        </span>
      </div>
    </div>
  );
}
