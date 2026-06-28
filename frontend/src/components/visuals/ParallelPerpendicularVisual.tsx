'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function ParallelPerpendicularVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Quan hệ',
  itemsLabel = 'đường thẳng',
}: VisualProps) {
  const mode = primaryCount % 2 === 0 ? 'parallel' : 'perpendicular';
  const isParallel = mode === 'parallel';

  const parallelPairs = [
    { l1: [40, 30, 260, 30], l2: [40, 70, 260, 70], label: 'Song song' },
    { l1: [40, 100, 260, 100], l2: [40, 140, 260, 140], label: 'Song song' },
  ];

  const perpPairs = [
    { l1: [60, 20, 60, 150], l2: [30, 90, 170, 90], label: 'Vuông góc' },
  ];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        {isParallel ? 'Đường thẳng song song (∥)' : 'Đường thẳng vuông góc (⊥)'}
      </span>

      <svg width="300" height="170" viewBox="0 0 300 170" className="bg-white rounded-xl border border-slate-200">
        {isParallel ? (
          <>
            {/* Pair 1 */}
            <line x1={40} y1={40} x2={260} y2={40} stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            <line x1={40} y1={80} x2={260} y2={80} stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            {/* Arrows */}
            <polygon points="260,36 270,40 260,44" fill="#3b82f6" />
            <polygon points="260,76 270,80 260,84" fill="#3b82f6" />
            {/* Symbol */}
            <text x="150" y="65" textAnchor="middle" className="text-[14px] font-black fill-blue-600">∥</text>
            <text x="150" y="100" textAnchor="middle" className="text-[10px] font-bold fill-slate-500">Song song</text>

            {/* Pair 2 */}
            <line x1={40} y1={110} x2={260} y2={110} stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
            <line x1={40} y1={150} x2={260} y2={150} stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
            <polygon points="260,106 270,110 260,114" fill="#10b981" />
            <polygon points="260,146 270,150 260,154" fill="#10b981" />
            <text x="150" y="135" textAnchor="middle" className="text-[14px] font-black fill-emerald-600">∥</text>
            <text x="150" y="165" textAnchor="middle" className="text-[10px] font-bold fill-slate-500">Song song</text>
          </>
        ) : (
          <>
            {/* Perpendicular pair */}
            <line x1={80} y1={20} x2={80} y2={150} stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <line x1={20} y1={90} x2={180} y2={90} stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            {/* Right angle marker */}
            <rect x="80" y="90" width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="1.5" />
            {/* Symbol */}
            <text x="130" y="55" textAnchor="middle" className="text-[14px] font-black fill-red-600">⊥</text>
            <text x="130" y="125" textAnchor="middle" className="text-[10px] font-bold fill-slate-500">Vuông góc</text>

            {/* Another pair */}
            <line x1={210} y1={20} x2={210} y2={150} stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
            <line x1={170} y1={90} x2={280} y2={90} stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
            <rect x="210" y="90" width="15" height="15" fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
            <text x="250" y="55" textAnchor="middle" className="text-[14px] font-black fill-violet-600">⊥</text>
            <text x="250" y="125" textAnchor="middle" className="text-[10px] font-bold fill-slate-500">Vuông góc</text>
          </>
        )}
      </svg>

      {/* Labels */}
      <div className="flex gap-3">
        <div className={`px-3 py-1 rounded-lg border-2 ${isParallel ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-[10px] font-bold ${isParallel ? 'text-blue-700' : 'text-slate-400'}`}>∥ Song song</span>
        </div>
        <div className={`px-3 py-1 rounded-lg border-2 ${!isParallel ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-[10px] font-bold ${!isParallel ? 'text-red-700' : 'text-slate-400'}`}>⊥ Vuông góc</span>
        </div>
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel} · {itemsLabel}
      </div>
    </div>
  );
}
