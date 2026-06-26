'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function ComparisonVisual({
  primaryCount,
  secondaryCount,
  groupsLabel = 'Số',
  config,
}: VisualProps) {
  const a = primaryCount;
  const b = secondaryCount;
  const aLabel = typeof config?.a_label === 'string' ? config.a_label : String(a);
  const bLabel = typeof config?.b_label === 'string' ? config.b_label : String(b);

  let symbol = '=';
  let symbolColor = 'text-slate-500';
  let summaryLabel = 'Hai số bằng nhau';
  if (a > b) {
    symbol = '>';
    symbolColor = 'text-emerald-600';
    summaryLabel = `${aLabel} lớn hơn ${bLabel}`;
  } else if (a < b) {
    symbol = '<';
    symbolColor = 'text-rose-600';
    summaryLabel = `${aLabel} nhỏ hơn ${bLabel}`;
  }

  const maxCount = Math.max(a, b, 1);
  const aWidth = `${(a / maxCount) * 100}%`;
  const bWidth = `${(b / maxCount) * 100}%`;

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4">
      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-600">
        So sánh hai số
      </span>

      <div className="grid w-full gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            {groupsLabel} A
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{aLabel}</p>
          <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/80">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: aWidth }} />
          </div>
          <p className="mt-3 text-3xl font-black text-blue-700">{a}</p>
        </div>

        <div className="flex min-w-[88px] flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-4">
          <span className={`text-3xl font-black ${symbolColor}`}>{symbol}</span>
          <span className={`text-center text-[11px] font-semibold ${symbolColor}`}>{summaryLabel}</span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
            {groupsLabel} B
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{bLabel}</p>
          <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/80">
            <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: bWidth }} />
          </div>
          <p className="mt-3 text-3xl font-black text-rose-700">{b}</p>
        </div>
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>0</span>
          <span>Mốc lớn nhất: {maxCount}</span>
        </div>
        <div className={`mt-3 rounded-xl border bg-white px-4 py-3 text-center text-sm font-bold ${symbolColor}`}>
          {a} {symbol} {b}
        </div>
      </div>
    </div>
  );
}
