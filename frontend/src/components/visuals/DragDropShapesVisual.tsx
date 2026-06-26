'use client';

import React from 'react';
import { VisualProps } from './shared';

const SHAPES = ['●', '■', '▲'];
const SHAPE_COLORS = ['text-rose-400', 'text-blue-400', 'text-emerald-400'];

export default function DragDropShapesVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Kéo thả',
  itemsLabel = 'hình',
}: VisualProps) {
  const rows = Math.max(2, Math.min(4, primaryCount));
  const cols = Math.max(2, Math.min(5, secondaryCount));
  const pattern: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pattern.push((r + c) % 3);
    }
  }

  const missingRow = Math.min(rows - 1, Math.floor(rows / 2));
  const missingCol = Math.min(cols - 1, Math.floor(cols / 2));
  const missingIdx = missingRow * cols + missingCol;
  const missingShape = pattern[missingIdx];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Sắp xếp hình: lưới {rows}×{cols}
      </span>

      {/* Grid pattern */}
      <div className="relative p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, 44px)` }}
        >
          {pattern.map((shapeIdx, i) => {
            const isMissing = i === missingIdx;
            return (
              <div
                key={i}
                className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl font-bold transition-all ${
                  isMissing
                    ? 'border-3 border-dashed border-red-400 bg-red-50 animate-pulse'
                    : 'border-2 border-slate-200 bg-white'
                }`}
              >
                {isMissing ? (
                  <span className="text-red-400 text-lg">?</span>
                ) : (
                  <span className={SHAPE_COLORS[shapeIdx]}>{SHAPES[shapeIdx]}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Shape options */}
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-bold text-slate-400">Chọn:</span>
        {SHAPES.map((s, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold border-2 cursor-pointer transition-all ${
              i === missingShape
                ? 'border-green-400 bg-green-50 ring-2 ring-green-300 scale-110'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className={SHAPE_COLORS[i]}>{s}</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
