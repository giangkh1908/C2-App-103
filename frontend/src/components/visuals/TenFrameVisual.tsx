'use client';

import React from 'react';

interface TenFrameProps {
  primaryCount: number;
  secondaryCount: number;
  totalCount: number;
  groupsLabel?: string;
  itemsLabel?: string;
}

function TenFrame({ filled, label }: { filled: number; label?: string }) {
  const cells = Array.from({ length: 10 }, (_, i) => i < filled);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="grid grid-cols-5 gap-1 border-2 border-amber-400 rounded-lg p-1.5 bg-amber-50">
        {cells.map((isFilled, i) => (
          <div
            key={i}
            className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold transition-all ${
              isFilled
                ? 'bg-amber-400 text-white shadow-sm'
                : 'bg-white border border-dashed border-amber-200 text-transparent'
            }`}
          >
            {isFilled ? '●' : '○'}
          </div>
        ))}
      </div>
      {label && (
        <span className="text-[10px] font-bold text-amber-600">{label}</span>
      )}
    </div>
  );
}

export default function TenFrameVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel,
}: TenFrameProps) {
  const fullFrames = Math.floor(totalCount / 10);
  const remainder = totalCount % 10;
  const frames: number[] = [];
  for (let i = 0; i < fullFrames; i++) frames.push(10);
  if (remainder > 0) frames.push(remainder);

  if (frames.length === 0) frames.push(0);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
        Khung 10 — Tổng: {totalCount}
      </span>

      <div className="flex flex-wrap justify-center gap-3">
        {frames.map((filled, idx) => (
          <TenFrame
            key={idx}
            filled={filled}
            label={idx < fullFrames ? '10' : `+${remainder}`}
          />
        ))}
      </div>

      <div className="text-xs font-semibold text-slate-600">
        {groupsLabel && <span>{groupsLabel}: </span>}
        {primaryCount} + {secondaryCount} = {totalCount}
      </div>
    </div>
  );
}
