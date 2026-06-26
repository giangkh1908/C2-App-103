'use client';

import React from 'react';
import { VisualProps } from './shared';

function SmallSquare({ color, x, y }: { color: string; x: number; y: number }) {
  return (
    <rect x={x} y={y} width="28" height="28" rx="3" fill={color} stroke="white" strokeWidth="1.5" />
  );
}

export default function ShapeCompositionVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Ghép hình',
  itemsLabel = 'hình nhỏ',
}: VisualProps) {
  const pieces = Math.max(2, Math.min(9, primaryCount));
  const COLORS = [
    'bg-rose-400', 'bg-blue-400', 'bg-emerald-400', 'bg-amber-400',
    'bg-violet-400', 'bg-cyan-400', 'bg-pink-400', 'bg-indigo-400', 'bg-teal-400',
  ];
  const fillColors = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#22d3ee', '#f472b6', '#818cf8', '#2dd4bf'];

  const gridSize = Math.ceil(Math.sqrt(pieces));
  const composedSize = gridSize * 30;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Ghép hình: {pieces} hình nhỏ → 1 hình lớn
      </span>

      <div className="flex items-center gap-6">
        {/* Small pieces */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold text-slate-500">{pieces} hình nhỏ</span>
          <div
            className="grid gap-1 p-2 bg-slate-50 rounded-xl border border-slate-200"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 28px)` }}
          >
            {Array.from({ length: pieces }).map((_, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-md ${COLORS[i % COLORS.length]} ring-2 ring-white`}
              />
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center">
          <svg width="50" height="24" viewBox="0 0 50 24">
            <line x1="0" y1="12" x2="40" y2="12" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
            <polygon points="40,6 50,12 40,18" fill="#3b82f6" />
          </svg>
          <span className="text-[9px] font-bold text-blue-600">ghép</span>
        </div>

        {/* Composed shape */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold text-slate-500">Hình lớn</span>
          <div className="p-2 bg-blue-50 rounded-xl border-2 border-blue-300">
            <svg width={composedSize} height={composedSize} viewBox={`0 0 ${composedSize} ${composedSize}`}>
              {Array.from({ length: pieces }).map((_, i) => {
                const row = Math.floor(i / gridSize);
                const col = i % gridSize;
                return (
                  <SmallSquare
                    key={i}
                    color={fillColors[i % fillColors.length]}
                    x={col * 30}
                    y={row * 30}
                  />
                );
              })}
            </svg>
          </div>
          <span className="text-[9px] font-bold text-blue-600">
            {gridSize}×{gridSize} hình vuông
          </span>
        </div>
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
