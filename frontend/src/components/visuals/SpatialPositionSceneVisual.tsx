'use client';

import React from 'react';
import { motion } from 'motion/react';

import { VisualProps } from './shared';

const POSITIONS = [
  { id: 1, name: 'Trên', x: 50, y: 16, icon: '⬆️' },
  { id: 2, name: 'Dưới', x: 50, y: 84, icon: '⬇️' },
  { id: 3, name: 'Trái', x: 14, y: 50, icon: '⬅️' },
  { id: 4, name: 'Phải', x: 86, y: 50, icon: '➡️' },
  { id: 5, name: 'Trước', x: 50, y: 50, icon: '⭐' },
  { id: 6, name: 'Sau', x: 50, y: 50, icon: '🔹' },
];

const OBJECTS = [
  { id: 'board', label: 'Bảng', x: 50, y: 12, emoji: '🟩' },
  { id: 'teacher', label: 'Cô giáo', x: 50, y: 34, emoji: '🧑‍🏫' },
  { id: 'desk-left', label: 'Bàn trái', x: 32, y: 64, emoji: '🪑' },
  { id: 'desk-right', label: 'Bàn phải', x: 68, y: 64, emoji: '🪑' },
  { id: 'bookshelf', label: 'Tủ sách', x: 14, y: 28, emoji: '📚' },
  { id: 'clock', label: 'Đồng hồ', x: 86, y: 24, emoji: '🕐' },
];

export default function SpatialPositionSceneVisual({
  primaryCount,
  groupsLabel = 'Vị trí',
  itemsLabel = 'trong lớp học',
}: VisualProps) {
  const highlighted = POSITIONS[Math.max(0, Math.min(POSITIONS.length - 1, primaryCount - 1))];

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-rose-200 bg-rose-50 px-4 py-1.5 text-sm font-bold text-rose-700">
        Vị trí trong không gian
      </span>

      <div className="relative h-64 w-full overflow-hidden rounded-3xl border-2 border-slate-200 bg-gradient-to-b from-sky-100 via-white to-amber-50 shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-amber-100 to-transparent" />

        {OBJECTS.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.04 }}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white bg-white/90 text-2xl shadow-sm">
              {item.emoji}
            </div>
            <span className="mt-1 text-xs font-bold text-slate-600">{item.label}</span>
          </motion.div>
        ))}

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-dashed border-rose-400 bg-rose-100/80 text-2xl"
          style={{ left: `${highlighted.x}%`, top: `${highlighted.y}%` }}
        >
          {highlighted.icon}
        </motion.div>
      </div>

      <div className="grid w-full gap-2 sm:grid-cols-3">
        {POSITIONS.map((item) => {
          const active = item.id === highlighted.id;
          return (
            <div key={item.id} className={`rounded-2xl border-2 px-3 py-2 text-center text-sm font-bold ${active ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
              {item.name}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
        {groupsLabel} của đồ vật {itemsLabel}
      </div>
    </div>
  );
}
