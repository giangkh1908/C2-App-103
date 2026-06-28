'use client';

import React from 'react';
import { motion } from 'motion/react';

import { getConfigNumber, VisualProps } from './shared';

export default function NumberLineVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  config,
}: VisualProps) {
  const start = Math.max(0, getConfigNumber(config, 'start') ?? primaryCount);
  const change = getConfigNumber(config, 'change') ?? secondaryCount;
  const result = Math.max(0, getConfigNumber(config, 'result') ?? totalCount);
  const maxValue = Math.max(start, result, start + Math.abs(change), 10);
  const range = Math.ceil(maxValue / 5) * 5;
  const ticks = Array.from({ length: range + 1 }, (_, index) => index);
  const width = range * 34 + 80;

  const startX = start * 34 + 30;
  const resultX = result * 34 + 30;
  const arcPath = start !== result
    ? `M ${startX} 42 Q ${(startX + resultX) / 2} ${Math.max(8, 42 - Math.abs(resultX - startX) * 0.25)} ${resultX} 42`
    : null;

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-bold text-sky-700">
        Tia số từ 0 đến {range}
      </span>

      <div className="w-full overflow-x-auto rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
        <svg viewBox={`0 0 ${width} 120`} className="mx-auto block w-full" style={{ minWidth: `${Math.min(width, 360)}px` }}>
          <line x1="20" y1="72" x2={range * 34 + 42} y2="72" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <polygon points={`${range * 34 + 54},72 ${range * 34 + 40},64 ${range * 34 + 40},80`} fill="#94a3b8" />

          {ticks.map((tick) => {
            const x = tick * 34 + 30;
            const active = tick === start || tick === result;
            return (
              <g key={tick}>
                <line x1={x} y1="60" x2={x} y2="84" stroke={active ? '#0ea5e9' : '#94a3b8'} strokeWidth={active ? 3 : 1.5} />
                <text x={x} y="102" textAnchor="middle" fill={active ? '#0369a1' : '#64748b'} fontSize="11" fontWeight={active ? '700' : '500'}>
                  {tick}
                </text>
              </g>
            );
          })}

          {arcPath && (
            <motion.path
              d={arcPath}
              fill="none"
              stroke="#f97316"
              strokeWidth="3"
              strokeDasharray="7 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.65 }}
            />
          )}

          <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
            <circle cx={startX} cy="48" r="13" fill="#38bdf8" />
            <text x={startX} y="53" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
              {start}
            </text>
          </motion.g>

          {start !== result && (
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3, delay: 0.35 }}>
              <circle cx={resultX} cy="26" r="13" fill="#22c55e" />
              <text x={resultX} y="31" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
                {result}
              </text>
            </motion.g>
          )}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 shadow-sm">
        <span>Bắt đầu: {start}</span>
        <span>Thay đổi: {change >= 0 ? `+${change}` : change}</span>
        <span>Kết quả: {result}</span>
      </div>
    </div>
  );
}
