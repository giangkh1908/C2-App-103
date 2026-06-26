'use client';

import React from 'react';
import { VisualProps } from './shared';

const ROW_COLORS = [
  'bg-violet-400',
  'bg-purple-400',
  'bg-indigo-400',
  'bg-blue-400',
  'bg-sky-400',
  'bg-cyan-400',
  'bg-teal-400',
  'bg-emerald-400',
];

export default function ArrayModelVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'hàng',
  itemsLabel = 'cột',
}: VisualProps) {
  const rows = primaryCount;
  const cols = secondaryCount;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
        {rows} {groupsLabel} × {cols} {itemsLabel} = {totalCount}
      </span>

      <div className="flex flex-col items-center gap-0.5">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center gap-0.5">
            <span className="text-[8px] font-bold text-violet-500 w-4 text-right mr-1">
              {r + 1}
            </span>
            {Array.from({ length: cols }, (_, c) => (
              <div
                key={c}
                className={`w-6 h-6 rounded-sm ${ROW_COLORS[r % ROW_COLORS.length]} opacity-75 transition-opacity hover:opacity-100`}
              />
            ))}
          </div>
        ))}
        <div className="flex gap-0.5 mt-1">
          <span className="w-4 mr-1" />
          {Array.from({ length: cols }, (_, c) => (
            <span key={c} className="w-6 text-center text-[8px] font-bold text-violet-500">
              {c + 1}
            </span>
          ))}
        </div>
      </div>

      <div className="text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1 rounded-lg border border-violet-200">
        {rows} × {cols} = {totalCount}
      </div>
    </div>
  );
}
