'use client';

import React from 'react';
import { VisualProps } from './shared';

const SOLIDS = [
  {
    type: 'cube',
    label: 'Khối lập phương',
    faces: 6,
    edges: 12,
    vertices: 8,
    render: () => (
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Back face */}
        <polygon points="30,25 70,25 70,65 30,65" fill="#93c5fd" stroke="#3b82f6" strokeWidth="1.5" />
        {/* Top face */}
        <polygon points="30,25 50,10 90,10 70,25" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1.5" />
        {/* Right face */}
        <polygon points="70,25 90,10 90,50 70,65" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.5" />
        {/* Front face */}
        <polygon points="30,25 70,25 70,65 30,65" fill="none" stroke="#3b82f6" strokeWidth="2" />
      </svg>
    ),
  },
  {
    type: 'prism',
    label: 'Khối hộp chữ nhật',
    faces: 6,
    edges: 12,
    vertices: 8,
    render: () => (
      <svg width="100" height="100" viewBox="0 0 100 100">
        <polygon points="20,35 60,35 60,75 20,75" fill="#93c5fd" stroke="#3b82f6" strokeWidth="1.5" />
        <polygon points="20,35 40,20 80,20 60,35" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1.5" />
        <polygon points="60,35 80,20 80,60 60,75" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.5" />
        <polygon points="20,35 60,35 60,75 20,75" fill="none" stroke="#3b82f6" strokeWidth="2" />
      </svg>
    ),
  },
  {
    type: 'cylinder',
    label: 'Khối tròn xoay',
    faces: 3,
    edges: 2,
    vertices: 0,
    render: () => (
      <svg width="100" height="100" viewBox="0 0 100 100">
        <ellipse cx="50" cy="25" rx="25" ry="10" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1.5" />
        <rect x="25" y="25" width="50" height="45" fill="#93c5fd" stroke="none" />
        <line x1="25" y1="25" x2="25" y2="70" stroke="#3b82f6" strokeWidth="1.5" />
        <line x1="75" y1="25" x2="75" y2="70" stroke="#3b82f6" strokeWidth="1.5" />
        <ellipse cx="50" cy="70" rx="25" ry="10" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    type: 'sphere',
    label: 'Quả cầu',
    faces: 1,
    edges: 0,
    vertices: 0,
    render: () => (
      <svg width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="sphereGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="35" fill="url(#sphereGrad)" stroke="#3b82f6" strokeWidth="1.5" />
        <ellipse cx="50" cy="50" rx="35" ry="12" fill="none" stroke="#93c5fd" strokeWidth="1" strokeDasharray="3 2" />
      </svg>
    ),
  },
];

export default function SolidShapeVisual({
  primaryCount,
  groupsLabel = 'Hình 3D',
  itemsLabel = 'khối',
}: VisualProps) {
  const shapeIdx = Math.max(0, Math.min(SOLIDS.length - 1, primaryCount - 1));
  const shape = SOLIDS[shapeIdx];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Hình 3D: {shape.label}
      </span>

      <div className="flex gap-3">
        {SOLIDS.map((s, i) => (
          <div
            key={s.type}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
              i === shapeIdx
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300 scale-105'
                : 'border-slate-200 bg-white opacity-50'
            }`}
          >
            {s.render()}
            <span className={`text-[9px] font-bold ${i === shapeIdx ? 'text-blue-700' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Properties */}
      <div className="flex gap-2">
        <div className="px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-[10px] font-bold text-blue-700">Mặt: {shape.faces}</span>
        </div>
        <div className="px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-700">Cạnh: {shape.edges}</span>
        </div>
        <div className="px-3 py-1 bg-red-50 rounded-lg border border-red-200">
          <span className="text-[10px] font-bold text-red-700">Đỉnh: {shape.vertices}</span>
        </div>
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
