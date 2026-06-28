'use client';

import React from 'react';
import { VisualProps } from './shared';

function getDigits(n: number): string[] {
  return String(n).split('');
}

function additionSteps(a: number, b: number): { digits: string; note: string }[] {
  const steps: { digits: string; note: string }[] = [];
  const maxLen = Math.max(getDigits(a).length, getDigits(b).length);
  const da = getDigits(a).map(Number);
  const db = getDigits(b).map(Number);
  const ra = da.reverse();
  const rb = db.reverse();

  let carry = 0;
  const resultDigits: number[] = [];

  for (let i = 0; i < maxLen; i++) {
    const da = ra[i] ?? 0;
    const db = rb[i] ?? 0;
    const sum = da + db + carry;
    const digit = sum % 10;
    const newCarry = Math.floor(sum / 10);
    resultDigits.push(digit);

    steps.push({
      digits: `${da} + ${db}${carry > 0 ? ` + ${carry} (nhớ)` : ''} = ${sum}`,
      note: newCarry > 0 ? `Nhớ ${newCarry}` : `Kết quả cột đơn vị: ${digit}`,
    });
    carry = newCarry;
  }
  if (carry > 0) {
    steps.push({ digits: `Nhớ ${carry}`, note: `Đưa ${carry} xuống hàng tiếp` });
  }

  return steps;
}

function subtractionSteps(a: number, b: number): { digits: string; note: string }[] {
  const steps: { digits: string; note: string }[] = [];
  const maxLen = Math.max(getDigits(a).length, getDigits(b).length);
  const ra = getDigits(a).map(Number).reverse();
  const rb = getDigits(b).map(Number).reverse();

  let borrow = 0;
  const resultDigits: number[] = [];

  for (let i = 0; i < maxLen; i++) {
    let da = (ra[i] ?? 0) - borrow;
    const db = rb[i] ?? 0;
    borrow = 0;

    if (da < db) {
      da += 10;
      borrow = 1;
      steps.push({
        digits: `${da} - ${db}${borrow > 0 ? ' (mượn 10)' : ''}`,
        note: `Mượn 10 từ cột kế: ${ra[i] ?? 0} → ${ra[i] ?? 0 - 1}, ${da} - ${db} = ${da - db}`,
      });
    } else {
      steps.push({
        digits: `${da} - ${db}`,
        note: `Kết quả: ${da - db}`,
      });
    }
    resultDigits.push(da - db);
  }

  return steps;
}

export default function StepByStepInputVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'bài toán',
  itemsLabel = 'bước',
}: VisualProps) {
  const a = primaryCount;
  const b = secondaryCount;
  const result = totalCount;
  const isAddition = result === a + b;
  const opSymbol = isAddition ? '+' : '−';
  const steps = isAddition ? additionSteps(a, b) : subtractionSteps(a, b);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
        {groupsLabel}: {a} {opSymbol} {b} = {result}
      </span>

      <div className="bg-white rounded-2xl border-2 border-orange-200 p-4 w-full max-w-xs shadow-sm">
        <span className="text-[10px] font-bold text-orange-600 block text-center mb-3 uppercase tracking-wide">
          Phép {isAddition ? 'cộng' : 'trừ'} có nhớ / mượn
        </span>

        <div className="bg-orange-50 rounded-xl p-3 mb-4 border border-orange-100">
          <div className="font-mono text-right text-lg text-gray-800">
            <span className="text-orange-500 font-bold">{a}</span>
            <span className="mx-1 text-orange-400">{opSymbol}</span>
            <span className="text-orange-500 font-bold">{b}</span>
            <span className="mx-1 text-orange-400">=</span>
            <span className="text-orange-700 font-bold">{result}</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">
            {itemsLabel} chi tiết ({steps.length} {itemsLabel})
          </span>
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 text-[11px] rounded-lg px-3 py-2 border transition-colors ${
                idx === steps.length - 1
                  ? 'bg-orange-100 border-orange-300 font-bold'
                  : 'bg-white border-orange-100'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center bg-orange-200 text-orange-800 rounded-full text-[10px] font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-gray-800">{step.digits}</span>
                <span className="text-gray-500 text-[10px]">{step.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
        Kết quả: {a} {opSymbol} {b} = {result}
      </div>
    </div>
  );
}
