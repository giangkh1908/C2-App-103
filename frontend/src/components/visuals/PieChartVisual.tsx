'use client';

import React from 'react';
import { VisualProps } from './shared';

const SEGMENT_COLORS = [
  '#3b82f6',
  '#06b6d4',
  '#8b5cf6',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#f97316',
];

const LABELS = [
  'Đỏ', 'Xanh', 'Tím', 'Vàng', 'Xanh lá',
  'Cam', 'Hồng', 'Indigo', 'Ngọc', 'Da cam',
];

export default function PieChartVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  itemsLabel = 'đơn vị',
}: VisualProps) {
  const segments = primaryCount;
  const total = totalCount || segments * (secondaryCount || 1);

  const segmentData: { label: string; value: number; color: string }[] = [];
  let remaining = total;
  for (let i = 0; i < segments; i++) {
    const val = Math.max(1, Math.round(remaining / (segments - i)));
    segmentData.push({
      label: LABELS[i % LABELS.length],
      value: val,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    });
    remaining -= val;
    if (remaining < 0) remaining = 0;
  }

  // Build SVG pie chart
  let cumAngle = -90; // start from top
  const paths = segmentData.map((seg) => {
    const pct = seg.value / total;
    const angle = pct * 360;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    const midAngle = ((startAngle + endAngle) / 2 * Math.PI) / 180;
    const labelX = 50 + 25 * Math.cos(midAngle);
    const labelY = 50 + 25 * Math.sin(midAngle);

    return { path: `M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z`, seg, labelX, labelY, pct };
  });

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
        Biểu đồ tròn: {segments} phần
      </span>

      <div className="flex items-center gap-4">
        {/* Pie chart SVG */}
        <svg viewBox="0 0 100 100" className="w-40 h-40">
          <circle cx="50" cy="50" r="40" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.5" />
          {paths.map((p, i) => (
            <g key={i}>
              <path d={p.path} fill={p.seg.color} stroke="white" strokeWidth="0.5" />
              {p.pct > 0.05 && (
                <text
                  x={p.labelX}
                  y={p.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-[4px] font-bold"
                >
                  {Math.round(p.pct * 100)}%
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex flex-col gap-1">
          {segmentData.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[10px] font-medium text-slate-700">
                {seg.label}: {seg.value} ({Math.round((seg.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        Tổng cộng: {total} {itemsLabel}
      </div>
    </div>
  );
}
