'use client';

import React from 'react';
import { motion } from 'motion/react';

import { getConfigNumber, getConfigString, getConfigStringArray, VisualProps } from './shared';

const DEFAULT_OUTCOMES = ['Đỏ', 'Xanh', 'Vàng', 'Tím', 'Cam'];
const OUTCOME_ICONS = ['🔴', '🔵', '🟡', '🟣', '🟠', '🟢'];

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export default function ProbabilityExperimentVisual({ totalCount, secondaryCount, config }: VisualProps) {
  const outcomes = getConfigStringArray(config, 'outcomes') ?? DEFAULT_OUTCOMES.slice(0, Math.max(2, totalCount || 4));
  const favorableCount = Math.max(0, getConfigNumber(config, 'favorable_count') ?? secondaryCount);
  const experimentLabel = getConfigString(config, 'experiment_label') ?? 'Kết quả có thể xảy ra';
  const total = Math.max(1, outcomes.length);
  const favorable = Math.min(total, favorableCount || Math.ceil(total / 2));
  const divisor = gcd(favorable, total);
  const numerator = favorable / divisor;
  const denominator = total / divisor;
  const percentage = Math.round((favorable / total) * 100);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700">
        Xác suất cơ bản
      </span>
      <div className="flex flex-wrap justify-center gap-2 rounded-3xl border-2 border-emerald-200 bg-white p-4 shadow-sm">
        {outcomes.map((outcome, index) => {
          const favorableOutcome = index < favorable;
          return (
            <motion.div
              key={outcome}
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex min-w-[88px] flex-col items-center gap-1 rounded-2xl border-2 px-3 py-3 ${favorableOutcome ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
            >
              <span className="text-2xl">{OUTCOME_ICONS[index % OUTCOME_ICONS.length]}</span>
              <span className={`text-xs font-bold ${favorableOutcome ? 'text-emerald-700' : 'text-slate-500'}`}>{outcome}</span>
            </motion.div>
          );
        })}
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-center shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Xác suất</div>
          <div className="text-3xl font-black text-emerald-700">{numerator}/{denominator}</div>
        </div>
        <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 px-4 py-3 text-center shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Phần trăm</div>
          <div className="text-3xl font-black text-sky-700">{percentage}%</div>
        </div>
      </div>
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
        {experimentLabel}: {favorable} / {total}
      </div>
    </div>
  );
}
