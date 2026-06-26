'use client';

import React from 'react';
import { VisualProps } from './shared';

const ROMAN_MAP: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

function toRoman(num: number): string {
  if (num <= 0 || num > 3999) return '(không hỗ trợ)';
  let result = '';
  let remaining = num;
  for (const [value, symbol] of ROMAN_MAP) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}

const REFERENCE_TABLE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export default function RomanNumeralVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'giá trị',
  itemsLabel = 'số',
}: VisualProps) {
  const mainNumber = primaryCount;
  const mainRoman = toRoman(mainNumber);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
        {groupsLabel}: {mainNumber} {itemsLabel}
      </span>

      <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-5 w-full max-w-xs">
        <span className="text-xs font-semibold text-purple-500 uppercase tracking-wide">Thập phân</span>
        <span className="text-4xl font-bold text-purple-800">{mainNumber}</span>

        <div className="flex items-center gap-2 text-purple-300">
          <div className="h-px w-8 bg-purple-200" />
          <span className="text-lg">⬇</span>
          <div className="h-px w-8 bg-purple-200" />
        </div>

        <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">La Mã</span>
        <span className="text-3xl font-bold text-indigo-800 tracking-wider">{mainRoman}</span>
      </div>

      <div className="bg-white rounded-xl border border-purple-200 p-3 w-full">
        <span className="text-[10px] font-bold text-purple-600 block text-center mb-2 uppercase tracking-wide">
          Bảng tra cứu
        </span>
        <div className="grid grid-cols-5 gap-x-3 gap-y-1">
          {REFERENCE_TABLE.map((n) => (
            <div
              key={n}
              className={`flex justify-between text-[10px] px-1 py-0.5 rounded ${
                n === mainNumber
                  ? 'bg-purple-100 text-purple-800 font-bold ring-1 ring-purple-300'
                  : 'text-gray-600'
              }`}
            >
              <span>{n}</span>
              <span className="font-mono">{toRoman(n)}</span>
            </div>
          ))}
        </div>
      </div>

      {totalCount > 0 && (
        <div className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
          {totalCount} {itemsLabel} = {toRoman(totalCount)} La Mã
        </div>
      )}
    </div>
  );
}
