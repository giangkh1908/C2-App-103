'use client';

import React from 'react';
import { type VisualProps } from './shared';

const BAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
];

const FALLBACK_LABELS = [
  'Nhom 1',
  'Nhom 2',
  'Nhom 3',
  'Nhom 4',
  'Nhom 5',
  'Nhom 6',
];

function buildFallbackBars(primaryCount: number, totalCount: number) {
  const bars: { label: string; value: number }[] = [];
  let remaining = totalCount;

  for (let index = 0; index < primaryCount; index += 1) {
    const value = Math.max(1, Math.round(remaining / (primaryCount - index)));
    bars.push({
      label: FALLBACK_LABELS[index % FALLBACK_LABELS.length],
      value,
    });
    remaining -= value;
  }

  return bars;
}

export default function BarChartVisual({
  primaryCount,
  totalCount,
  config,
  groupsLabel = 'Nhom',
  itemsLabel = 'So luong',
}: VisualProps) {
  const configLabels = Array.isArray(config?.labels)
    ? config.labels.filter((label): label is string => typeof label === 'string')
    : [];
  const configValues = Array.isArray(config?.values)
    ? config.values.filter((value): value is number => typeof value === 'number')
    : [];

  const barData =
    configLabels.length > 0 &&
    configValues.length > 0 &&
    configLabels.length === configValues.length
      ? configLabels.map((label, index) => ({ label, value: configValues[index] }))
      : buildFallbackBars(primaryCount, totalCount);

  const maxVal = Math.max(...barData.map((bar) => bar.value), 1);
  const maxIdx = barData.findIndex((bar) => bar.value === maxVal);
  const minVal = Math.min(...barData.map((bar) => bar.value), maxVal);
  const minIdx = barData.findIndex((bar) => bar.value === minVal);
  const chartHeight = 220;
  const yTicks = Array.from({ length: 5 }, (_, index) =>
    Math.round((maxVal * (4 - index)) / 4)
  );

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600">
        Bieu do cot: {barData.length} cot
      </span>

      <div className="flex w-full max-w-xl gap-2">
        <div
          className="flex flex-col justify-between pr-2 text-right text-[10px] font-medium text-slate-500"
          style={{ height: `${chartHeight}px` }}
        >
          {yTicks.map((tick, index) => (
            <span key={index}>{tick}</span>
          ))}
        </div>

        <div className="flex-1">
          <div
            className="relative rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-3 pt-3 pb-2 shadow-sm"
            style={{ height: `${chartHeight + 38}px` }}
          >
            <div className="absolute inset-x-3 top-3 bottom-10 flex flex-col justify-between pointer-events-none">
              {yTicks.map((_, index) => (
                <div key={index} className="w-full border-b border-dashed border-slate-200" />
              ))}
            </div>

            <div
              className="relative flex items-end justify-around gap-3"
              style={{ height: `${chartHeight}px` }}
            >
              {barData.map((bar, index) => {
                const heightPct = (bar.value / maxVal) * 100;
                const isMax = index === maxIdx;
                const isMin = index === minIdx;

                return (
                  <div
                    key={`${bar.label}-${index}`}
                    className="relative z-10 flex h-full flex-1 flex-col items-center justify-end"
                  >
                    <span
                      className={`mb-1 text-[11px] font-bold ${
                        isMax ? 'text-emerald-600' : isMin ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      {bar.value}
                    </span>
                    <div
                      className={`w-full max-w-[72px] rounded-t-xl shadow-sm ${BAR_COLORS[index % BAR_COLORS.length]} ${
                        isMax ? 'ring-2 ring-emerald-300' : isMin ? 'ring-2 ring-rose-300' : ''
                      }`}
                      style={{ height: `${heightPct}%`, minHeight: '24px' }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex justify-around border-t border-slate-300 pt-2">
              {barData.map((bar, index) => (
                <span
                  key={`${bar.label}-axis-${index}`}
                  className="flex-1 text-center text-[10px] font-semibold text-slate-600"
                >
                  {bar.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold text-slate-600">
        {groupsLabel} - {itemsLabel}
      </div>
    </div>
  );
}
