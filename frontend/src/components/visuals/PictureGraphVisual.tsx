'use client';

import React from 'react';
import { VisualProps } from './shared';

const CATEGORY_NAMES = [
  'Táo', 'Cam', 'Chuối', 'Nho', 'Xoài',
  'Dưa hấu', 'Dâu', 'Kiwi', 'Bơ', 'Măng cụt',
];

const ICONS = ['🍎', '⭐', '🍊', '🍋', '🍇'];

const GROUP_COLORS = [
  'bg-red-50 border-red-200',
  'bg-amber-50 border-amber-200',
  'bg-orange-50 border-orange-200',
  'bg-yellow-50 border-yellow-200',
  'bg-purple-50 border-purple-200',
  'bg-green-50 border-green-200',
  'bg-pink-50 border-pink-200',
  'bg-cyan-50 border-cyan-200',
];

export default function PictureGraphVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Loại trái cây',
  itemsLabel = 'quả',
}: VisualProps) {
  const groups = primaryCount;
  const perGroup = secondaryCount;
  const icon = ICONS[0];

  const groupData: { label: string; count: number }[] = [];
  let remaining = totalCount;
  for (let g = 0; g < groups; g++) {
    const count = Math.min(perGroup, remaining);
    groupData.push({ label: CATEGORY_NAMES[g % CATEGORY_NAMES.length], count });
    remaining -= count;
    if (remaining < 0) remaining = 0;
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
        Biểu đồ tranh: {groups} loại × {perGroup} {itemsLabel}
      </span>

      {/* Scale legend */}
      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
        <span>Chú giải: 1 {icon} = {perGroup} {itemsLabel}</span>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-md">
        {groupData.map((group, gIdx) => {
          const iconCount = Math.ceil(group.count / perGroup);
          return (
            <div
              key={gIdx}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${GROUP_COLORS[gIdx % GROUP_COLORS.length]}`}
            >
              <span className="text-[10px] font-bold text-slate-700 w-16 shrink-0 text-right">
                {group.label}
              </span>
              <div className="flex flex-wrap gap-0.5">
                {Array.from({ length: iconCount }, (_, i) => (
                  <span key={i} className="text-base leading-none">
                    {icon}
                  </span>
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-600 ml-auto">
                {group.count} {itemsLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
        Tổng cộng: {totalCount} {itemsLabel}
      </div>
    </div>
  );
}
