'use client';

import React from 'react';

import { getConfigNumber, getConfigString, VisualProps } from './shared';

export default function MassCapacityVisual({ primaryCount, secondaryCount, config }: VisualProps) {
  const leftLabel = getConfigString(config, 'left_label') ?? 'Vật A';
  const rightLabel = getConfigString(config, 'right_label') ?? 'Vật B';
  const unit = getConfigString(config, 'unit') ?? 'kg';
  const leftValue = getConfigNumber(config, 'left_value') ?? primaryCount;
  const rightValue = getConfigNumber(config, 'right_value') ?? secondaryCount;
  const maxValue = Math.max(leftValue, rightValue, 1);
  const tiltAngle = Math.min(Math.max(((rightValue - leftValue) / maxValue) * 15, -15), 15);
  const verdict = leftValue > rightValue ? `${leftLabel} nặng hơn` : leftValue < rightValue ? `${rightLabel} nặng hơn` : 'Cân bằng';

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-bold text-amber-700">
        So sánh khối lượng và dung tích
      </span>
      <svg width="360" height="250" viewBox="0 0 360 250" className="rounded-3xl border-2 border-amber-200 bg-white p-2 shadow-sm">
        <polygon points="155,220 205,220 188,118 172,118" fill="#b45309" />
        <rect x="165" y="102" width="30" height="18" rx="5" fill="#92400e" />
        <g transform={`rotate(${tiltAngle}, 180, 110)`}>
          <rect x="60" y="104" width="240" height="12" rx="6" fill="#f59e0b" />
          <line x1="80" y1="110" x2="60" y2="152" stroke="#64748b" strokeWidth="3" />
          <line x1="80" y1="110" x2="100" y2="152" stroke="#64748b" strokeWidth="3" />
          <ellipse cx="80" cy="160" rx="48" ry="10" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <line x1="280" y1="110" x2="260" y2="152" stroke="#64748b" strokeWidth="3" />
          <line x1="280" y1="110" x2="300" y2="152" stroke="#64748b" strokeWidth="3" />
          <ellipse cx="280" cy="160" rx="48" ry="10" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <rect x="52" y="124" width="56" height="28" rx="8" fill="#38bdf8" />
          <text x="80" y="142" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="700">{leftValue}{unit}</text>
          <rect x="252" y="124" width="56" height="28" rx="8" fill="#f472b6" />
          <text x="280" y="142" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="700">{rightValue}{unit}</text>
        </g>
        <text x="80" y="240" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">{leftLabel}</text>
        <text x="280" y="240" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">{rightLabel}</text>
      </svg>
      <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 px-4 py-3 text-center shadow-sm">
        <div className="text-lg font-black text-purple-700">{verdict}</div>
        <div className="text-sm font-medium text-slate-600">{leftValue}{unit} và {rightValue}{unit}</div>
      </div>
    </div>
  );
}
