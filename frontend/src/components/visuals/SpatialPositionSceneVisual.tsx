'use client';

import React from 'react';
import { VisualProps } from './shared';

const POSITIONS = [
  { id: 1, name: 'Trên', x: 50, y: 15, icon: '⬆️' },
  { id: 2, name: 'Dưới', x: 50, y: 85, icon: '⬇️' },
  { id: 3, name: 'Trái', x: 10, y: 50, icon: '⬅️' },
  { id: 4, name: 'Phải', x: 90, y: 50, icon: '➡️' },
  { id: 5, name: 'Trước', x: 50, y: 50, icon: '⏹️' },
  { id: 6, name: 'Sau', x: 50, y: 50, icon: '⏫' },
];

const OBJECTS = [
  { id: 'teacher', label: 'Giáo viên', x: 50, y: 50 },
  { id: 'board', label: 'Bảng', x: 50, y: 8 },
  { id: 'desk1', label: 'Bàn 1', x: 30, y: 60 },
  { id: 'desk2', label: 'Bàn 2', x: 70, y: 60 },
  { id: 'bookshelf', label: 'Tủ sách', x: 8, y: 25 },
  { id: 'clock', label: 'Đồng hồ', x: 92, y: 25 },
];

export default function SpatialPositionSceneVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Vị trí',
  itemsLabel = 'trong lớp học',
}: VisualProps) {
  const highlightedPos = Math.max(1, Math.min(6, primaryCount));
  const pos = POSITIONS.find((p) => p.id === highlightedPos)!;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Vị trí không gian: {pos.name}
      </span>

      {/* Classroom scene */}
      <div className="relative w-full h-52 bg-gradient-to-b from-sky-100 to-sky-50 rounded-xl border-2 border-slate-200 overflow-hidden">
        {/* Floor */}
        <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-amber-100 to-amber-50" />

        {/* Objects */}
        {OBJECTS.map((obj) => (
          <div
            key={obj.id}
            className="absolute flex flex-col items-center"
            style={{ left: `${obj.x}%`, top: `${obj.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">
              {obj.label.charAt(0)}
            </div>
            <span className="text-[8px] font-semibold text-slate-500 mt-0.5">{obj.label}</span>
          </div>
        ))}

        {/* Highlighted position indicator */}
        <div
          className="absolute w-12 h-12 rounded-full border-4 border-dashed border-red-400 bg-red-100/50 flex items-center justify-center animate-pulse"
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <span className="text-lg">{pos.icon}</span>
        </div>
      </div>

      {/* Position labels */}
      <div className="grid grid-cols-3 gap-2">
        {POSITIONS.map((p) => (
          <span
            key={p.id}
            className={`text-[9px] font-bold px-2 py-1 rounded-full text-center ${
              p.id === highlightedPos
                ? 'bg-red-100 text-red-700 ring-2 ring-red-300'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {p.name}
          </span>
        ))}
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
