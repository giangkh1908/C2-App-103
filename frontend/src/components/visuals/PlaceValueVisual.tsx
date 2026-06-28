'use client';

import React from 'react';
import { motion } from 'motion/react';

import { getConfigNumber, VisualProps } from './shared';

const PLACE_CONFIG = [
  { label: 'trăm', icon: '🟧', bg: '#FFF4E6', border: '#FF922B', text: '#D9480F' },
  { label: 'chục', icon: '🟩', bg: '#EBFBEE', border: '#51CF66', text: '#2F9E44' },
  { label: 'đơn vị', icon: '🟡', bg: '#FFF9DB', border: '#FFD43B', text: '#E67700' },
];

function PlaceBlock({ value, label, icon, bg, border, text, delay }: { value: number; label: string; icon: string; bg: string; border: string; text: string; delay: number }) {
  if (value === 0) return null;
  return (
    <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay }} className="flex flex-col items-center gap-2 rounded-3xl border-2 p-3 shadow-sm" style={{ background: bg, borderColor: border }}>
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: text }}>{label}</span>
      <div className="flex max-w-[120px] flex-wrap justify-center gap-1">
        {Array.from({ length: Math.min(value, 12) }, (_, index) => (
          <motion.span key={index} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay + index * 0.03, type: 'spring', stiffness: 320 }} className="text-xl leading-none">{icon}</motion.span>
        ))}
      </div>
      <span className="text-xl font-black" style={{ color: text }}>{value}</span>
    </motion.div>
  );
}

export default function PlaceValueVisual({ totalCount, primaryCount, secondaryCount, config }: VisualProps) {
  const number = getConfigNumber(config, 'number') ?? totalCount ?? primaryCount * 10 + secondaryCount;
  const hundreds = getConfigNumber(config, 'hundreds') ?? Math.floor(number / 100);
  const tens = getConfigNumber(config, 'tens') ?? Math.floor((number % 100) / 10);
  const ones = getConfigNumber(config, 'ones') ?? number % 10;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-full border-2 px-4 py-2 text-sm font-bold" style={{ background: '#E8F4FF', borderColor: '#4DABF7', color: '#1971C2' }}>
        Cấu tạo số: <span className="text-lg font-black">{number}</span>
      </motion.div>
      <div className="flex flex-wrap items-end justify-center gap-3">
        <PlaceBlock value={hundreds} delay={0.05} {...PLACE_CONFIG[0]} />
        <PlaceBlock value={tens} delay={0.14} {...PLACE_CONFIG[1]} />
        <PlaceBlock value={ones} delay={0.23} {...PLACE_CONFIG[2]} />
      </div>
      <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 px-4 py-2 text-base font-black text-sky-700 shadow-sm">
        {hundreds > 0 ? `${hundreds}×100` : ''}{hundreds > 0 && tens > 0 ? ' + ' : ''}{tens > 0 ? `${tens}×10` : ''}{(hundreds > 0 || tens > 0) ? ' + ' : ''}{ones} = {number}
      </div>
    </div>
  );
}
