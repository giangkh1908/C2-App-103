'use client';

import React from 'react';
import { VisualProps } from './shared';

const GROUP_COLORS = [
  'border-blue-300 bg-blue-50',
  'border-sky-300 bg-sky-50',
  'border-indigo-300 bg-indigo-50',
  'border-cyan-300 bg-cyan-50',
  'border-blue-200 bg-blue-100',
  'border-sky-200 bg-sky-100',
];

export default function CountingObjectsVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'nhóm',
  itemsLabel = 'vật',
}: VisualProps) {
  const groups = primaryCount;
  const itemsPerGroup = secondaryCount;

  const allGroups: number[][] = [];
  let remaining = totalCount;
  for (let g = 0; g < groups; g++) {
    const count = Math.min(itemsPerGroup, remaining);
    allGroups.push(Array.from({ length: count }, (_, i) => g * itemsPerGroup + i));
    remaining -= count;
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        {groups} {groupsLabel} × {itemsPerGroup} {itemsLabel} = {totalCount}
      </span>

      <div className="flex flex-wrap justify-center gap-3">
        {allGroups.map((group, gIdx) => (
          <div
            key={gIdx}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 ${GROUP_COLORS[gIdx % GROUP_COLORS.length]}`}
          >
            <span className="text-[9px] font-bold uppercase opacity-60 text-blue-700">
              {groupsLabel} {gIdx + 1}
            </span>
            <div className="flex flex-wrap justify-center gap-1 max-w-[90px]">
              {group.map((itemIdx) => (
                <span key={itemIdx} className="text-blue-500 text-lg leading-none">
                  ●
                </span>
              ))}
            </div>
            <span className="text-[10px] font-bold text-blue-700">{group.length}</span>
          </div>
        ))}
      </div>

      <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
        Tổng cộng: {totalCount} {itemsLabel}
      </div>
    </div>
  );
}
