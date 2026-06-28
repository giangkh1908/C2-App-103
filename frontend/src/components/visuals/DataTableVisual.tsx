'use client';

import React from 'react';

import { getConfigStringArray, VisualProps } from './shared';

const DEFAULT_LABELS = ['Táo', 'Cam', 'Chuối', 'Nho'];

export default function DataTableVisual({ groupsLabel = 'Loại', itemsLabel = 'Số lượng', config }: VisualProps) {
  const labels = getConfigStringArray(config, 'labels') ?? DEFAULT_LABELS;
  const rawValues = Array.isArray(config?.values) ? config.values.map((value) => Number(value)).filter(Number.isFinite) : undefined;
  const values = labels.map((_, index) => rawValues?.[index] ?? index + 2);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-bold text-sky-700">
        Bảng số liệu
      </span>
      <div className="w-full overflow-hidden rounded-3xl border-2 border-sky-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-sky-100 text-sky-800">
              <th className="px-4 py-3 text-left font-bold">{groupsLabel}</th>
              <th className="px-4 py-3 text-center font-bold">{itemsLabel}</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label, index) => {
              const value = values[index];
              const highlightClass = value === maxValue ? 'bg-emerald-50 text-emerald-700' : value === minValue ? 'bg-rose-50 text-rose-700' : 'text-slate-700';
              return (
                <tr key={label} className="border-t border-sky-100 even:bg-sky-50/40">
                  <td className="px-4 py-3 font-semibold text-slate-700">{label}</td>
                  <td className={`px-4 py-3 text-center font-black ${highlightClass}`}>{value}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">Lớn nhất: {maxValue}</span>
        <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">Nhỏ nhất: {minValue}</span>
      </div>
    </div>
  );
}
