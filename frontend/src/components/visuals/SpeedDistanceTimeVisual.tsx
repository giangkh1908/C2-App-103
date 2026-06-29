'use client';

import { VisualProps } from './shared';

export default function SpeedDistanceTimeVisual({ primaryCount, secondaryCount, groupsLabel }: VisualProps) {
  const width = 400;
  const height = 250;
  const lineY = 150;
  const lineStart = 50;
  const lineEnd = 350;
  const lineLength = lineEnd - lineStart;

  const distance = primaryCount;
  const time = secondaryCount || 1;
  const speed = distance / time;

  const maxDistance = Math.max(distance, 10);
  const scale = lineLength / maxDistance;

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Number line */}
        <line x1={lineStart} y1={lineY} x2={lineEnd} y2={lineY} stroke="#333" strokeWidth={2} />

        {/* Distance markers */}
        {Array.from({ length: Math.min(maxDistance + 1, 20) }).map((_, i) => {
          const x = lineStart + i * scale;
          return (
            <g key={i}>
              <line x1={x} y1={lineY - 5} x2={x} y2={lineY + 5} stroke="#333" strokeWidth={1} />
              {i % 2 === 0 && (
                <text x={x} y={lineY + 20} textAnchor="middle" fontSize={10} fill="#333">
                  {i}
                </text>
              )}
            </g>
          );
        })}

        {/* Movement arrow */}
        <line
          x1={lineStart}
          y1={lineY - 30}
          x2={lineStart + distance * scale}
          y2={lineY - 30}
          stroke="#e74c3c"
          strokeWidth={3}
          markerEnd="url(#arrow)"
        />
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#e74c3c" />
          </marker>
        </defs>

        {/* Distance label */}
        <text
          x={lineStart + (distance * scale) / 2}
          y={lineY - 40}
          textAnchor="middle"
          fontSize={14}
          fontWeight="bold"
          fill="#e74c3c"
        >
          {distance} km
        </text>

        {/* Time indicator */}
        <rect x={lineStart} y={lineY + 30} width={distance * scale} height={20} fill="#3498db" rx={3} opacity={0.7} />
        <text
          x={lineStart + (distance * scale) / 2}
          y={lineY + 45}
          textAnchor="middle"
          fontSize={12}
          fill="white"
          fontWeight="bold"
        >
          {time} giờ
        </text>

        {/* Car icon */}
        <rect x={lineStart + distance * scale - 15} y={lineY - 25} width={20} height={12} fill="#f39c12" rx={3} />
        <circle cx={lineStart + distance * scale - 10} cy={lineY - 10} r={3} fill="#333" />
        <circle cx={lineStart + distance * scale + 2} cy={lineY - 10} r={3} fill="#333" />
      </svg>

      <div className="mt-4 text-center">
        <div className="text-lg font-bold text-green-700">
          Vận tốc = {distance} / {time} = {speed.toFixed(1)} km/h
        </div>
        <div className="text-sm text-gray-600">
          {groupsLabel ? `${groupsLabel}: ` : ''}
          Quãng đường {distance}km, thời gian {time} giờ
        </div>
      </div>
    </div>
  );
}
