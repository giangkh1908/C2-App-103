'use client';

import React from 'react';
import { VisualProps } from './shared';

const SHAPES_CONFIG = [
  {
    type: 'rectangle',
    label: 'Hình chữ nhật',
    vertices: 4,
    edges: 4,
    faces: 1,
    points: '20,15 130,15 130,85 20,85',
    edgeLines: [
      [20, 15, 130, 15],
      [130, 15, 130, 85],
      [130, 85, 20, 85],
      [20, 85, 20, 15],
    ],
    vertexPoints: [
      [20, 15], [130, 15], [130, 85], [20, 85],
    ],
  },
  {
    type: 'triangle',
    label: 'Hình tam giác',
    vertices: 3,
    edges: 3,
    faces: 1,
    points: '75,10 140,90 10,90',
    edgeLines: [
      [75, 10, 140, 90],
      [140, 90, 10, 90],
      [10, 90, 75, 10],
    ],
    vertexPoints: [
      [75, 10], [140, 90], [10, 90],
    ],
  },
  {
    type: 'pentagon',
    label: 'Hình ngũ giác',
    vertices: 5,
    edges: 5,
    faces: 1,
    points: '75,8 140,40 120,100 30,100 10,40',
    edgeLines: [
      [75, 8, 140, 40],
      [140, 40, 120, 100],
      [120, 100, 30, 100],
      [30, 100, 10, 40],
      [10, 40, 75, 8],
    ],
    vertexPoints: [
      [75, 8], [140, 40], [120, 100], [30, 100], [10, 40],
    ],
  },
  {
    type: 'hexagon',
    label: 'Hình lục giác',
    vertices: 6,
    edges: 6,
    faces: 1,
    points: '75,8 135,30 135,80 75,102 15,80 15,30',
    edgeLines: [
      [75, 8, 135, 30],
      [135, 30, 135, 80],
      [135, 80, 75, 102],
      [75, 102, 15, 80],
      [15, 80, 15, 30],
      [15, 30, 75, 8],
    ],
    vertexPoints: [
      [75, 8], [135, 30], [135, 80], [75, 102], [15, 80], [15, 30],
    ],
  },
];

export default function ShapeAttributeHighlightVisual({
  primaryCount,
  groupsLabel = 'Thuộc tính',
  itemsLabel = 'hình',
}: VisualProps) {
  const shapeIdx = Math.max(0, Math.min(SHAPES_CONFIG.length - 1, primaryCount - 1));
  const shape = SHAPES_CONFIG[shapeIdx];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Thuộc tính hình: {shape.label}
      </span>

      <div className="flex items-center gap-6">
        {/* Shape with highlighted attributes */}
        <svg width="150" height="110" viewBox="0 0 150 110" className="bg-white rounded-xl border border-slate-200">
          {/* Edges */}
          {shape.edgeLines.map(([x1, y1, x2, y2], i) => (
            <line
              key={`edge-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
          {/* Vertices */}
          {shape.vertexPoints.map(([x, y], i) => (
            <g key={`vertex-${i}`}>
              <circle cx={x} cy={y} r="7" fill="#ef4444" stroke="white" strokeWidth="2" />
              <text
                x={x} y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[8px] font-bold fill-white"
              >
                {i + 1}
              </text>
            </g>
          ))}
        </svg>

        {/* Attribute counts */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-red-700">Đỉnh: {shape.vertices}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-6 h-0.5 bg-blue-500 rounded" />
            <span className="text-[10px] font-bold text-blue-700">Cạnh: {shape.edges}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="w-4 h-4 rounded bg-emerald-500 opacity-40" />
            <span className="text-[10px] font-bold text-emerald-700">Mặt: {shape.faces}</span>
          </div>
        </div>
      </div>

      {/* Shape selector */}
      <div className="flex gap-2">
        {SHAPES_CONFIG.map((s, i) => (
          <span
            key={s.type}
            className={`text-[9px] font-bold px-2 py-1 rounded-full ${
              i === shapeIdx
                ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
