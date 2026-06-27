'use client';

import React from 'react';
import { motion } from 'motion/react';

import { getConfigNumber, getConfigString, VisualProps } from './shared';

const WEEKDAYS = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];

export default function ClockCalendarVisual({
  primaryCount,
  secondaryCount,
  config,
}: VisualProps) {
  const mode = getConfigString(config, 'mode') ?? 'clock';
  const hour = getConfigNumber(config, 'hour') ?? (primaryCount % 12 || 12);
  const minute = getConfigNumber(config, 'minute') ?? (secondaryCount % 60);
  const weekday = getConfigString(config, 'weekday') ?? WEEKDAYS[Math.max(0, (primaryCount - 1) % WEEKDAYS.length)];

  if (mode === 'calendar') {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <span className="rounded-full border-2 border-pink-200 bg-pink-50 px-4 py-1.5 text-sm font-bold text-pink-700">
          Lịch trong tuần
        </span>
        <div className="grid w-full grid-cols-2 gap-2 rounded-3xl border-2 border-pink-200 bg-white p-4 shadow-sm sm:grid-cols-4">
          {WEEKDAYS.map((day) => {
            const active = day === weekday;
            return (
              <motion.div
                key={day}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`rounded-2xl border-2 px-3 py-4 text-center text-sm font-bold ${active ? 'border-pink-300 bg-pink-100 text-pink-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
              >
                {day}
              </motion.div>
            );
          })}
        </div>
        <div className="rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2 text-sm font-bold text-pink-700 shadow-sm">
          Hôm nay là {weekday}
        </div>
      </div>
    );
  }

  const width = 280;
  const height = 280;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 92;
  const hourAngle = ((hour % 12 + minute / 60) / 12) * 360 - 90;
  const minuteAngle = (minute / 60) * 360 - 90;
  const hourX = cx + 48 * Math.cos((hourAngle * Math.PI) / 180);
  const hourY = cy + 48 * Math.sin((hourAngle * Math.PI) / 180);
  const minuteX = cx + 68 * Math.cos((minuteAngle * Math.PI) / 180);
  const minuteY = cy + 68 * Math.sin((minuteAngle * Math.PI) / 180);
  const digitalTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <span className="rounded-full border-2 border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-bold text-sky-700">
        Đồng hồ kim
      </span>
      <div className="rounded-[2rem] border-2 border-sky-200 bg-white p-4 shadow-sm">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <radialGradient id="clockFace" cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={radius} fill="url(#clockFace)" stroke="#38bdf8" strokeWidth={6} />
          {Array.from({ length: 12 }).map((_, i) => {
            const display = i + 1;
            const angle = (display / 12) * 360 - 90;
            const x = cx + (radius - 22) * Math.cos((angle * Math.PI) / 180);
            const y = cy + (radius - 22) * Math.sin((angle * Math.PI) / 180);
            const x1 = cx + (radius - 12) * Math.cos((angle * Math.PI) / 180);
            const y1 = cy + (radius - 12) * Math.sin((angle * Math.PI) / 180);
            const x2 = cx + radius * Math.cos((angle * Math.PI) / 180);
            const y2 = cy + radius * Math.sin((angle * Math.PI) / 180);
            return (
              <g key={display}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0f172a" strokeWidth={2} />
                <text x={x} y={y + 5} textAnchor="middle" fontSize={16} fontWeight="700" fill="#0f172a">
                  {display}
                </text>
              </g>
            );
          })}
          <motion.line
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55 }}
            x1={cx}
            y1={cy}
            x2={hourX}
            y2={hourY}
            stroke="#f97316"
            strokeWidth={7}
            strokeLinecap="round"
          />
          <motion.line
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            x1={cx}
            y1={cy}
            x2={minuteX}
            y2={minuteY}
            stroke="#0284c7"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={7} fill="#ef4444" />
        </svg>
      </div>
      <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 px-4 py-2 text-center shadow-sm">
        <div className="text-2xl font-black text-sky-700">{digitalTime}</div>
        <div className="text-sm font-semibold text-slate-600">{hour} giờ {minute} phút</div>
      </div>
    </div>
  );
}
