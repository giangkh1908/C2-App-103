'use client';

import { VisualProps } from './shared';

export default function RulerMeasurementVisual({ primaryCount, secondaryCount, totalCount, groupsLabel, itemsLabel }: VisualProps) {
  const width = 400;
  const height = 200;
  const rulerY = 120;
  const objectY = 60;
  const objectHeight = 30;
  const cmWidth = 30;
  const maxCm = Math.max(primaryCount, 10);

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="rulerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5deb3" />
            <stop offset="100%" stopColor="#deb887" />
          </linearGradient>
        </defs>

        {/* Object being measured */}
        <rect
          x={20}
          y={objectY}
          width={primaryCount * cmWidth}
          height={objectHeight}
          fill="#4a90d9"
          rx={3}
        />
        <text
          x={20 + (primaryCount * cmWidth) / 2}
          y={objectY + objectHeight / 2 + 4}
          textAnchor="middle"
          fill="white"
          fontSize={12}
          fontWeight="bold"
        >
          {itemsLabel || 'Đối tượng'}
        </text>

        {/* Ruler body */}
        <rect x={20} y={rulerY} width={maxCm * cmWidth + 20} height={40} fill="url(#rulerGrad)" stroke="#8b7355" strokeWidth={1} rx={2} />

        {/* Ruler markings */}
        {Array.from({ length: maxCm + 1 }).map((_, i) => (
          <g key={i}>
            <line
              x1={20 + i * cmWidth}
              y1={rulerY}
              x2={20 + i * cmWidth}
              y2={rulerY + (i % 5 === 0 ? 20 : 10)}
              stroke="#333"
              strokeWidth={i % 5 === 0 ? 2 : 1}
            />
            {i % 5 === 0 && (
              <text
                x={20 + i * cmWidth}
                y={rulerY + 35}
                textAnchor="middle"
                fontSize={10}
                fill="#333"
              >
                {i}
              </text>
            )}
          </g>
        ))}

        {/* Measurement arrow */}
        <line
          x1={20}
          y1={objectY - 10}
          x2={20 + primaryCount * cmWidth}
          y2={objectY - 10}
          stroke="#e74c3c"
          strokeWidth={2}
          markerEnd="url(#arrowhead)"
          markerStart="url(#arrowheadStart)"
        />
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#e74c3c" />
          </marker>
          <marker id="arrowheadStart" markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto">
            <polygon points="10 0, 0 3.5, 10 7" fill="#e74c3c" />
          </marker>
        </defs>

        {/* Measurement label */}
        <text
          x={20 + (primaryCount * cmWidth) / 2}
          y={objectY - 15}
          textAnchor="middle"
          fontSize={14}
          fontWeight="bold"
          fill="#e74c3c"
        >
          {primaryCount} cm
        </text>
      </svg>

      <div className="mt-2 text-center">
        <span className="text-lg font-bold text-amber-800">
          {groupsLabel ? `${groupsLabel}: ` : ''}
          Đo được {primaryCount} cm
        </span>
      </div>
    </div>
  );
}
