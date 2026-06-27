'use client';

import React from 'react';
import { motion } from 'motion/react';

import { getConfigString, VisualProps } from './shared';

export default function ComparisonVisual({
  primaryCount,
  secondaryCount,
  groupsLabel = 'Số',
  config,
}: VisualProps) {
  const a = Number.isFinite(primaryCount) ? primaryCount : Number(primaryCount) || 0;
  const b = Number.isFinite(secondaryCount) ? secondaryCount : Number(secondaryCount) || 0;
  const aLabel = getConfigString(config, 'a_label') ?? String(a);
  const bLabel = getConfigString(config, 'b_label') ?? String(b);
  const compareOperator = a > b ? '>' : a < b ? '<' : '=';

  let symbolColor = 'text-amber-600';
  let summaryLabel = 'Hai số bằng nhau';
  if (compareOperator === '>') {
    symbolColor = 'text-emerald-600';
    summaryLabel = `${aLabel} lớn hơn ${bLabel}`;
  } else if (compareOperator === '<') {
    symbolColor = 'text-rose-600';
    summaryLabel = `${aLabel} nhỏ hơn ${bLabel}`;
  }

  const maxCount = Math.max(a, b, 1);
  const aWidth = `${(a / maxCount) * 100}%`;
  const bWidth = `${(b / maxCount) * 100}%`;

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-bold text-violet-700">
        So sánh hai số
      </span>

      <div className="grid w-full gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-3xl border-2 border-sky-200 bg-sky-50 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-700">{groupsLabel} A</p>
          <p className="mt-1 text-base font-bold text-slate-700">{aLabel}</p>
          <div className="mt-3 h-5 overflow-hidden rounded-full bg-white/90">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: aWidth }}
              transition={{ duration: 0.45 }}
              className="h-full rounded-full bg-sky-500"
            />
          </div>
          <p className="mt-3 text-4xl font-black text-sky-700">{a}</p>
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex min-w-[96px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-slate-200 bg-white px-3 py-4 shadow-sm"
        >
          <motion.span
            animate={{ scale: [1, 1.14, 1] }}
            transition={{ duration: 0.6 }}
            className={`text-4xl font-black ${symbolColor}`}
          >
            {compareOperator}
          </motion.span>
          <span className={`text-center text-xs font-bold ${symbolColor}`}>{summaryLabel}</span>
        </motion.div>

        <div className="rounded-3xl border-2 border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-rose-700">{groupsLabel} B</p>
          <p className="mt-1 text-base font-bold text-slate-700">{bLabel}</p>
          <div className="mt-3 h-5 overflow-hidden rounded-full bg-white/90">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: bWidth }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="h-full rounded-full bg-rose-500"
            />
          </div>
          <p className="mt-3 text-4xl font-black text-rose-700">{b}</p>
        </div>
      </div>

      <div className="w-full rounded-3xl border-2 border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-amber-700">
          <span>0</span>
          <span>Mốc lớn nhất: {maxCount}</span>
        </div>
        <div className={`mt-3 rounded-2xl border-2 bg-white px-4 py-3 text-center text-base font-black ${symbolColor}`}>
          {a} {compareOperator} {b}
        </div>
      </div>
    </div>
  );
}
