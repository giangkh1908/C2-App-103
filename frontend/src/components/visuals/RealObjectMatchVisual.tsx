'use client';

import React from 'react';
import { motion } from 'motion/react';

import { VisualProps } from './shared';

const MATCHES = [
  { shape: 'rectangle', shapeLabel: 'Hình chữ nhật', realObj: 'Quyển sách', realIcon: '📘', color: '#f59e0b' },
  { shape: 'circle', shapeLabel: 'Hình tròn', realObj: 'Đồng hồ', realIcon: '🕐', color: '#fb7185' },
  { shape: 'triangle', shapeLabel: 'Hình tam giác', realObj: 'Biển báo', realIcon: '🔺', color: '#34d399' },
  { shape: 'square', shapeLabel: 'Hình vuông', realObj: 'Cửa sổ', realIcon: '🪟', color: '#60a5fa' },
];

function ShapeIcon({ shape, color }: { shape: string; color: string }) {
  if (shape === 'rectangle') {
    return <svg width="54" height="40" viewBox="0 0 54 40"><rect x="4" y="4" width="46" height="32" rx="5" fill={color} /></svg>;
  }
  if (shape === 'circle') {
    return <svg width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="18" fill={color} /></svg>;
  }
  if (shape === 'triangle') {
    return <svg width="50" height="46" viewBox="0 0 50 46"><polygon points="25,4 46,42 4,42" fill={color} /></svg>;
  }
  return <svg width="46" height="46" viewBox="0 0 46 46"><rect x="5" y="5" width="36" height="36" rx="4" fill={color} /></svg>;
}

export default function RealObjectMatchVisual({ primaryCount, groupsLabel = 'Khớp hình', itemsLabel = 'vật thật' }: VisualProps) {
  const match = MATCHES[Math.max(0, Math.min(MATCHES.length - 1, primaryCount - 1))];

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-bold text-sky-700">
        Ghép hình với đồ vật quen thuộc
      </span>

      <div className="flex flex-wrap items-center justify-center gap-4 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-slate-200 bg-slate-50 px-5 py-4">
          <ShapeIcon shape={match.shape} color={match.color} />
          <span className="text-sm font-black text-slate-700">{match.shapeLabel}</span>
        </div>

        <motion.div initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="rounded-full border-2 border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700">
          Ghép đúng
        </motion.div>

        <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl">{match.realIcon}</div>
          <span className="text-sm font-black text-slate-700">{match.realObj}</span>
        </div>
      </div>

      <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {MATCHES.map((item) => {
          const active = item.shape === match.shape;
          return (
            <div key={item.shape} className={`rounded-2xl border-2 px-3 py-2 text-center text-sm font-bold ${active ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
              <div className="text-xl">{item.realIcon}</div>
              <div>{item.shapeLabel}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
        {groupsLabel} với {itemsLabel}
      </div>
    </div>
  );
}
