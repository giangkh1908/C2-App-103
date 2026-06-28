'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function AreaGridVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Diện tích',
  itemsLabel = 'ô vuông',
}: VisualProps) {
  const rows = Math.max(1, Math.min(8, primaryCount));
  const cols = Math.max(1, Math.min(8, secondaryCount));
  const totalArea = rows * cols;

  const cellSize = 28;
  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Diện tích: {rows} × {cols} = {totalArea} ô
      </span>

      <div className="flex items-center gap-6">
        {/* Grid */}
        <div className="relative p-3 bg-white rounded-xl border border-slate-200">
          {/* Row label */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90">
            <span className="text-[9px] font-bold text-blue-600">{rows} hàng</span>
          </div>

          {/* Column label */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4">
            <span className="text-[9px] font-bold text-blue-600">{cols} cột</span>
          </div>

          <svg width={gridWidth + 2} height={gridHeight + 2} viewBox={`0 0 ${gridWidth + 2} ${gridHeight + 2}`}>
            <g transform="translate(1, 1)">
              {Array.from({ length: rows }).map((_, r) =>
                Array.from({ length: cols }).map((_, c) => (
                  <g key={`${r}-${c}`}>
                    <rect
                      x={c * cellSize}
                      y={r * cellSize}
                      width={cellSize - 1}
                      height={cellSize - 1}
                      fill={
                        (r + c) % 2 === 0 ? '#dbeafe' : '#bfdbfe'
                      }
                      stroke="#3b82f6"
                      strokeWidth="1"
                      rx="2"
                    />
                    <text
                      x={c * cellSize + (cellSize - 1) / 2}
                      y={r * cellSize + (cellSize - 1) / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[7px] font-bold fill-blue-600"
                    >
                      1
                    </text>
                  </g>
                ))
              )}
            </g>
          </svg>
        </div>

        {/* Formula */}
        <div className="flex flex-col items-center gap-2">
          <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300">
            <div className="text-[11px] font-bold text-blue-700 text-center mb-1">Công thức</div>
            <div className="text-[13px] font-black text-blue-900 text-center">
              S = {rows} × {cols}
            </div>
            <div className="text-[15px] font-black text-blue-600 text-center mt-1">
              S = {totalArea}
            </div>
          </div>

          <div className="px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700">
              = {totalArea} ô vuông
            </span>
          </div>

          <div className="flex gap-1">
            <div className="px-2 py-0.5 bg-blue-100 rounded text-[9px] font-bold text-blue-600">
              {rows} hàng
            </div>
            <div className="px-2 py-0.5 bg-indigo-100 rounded text-[9px] font-bold text-indigo-600">
              {cols} cột
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
