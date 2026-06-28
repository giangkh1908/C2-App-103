'use client';

import React from 'react';
import { motion } from 'motion/react';

import { VisualProps } from './shared';

const SHAPES = [
  { id: 1, name: 'Hình tròn', color: '#fb7185' },
  { id: 2, name: 'Hình vuông', color: '#60a5fa' },
  { id: 3, name: 'Hình tam giác', color: '#34d399' },
  { id: 4, name: 'Hình chữ nhật', color: '#f59e0b' },
];

function ShapeSVG({ shapeId, size = 64 }: { shapeId: number; size?: number }) {
  if (shapeId === 1) return <svg width={size} height={size} viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#fb7185" /></svg>;
  if (shapeId === 2) return <svg width={size} height={size} viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="6" fill="#60a5fa" /></svg>;
  if (shapeId === 3) return <svg width={size} height={size} viewBox="0 0 64 64"><polygon points="32,8 56,56 8,56" fill="#34d399" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 64 64"><rect x="8" y="16" width="48" height="32" rx="6" fill="#f59e0b" /></svg>;
}

export default function GeometryShapeVisual({ primaryCount, groupsLabel = 'Hình học', itemsLabel = 'hình 2D' }: VisualProps) {
  const highlighted = Math.max(1, Math.min(4, primaryCount));

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-bold text-sky-700">
        Nhận biết hình học cơ bản
      </span>
      <div className="grid w-full gap-4 sm:grid-cols-2">
        {SHAPES.map((shape, index) => {
          const active = shape.id === highlighted;
          return (
            <motion.div key={shape.id} initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.05 }} className={`flex flex-col items-center gap-2 rounded-3xl border-2 p-4 shadow-sm ${active ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'}`}>
              <ShapeSVG shapeId={shape.id} />
              <div className={`text-sm font-black ${active ? 'text-sky-700' : 'text-slate-600'}`}>{shape.name}</div>
              {active && <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-700">#{shape.id}</div>}
            </motion.div>
          );
        })}
      </div>
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
        {groupsLabel} với các {itemsLabel}
      </div>
    </div>
  );
}
