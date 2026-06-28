'use client';

import React from 'react';
import { VisualProps } from './shared';

const CALC_BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

export default function CalculatorDemoVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'phép cộng',
  itemsLabel = 'số',
}: VisualProps) {
  const a = primaryCount;
  const b = secondaryCount;
  const result = totalCount;
  const expression = `${a} + ${b}`;

  const steps = [
    `Nhập số ${a}`,
    `Nhấn nút +`,
    `Nhập số ${b}`,
    `Nhấn nút =`,
    `Kết quả: ${result}`,
  ];

  const highlightKeys = new Set<string>();
  const aDigits = String(a).split('');
  const bDigits = String(b).split('');
  aDigits.forEach((d) => highlightKeys.add(d));
  highlightKeys.add('+');
  bDigits.forEach((d) => highlightKeys.add(d));
  highlightKeys.add('=');

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
        {groupsLabel}: {expression} = {result} ({itemsLabel})
      </span>

      <div className="bg-gray-900 rounded-2xl border-2 border-gray-700 p-3 w-full max-w-[260px] shadow-lg">
        <div className="bg-gray-800 rounded-xl p-3 mb-3 text-right">
          <div className="text-gray-400 text-xs font-mono h-4">{expression}</div>
          <div className="text-white text-2xl font-mono font-bold">{result}</div>
        </div>

        <div className="grid gap-1.5">
          {CALC_BUTTONS.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1.5">
              {row.map((label) => {
                const isHighlight = highlightKeys.has(label);
                const isZero = label === '0';
                const isOp = ['÷', '×', '−', '+', '='].includes(label);
                const isFunc = ['C', '±', '%'].includes(label);

                let bg = 'bg-gray-700 text-white hover:bg-gray-600';
                if (isOp) bg = 'bg-emerald-500 text-white hover:bg-emerald-400';
                if (isFunc) bg = 'bg-gray-500 text-gray-900 hover:bg-gray-400';

                const pressedBg = isHighlight && isOp
                  ? 'bg-emerald-300 text-emerald-900 ring-2 ring-emerald-200'
                  : isHighlight
                  ? 'bg-white text-gray-900 ring-2 ring-emerald-300'
                  : bg;

                return (
                  <button
                    key={label}
                    disabled
                    className={`${pressedBg} ${isZero ? 'flex-[2]' : 'flex-1'} h-10 rounded-lg text-sm font-bold transition-all cursor-default`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-[260px]">
        <span className="text-[10px] font-bold text-emerald-600 block text-center mb-2 uppercase tracking-wide">
          Các bước thực hiện
        </span>
        <div className="space-y-1">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-[11px] bg-emerald-50 rounded-lg px-3 py-1.5 border border-emerald-100"
            >
              <span className="w-5 h-5 flex items-center justify-center bg-emerald-200 text-emerald-800 rounded-full text-[10px] font-bold shrink-0">
                {idx + 1}
              </span>
              <span className="text-gray-700 font-medium">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
        {a} + {b} = {result}
      </div>
    </div>
  );
}
