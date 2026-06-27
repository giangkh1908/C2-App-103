'use client';

import React from 'react';
import { motion } from 'motion/react';

import { VisualProps } from './shared';

const SHAPES = ['●', '■', '▲'];
const SHAPE_COLORS = ['text-rose-400', 'text-sky-400', 'text-emerald-400'];

export default function DragDropShapesVisual({
  primaryCount,
  secondaryCount,
  groupsLabel = 'Kéo thả',
  itemsLabel = 'hình',
}: VisualProps) {
  const rows = Math.max(2, Math.min(4, primaryCount));
  const cols = Math.max(2, Math.min(5, secondaryCount));
  const pattern = Array.from({ length: rows * cols }, (_, index) => index % SHAPES.length);
  const missingIndex = Math.min(pattern.length - 1, Math.floor(pattern.length / 2));
  const missingShape = pattern[missingIndex];

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700">
        Kéo thả để hoàn thành quy luật
      </span>

      <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 48px)` }}>
          {pattern.map((shapeIndex, index) => {
            const isMissing = index === missingIndex;
            return (
              <motion.div
                key={index}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-2xl font-black ${isMissing ? 'border-dashed border-amber-400 bg-amber-50 text-amber-600' : 'border-slate-200 bg-slate-50'}`}
              >
                {isMissing ? '?' : <span className={SHAPE_COLORS[shapeIndex]}>{SHAPES[shapeIndex]}</span>}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-3xl border-2 border-amber-200 bg-amber-50 p-4 shadow-sm">
        <span className="text-sm font-bold text-amber-700">Chọn hình đúng:</span>
        {SHAPES.map((shape, index) => {
          const active = index === missingShape;
          return (
            <div key={shape} className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-2xl font-black ${active ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200' : 'border-slate-200 bg-white'}`}>
              <span className={SHAPE_COLORS[index]}>{shape}</span>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
        {groupsLabel} {itemsLabel} theo quy luật lặp lại
      </div>
    </div>
  );
}
