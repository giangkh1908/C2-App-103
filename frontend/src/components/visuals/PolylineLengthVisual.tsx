'use client';

import { VisualProps } from './shared';

export default function PolylineLengthVisual({ primaryCount, secondaryCount, totalCount, groupsLabel, itemsLabel }: VisualProps) {
  const width = 400;
  const height = 200;
  const startX = 30;
  const startY = 100;

  const segmentCount = Math.max(primaryCount, 1);
  const segmentLengths: number[] = [];

  for (let i = 0; i < segmentCount; i++) {
    segmentLengths.push(20 + Math.sin(i * 1.5) * 15 + Math.cos(i * 0.8) * 10);
  }

  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
  let currentX = startX;
  let currentY = startY;

  for (let i = 0; i < segmentCount; i++) {
    const angle = (Math.PI / 6) * (i % 2 === 0 ? 1 : -1) + (i * Math.PI) / (segmentCount * 2);
    currentX += segmentLengths[i] * Math.cos(angle);
    currentY += segmentLengths[i] * Math.sin(angle);
    points.push({ x: currentX, y: currentY });
  }

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  const totalLength = segmentLengths.reduce((sum, len) => sum + len, 0);

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Polyline */}
        <path d={pathD} fill="none" stroke="#3498db" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={i === 0 ? '#2ecc71' : i === points.length - 1 ? '#e74c3c' : '#f39c12'} stroke="#fff" strokeWidth={2} />
        ))}

        {/* Segment labels */}
        {points.slice(0, -1).map((p, i) => {
          const next = points[i + 1];
          const midX = (p.x + next.x) / 2;
          const midY = (p.y + next.y) / 2 - 10;
          return (
            <text key={i} x={midX} y={midY} textAnchor="middle" fontSize={10} fill="#333" fontWeight="bold">
              {segmentLengths[i].toFixed(0)}
            </text>
          );
        })}

        {/* Start/End labels */}
        <text x={startX - 5} y={startY + 20} textAnchor="middle" fontSize={10} fill="#2ecc71">
          A
        </text>
        <text x={points[points.length - 1].x + 5} y={points[points.length - 1].y + 20} textAnchor="middle" fontSize={10} fill="#e74c3c">
          B
        </text>
      </svg>

      <div className="mt-2 text-center">
        <div className="text-lg font-bold text-purple-700">
          Tổng độ dài = {totalLength.toFixed(0)} đơn vị
        </div>
        <div className="text-sm text-gray-600">
          {groupsLabel ? `${groupsLabel}: ` : ''}
          {segmentCount} đoạn thẳng
        </div>
      </div>
    </div>
  );
}
