'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function PercentBarVisual({
  primaryCount,
}: VisualProps) {
  const percent = Math.max(0, Math.min(100, primaryCount));
  const barW = 280;
  const fillW = (percent / 100) * barW;
  const markers = [0, 25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
        Phần trăm
      </span>

      <svg viewBox="0 0 320 70" className="w-full max-w-md">
        <rect x={20} y={10} width={barW} height={28} rx={4} fill="#fff7ed" stroke="#fdba74" strokeWidth={1} />
        <rect x={20} y={10} width={fillW} height={28} rx={4} fill="#f97316" />

        {markers.map((m) => {
          const x = 20 + (m / 100) * barW;
          return (
            <g key={m}>
              <line x1={x} y1={40} x2={x} y2={48} stroke="#fb923c" strokeWidth={1} />
              <text
                x={x}
                y={58}
                textAnchor="middle"
                className="fill-slate-500 text-[9px]"
                fontFamily="sans-serif"
              >
                {m}%
              </text>
            </g>
          );
        })}

        <text
          x={20 + fillW}
          y={8}
          textAnchor="middle"
          className="fill-orange-700 text-[11px] font-bold"
          fontFamily="sans-serif"
        >
          {percent}%
        </text>
      </svg>

      <div className="flex gap-3 text-[11px] font-semibold text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-orange-500" />
          Đã tô: {percent}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-orange-100 border border-orange-300" />
          Còn lại: {100 - percent}%
        </span>
      </div>
    </div>
  );
}
