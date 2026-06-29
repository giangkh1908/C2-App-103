'use client';

import React from 'react';

import type { VisualProps } from './shared';

export default function RoundingVisual({
  primaryCount,
  totalCount,
  groupsLabel = 'làm tròn',
}: VisualProps) {
  const raw = primaryCount;
  const floor = Math.floor(raw);
  const ceil = Math.ceil(raw);
  const distFloor = Math.abs(raw - floor);
  const distCeil = Math.abs(ceil - raw);
  const rounded = totalCount !== undefined && totalCount !== 0
    ? totalCount
    : distFloor <= distCeil
      ? floor
      : ceil;
  const isCloserToFloor = distFloor <= distCeil;

  const maxVal = Math.max(ceil + 1, 10);
  const tickSpacing = maxVal <= 10 ? 40 : 30;
  const svgWidth = maxVal * tickSpacing + 60;
  const lineY = 44;

  const xPos = (val: number) => val * tickSpacing + 30;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Làm tròn {raw} {groupsLabel}
      </span>

      <svg viewBox={`0 0 ${svgWidth} 100`} className="w-full max-w-lg">
        {/* Number line */}
        <line
          x1="10"
          y1={lineY}
          x2={svgWidth - 10}
          y2={lineY}
          stroke="#94a3b8"
          strokeWidth="2"
        />
        <polygon
          points={`${svgWidth - 10},${lineY} ${svgWidth - 18},${lineY - 5} ${svgWidth - 18},${lineY + 5}`}
          fill="#94a3b8"
        />

        {/* Ticks */}
        {Array.from({ length: maxVal + 1 }, (_, i) => i).map((tick) => (
          <g key={tick}>
            <line
              x1={xPos(tick)}
              y1={lineY - 6}
              x2={xPos(tick)}
              y2={lineY + 6}
              stroke="#64748b"
              strokeWidth="1.5"
            />
            <text
              x={xPos(tick)}
              y={lineY + 20}
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
              fontFamily="sans-serif"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Floor marker (green) */}
        {floor !== ceil && (
          <g>
            <circle cx={xPos(floor)} cy={lineY - 18} r="7" fill="#22c55e" opacity="0.85" />
            <text
              x={xPos(floor)}
              y={lineY - 14}
              textAnchor="middle"
              className="fill-white text-[8px] font-bold"
              fontFamily="sans-serif"
            >
              {floor}
            </text>
            <text
              x={xPos(floor)}
              y={lineY - 30}
              textAnchor="middle"
              className="fill-green-600 text-[8px]"
              fontFamily="sans-serif"
            >
              dưới
            </text>
          </g>
        )}

        {/* Ceiling marker (green) */}
        {floor !== ceil && (
          <g>
            <circle cx={xPos(ceil)} cy={lineY - 18} r="7" fill="#22c55e" opacity="0.85" />
            <text
              x={xPos(ceil)}
              y={lineY - 14}
              textAnchor="middle"
              className="fill-white text-[8px] font-bold"
              fontFamily="sans-serif"
            >
              {ceil}
            </text>
            <text
              x={xPos(ceil)}
              y={lineY - 30}
              textAnchor="middle"
              className="fill-green-600 text-[8px]"
              fontFamily="sans-serif"
            >
              trên
            </text>
          </g>
        )}

        {/* Actual value (blue, larger) */}
        <circle cx={xPos(raw)} cy={lineY - 18} r="10" fill="#3b82f6" />
        <text
          x={xPos(raw)}
          y={lineY - 14}
          textAnchor="middle"
          className="fill-white text-[9px] font-bold"
          fontFamily="sans-serif"
        >
          {raw}
        </text>

        {/* Distance arrows */}
        {floor !== ceil && (
          <>
            <line
              x1={xPos(raw)}
              y1={lineY + 12}
              x2={xPos(isCloserToFloor ? floor : ceil)}
              y2={lineY + 12}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <text
              x={(xPos(raw) + xPos(isCloserToFloor ? floor : ceil)) / 2}
              y={lineY + 24}
              textAnchor="middle"
              className="fill-amber-600 text-[8px] font-bold"
              fontFamily="sans-serif"
            >
              gần nhất
            </text>
          </>
        )}
      </svg>

      {/* Result badge */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-600">
          {raw} ≈
        </span>
        <span className="text-sm font-extrabold text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
          {rounded}
        </span>
        <span className="text-[10px] text-slate-500">
          ({floor !== ceil ? (isCloserToFloor ? 'làm tròn xuống' : 'làm tròn lên') : 'số nguyên'})
        </span>
      </div>
    </div>
  );
}
