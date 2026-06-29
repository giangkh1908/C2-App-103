'use client';

import React from 'react';

import { type VisualProps } from './shared';

export default function UnitRateVisual({
  primaryCount,
  secondaryCount,
  groupsLabel = 'nhóm',
  itemsLabel = 'vật',
}: VisualProps) {
  const total = primaryCount;
  const groups = secondaryCount || 1;
  const perGroup = groups > 0 ? total / groups : 0;
  const maxPerGroup = Math.max(perGroup, 1);

  const barColors = [
    'bg-sky-400 border-sky-600',
    'bg-emerald-400 border-emerald-600',
    'bg-amber-400 border-amber-600',
    'bg-rose-400 border-rose-600',
    'bg-violet-400 border-violet-600',
    'bg-teal-400 border-teal-600',
  ];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
        Tỷ lệ đơn vị — {total} {itemsLabel} / {groups} {groupsLabel}
      </span>

      <div className="flex flex-col items-center gap-2 w-full max-w-sm">
        {Array.from({ length: groups }, (_, i) => {
          const color = barColors[i % barColors.length];
          const filled = Math.min(perGroup, total - i * perGroup);
          const barWidth = maxPerGroup > 0 ? (filled / maxPerGroup) * 100 : 0;

          return (
            <div key={i} className="flex items-center gap-2 w-full">
              <span className="text-[10px] font-bold text-slate-500 w-16 text-right shrink-0">
                {groupsLabel} {i + 1}
              </span>
              <div className="flex-1 h-6 bg-slate-100 rounded-full border border-slate-200 overflow-hidden relative">
                <div
                  className={`h-full rounded-full border ${color} transition-all`}
                  style={{ width: `${barWidth}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                  {filled % 1 === 0 ? filled : filled.toFixed(1)} {itemsLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="text-xs font-semibold text-slate-600">
          <span className="text-sky-600">{total}</span>
          <span className="text-slate-400 mx-1">÷</span>
          <span className="text-sky-600">{groups}</span>
          <span className="text-slate-400 mx-1">=</span>
          <span className="text-sky-700 font-bold">
            {perGroup % 1 === 0 ? perGroup : perGroup.toFixed(2)}
          </span>
          <span className="text-slate-500 ml-1">{itemsLabel}/{groupsLabel}</span>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-sky-400 border border-sky-600" />
            <span className="text-[10px] text-slate-500">
              {perGroup % 1 === 0 ? perGroup : perGroup.toFixed(1)} {itemsLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
