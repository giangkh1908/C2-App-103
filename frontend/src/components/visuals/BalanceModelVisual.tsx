'use client';

import React from 'react';

import type { VisualProps } from './shared';

export default function BalanceModelVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'bên trái',
  itemsLabel = 'vật',
}: VisualProps) {
  const left = primaryCount;
  const right = secondaryCount;
  const diff = left - right;
  const balanced = diff === 0;
  const tiltAngle = balanced ? 0 : Math.min(Math.max(diff * 5, -20), 20);

  const blockColors = [
    'bg-rose-400 border-rose-500',
    'bg-sky-400 border-sky-500',
    'bg-emerald-400 border-emerald-500',
    'bg-amber-400 border-amber-500',
    'bg-violet-400 border-violet-500',
    'bg-pink-400 border-pink-500',
  ];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
        Cân bằng: {left} {groupsLabel} vs {right} {itemsLabel}
      </span>

      {/* Balance scale */}
      <svg viewBox="0 0 300 160" className="w-full max-w-sm">
        {/* Base / stand */}
        <polygon points="150,145 140,155 160,155" fill="#64748b" />
        <line x1="150" y1="80" x2="150" y2="145" stroke="#64748b" strokeWidth="3" />

        {/* Beam */}
        <g transform={`rotate(${tiltAngle}, 150, 80)`}>
          <line x1="30" y1="80" x2="270" y2="80" stroke="#475569" strokeWidth="3" />

          {/* Left pan */}
          <line x1="60" y1="80" x2="60" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="30" y1="110" x2="90" y2="110" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Right pan */}
          <line x1="240" y1="80" x2="240" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="210" y1="110" x2="270" y2="110" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Left items */}
          {Array.from({ length: Math.min(left, 12) }, (_, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            return (
              <rect
                key={`l-${i}`}
                x={36 + col * 14}
                y={96 - row * 14}
                width="12"
                height="12"
                rx="2"
                className={blockColors[i % blockColors.length]}
                fillOpacity="0.8"
              />
            );
          })}
          {left > 12 && (
            <text x="60" y="82" textAnchor="middle" className="fill-slate-500 text-[8px]" fontFamily="sans-serif">
              +{left - 12}
            </text>
          )}

          {/* Right items */}
          {Array.from({ length: Math.min(right, 12) }, (_, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            return (
              <rect
                key={`r-${i}`}
                x={216 + col * 14}
                y={96 - row * 14}
                width="12"
                height="12"
                rx="2"
                className={blockColors[(i + 3) % blockColors.length]}
                fillOpacity="0.8"
              />
            );
          })}
          {right > 12 && (
            <text x="240" y="82" textAnchor="middle" className="fill-slate-500 text-[8px]" fontFamily="sans-serif">
              +{right - 12}
            </text>
          )}

          {/* Left count label */}
          <text x="60" y="125" textAnchor="middle" className="fill-sky-700 text-[11px] font-bold" fontFamily="sans-serif">
            {left}
          </text>

          {/* Right count label */}
          <text x="240" y="125" textAnchor="middle" className="fill-rose-700 text-[11px] font-bold" fontFamily="sans-serif">
            {right}
          </text>
        </g>

        {/* Fulcrum triangle */}
        <polygon points="144,80 156,80 150,70" fill="#475569" />
      </svg>

      {/* Equation */}
      <div className="flex items-center gap-2 text-sm font-bold">
        <span className="text-sky-600">{left}</span>
        <span className={balanced ? 'text-green-600' : 'text-red-500'}>
          {balanced ? '=' : (diff > 0 ? '>' : '<')}
        </span>
        <span className="text-rose-600">{right}</span>
        {balanced && (
          <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            Cân bằng!
          </span>
        )}
      </div>

      {/* Total */}
      <div className="text-[11px] font-semibold text-slate-500">
        Tổng: {left} + {right} = {totalCount !== undefined ? totalCount : left + right}
      </div>
    </div>
  );
}
