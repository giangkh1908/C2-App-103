'use client';

import React from 'react';
import { VisualProps } from './shared';

const SHAPES = [
  { id: 1, name: 'Hình tròn', color: 'bg-rose-400', ring: 'ring-rose-400' },
  { id: 2, name: 'Hình vuông', color: 'bg-blue-400', ring: 'ring-blue-400' },
  { id: 3, name: 'Hình tam giác', color: 'bg-emerald-400', ring: 'ring-emerald-400' },
  { id: 4, name: 'Hình chữ nhật', color: 'bg-amber-400', ring: 'ring-amber-400' },
];

function ShapeSVG({ shapeId, size = 60 }: { shapeId: number; size?: number }) {
  const s = size;
  if (shapeId === 1) {
    return (
      <svg width={s} height={s} viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="25" fill="currentColor" className="text-rose-400" />
      </svg>
    );
  }
  if (shapeId === 2) {
    return (
      <svg width={s} height={s} viewBox="0 0 60 60">
        <rect x="5" y="5" width="50" height="50" fill="currentColor" className="text-blue-400" />
      </svg>
    );
  }
  if (shapeId === 3) {
    return (
      <svg width={s} height={s} viewBox="0 0 60 60">
        <polygon points="30,5 55,55 5,55" fill="currentColor" className="text-emerald-400" />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 60 60">
      <rect x="5" y="12" width="50" height="36" rx="2" fill="currentColor" className="text-amber-400" />
    </svg>
  );
}

export default function GeometryShapeVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Hình học',
  itemsLabel = 'hình 2D',
}: VisualProps) {
  const highlighted = Math.max(1, Math.min(4, primaryCount));

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Hình học cơ bản: 4 hình 2D
      </span>

      <div className="grid grid-cols-2 gap-4">
        {SHAPES.map((shape) => {
          const isActive = shape.id === highlighted;
          return (
            <div
              key={shape.id}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                isActive
                  ? `border-blue-500 bg-blue-50 ring-2 ${shape.ring} scale-110`
                  : 'border-slate-200 bg-white opacity-60'
              }`}
            >
              <ShapeSVG shapeId={shape.id} />
              <span
                className={`text-[10px] font-bold ${isActive ? 'text-blue-700' : 'text-slate-500'}`}
              >
                {shape.name}
              </span>
              {isActive && (
                <span className="text-[9px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  #{shape.id}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
