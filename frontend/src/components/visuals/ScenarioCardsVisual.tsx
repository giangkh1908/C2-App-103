'use client';

import React from 'react';
import { VisualProps } from './shared';

interface Scenario {
  type: 'possible' | 'certain' | 'impossible';
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const SCENARIOS: Scenario[] = [
  {
    type: 'possible',
    label: 'Có thể',
    icon: '🎲',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    description: 'Có thể xảy ra hoặc không',
  },
  {
    type: 'certain',
    label: 'Chắc chắn',
    icon: '✅',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    description: 'Chắc chắn xảy ra',
  },
  {
    type: 'impossible',
    label: 'Không thể',
    icon: '❌',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    description: 'Không thể xảy ra',
  },
];

function getScenarioType(
  primaryCount: number,
  secondaryCount: number,
  totalCount: number
): 'possible' | 'certain' | 'impossible' {
  const ratio = totalCount > 0 ? secondaryCount / totalCount : 0;
  if (ratio >= 1) return 'certain';
  if (ratio <= 0) return 'impossible';
  return 'possible';
}

export default function ScenarioCardsVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Sự kiện',
  itemsLabel = 'kết quả',
}: VisualProps) {
  const activeType = getScenarioType(primaryCount, secondaryCount, totalCount);
  const probability = totalCount > 0 ? secondaryCount / totalCount : 0;
  const percentage = Math.round(probability * 100);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
        Phân loại sự kiện: {groupsLabel}
      </span>

      <div className="flex gap-3 w-full max-w-md justify-center">
        {SCENARIOS.map((scenario) => {
          const isActive = scenario.type === activeType;
          return (
            <div
              key={scenario.type}
              className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border-2 transition-all flex-1 ${
                isActive
                  ? `${scenario.bgColor} ${scenario.borderColor} shadow-md scale-105`
                  : 'bg-slate-50 border-slate-200 opacity-50'
              }`}
            >
              <span className="text-2xl">{scenario.icon}</span>
              <span className={`text-xs font-bold ${isActive ? scenario.color : 'text-slate-400'}`}>
                {scenario.label}
              </span>
              <span className={`text-[9px] ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                {scenario.description}
              </span>
              {isActive && (
                <span className={`text-[10px] font-bold ${scenario.color} bg-white/70 px-2 py-0.5 rounded-full`}>
                  {percentage}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {groupsLabel}: {secondaryCount} / {totalCount} {itemsLabel} → {percentage}%
      </div>
    </div>
  );
}
