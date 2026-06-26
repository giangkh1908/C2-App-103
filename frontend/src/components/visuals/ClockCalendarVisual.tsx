'use client';

import { VisualProps } from './shared';

export default function ClockCalendarVisual({ primaryCount, secondaryCount, totalCount, groupsLabel, itemsLabel }: VisualProps) {
  const width = 300;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 100;

  const hour = primaryCount % 12;
  const minute = secondaryCount % 60;

  const hourAngle = ((hour + minute / 60) / 12) * 360 - 90;
  const minuteAngle = (minute / 60) * 360 - 90;

  const hourLength = 50;
  const minuteLength = 70;

  const hourX = cx + hourLength * Math.cos((hourAngle * Math.PI) / 180);
  const hourY = cy + hourLength * Math.sin((hourAngle * Math.PI) / 180);
  const minuteX = cx + minuteLength * Math.cos((minuteAngle * Math.PI) / 180);
  const minuteY = cy + minuteLength * Math.sin((minuteAngle * Math.PI) / 180);

  const digitalTime = `${String(hour || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Clock face */}
        <circle cx={cx} cy={cy} r={radius} fill="#fff" stroke="#333" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={radius - 5} fill="none" stroke="#ddd" strokeWidth={1} />

        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = ((i + 1) / 12) * 360 - 90;
          const x1 = cx + (radius - 15) * Math.cos((angle * Math.PI) / 180);
          const y1 = cy + (radius - 15) * Math.sin((angle * Math.PI) / 180);
          const x2 = cx + (radius - 5) * Math.cos((angle * Math.PI) / 180);
          const y2 = cy + (radius - 5) * Math.sin((angle * Math.PI) / 180);
          const textX = cx + (radius - 25) * Math.cos((angle * Math.PI) / 180);
          const textY = cy + (radius - 25) * Math.sin((angle * Math.PI) / 180);

          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth={2} />
              <text x={textX} y={textY + 4} textAnchor="middle" fontSize={12} fill="#333">
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* Minute ticks */}
        {Array.from({ length: 60 }).map((_, i) => {
          if (i % 5 === 0) return null;
          const angle = (i / 60) * 360 - 90;
          const x1 = cx + (radius - 10) * Math.cos((angle * Math.PI) / 180);
          const y1 = cy + (radius - 10) * Math.sin((angle * Math.PI) / 180);
          const x2 = cx + (radius - 5) * Math.cos((angle * Math.PI) / 180);
          const y2 = cy + (radius - 5) * Math.sin((angle * Math.PI) / 180);

          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#999" strokeWidth={1} />
          );
        })}

        {/* Hour hand */}
        <line x1={cx} y1={cy} x2={hourX} y2={hourY} stroke="#333" strokeWidth={4} strokeLinecap="round" />

        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={minuteX} y2={minuteY} stroke="#666" strokeWidth={2} strokeLinecap="round" />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={4} fill="#e74c3c" />
      </svg>

      <div className="mt-2 text-center">
        <div className="text-2xl font-bold text-blue-600">{digitalTime}</div>
        <div className="text-sm text-gray-600">
          {groupsLabel ? `${groupsLabel}: ` : ''}
          {hour || 12} giờ {minute} phút
        </div>
      </div>
    </div>
  );
}
