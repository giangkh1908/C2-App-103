'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function AreaModelDecimalVisual({
  primaryCount,
  secondaryCount,
}: VisualProps) {
  const width = Math.max(primaryCount, 0.1);
  const height = Math.max(secondaryCount, 0.1);
  const area = width * height;

  const svgW = 320;
  const svgH = 200;
  const pad = 40;
  const rectW = svgW - pad * 2;
  const rectH = svgH - pad * 2;

  const intW = Math.floor(width);
  const fracW = width - intW;
  const intH = Math.floor(height);
  const fracH = height - intH;

  const scaleX = (v: number) => pad + (v / width) * rectW;
  const scaleY = (v: number) => pad + (v / height) * rectH;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
        Mô hình diện tích thập phân
      </span>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-md">
        <rect
          x={pad}
          y={pad}
          width={rectW}
          height={rectH}
          fill="#f0fdfa"
          stroke="#14b8a6"
          strokeWidth={2}
          rx={2}
        />

        {Array.from({ length: intW }, (_, i) => (
          <line
            key={`vw${i + 1}`}
            x1={scaleX(i + 1)}
            y1={pad}
            x2={scaleX(i + 1)}
            y2={pad + rectH}
            stroke="#99f6e4"
            strokeWidth={1}
          />
        ))}
        {fracW > 0.01 && (
          <line
            x1={scaleX(intW + fracW)}
            y1={pad}
            x2={scaleX(intW + fracW)}
            y2={pad + rectH}
            stroke="#99f6e4"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        )}

        {Array.from({ length: intH }, (_, i) => (
          <line
            key={`vh${i + 1}`}
            x1={pad}
            y1={scaleY(i + 1)}
            x2={pad + rectW}
            y2={scaleY(i + 1)}
            stroke="#99f6e4"
            strokeWidth={1}
          />
        ))}
        {fracH > 0.01 && (
          <line
            x1={pad}
            y1={scaleY(intH + fracH)}
            x2={pad + rectW}
            y2={scaleY(intH + fracH)}
            stroke="#99f6e4"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        )}

        <text
          x={svgW / 2}
          y={svgH - 6}
          textAnchor="middle"
          className="fill-teal-700 text-[11px] font-bold"
          fontFamily="sans-serif"
        >
          Chiều rộng = {width}
        </text>
        <text
          x={10}
          y={svgH / 2}
          textAnchor="middle"
          className="fill-teal-700 text-[11px] font-bold"
          fontFamily="sans-serif"
          transform={`rotate(-90 10 ${svgH / 2})`}
        >
          Chiều cao = {height}
        </text>

        <text
          x={pad + rectW / 2}
          y={pad + rectH / 2 - 6}
          textAnchor="middle"
          className="fill-teal-800 text-[14px] font-bold"
          fontFamily="sans-serif"
        >
          S = {width} × {height}
        </text>
        <text
          x={pad + rectW / 2}
          y={pad + rectH / 2 + 12}
          textAnchor="middle"
          className="fill-teal-600 text-[12px] font-bold"
          fontFamily="sans-serif"
        >
          = {area}
        </text>
      </svg>

      <div className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {width} × {height} = {area}
      </div>
    </div>
  );
}
