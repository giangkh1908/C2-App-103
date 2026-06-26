'use client';

import React from 'react';
import { VisualProps } from './shared';

const MATCHES = [
  {
    shape: 'rectangle',
    shapeLabel: 'Hình chữ nhật',
    realObj: 'Sách',
    realIcon: '📖',
    color: 'bg-amber-400',
  },
  {
    shape: 'circle',
    shapeLabel: 'Hình tròn',
    realObj: 'Đồng hồ',
    realIcon: '🕐',
    color: 'bg-rose-400',
  },
  {
    shape: 'triangle',
    shapeLabel: 'Hình tam giác',
    realObj: 'Bánh xe',
    realIcon: '🔺',
    color: 'bg-emerald-400',
  },
  {
    shape: 'square',
    shapeLabel: 'Hình vuông',
    realObj: 'Cửa sổ',
    realIcon: '🪟',
    color: 'bg-blue-400',
  },
];

function ShapeIcon({ shape, color }: { shape: string; color: string }) {
  if (shape === 'rectangle') {
    return (
      <svg width="48" height="36" viewBox="0 0 48 36">
        <rect x="2" y="2" width="44" height="32" rx="3" fill="currentColor" className={color} />
      </svg>
    );
  }
  if (shape === 'circle') {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="currentColor" className={color} />
      </svg>
    );
  }
  if (shape === 'triangle') {
    return (
      <svg width="48" height="44" viewBox="0 0 48 44">
        <polygon points="24,4 44,40 4,40" fill="currentColor" className={color} />
      </svg>
    );
  }
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <rect x="4" y="4" width="36" height="36" fill="currentColor" className={color} />
    </svg>
  );
}

export default function RealObjectMatchVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Khớp hình',
  itemsLabel = 'vật thật',
}: VisualProps) {
  const matchIdx = Math.max(0, Math.min(MATCHES.length - 1, primaryCount - 1));
  const match = MATCHES[matchIdx];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Khớp hình với vật thật
      </span>

      <div className="flex items-center gap-4">
        {/* Geometric shape */}
        <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border-2 border-slate-200">
          <ShapeIcon shape={match.shape} color={match.color} />
          <span className="text-[10px] font-bold text-slate-600">{match.shapeLabel}</span>
        </div>

        {/* Arrow / match line */}
        <div className="flex flex-col items-center">
          <svg width="60" height="24" viewBox="0 0 60 24">
            <line x1="0" y1="12" x2="50" y2="12" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
            <polygon points="50,6 60,12 50,18" fill="#3b82f6" />
          </svg>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            Khớp
          </span>
        </div>

        {/* Real object */}
        <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border-2 border-slate-200">
          <div className="w-12 h-12 flex items-center justify-center text-2xl">
            {match.realIcon}
          </div>
          <span className="text-[10px] font-bold text-slate-600">{match.realObj}</span>
        </div>
      </div>

      {/* All matches list */}
      <div className="flex gap-2">
        {MATCHES.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[9px] font-bold ${
              i === matchIdx ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span>{m.realIcon}</span>
            <span>{m.shapeLabel}</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
