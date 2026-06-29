'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function DecimalPlaceValueVisual({
  primaryCount,
  secondaryCount,
}: VisualProps) {
  const integerPart = primaryCount;
  const decimalDigits = String(Math.abs(secondaryCount)).split('').map(Number);
  const fullNumber = parseFloat(`${integerPart}.${decimalDigits.join('') || '0'}`);
  const display = fullNumber.toLocaleString('vi-VN', {
    minimumFractionDigits: decimalDigits.length || 1,
    maximumFractionDigits: decimalDigits.length || 1,
  });

  const intDigits = String(integerPart).split('').map(Number);

  const intPlaceValues = [
    { label: 'Đơn vị', value: 1 },
    { label: 'Chục', value: 10 },
    { label: 'Trăm', value: 100 },
    { label: 'Nghìn', value: 1000 },
  ];

  const decPlaceValues = [
    { label: 'Tenths', labelVi: 'Phần mười', value: 0.1 },
    { label: 'Hundredths', labelVi: 'Phần trăm', value: 0.01 },
    { label: 'Thousandths', labelVi: 'Phần nghìn', value: 0.001 },
  ];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
        Giá trị vị trí thập phân
      </span>

      <div className="text-lg font-bold text-slate-800">
        {display}
      </div>

      <div className="w-full max-w-md overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-tl-lg">
                Phần nguyên
              </th>
              {intDigits.slice().reverse().map((_, ri) => {
                const idx = intDigits.length - 1 - ri;
                return (
                  <th
                    key={idx}
                    className="px-2 py-1 text-center font-bold text-blue-700 bg-blue-50 border border-blue-200"
                  >
                    {intPlaceValues[Math.min(idx, 3)]?.label || ''}
                  </th>
                );
              })}
              <th className="px-2 py-1 text-center font-bold text-amber-700 bg-amber-50 border border-amber-200">
                .
              </th>
              <th
                colSpan={Math.max(decimalDigits.length, 1)}
                className="px-2 py-1 text-center font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-tr-lg"
              >
                Phần thập phân
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 font-bold text-slate-500 border border-slate-200 rounded-bl-lg" />
              {intDigits.slice().reverse().map((_, ri) => {
                const idx = intDigits.length - 1 - ri;
                return (
                  <td
                    key={idx}
                    className="px-2 py-1 text-center font-bold text-blue-700 text-sm border border-slate-200"
                  >
                    {intDigits[idx]}
                  </td>
                );
              })}
              <td className="px-2 py-1 text-center font-bold text-amber-600 text-sm border border-slate-200">
                .
              </td>
              {decimalDigits.map((d, i) => (
                <td
                  key={i}
                  className="px-2 py-1 text-center font-bold text-amber-700 text-sm border border-slate-200 rounded-br-lg"
                >
                  {d}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-1 font-bold text-slate-500 border border-slate-200" />
              {intDigits.slice().reverse().map((_, ri) => {
                const idx = intDigits.length - 1 - ri;
                return (
                  <td
                    key={idx}
                    className="px-1 py-0.5 text-center text-[9px] text-slate-500 border border-slate-200"
                  >
                    {intDigits[idx]} × {intPlaceValues[Math.min(idx, 3)]?.value}
                  </td>
                );
              })}
              <td />
              {decimalDigits.map((d, i) => (
                <td
                  key={i}
                  className="px-1 py-0.5 text-center text-[9px] text-slate-500 border border-slate-200"
                >
                  {d} × {decPlaceValues[Math.min(i, 2)]?.value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        {intDigits.map((d, i) => {
          const idx = intDigits.length - 1 - i;
          return (
            <span key={i} className="text-blue-600">
              {d > 0 ? `${d}×${intPlaceValues[Math.min(idx, 3)]?.value}` : ''}
            </span>
          );
        })}
        {decimalDigits.map((d, i) => (
          <span key={`d${i}`} className="text-amber-600">
            {d > 0 ? ` + ${d}×${decPlaceValues[Math.min(i, 2)]?.value}` : ''}
          </span>
        ))}
        <span className="text-slate-400 ml-1">= {display}</span>
      </div>
    </div>
  );
}
