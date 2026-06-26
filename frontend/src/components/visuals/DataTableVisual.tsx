'use client';

import React from 'react';
import { VisualProps } from './shared';

const CATEGORY_LABELS = [
  'Táo', 'Cam', 'Chuối', 'Nho', 'Xoài', 'Dưa hấu',
  'Dâu', 'Kiwi', 'Bơ', 'Măng cụt', 'Thanh long', 'Sầu riêng',
];

const ROW_COLORS = ['bg-blue-50', 'bg-sky-50'];

export default function DataTableVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Loại trái cây',
  itemsLabel = 'số lượng',
}: VisualProps) {
  const rows = primaryCount;
  const cols = secondaryCount;

  const data: number[][] = [];
  let remaining = totalCount;
  for (let r = 0; r < rows; r++) {
    const rowData: number[] = [];
    for (let c = 0; c < cols; c++) {
      const val = Math.max(1, Math.round(remaining / (rows - r)));
      rowData.push(val);
      remaining -= val;
      if (remaining < 0) remaining = 0;
    }
    data.push(rowData);
  }

  const allValues = data.flat();
  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
        Bảng dữ liệu: {rows} dòng × {cols} cột
      </span>

      <div className="w-full max-w-md overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-blue-100 border-b-2 border-blue-300">
              <th className="px-3 py-2 text-left font-bold text-blue-700">{groupsLabel}</th>
              {Array.from({ length: cols }, (_, c) => (
                <th key={c} className="px-3 py-2 text-center font-bold text-blue-700">
                  {itemsLabel} {c + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={`${ROW_COLORS[rIdx % 2]} border-b border-blue-100`}
              >
                <td className="px-3 py-2 font-semibold text-blue-700">
                  {CATEGORY_LABELS[rIdx % CATEGORY_LABELS.length]}
                </td>
                {row.map((val, cIdx) => {
                  const isMax = val === maxVal;
                  const isMin = val === minVal;
                  return (
                    <td
                      key={cIdx}
                      className={`px-3 py-2 text-center font-medium ${
                        isMax
                          ? 'bg-green-200 text-green-800 font-bold rounded'
                          : isMin
                          ? 'bg-red-200 text-red-800 font-bold rounded'
                          : 'text-slate-700'
                      }`}
                    >
                      {val}
                      {isMax && ' ↑'}
                      {isMin && ' ↓'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 text-[10px] font-semibold">
        <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
          ↑ Largest: {maxVal}
        </span>
        <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
          ↓ Smallest: {minVal}
        </span>
      </div>
    </div>
  );
}
