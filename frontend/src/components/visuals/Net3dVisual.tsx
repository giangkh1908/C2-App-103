'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function Net3dVisual({
  primaryCount,
  groupsLabel = 'Hình khai triển',
  itemsLabel = 'mặt',
}: VisualProps) {
  const highlightedFace = Math.max(1, Math.min(6, primaryCount));

  const faces = [
    { id: 1, x: 100, y: 20, label: 'Mặt 1', color: '#f472b6' },
    { id: 2, x: 60, y: 60, label: 'Mặt 2', color: '#60a5fa' },
    { id: 3, x: 100, y: 60, label: 'Mặt 3', color: '#34d399' },
    { id: 4, x: 140, y: 60, label: 'Mặt 4', color: '#fbbf24' },
    { id: 5, x: 180, y: 60, label: 'Mặt 5', color: '#a78bfa' },
    { id: 6, x: 100, y: 100, label: 'Mặt 6', color: '#22d3ee' },
  ];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Hình khai triển khối lập phương
      </span>

      <div className="flex items-center gap-6">
        {/* Net (unfolded) */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold text-slate-500">Khai triển</span>
          <svg width="200" height="140" viewBox="0 0 200 140" className="bg-white rounded-xl border border-slate-200">
            {/* Cross pattern net */}
            {faces.map((f) => {
              const isActive = f.id === highlightedFace;
              return (
                <g key={f.id}>
                  <rect
                    x={f.x}
                    y={f.y}
                    width="36"
                    height="36"
                    rx="3"
                    fill={f.color}
                    opacity={isActive ? 1 : 0.3}
                    stroke={isActive ? '#1e40af' : '#cbd5e1'}
                    strokeWidth={isActive ? 2.5 : 1}
                  />
                  <text
                    x={f.x + 18}
                    y={f.y + 20}
                    textAnchor="middle"
                    className={`text-[9px] font-bold ${isActive ? 'fill-white' : 'fill-slate-400'}`}
                  >
                    {f.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center">
          <svg width="50" height="24" viewBox="0 0 50 24">
            <line x1="0" y1="12" x2="40" y2="12" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
            <polygon points="40,6 50,12 40,18" fill="#3b82f6" />
          </svg>
          <span className="text-[9px] font-bold text-blue-600">gấp</span>
        </div>

        {/* 3D cube */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold text-slate-500">Khối lập phương</span>
          <svg width="100" height="100" viewBox="0 0 100 100" className="bg-blue-50 rounded-xl border border-blue-200">
            {/* Back face */}
            <polygon points="30,25 70,25 70,65 30,65" fill="#93c5fd" stroke="#3b82f6" strokeWidth="1.5" />
            {/* Top face */}
            <polygon points="30,25 50,10 90,10 70,25" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1.5" />
            {/* Right face */}
            <polygon points="70,25 90,10 90,50 70,65" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.5" />
            {/* Highlighted face on cube */}
            {faces.map((f) => {
              if (f.id !== highlightedFace) return null;
              const cubeFaces: Record<number, string> = {
                1: 'M30,25 L50,10 L90,10 L70,25 Z',
                2: 'M30,25 L30,65 L70,65 L70,25 Z',
                3: 'M30,25 L50,10 L90,10 L70,25 Z',
                4: 'M70,25 L90,10 L90,50 L70,65 Z',
                5: 'M30,65 L70,65 L70,25 L30,25 Z',
                6: 'M30,65 L70,65 L90,50 L50,50 Z',
              };
              return (
                <path
                  key={f.id}
                  d={cubeFaces[f.id] || cubeFaces[1]}
                  fill={f.color}
                  opacity="0.6"
                  stroke="#1e40af"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Face selector */}
      <div className="flex gap-1.5">
        {faces.map((f) => (
          <div
            key={f.id}
            className={`flex flex-col items-center px-2 py-1 rounded-lg text-[9px] font-bold ${
              f.id === highlightedFace
                ? 'text-white ring-2 ring-blue-300'
                : 'bg-slate-100 text-slate-400'
            }`}
            style={{ backgroundColor: f.id === highlightedFace ? f.color : undefined }}
          >
            <span>{f.label}</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
