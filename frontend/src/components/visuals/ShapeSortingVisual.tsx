'use client';

import React from 'react';
import { VisualProps } from './shared';

function MiniShape({ type, color }: { type: string; color: string }) {
  if (type === 'circle') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill={color} />
      </svg>
    );
  }
  if (type === 'square') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <rect x="4" y="4" width="24" height="24" fill={color} />
      </svg>
    );
  }
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <polygon points="16,4 28,28 4,28" fill={color} />
    </svg>
  );
}

const CATEGORIES = [
  { type: 'circle', label: 'Hình tròn', color: '#f472b6', bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700' },
  { type: 'square', label: 'Hình vuông', color: '#60a5fa', bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  { type: 'triangle', label: 'Hình tam giác', color: '#34d399', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700' },
];

export default function ShapeSortingVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Phân loại',
  itemsLabel = 'hình',
}: VisualProps) {
  const circleCount = Math.max(1, primaryCount);
  const squareCount = Math.max(1, secondaryCount);
  const triangleCount = Math.max(1, totalCount - circleCount - squareCount);
  const counts = [circleCount, squareCount, Math.max(0, triangleCount)];

  const mixedShapes: { type: string; color: string }[] = [];
  const colors = ['#f472b6', '#60a5fa', '#34d399'];
  const types = ['circle', 'square', 'triangle'];
  for (let i = 0; i < totalCount; i++) {
    mixedShapes.push({ type: types[i % 3], color: colors[i % 3] });
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Phân loại hình: {totalCount} hình
      </span>

      {/* Mixed shapes */}
      <div className="flex flex-wrap gap-1.5 justify-center p-2 bg-slate-50 rounded-xl border border-slate-200">
        {mixedShapes.map((s, i) => (
          <div key={i} className="opacity-60">
            <MiniShape type={s.type} color={s.color} />
          </div>
        ))}
        <span className="text-[9px] text-slate-400 self-center ml-1">→</span>
      </div>

      {/* Sorted categories */}
      <div className="flex gap-3">
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.type}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 ${cat.bg} ${cat.border}`}
          >
            <div className="flex flex-wrap gap-1 justify-center min-h-[36px]">
              {Array.from({ length: counts[i] }).map((_, j) => (
                <MiniShape key={j} type={cat.type} color={cat.color} />
              ))}
            </div>
            <span className={`text-[10px] font-bold ${cat.text}`}>{cat.label}</span>
            <span className={`text-[11px] font-black ${cat.text}`}>{counts[i]}</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
