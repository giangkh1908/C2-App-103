'use client';

import React from 'react';
import { motion } from 'motion/react';

import { VisualProps } from './shared';

function MiniShape({ type, color }: { type: string; color: string }) {
  if (type === 'circle') {
    return <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" fill={color} /></svg>;
  }
  if (type === 'square') {
    return <svg width="28" height="28" viewBox="0 0 28 28"><rect x="4" y="4" width="20" height="20" rx="4" fill={color} /></svg>;
  }
  return <svg width="28" height="28" viewBox="0 0 28 28"><polygon points="14,4 24,24 4,24" fill={color} /></svg>;
}

const CATEGORIES = [
  { type: 'circle', label: 'Hình tròn', color: '#fb7185', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  { type: 'square', label: 'Hình vuông', color: '#60a5fa', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
  { type: 'triangle', label: 'Hình tam giác', color: '#34d399', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
];

export default function ShapeSortingVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Phân loại',
  itemsLabel = 'hình',
}: VisualProps) {
  const counts = [Math.max(1, primaryCount), Math.max(1, secondaryCount), Math.max(1, totalCount - primaryCount - secondaryCount)];
  const mixedShapes = Array.from({ length: Math.max(totalCount, counts.reduce((sum, value) => sum + value, 0)) }, (_, index) => ({
    type: CATEGORIES[index % CATEGORIES.length].type,
    color: CATEGORIES[index % CATEGORIES.length].color,
  }));

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-bold text-violet-700">
        Phân loại hình
      </span>

      <div className="flex flex-wrap justify-center gap-2 rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
        {mixedShapes.map((shape, index) => (
          <motion.div key={`${shape.type}-${index}`} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.03 }} className="opacity-75">
            <MiniShape type={shape.type} color={shape.color} />
          </motion.div>
        ))}
      </div>

      <div className="grid w-full gap-3 sm:grid-cols-3">
        {CATEGORIES.map((category, index) => (
          <div key={category.type} className={`rounded-3xl border-2 p-4 shadow-sm ${category.bg} ${category.border}`}>
            <div className="flex flex-wrap justify-center gap-1">
              {Array.from({ length: counts[index] }, (_, shapeIndex) => (
                <MiniShape key={shapeIndex} type={category.type} color={category.color} />
              ))}
            </div>
            <div className={`mt-3 text-center text-sm font-black ${category.text}`}>{category.label}</div>
            <div className={`text-center text-lg font-black ${category.text}`}>{counts[index]}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
        {groupsLabel} theo từng {itemsLabel}
      </div>
    </div>
  );
}
