'use client';

import React from 'react';
import { motion } from 'motion/react';

import { getConfigNumber, getConfigString, VisualProps } from './shared';
import { getItemEmoji } from './kidThemeSafe';

export default function OperationStoryVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'đồ vật',
  config,
}: VisualProps) {
  const before = getConfigNumber(config, 'before') ?? primaryCount;
  const change = getConfigNumber(config, 'change') ?? secondaryCount;
  const after = getConfigNumber(config, 'result') ?? totalCount;
  const operation = getConfigString(config, 'operation') ?? (after >= before ? '+' : '−');
  const storyContext = getConfigString(config, 'story_context') ?? groupsLabel;
  const isAddition = operation !== '-' && operation !== '−';
  const emoji = getItemEmoji(storyContext, 0);

  const renderObjects = (count: number, label: string, colorClass: string, maxShow = 8) => {
    const shown = Math.min(count, maxShow);
    const extra = count - shown;
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
        <div className="flex min-h-[44px] max-w-[168px] flex-wrap justify-center gap-1">
          {Array.from({ length: shown }, (_, index) => (
            <motion.span
              key={`${label}-${index}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.04, type: 'spring', stiffness: 300 }}
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg ${colorClass}`}
            >
              {emoji}
            </motion.span>
          ))}
          {extra > 0 && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-xs font-bold text-slate-500">
              +{extra}
            </div>
          )}
        </div>
        <span className="text-base font-black text-slate-700">{count}</span>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <span className="rounded-full border-2 border-fuchsia-200 bg-fuchsia-50 px-4 py-1.5 text-sm font-bold text-fuchsia-700">
        Bài toán lời văn
      </span>

      <div className="flex w-full flex-wrap items-center justify-center gap-4 rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
        {renderObjects(before, 'Trước', 'border-amber-300 bg-amber-50')}

        <div className="flex flex-col items-center gap-2">
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl font-black text-slate-400">
            →
          </motion.div>
          <div className={`rounded-full border-2 px-3 py-1 text-sm font-bold ${isAddition ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {operation} {change}
          </div>
        </div>

        {renderObjects(after, 'Sau', 'border-sky-300 bg-sky-50')}
      </div>

      <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-4 py-3 text-center shadow-sm">
        <div className="text-lg font-black text-violet-700">
          <span className="text-amber-600">{before}</span>
          <span className="mx-2 text-slate-400">{operation}</span>
          <span className={isAddition ? 'text-emerald-600' : 'text-rose-600'}>{change}</span>
          <span className="mx-2 text-slate-400">=</span>
          <span>{after}</span>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-600">
          {isAddition
            ? `Có ${before} ${storyContext}, thêm ${change} ${storyContext}, nên có ${after} ${storyContext}.`
            : `Có ${before} ${storyContext}, bớt ${change} ${storyContext}, còn lại ${after} ${storyContext}.`}
        </p>
      </div>
    </div>
  );
}
