'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, RotateCcw } from 'lucide-react';

interface VisualDataProps {
  type: 'candy' | 'apple' | 'pizza' | 'grid';
  primaryCount: number;
  secondaryCount: number;
  totalCount: number;
  groupsLabel?: string;
  itemsLabel?: string;
}

type BrowserWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function buildInitialCandyCounts(primary: number, secondary: number): number[] {
  return Array(primary).fill(secondary);
}

function buildInitialAppleState(primary: number, secondary: number): { basket: number; applesPerDoll: number[] } {
  const applesPerDoll = Array(secondary).fill(Math.floor(primary / secondary) || 2);
  const consumed = applesPerDoll.reduce((sum, count) => sum + count, 0);
  return {
    basket: Math.max(0, primary - consumed),
    applesPerDoll,
  };
}

function buildInitialPizzaShares(primary: number, secondary: number): boolean[] {
  return Array.from({ length: secondary }, (_, index) => index < primary);
}

function buildInitialGardenTiles(primary: number, secondary: number): boolean[] {
  return Array(primary * secondary).fill(true);
}

export default function InteractiveSimulation({ visualData }: { visualData: VisualDataProps }) {
  // Safe default bounds
  const safePrimary = Math.max(1, Math.min(visualData.primaryCount || 3, 12));
  const safeSecondary = Math.max(1, Math.min(visualData.secondaryCount || 4, 12));
  const initialAppleState = buildInitialAppleState(safePrimary, safeSecondary);

  // Dynamic sandbox state specific to simulation types
  const [candyCounts, setCandyCounts] = useState<number[]>(() => buildInitialCandyCounts(safePrimary, safeSecondary));
  const [appleBasket, setAppleBasket] = useState<number>(() => initialAppleState.basket);
  const [applesPerDoll, setApplesPerDoll] = useState<number[]>(() => initialAppleState.applesPerDoll);
  const [pizzaShares, setPizzaShares] = useState<boolean[]>(() => buildInitialPizzaShares(safePrimary, safeSecondary));
  const [gardenTiles, setGardenTiles] = useState<boolean[]>(() => buildInitialGardenTiles(safePrimary, safeSecondary));

  // Audio synthethizer feedback logic
  const playSoundEffect = (soundType: 'pop' | 'crunch' | 'synth') => {
    try {
      const audioWindow = window as BrowserWindow;
      const AudioContext = window.AudioContext || audioWindow.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (soundType === 'pop') {
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (soundType === 'crunch') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (soundType === 'synth') {
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
      // Audio fallback
    }
  };

  const handleReset = () => {
    playSoundEffect('synth');
    if (visualData.type === 'candy') {
      setCandyCounts(buildInitialCandyCounts(safePrimary, safeSecondary));
    } else if (visualData.type === 'apple') {
      const resetState = buildInitialAppleState(safePrimary, safeSecondary);
      setApplesPerDoll(resetState.applesPerDoll);
      setAppleBasket(resetState.basket);
    } else if (visualData.type === 'pizza') {
      setPizzaShares(buildInitialPizzaShares(safePrimary, safeSecondary));
    } else if (visualData.type === 'grid') {
      setGardenTiles(buildInitialGardenTiles(safePrimary, safeSecondary));
    }
  };

  // 1. CANDY COMPONENT
  const renderCandySimulation = () => {
    const totalCandies = candyCounts.reduce((sum, val) => sum + val, 0);
    const areAllEqual = candyCounts.every((val) => val === candyCounts[0]);

    return (
      <div className="flex flex-col items-center gap-3 w-full text-center">
        <span className="text-[11px] font-bold text-[#4A6741] bg-[#E9F0E6] px-3 py-1 rounded-full border border-[#4A6741]/20">
          🍬 Chạm đĩa để tăng giảm số kẹo ngọt dâu (1-6 kẹo)
        </span>

        <div className="flex flex-wrap justify-center gap-3 py-2 w-full">
          {candyCounts.map((count, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSoundEffect('pop');
                setCandyCounts((prev) => {
                  const updated = [...prev];
                  updated[idx] = (updated[idx] % 6) + 1;
                  return updated;
                });
              }}
              className="flex flex-col items-center bg-white p-3 rounded-2xl border border-gray-200 min-w-[90px] shadow-xs cursor-pointer select-none"
            >
              <span className="text-[9px] font-bold text-gray-400 mb-1.5 uppercase">Đĩa {idx + 1}</span>
              <div className="grid grid-cols-3 gap-1 min-h-[30px] items-center">
                {Array.from({ length: count }).map((_, cIdx) => (
                  <span key={cIdx} className="text-sm select-none">🍬</span>
                ))}
              </div>
              <span className="text-[10px] font-bold text-gray-600 mt-2">{count} viên</span>
            </motion.div>
          ))}
        </div>

        <div className="bg-[#FAF9F5] p-3 rounded-xl border border-gray-200 w-full max-w-sm">
          <p className="text-xs font-semibold text-gray-700">
            Phép cộng lặp: {candyCounts.join(' + ')} = <span className="text-[#4A6741] font-bold">{totalCandies}</span> viên
          </p>
          {areAllEqual && (
            <p className="text-xs text-[#4A6741] font-bold mt-1.5 bg-[#E9F0E6] px-2.5 py-1 rounded-full w-fit mx-auto">
              Nhân gọn: {candyCounts.length} đĩa × {candyCounts[0]} kẹo = {totalCandies} kẹo ngọt
            </p>
          )}
        </div>
      </div>
    );
  };

  // 2. APPLE COMPONENT (DIVISION)
  const renderAppleSimulation = () => {
    const handleFeedDoll = () => {
      if (appleBasket <= 0) {
        playSoundEffect('synth');
        return;
      }
      playSoundEffect('pop');
      const minApples = Math.min(...applesPerDoll);
      const targetIdx = applesPerDoll.indexOf(minApples);
      if (targetIdx !== -1) {
        setApplesPerDoll((prev) => {
          const updated = [...prev];
          updated[targetIdx] += 1;
          return updated;
        });
        setAppleBasket((prev) => prev - 1);
      }
    };

    const handleReturnApple = (dollIdx: number) => {
      if (applesPerDoll[dollIdx] <= 0) return;
      playSoundEffect('crunch');
      setApplesPerDoll((prev) => {
        const updated = [...prev];
        updated[dollIdx] -= 1;
        return updated;
      });
      setAppleBasket((prev) => prev + 1);
    };

    return (
      <div className="flex flex-col items-center gap-3 w-full text-center">
        <span className="text-[11px] font-bold text-[#FF8C42] bg-[#FFF4E5] px-3 py-1 rounded-full border border-[#FF8C42]/20">
          🍎 Chạm giỏ để phát táo, chạm búp bê để trả táo về giỏ!
        </span>

        {/* Giỏ táo */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          onClick={handleFeedDoll}
          className="bg-[#FFF4E5] p-3 rounded-2xl border border-[#FF8C42]/30 cursor-pointer w-full max-w-[200px] text-center"
        >
          <span className="text-[10px] uppercase font-bold text-[#FF8C42] block mb-1">🧺 Giỏ táo ({appleBasket} quả)</span>
          {appleBasket > 0 ? (
            <div className="flex flex-wrap justify-center gap-1">
              {Array.from({ length: appleBasket }).map((_, i) => (
                <span key={i} className="text-base select-none">🍎</span>
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 italic">Đã chia hết táo rồi bé nhé!</span>
          )}
        </motion.div>

        {/* Danh sách búp bế */}
        <div className="flex flex-wrap justify-center gap-2 w-full py-1">
          {applesPerDoll.map((apples, idx) => (
            <motion.div
              key={idx}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleReturnApple(idx)}
              className="flex flex-col items-center bg-emerald-50/40 p-2.5 rounded-2xl border border-dashed border-[#4A6741]/30 min-w-[75px] cursor-pointer hover:bg-emerald-50"
            >
              <span className="text-[10px] font-bold text-[#4A6741]">🎎 Bạn {idx + 1}</span>
              <div className="flex flex-wrap justify-center items-center gap-0.5 mt-1.5 min-h-[22px]">
                {apples > 0 ? (
                  Array.from({ length: apples }).map((_, i) => (
                    <span key={i} className="text-sm select-none">🍎</span>
                  ))
                ) : (
                  <span className="text-[8px] text-gray-400 italic">...</span>
                )}
              </div>
              <span className="text-[9px] font-bold text-[#4A6741] mt-1.5 bg-white px-1.5 py-0.5 rounded-full border border-[#4A6741]/10">
                {apples} quả
              </span>
            </motion.div>
          ))}
        </div>

        <div className="text-[10px] text-gray-500 font-medium">
          Dư trong giỏ: <span className="font-bold text-[#FF8C42]">{appleBasket}</span> quả | Mỗi bạn được chia: <span className="font-bold text-[#4A6741]">{Math.min(...applesPerDoll)} - {Math.max(...applesPerDoll)}</span> quả
        </div>
      </div>
    );
  };

  // 3. PIZZA SLICES (FRACTION)
  const renderPizzaSimulation = () => {
    const activeSlices = pizzaShares.filter(Boolean).length;
    const totalSlices = pizzaShares.length;

    const toggleSlice = (idx: number) => {
      playSoundEffect('crunch');
      setPizzaShares((prev) => {
        const updated = [...prev];
        updated[idx] = !updated[idx];
        return updated;
      });
    };

    return (
      <div className="flex flex-col items-center gap-3 w-full text-center">
        <span className="text-[11px] font-bold text-[#FF8C42] bg-[#FFF4E5] px-3 py-1 rounded-full border border-[#FF8C42]/20">
          🍕 Chạm vào các miếng cắt để đổi phần bánh ăn dâu
        </span>

        <div className="relative h-32 w-32 flex items-center justify-center bg-white rounded-full p-2 shadow-sm border border-gray-150">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="41" fill="#FAF9F5" stroke="#E8E6D9" strokeWidth="2" />
            {pizzaShares.map((isActive, idx) => {
              const angle = 360 / totalSlices;
              const startAngle = idx * angle;
              const endAngle = (idx + 1) * angle;

              const rad1 = (startAngle * Math.PI) / 180;
              const rad2 = (endAngle * Math.PI) / 180;
              const r = 38;

              const x1 = 50 + r * Math.cos(rad1);
              const y1 = 50 + r * Math.sin(rad1);
              const x2 = 50 + r * Math.cos(rad2);
              const y2 = 50 + r * Math.sin(rad2);

              const largeArcFlag = angle > 180 ? 1 : 0;
              const pathData = `M50,50 L${x1},${y1} A${r},${r} 0 ${largeArcFlag},1 ${x2},${y2} Z`;

              return (
                <path
                  key={idx}
                  d={pathData}
                  fill={isActive ? '#FF8C42' : '#E8E6D9'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  onClick={() => toggleSlice(idx)}
                  className="cursor-pointer transition-colors duration-200 hover:opacity-90"
                />
              );
            })}
          </svg>

          {/* Fraction badge */}
          <div className="absolute flex flex-col items-center justify-center bg-white border border-gray-100 rounded-full h-14 w-14 shadow-sm select-none">
            <span className="text-xl font-bold text-[#FF8C42] leading-none">{activeSlices}</span>
            <div className="h-[2px] w-7 bg-gray-300 my-0.5" />
            <span className="text-md font-bold text-gray-800 leading-none">{totalSlices}</span>
          </div>
        </div>

        <div className="flex gap-3 text-[10px] font-bold text-gray-600">
          <span className="bg-[#FFF4E5] text-[#FF8C42] px-2.5 py-1 rounded-full">
            Đã ăn: {activeSlices} lát
          </span>
          <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
            Tổng cắt: {totalSlices} miếng
          </span>
        </div>
      </div>
    );
  };

  // 4. GARDEN GRID (AREA & PERIMETER)
  const renderGridSimulation = () => {
    const width = safePrimary;
    const height = safeSecondary;
    const activeSprouts = gardenTiles.filter(Boolean).length;
    const perimeter = (width + height) * 2;

    const toggleSprout = (idx: number) => {
      playSoundEffect('pop');
      setGardenTiles((prev) => {
        const updated = [...prev];
        updated[idx] = !updated[idx];
        return updated;
      });
    };

    return (
      <div className="flex flex-col items-center gap-3 w-full text-center">
        <span className="text-[11px] font-bold text-[#4A6741] bg-[#E9F0E6] px-3 py-1 rounded-full border border-[#4A6741]/20">
          🌱 Nhấp vào ô vuông để gieo hạt mầm mọc cỏ dại
        </span>

        <div className="p-2 bg-slate-50 border border-gray-200 rounded-xl inline-block">
          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
          >
            {gardenTiles.map((isActive, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                onClick={() => toggleSprout(idx)}
                className={`h-9 w-9 rounded-md border flex items-center justify-center text-xs font-bold cursor-pointer select-none transition-all ${
                  isActive 
                    ? 'bg-[#E9F0E6] border-[#4A6741]/40 text-[#4A6741]' 
                    : 'bg-white border-gray-200 text-gray-300'
                }`}
              >
                {isActive ? '🌱' : idx + 1}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <span className="bg-[#E9F0E6] text-[#4A6741] text-[10px] font-bold px-2.5 py-1 rounded-full">
            Diện tích (Hạt mầm cỏ) = {activeSprouts} m²
          </span>
          <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
            Chu vi hàng rào = {perimeter} m
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-150 p-4.5 shadow-sm relative overflow-hidden text-left">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-4">
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-amber-500 animate-bounce" />
          <span className="text-xs font-extrabold text-gray-800 uppercase tracking-tight">Học cụ xúc giác AI</span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[10px] font-extrabold text-gray-500 hover:text-[#4A6741] transition-colors uppercase cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Đặt lại</span>
        </button>
      </div>

      <div className="flex items-center justify-center min-h-[180px] py-1">
        {visualData.type === 'candy' && renderCandySimulation()}
        {visualData.type === 'apple' && renderAppleSimulation()}
        {visualData.type === 'pizza' && renderPizzaSimulation()}
        {visualData.type === 'grid' && renderGridSimulation()}
      </div>
    </div>
  );
}
