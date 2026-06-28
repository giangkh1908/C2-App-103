'use client';

import React from 'react';

import { type VisualProps } from './shared';

export default function AreaModelDistributiveVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'chiều rộng',
  itemsLabel = 'chiều cao',
}: VisualProps) {
  const a = primaryCount;
  const b = secondaryCount;
  const c = totalCount;
  const areaA = a * c;
  const areaB = b * c;
  const totalArea = areaA + areaB;
  const totalWidth = a + b;

  const svgW = 300;
  const svgH = 180;
  const pad = 30;
  const maxDim = Math.max(totalWidth, c, 1);
  const cellW = Math.min((svgW - 2 * pad) / maxDim, 40);
  const cellH = Math.min((svgH - 2 * pad - 20) / maxDim, 40);

  const rectW = totalWidth * cellW;
  const rectH = c * cellH;
  const offsetX = (svgW - rectW) / 2;
  const offsetY = (svgH - rectH - 20) / 2 + 10;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
        Mô hình diện tích — Phân phối: ({a} + {b}) × {c}
      </span>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-md">
        {/* Left rectangle (a × c) */}
        <rect
          x={offsetX}
          y={offsetY}
          width={a * cellW}
          height={rectH}
          fill="#bbf7d0"
          stroke="#16a34a"
          strokeWidth="2"
          rx="4"
        />
        {/* Grid lines for left */}
        {Array.from({ length: a }, (_, i) => (
          <line
            key={`vl${i}`}
            x1={offsetX + (i + 1) * cellW}
            y1={offsetY}
            x2={offsetX + (i + 1) * cellW}
            y2={offsetY + rectH}
            stroke="#16a34a"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        {Array.from({ length: c }, (_, i) => (
          <line
            key={`hl${i}`}
            x1={offsetX}
            y1={offsetY + (i + 1) * cellH}
            x2={offsetX + a * cellW}
            y2={offsetY + (i + 1) * cellH}
            stroke="#16a34a"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        <text
          x={offsetX + (a * cellW) / 2}
          y={offsetY + rectH / 2 - 6}
          textAnchor="middle"
          className="fill-emerald-700 text-[11px] font-bold"
          fontFamily="sans-serif"
        >
          {a} × {c}
        </text>
        <text
          x={offsetX + (a * cellW) / 2}
          y={offsetY + rectH / 2 + 10}
          textAnchor="middle"
          className="fill-emerald-600 text-[10px]"
          fontFamily="sans-serif"
        >
          = {areaA}
        </text>

        {/* Right rectangle (b × c) */}
        <rect
          x={offsetX + a * cellW}
          y={offsetY}
          width={b * cellW}
          height={rectH}
          fill="#bfdbfe"
          stroke="#2563eb"
          strokeWidth="2"
          rx="4"
        />
        {Array.from({ length: b }, (_, i) => (
          <line
            key={`vr${i}`}
            x1={offsetX + a * cellW + (i + 1) * cellW}
            y1={offsetY}
            x2={offsetX + a * cellW + (i + 1) * cellW}
            y2={offsetY + rectH}
            stroke="#2563eb"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        {Array.from({ length: c }, (_, i) => (
          <line
            key={`hr${i}`}
            x1={offsetX + a * cellW}
            y1={offsetY + (i + 1) * cellH}
            x2={offsetX + totalWidth * cellW}
            y2={offsetY + (i + 1) * cellH}
            stroke="#2563eb"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        <text
          x={offsetX + a * cellW + (b * cellW) / 2}
          y={offsetY + rectH / 2 - 6}
          textAnchor="middle"
          className="fill-blue-700 text-[11px] font-bold"
          fontFamily="sans-serif"
        >
          {b} × {c}
        </text>
        <text
          x={offsetX + a * cellW + (b * cellW) / 2}
          y={offsetY + rectH / 2 + 10}
          textAnchor="middle"
          className="fill-blue-600 text-[10px]"
          fontFamily="sans-serif"
        >
          = {areaB}
        </text>

        {/* Divider line */}
        <line
          x1={offsetX + a * cellW}
          y1={offsetY - 4}
          x2={offsetX + a * cellW}
          y2={offsetY + rectH + 4}
          stroke="#475569"
          strokeWidth="2"
          strokeDasharray="4,2"
        />

        {/* Width label */}
        <text
          x={offsetX + (a * cellW) / 2}
          y={offsetY + rectH + 18}
          textAnchor="middle"
          className="fill-emerald-600 text-[9px] font-bold"
          fontFamily="sans-serif"
        >
          {a} {groupsLabel}
        </text>
        <text
          x={offsetX + a * cellW + (b * cellW) / 2}
          y={offsetY + rectH + 18}
          textAnchor="middle"
          className="fill-blue-600 text-[9px] font-bold"
          fontFamily="sans-serif"
        >
          {b} {groupsLabel}
        </text>
        <text
          x={offsetX + (totalWidth * cellW) / 2}
          y={offsetY + rectH + 30}
          textAnchor="middle"
          className="fill-slate-500 text-[9px] font-bold"
          fontFamily="sans-serif"
        >
          Tổng: {totalWidth} {groupsLabel}
        </text>

        {/* Height label */}
        <text
          x={offsetX - 10}
          y={offsetY + rectH / 2}
          textAnchor="middle"
          className="fill-slate-500 text-[9px] font-bold"
          fontFamily="sans-serif"
          transform={`rotate(-90, ${offsetX - 10}, ${offsetY + rectH / 2})`}
        >
          {c} {itemsLabel}
        </text>
      </svg>

      <div className="text-xs font-semibold text-slate-600 text-center">
        <span className="text-emerald-600">{a}×{c}</span>
        <span className="text-slate-400 mx-1">+</span>
        <span className="text-blue-600">{b}×{c}</span>
        <span className="text-slate-400 mx-1">=</span>
        <span className="text-emerald-700">{areaA}</span>
        <span className="text-slate-400 mx-1">+</span>
        <span className="text-blue-700">{areaB}</span>
        <span className="text-slate-400 mx-1">=</span>
        <span className="font-bold text-slate-800">{totalArea}</span>
      </div>
    </div>
  );
}
