'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function BarModelVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'phần',
  itemsLabel = 'đơn vị',
}: VisualProps) {
  const a = primaryCount;
  const b = totalCount;
  const diff = Math.max(a, b) - Math.min(a, b);
  const maxBar = Math.max(a, b);

  const barWidth = (count: number) => maxBar > 0 ? `${(count / maxBar) * 100}%` : '0%';

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
        So sánh: {a} và {b}
      </span>

      <div className="w-full max-w-md flex flex-col gap-2">
        {/* Top bar - primary */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-blue-600 w-16 text-right shrink-0">
            {groupsLabel} 1
          </span>
          <div className="flex-1 relative h-8 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-blue-400 rounded-lg flex items-center justify-center"
              style={{ width: barWidth(a) }}
            >
              <span className="text-xs font-bold text-white">{a} {itemsLabel}</span>
            </div>
          </div>
        </div>

        {/* Bottom bar - total */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-green-600 w-16 text-right shrink-0">
            {groupsLabel} 2
          </span>
          <div className="flex-1 relative h-8 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-emerald-400 rounded-lg flex items-center justify-center"
              style={{ width: barWidth(b) }}
            >
              <span className="text-xs font-bold text-white">{b} {itemsLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Difference bracket */}
      {diff > 0 && (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
          <span className="text-amber-400">└──</span>
          Khác biệt: {diff} {itemsLabel}
          <span className="text-amber-400">──┘</span>
        </div>
      )}

      <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {a} {a < b ? '<' : a > b ? '>' : '='} {b}
      </div>
    </div>
  );
}
