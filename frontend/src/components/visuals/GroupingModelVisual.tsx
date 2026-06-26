'use client';

import React from 'react';

interface GroupingModelProps {
  primaryCount: number;
  secondaryCount: number;
  totalCount: number;
  groupsLabel?: string;
  itemsLabel?: string;
}

export default function GroupingModelVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'nhóm',
  itemsLabel = 'vật',
}: GroupingModelProps) {
  const groups = primaryCount;
  const itemsPerGroup = secondaryCount;
  const total = groups * itemsPerGroup;

  const groupColors = [
    'bg-rose-100 border-rose-300 text-rose-600',
    'bg-sky-100 border-sky-300 text-sky-600',
    'bg-emerald-100 border-emerald-300 text-emerald-600',
    'bg-amber-100 border-amber-300 text-amber-600',
    'bg-violet-100 border-violet-300 text-violet-600',
    'bg-teal-100 border-teal-300 text-teal-600',
    'bg-pink-100 border-pink-300 text-pink-600',
    'bg-indigo-100 border-indigo-300 text-indigo-600',
  ];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
        {groups} {groupsLabel} × {itemsPerGroup} {itemsLabel} = {total}
      </span>

      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: groups }, (_, groupIdx) => (
          <div
            key={groupIdx}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 ${
              groupColors[groupIdx % groupColors.length]
            }`}
          >
            <span className="text-[9px] font-bold uppercase opacity-70">
              {groupsLabel} {groupIdx + 1}
            </span>
            <div className="flex flex-wrap justify-center gap-1 max-w-[80px]">
              {Array.from({ length: itemsPerGroup }, (_, itemIdx) => (
                <div
                  key={itemIdx}
                  className="w-5 h-5 rounded-full bg-current opacity-30"
                />
              ))}
            </div>
            <span className="text-[10px] font-bold">{itemsPerGroup}</span>
          </div>
        ))}
      </div>

      <div className="text-xs font-semibold text-slate-600">
        {Array.from({ length: groups }, () => itemsPerGroup).join(' + ')} = {total}
      </div>
    </div>
  );
}
