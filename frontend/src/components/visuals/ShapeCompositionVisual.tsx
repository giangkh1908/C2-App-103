'use client';

import React from 'react';
import { motion } from 'motion/react';

import { VisualProps } from './shared';

export default function ShapeCompositionVisual({ primaryCount, groupsLabel = 'Ghép hình', itemsLabel = 'mảnh ghép' }: VisualProps) {
  const pieces = Math.max(2, Math.min(9, primaryCount));
  const gridSize = Math.ceil(Math.sqrt(pieces));
  const colors = ['#fb7185', '#60a5fa', '#34d399', '#f59e0b', '#a78bfa', '#22d3ee', '#f472b6', '#818cf8', '#2dd4bf'];

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-bold text-violet-700">
        Ghép các hình nhỏ thành hình lớn
      </span>

      <div className="flex flex-wrap items-center justify-center gap-6 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold text-slate-500">{pieces} mảnh ghép</span>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 32px)` }}>
            {Array.from({ length: pieces }, (_, index) => (
              <motion.div key={index} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.04 }} className="h-8 w-8 rounded-lg" style={{ background: colors[index % colors.length] }} />
            ))}
          </div>
        </div>

        <div className="rounded-full border-2 border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700">
          Ghép lại
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold text-slate-500">Hình lớn</span>
          <svg width={gridSize * 34} height={gridSize * 34} viewBox={`0 0 ${gridSize * 34} ${gridSize * 34}`} className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-1">
            {Array.from({ length: pieces }, (_, index) => {
              const row = Math.floor(index / gridSize);
              const col = index % gridSize;
              return <rect key={index} x={col * 34 + 2} y={row * 34 + 2} width="30" height="30" rx="5" fill={colors[index % colors.length]} stroke="#ffffff" strokeWidth="2" />;
            })}
          </svg>
          <span className="text-sm font-black text-violet-700">{gridSize}×{gridSize} hình vuông</span>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
        {groupsLabel} bằng các {itemsLabel}
      </div>
    </div>
  );
}
