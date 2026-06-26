'use client';

import React from 'react';

import { type VisualProps } from './shared';

export default function OperationStoryVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'đồ vật',
  itemsLabel = 'bài toán',
}: VisualProps) {
  const before = primaryCount;
  const change = secondaryCount;
  const after = totalCount;
  const isAddition = after >= before;
  const operation = isAddition ? '+' : '−';
  const emoji = isAddition ? '🟢' : '🔴';

  const objectColors = [
    'bg-amber-400 border-amber-600',
    'bg-sky-400 border-sky-600',
    'bg-emerald-400 border-emerald-600',
    'bg-rose-400 border-rose-600',
    'bg-violet-400 border-violet-600',
    'bg-teal-400 border-teal-600',
    'bg-pink-400 border-pink-600',
    'bg-indigo-400 border-indigo-600',
  ];

  const renderObjects = (count: number, label: string, maxShow: number) => {
    const shown = Math.min(count, maxShow);
    const extra = count - shown;
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase">{label}</span>
        <div className="flex flex-wrap justify-center gap-1 max-w-[120px] min-h-[32px]">
          {Array.from({ length: shown }, (_, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full border-2 ${objectColors[i % objectColors.length]} flex items-center justify-center text-[8px] font-bold text-white`}
            >
              ●
            </div>
          ))}
          {extra > 0 && (
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[8px] font-bold text-slate-400">
              +{extra}
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold text-slate-600">{count}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
        Bài toán lời văn
      </span>

      <div className="flex items-center justify-center gap-3 w-full">
        {/* Before state */}
        <div className="flex flex-col items-center">
          {renderObjects(before, 'Trước', 6)}
        </div>

        {/* Arrow with operation */}
        <div className="flex flex-col items-center gap-1">
          <svg viewBox="0 0 60 30" className="w-16 h-8">
            <line x1="5" y1="15" x2="45" y2="15" stroke="#94a3b8" strokeWidth="2" />
            <polygon points="45,15 38,10 38,20" fill="#94a380" />
          </svg>
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              isAddition
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}
          >
            <span>{emoji}</span>
            <span>
              {operation} {change}
            </span>
          </div>
        </div>

        {/* After state */}
        <div className="flex flex-col items-center">
          {renderObjects(after, 'Sau', 6)}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="text-sm font-bold text-slate-700">
          <span className="text-amber-600">{before}</span>
          <span className="text-slate-400 mx-1.5">{operation}</span>
          <span className={isAddition ? 'text-emerald-600' : 'text-rose-600'}>{change}</span>
          <span className="text-slate-400 mx-1.5">=</span>
          <span className="text-violet-700">{after}</span>
        </div>

        <div className="text-[10px] text-slate-500 italic text-center max-w-[240px]">
          {isAddition
            ? `Có ${before} ${groupsLabel}, thêm ${change} ${groupsLabel} nữa, giờ có ${after} ${groupsLabel}`
            : `Có ${before} ${groupsLabel}, lấy đi ${change} ${groupsLabel}, còn lại ${after} ${groupsLabel}`}
        </div>
      </div>
    </div>
  );
}
