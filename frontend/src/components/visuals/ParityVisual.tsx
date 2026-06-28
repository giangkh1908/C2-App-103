'use client';

import React from 'react';

import type { VisualProps } from './shared';

export default function ParityVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'số',
  itemsLabel = 'vật',
}: VisualProps) {
  const count = totalCount || primaryCount;
  const isEven = count % 2 === 0;
  const pairCount = Math.floor(count / 2);
  const hasUnpaired = count % 2 !== 0;

  const dotColor = isEven ? 'bg-emerald-400 border-emerald-500' : 'bg-rose-400 border-rose-500';
  const unpairedColor = 'bg-amber-400 border-amber-500';

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
        {count} {groupsLabel}
      </span>

      {/* Pairs display */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-xs">
        {Array.from({ length: pairCount }, (_, pairIdx) => (
          <div key={pairIdx} className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <div
                className={`w-5 h-5 rounded-full ${dotColor} border-2`}
                title={`${itemsLabel} ${pairIdx * 2 + 1}`}
              />
              <div
                className={`w-5 h-5 rounded-full ${dotColor} border-2`}
                title={`${itemsLabel} ${pairIdx * 2 + 2}`}
              />
            </div>
            <span className="text-[8px] text-slate-400 font-semibold">
              {(pairIdx + 1) * 2 - 1}, {(pairIdx + 1) * 2}
            </span>
          </div>
        ))}

        {hasUnpaired && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <div
                className={`w-5 h-5 rounded-full ${unpairedColor} border-2`}
                title={`${itemsLabel} ${count}`}
              />
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-300 opacity-30" />
            </div>
            <span className="text-[8px] text-amber-500 font-bold">
              {count} (lẻ)
            </span>
          </div>
        )}
      </div>

      {/* Parity result */}
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold ${
          isEven
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
            : 'bg-rose-50 border-rose-300 text-rose-700'
        }`}
      >
        <span className="text-2xl">
          {isEven ? '🟢' : '🔴'}
        </span>
        <div className="flex flex-col">
          <span className="text-lg">
            {isEven ? 'Chẵn' : 'Lẻ'}
          </span>
          <span className="text-[10px] font-normal opacity-70">
            {count} {isEven ? 'chia hết cho 2' : 'không chia hết cho 2'}
          </span>
        </div>
      </div>

      {/* Equation */}
      <div className="text-[11px] font-semibold text-slate-500">
        {count} ÷ 2 = {pairCount}
        {hasUnpaired ? ' (dư 1)' : ' (không dư)'}
      </div>

      {/* Pair count label */}
      <div className="flex gap-3 text-[10px] font-semibold">
        <span className="text-emerald-600">
          {pairCount} cặp {itemsLabel}
        </span>
        {hasUnpaired && (
          <span className="text-amber-600">
            1 {itemsLabel} chưa ghép cặp
          </span>
        )}
      </div>
    </div>
  );
}
