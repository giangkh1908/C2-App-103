'use client';

import { VisualProps } from './shared';

export default function MassCapacityVisual({ primaryCount, secondaryCount, totalCount, groupsLabel, itemsLabel }: VisualProps) {
  const width = 400;
  const height = 250;
  const cx = width / 2;
  const beamY = 100;
  const beamLength = 160;

  const primaryWeight = primaryCount;
  const secondaryWeight = secondaryCount;
  const maxWeight = Math.max(primaryWeight, secondaryWeight, 1);

  const tiltAngle = Math.min(Math.max((secondaryWeight - primaryWeight) / maxWeight * 15, -15), 15);

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Stand */}
        <polygon
          points={`${cx - 30},${height - 20} ${cx + 30},${height - 20} ${cx + 10},${beamY + 10} ${cx - 10},${beamY + 10}`}
          fill="#8b4513"
          stroke="#5d3a1a"
          strokeWidth={2}
        />
        <rect x={cx - 15} y={beamY - 5} width={30} height={15} fill="#a0522d" rx={3} />

        {/* Beam */}
        <g transform={`rotate(${tiltAngle}, ${cx}, ${beamY})`}>
          <rect x={cx - beamLength} y={beamY - 5} width={beamLength * 2} height={10} fill="#daa520" stroke="#b8860b" strokeWidth={2} rx={3} />

          {/* Left pan */}
          <line x1={cx - beamLength} y1={beamY} x2={cx - beamLength - 30} y2={beamY + 40} stroke="#666" strokeWidth={2} />
          <line x1={cx - beamLength} y1={beamY} x2={cx - beamLength + 30} y2={beamY + 40} stroke="#666" strokeWidth={2} />
          <ellipse cx={cx - beamLength} cy={beamY + 45} rx={40} ry={8} fill="#ddd" stroke="#999" strokeWidth={2} />

          {/* Right pan */}
          <line x1={cx + beamLength} y1={beamY} x2={cx + beamLength - 30} y2={beamY + 40} stroke="#666" strokeWidth={2} />
          <line x1={cx + beamLength} y1={beamY} x2={cx + beamLength + 30} y2={beamY + 40} stroke="#666" strokeWidth={2} />
          <ellipse cx={cx + beamLength} cy={beamY + 45} rx={40} ry={8} fill="#ddd" stroke="#999" strokeWidth={2} />

          {/* Left weight */}
          <rect x={cx - beamLength - 20} y={beamY + 10} width={40} height={30} fill="#3498db" rx={3} />
          <text x={cx - beamLength} y={beamY + 30} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
            {primaryWeight}kg
          </text>

          {/* Right weight */}
          <rect x={cx + beamLength - 20} y={beamY + 10} width={40} height={30} fill="#e74c3c" rx={3} />
          <text x={cx + beamLength} y={beamY + 30} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
            {secondaryWeight}kg
          </text>
        </g>

        {/* Labels */}
        <text x={cx - beamLength} y={height - 5} textAnchor="middle" fontSize={12} fill="#333">
          {itemsLabel || 'Vật 1'}
        </text>
        <text x={cx + beamLength} y={height - 5} textAnchor="middle" fontSize={12} fill="#333">
          {itemsLabel || 'Vật 2'}
        </text>
      </svg>

      <div className="mt-2 text-center">
        <div className="text-lg font-bold text-purple-700">
          {primaryWeight > secondaryWeight
            ? `${itemsLabel || 'Vật 1'} nặng hơn`
            : primaryWeight < secondaryWeight
            ? `${itemsLabel || 'Vật 2'} nặng hơn`
            : 'Cân bằng'}
        </div>
        <div className="text-sm text-gray-600">
          {groupsLabel ? `${groupsLabel}: ` : ''}
          {primaryWeight}kg vs {secondaryWeight}kg
        </div>
      </div>
    </div>
  );
}
