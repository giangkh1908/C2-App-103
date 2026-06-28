'use client';

import React from 'react';
import { motion } from 'motion/react';

import { VisualProps } from './shared';

const SCENARIOS = [
  { type: 'possible', label: 'Có thể', icon: '🎲', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', description: 'Có thể xảy ra hoặc không' },
  { type: 'certain', label: 'Chắc chắn', icon: '✅', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', description: 'Sự kiện chắc chắn xảy ra' },
  { type: 'impossible', label: 'Không thể', icon: '❌', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', description: 'Sự kiện không thể xảy ra' },
] as const;

function getScenarioType(secondaryCount: number, totalCount: number) {
  if (totalCount <= 0 || secondaryCount <= 0) return 'impossible';
  if (secondaryCount >= totalCount) return 'certain';
  return 'possible';
}

export default function ScenarioCardsVisual({ secondaryCount, totalCount, groupsLabel = 'Sự kiện', itemsLabel = 'kết quả' }: VisualProps) {
  const type = getScenarioType(secondaryCount, totalCount);
  const percentage = totalCount > 0 ? Math.round((secondaryCount / totalCount) * 100) : 0;

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-bold text-indigo-700">
        Phân loại khả năng xảy ra
      </span>
      <div className="grid w-full gap-3 sm:grid-cols-3">
        {SCENARIOS.map((scenario, index) => {
          const active = scenario.type === type;
          return (
            <motion.div key={scenario.type} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.05 }} className={`rounded-3xl border-2 px-4 py-4 text-center shadow-sm ${active ? `${scenario.bg} ${scenario.border}` : 'border-slate-200 bg-slate-50'}`}>
              <div className="text-3xl">{scenario.icon}</div>
              <div className={`mt-2 text-sm font-black ${active ? scenario.color : 'text-slate-500'}`}>{scenario.label}</div>
              <div className="mt-1 text-xs font-medium text-slate-600">{scenario.description}</div>
              {active && <div className={`mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black ${scenario.color}`}>{percentage}%</div>}
            </motion.div>
          );
        })}
      </div>
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
        {groupsLabel}: {secondaryCount} / {totalCount} {itemsLabel}
      </div>
    </div>
  );
}
