'use client';

import React from 'react';
import { motion } from 'motion/react';

import { getConfigNumberArray, VisualProps } from './shared';

export default function PolylineLengthVisual({ primaryCount, totalCount, config }: VisualProps) {
  const segments = getConfigNumberArray(config, 'segments') ?? Array.from({ length: Math.max(primaryCount, 3) }, (_, index) => [4, 3, 5, 2][index % 4]);
  const total = totalCount || segments.reduce((sum, value) => sum + value, 0);
  const width = 340;
  const height = 180;
  const points = [{ x: 28, y: 116 }];

  segments.forEach((segment, index) => {
    const prev = points[points.length - 1];
    points.push({
      x: prev.x + 40,
      y: prev.y + (index % 2 === 0 ? -segment * 10 : segment * 8),
    });
  });

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-cyan-200 bg-cyan-50 px-4 py-1.5 text-sm font-bold text-cyan-700">
        Độ dài đường gấp khúc
      </span>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="rounded-3xl border-2 border-cyan-200 bg-white p-3 shadow-sm">
        <motion.path d={path} fill="none" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} />
        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="5" fill={index === 0 ? '#22c55e' : index === points.length - 1 ? '#ef4444' : '#0ea5e9'} />
            <text x={point.x} y={point.y + 20} textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">{String.fromCharCode(65 + index)}</text>
          </g>
        ))}
        {segments.map((segment, index) => {
          const current = points[index];
          const next = points[index + 1];
          return (
            <text key={index} x={(current.x + next.x) / 2} y={(current.y + next.y) / 2 - 8} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f766e">
              {segment} cm
            </text>
          );
        })}
      </svg>
      <div className="rounded-2xl border-2 border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700 shadow-sm">
        Tổng độ dài: {total} cm
      </div>
    </div>
  );
}
