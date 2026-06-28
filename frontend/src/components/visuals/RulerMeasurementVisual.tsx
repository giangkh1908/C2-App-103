'use client';

import React from 'react';
import { motion } from 'motion/react';

import { getConfigNumber, getConfigString, VisualProps } from './shared';

export default function RulerMeasurementVisual({ primaryCount, config }: VisualProps) {
  const objectName = getConfigString(config, 'object_name') ?? 'Cây bút';
  const lengthCm = Math.max(1, getConfigNumber(config, 'length_cm') ?? primaryCount);
  const maxCm = Math.max(lengthCm + 2, 12);
  const cmWidth = 22;
  const width = maxCm * cmWidth + 80;

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-bold text-orange-700">
        Đo độ dài bằng thước
      </span>
      <svg width={width} height="190" viewBox={`0 0 ${width} 190`} className="rounded-3xl border-2 border-orange-200 bg-white p-2 shadow-sm">
        <defs>
          <linearGradient id="rulerFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <motion.rect initial={{ width: 0 }} animate={{ width: lengthCm * cmWidth }} transition={{ duration: 0.55 }} x="30" y="42" height="34" rx="10" fill="#60a5fa" />
        <text x={30 + (lengthCm * cmWidth) / 2} y="63" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="700">{objectName}</text>
        <rect x="30" y="110" width={maxCm * cmWidth} height="42" rx="8" fill="url(#rulerFill)" stroke="#b45309" strokeWidth="2" />
        {Array.from({ length: maxCm + 1 }, (_, value) => {
          const x = 30 + value * cmWidth;
          return (
            <g key={value}>
              <line x1={x} y1="110" x2={x} y2={value % 5 === 0 ? 138 : 128} stroke="#451a03" strokeWidth={value % 5 === 0 ? 2 : 1} />
              <text x={x} y="145" textAnchor="middle" fontSize="10" fontWeight="700" fill="#451a03">{value}</text>
            </g>
          );
        })}
        <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55 }} x1="30" y1="28" x2={30 + lengthCm * cmWidth} y2="28" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        <polygon points={`${30 + lengthCm * cmWidth},28 ${30 + lengthCm * cmWidth - 10},22 ${30 + lengthCm * cmWidth - 10},34`} fill="#ef4444" />
        <polygon points={`30,28 40,22 40,34`} fill="#ef4444" />
        <text x={30 + (lengthCm * cmWidth) / 2} y="20" textAnchor="middle" fontSize="16" fontWeight="800" fill="#ef4444">{lengthCm} cm</text>
      </svg>
      <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 shadow-sm">
        {objectName} dài {lengthCm} cm
      </div>
    </div>
  );
}
