'use client';

import React from 'react';
import { VisualProps } from './shared';

const OUTCOME_LABELS = [
  'Màu đỏ', 'Màu xanh', 'Màu vàng', 'Màu tím',
  'Màu cam', 'Màu hồng', 'Màu xanh lá', 'Màu nâu',
];

const OUTCOME_ICONS = ['🔴', '🔵', '🟡', '🟣', '🟠', '🩷', '🟢', '🟤'];

export default function ProbabilityExperimentVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Kết quả có lợi',
  itemsLabel = 'kết quả',
}: VisualProps) {
  const totalOutcomes = totalCount || primaryCount;
  const favorable = secondaryCount;

  const outcomes = Array.from({ length: totalOutcomes }, (_, i) => ({
    label: OUTCOME_LABELS[i % OUTCOME_LABELS.length],
    icon: OUTCOME_ICONS[i % OUTCOME_ICONS.length],
    isFavorable: i < favorable,
  }));

  const probability = totalOutcomes > 0 ? favorable / totalOutcomes : 0;
  const percentage = Math.round(probability * 100);

  // Simplify fraction
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(favorable, totalOutcomes);
  const simplifiedNum = favorable / g;
  const simplifiedDen = totalOutcomes / g;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
        Thí nghiệm xác suất: {totalOutcomes} {itemsLabel}
      </span>

      {/* Outcomes grid */}
      <div className="flex flex-wrap justify-center gap-2">
        {outcomes.map((outcome, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border-2 transition-all ${
              outcome.isFavorable
                ? 'border-green-400 bg-green-100 shadow-sm shadow-green-200'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <span className="text-xl">{outcome.icon}</span>
            <span className={`text-[9px] font-semibold ${outcome.isFavorable ? 'text-green-700' : 'text-slate-500'}`}>
              {outcome.label}
            </span>
            {outcome.isFavorable && (
              <span className="text-[8px] font-bold text-green-600 bg-green-200 px-1.5 py-0.5 rounded-full">
                Có lợi
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Probability display */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center bg-white rounded-xl border-2 border-emerald-300 px-4 py-2 shadow-sm">
          <span className="text-[9px] font-bold text-emerald-600 uppercase">Xác suất</span>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-emerald-700">{simplifiedNum}</span>
            <span className="text-xl text-slate-400">/</span>
            <span className="text-2xl font-bold text-emerald-700">{simplifiedDen}</span>
          </div>
        </div>

        <div className="flex flex-col items-center bg-white rounded-xl border-2 border-blue-300 px-4 py-2 shadow-sm">
          <span className="text-[9px] font-bold text-blue-600 uppercase">Phần trăm</span>
          <span className="text-2xl font-bold text-blue-700">{percentage}%</span>
        </div>
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel}: {favorable} / {totalOutcomes} {itemsLabel}
      </div>
    </div>
  );
}
