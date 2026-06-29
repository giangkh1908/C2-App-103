'use client';

import React from 'react';
import { VisualProps } from './shared';

function Bar({
  numerator,
  denominator,
  color,
  y,
}: {
  numerator: number;
  denominator: number;
  color: string;
  y: number;
}) {
  const segW = 280 / denominator;
  return (
    <g>
      {Array.from({ length: denominator }, (_, i) => (
        <rect
          key={i}
          x={10 + i * segW + 0.5}
          y={y}
          width={segW - 1}
          height={32}
          rx={2}
          fill={i < numerator ? color : '#e2e8f0'}
          stroke={i < numerator ? color : '#cbd5e1'}
          strokeWidth={0.8}
        />
      ))}
      <text
        x={150}
        y={y + 52}
        textAnchor="middle"
        className="fill-slate-700 text-[12px] font-bold"
        fontFamily="sans-serif"
      >
        {numerator}/{denominator}
      </text>
    </g>
  );
}

export default function EquivalentFractionVisual({
  primaryCount,
  secondaryCount,
}: VisualProps) {
  const num1 = primaryCount;
  const den1 = Math.max(1, secondaryCount);
  const num2 = num1 * 2;
  const den2 = den1 * 2;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
        Phân số tương đương
      </span>

      <svg viewBox="0 0 300 130" className="w-full max-w-md">
        <Bar numerator={num1} denominator={den1} color="#3b82f6" y={5} />

        <text
          x={150}
          y={72}
          textAnchor="middle"
          className="fill-amber-500 text-[18px] font-bold"
          fontFamily="sans-serif"
        >
          =
        </text>

        <Bar numerator={num2} denominator={den2} color="#8b5cf6" y={80} />
      </svg>

      <div className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {num1}/{den1} = {num2}/{den2}
      </div>
    </div>
  );
}
