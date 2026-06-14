"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import ScrollReveal from "@/components/shared/ScrollReveal";
import { getAudioContext } from "@/lib/audio";

// ── Types ──
type Domain = "multiplication" | "division" | "fraction_basic" | "perimeter_area_basic";

// ── Sound Effects ──
function playSound(type: "pop" | "crunch" | "correct" | "synth") {
  try {
    const ctx = getAudioContext();

    if (type === "pop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "crunch") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "correct") {
      [261.63, 329.63, 392.0, 523.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.2);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.2);
      });
    } else if (type === "synth") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch {
    // Audio sandbox safeguard
  }
}

// ── Main Component ──
export default function Sandbox() {
  const t = useTranslations("sandbox");
  const [activeTab, setActiveTab] = useState<Domain>("multiplication");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answersChecked, setAnswersChecked] = useState(false);

  // Sandbox states
  const [candyCounts, setCandyCounts] = useState([4, 4, 4]);
  const [appleBasket, setAppleBasket] = useState(3);
  const [applesPerDoll, setApplesPerDoll] = useState([3, 3, 3]);
  const [pizzaEaten, setPizzaEaten] = useState([true, true, true, false]);
  const [gridTiles, setGridTiles] = useState<boolean[]>(Array(12).fill(true));

  // TTS — dùng ref để tránh stale closure và re-create không cần thiết
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const speakingTextRef = useRef<string | null>(null);

  useEffect(() => {
    speakingTextRef.current = speakingText;
  }, [speakingText]);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (speakingTextRef.current === text) {
      setSpeakingText(null);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "vi-VN";
    utter.rate = 0.95;
    utter.onend = () => setSpeakingText(null);
    setSpeakingText(text);
    window.speechSynthesis.speak(utter);
  }, []);

  // Cleanup TTS khi unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Lesson data from translations
  const LESSONS: Record<Domain, { title: string; grade: number; shortExplanation: string; lifeExample: string; questionText: string; options: string[]; correctAnswerIndex: number; successMessage: string; failMessage: string }> = {
    multiplication: {
      title: t("multiplication.title"),
      grade: 2,
      shortExplanation: t("multiplication.explanation"),
      lifeExample: t("multiplication.lifeExample"),
      questionText: t("multiplication.question"),
      options: [t("multiplication.optionA"), t("multiplication.optionB"), t("multiplication.optionC"), t("multiplication.optionD")],
      correctAnswerIndex: 1,
      successMessage: t("multiplication.correctMsg"),
      failMessage: t("multiplication.incorrectMsg"),
    },
    division: {
      title: t("division.title"),
      grade: 2,
      shortExplanation: t("division.explanation"),
      lifeExample: t("division.lifeExample"),
      questionText: t("division.question"),
      options: [t("division.optionA"), t("division.optionB"), t("division.optionC"), t("division.optionD")],
      correctAnswerIndex: 0,
      successMessage: t("division.correctMsg"),
      failMessage: t("division.incorrectMsg"),
    },
    fraction_basic: {
      title: t("fraction.title"),
      grade: 3,
      shortExplanation: t("fraction.explanation"),
      lifeExample: t("fraction.lifeExample"),
      questionText: t("fraction.question"),
      options: [t("fraction.optionA"), t("fraction.optionB"), t("fraction.optionC"), t("fraction.optionD")],
      correctAnswerIndex: 1,
      successMessage: t("fraction.correctMsg"),
      failMessage: t("fraction.incorrectMsg"),
    },
    perimeter_area_basic: {
      title: t("area.title"),
      grade: 4,
      shortExplanation: t("area.explanation"),
      lifeExample: t("area.lifeExample"),
      questionText: t("area.question"),
      options: [t("area.optionA"), t("area.optionB"), t("area.optionC"), t("area.optionD")],
      correctAnswerIndex: 0,
      successMessage: t("area.correctMsg"),
      failMessage: t("area.incorrectMsg"),
    },
  };

  const TABS: { key: Domain; label: string; color: string }[] = [
    { key: "multiplication", label: `🍬 ${t("tabMultiplication")}`, color: "bg-natural-green" },
    { key: "division", label: `🍎 ${t("tabDivision")}`, color: "bg-natural-orange" },
    { key: "fraction_basic", label: `🍕 ${t("tabFraction")}`, color: "bg-natural-orange" },
    { key: "perimeter_area_basic", label: `🌱 ${t("tabArea")}`, color: "bg-natural-green" },
  ];

  const resetSandboxState = (nextTab: Domain) => {
    setSelectedAnswer(null);
    setAnswersChecked(false);
    if (nextTab === "multiplication") setCandyCounts([4, 4, 4]);
    else if (nextTab === "division") {
      setApplesPerDoll([3, 3, 3]);
      setAppleBasket(3);
    } else if (nextTab === "fraction_basic") setPizzaEaten([true, true, true, false]);
    else if (nextTab === "perimeter_area_basic") setGridTiles(Array(12).fill(true));
  };

  // ── Sandbox Handlers ──
  const handlePlateClick = (idx: number) => {
    playSound("pop");
    setCandyCounts((prev) => {
      const next = [...prev];
      next[idx] = (next[idx] % 6) + 1;
      return next;
    });
  };

  const handleBasketClick = () => {
    if (appleBasket <= 0) {
      playSound("synth");
      return;
    }
    playSound("pop");
    const minVal = Math.min(...applesPerDoll);
    const targetIdx = applesPerDoll.indexOf(minVal);
    setApplesPerDoll((prev) => {
      const next = [...prev];
      next[targetIdx] += 1;
      return next;
    });
    setAppleBasket((prev) => prev - 1);
  };

  const handleDollClick = (idx: number) => {
    if (applesPerDoll[idx] <= 0) return;
    playSound("crunch");
    setApplesPerDoll((prev) => {
      const next = [...prev];
      next[idx] -= 1;
      return next;
    });
    setAppleBasket((prev) => prev + 1);
  };

  const handlePizzaClick = (idx: number) => {
    playSound("crunch");
    setPizzaEaten((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const handleTileClick = (idx: number) => {
    playSound("pop");
    setGridTiles((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const activeLesson = LESSONS[activeTab];

  // ── Visual Simulation Renderer ──
  const renderSimulation = () => {
    if (activeTab === "multiplication") {
      const total = candyCounts.reduce((a, b) => a + b, 0);
      const allEqual = candyCounts.every((v) => v === candyCounts[0]);
      return (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="text-center text-[11px] sm:text-xs text-natural-green font-bold bg-natural-green-tint px-4 py-1.5 rounded-full border border-natural-green/20 shadow-xs animate-pulse">
            🍬 {t("simMultiplication.hint")}
          </div>
          <div className="flex flex-wrap justify-center gap-4 py-3 w-full">
            {candyCounts.map((count, idx) => (
              <div
                key={idx}
                onClick={() => handlePlateClick(idx)}
                className="flex flex-col items-center bg-natural-bg p-4 rounded-2xl border-2 border-natural-border min-w-[105px] shadow-xs cursor-pointer select-none relative overflow-hidden transition-all duration-100 hover:scale-105 hover:border-natural-green ease-out active:scale-98"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-natural-green/20" />
                <span className="text-[9px] font-bold text-natural-green uppercase tracking-wider mb-2 bg-natural-green-tint px-2 py-0.5 rounded-full">
                  {t("simMultiplication.plate", { idx: idx + 1 })}
                </span>
                <div className="grid grid-cols-3 gap-1.5 min-h-[42px] items-center">
                  {Array.from({ length: count }).map((_, cIdx) => (
                    <span key={cIdx} className="text-base animate-bounce-y" style={{ animationDelay: `${cIdx * 0.1}s` }}>
                      🍬
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-bold text-natural-charcoal/60 mt-2">{t("simMultiplication.count", { count })}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center bg-natural-bg p-4 rounded-2xl border border-natural-border w-full max-w-md">
            <span className="text-[10px] font-black text-natural-charcoal/65 uppercase tracking-wider block mb-1">
              {t("simMultiplication.additionLabel")}
            </span>
            <p className="text-sm font-semibold text-natural-dark">
              {t("simMultiplication.additionFormula", { result: candyCounts.join(" + "), total })}
            </p>
            {allEqual && (
              <p className="text-xs text-natural-green font-bold mt-2 flex items-center justify-center gap-1.5 bg-natural-green-tint px-3.5 py-1.5 rounded-full w-fit mx-auto border border-natural-green/10">
                <span>{t("simMultiplication.visualLabel")}</span>
                <span className="font-extrabold">{t("simMultiplication.multiplyFormula", { n: candyCounts.length, m: candyCounts[0], total })}</span>
              </p>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "division") {
      const distributed = applesPerDoll.reduce((a, b) => a + b, 0);
      const total = appleBasket + distributed;
      return (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="text-center text-[11px] sm:text-xs text-natural-orange font-bold bg-natural-orange-tint px-4 py-1.5 rounded-full border border-natural-orange/20 shadow-xs animate-pulse">
            🍎 {t("simDivision.hint")}
          </div>
          <div
            onClick={handleBasketClick}
            className="flex flex-col items-center bg-natural-orange-tint p-4 rounded-2xl border border-natural-orange/20 shadow-xs cursor-pointer select-none max-w-xs w-full text-center transition-transform duration-100 hover:scale-105 ease-out active:scale-98"
          >
            <span className="text-[10px] font-bold text-natural-orange uppercase tracking-wider mb-2">
              🧺 {t("simDivision.basket", { n: appleBasket })}
            </span>
            {appleBasket > 0 ? (
              <div className="flex flex-wrap justify-center gap-1.5 py-1">
                {Array.from({ length: appleBasket }).map((_, idx) => (
                  <span key={idx} className="text-lg hover:scale-125 transition-transform">🍎</span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic py-1">{t("simDivision.empty")}</span>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 w-full py-2">
            {applesPerDoll.map((apples, idx) => (
              <div
                key={idx}
                onClick={() => handleDollClick(idx)}
                className="flex flex-col items-center bg-natural-green-tint/50 p-4 rounded-2xl border-2 border-dashed border-natural-green/35 min-w-[105px] cursor-pointer hover:bg-natural-green-tint transition-all duration-100 hover:border-natural-green hover:-translate-y-1 text-center shadow-xs ease-out active:scale-98"
              >
                <span className="text-xs font-bold text-natural-green">🎎 {t("simDivision.doll", { idx: idx + 1 })}</span>
                <div className="flex flex-wrap justify-center items-center gap-1 mt-2 min-h-[30px]">
                  {apples > 0 ? (
                    Array.from({ length: apples }).map((_, aIdx) => (
                      <span key={aIdx} className="text-base">🍎</span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">{t("simDivision.waiting")}</span>
                  )}
                </div>
                <span className="text-[10px] text-natural-green/80 font-bold mt-2 bg-white px-2 py-0.5 rounded-full border border-natural-green/15">
                  {t("simDivision.portion", { n: apples })}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center bg-natural-bg p-3 rounded-xl border border-natural-border w-full max-w-sm">
            <p className="text-xs text-natural-charcoal/80 font-semibold">
              {t("simDivision.status", { total, distributed, basket: appleBasket })}
            </p>
          </div>
        </div>
      );
    }

    if (activeTab === "fraction_basic") {
      const activeSlices = pizzaEaten.filter(Boolean).length;
      const totalSlices = pizzaEaten.length;
      return (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="text-center text-[11px] sm:text-xs text-natural-orange font-bold bg-natural-orange-tint px-4 py-1.5 rounded-full border border-natural-orange/20 shadow-xs animate-pulse">
            🍕 {t("simFraction.hint")}
          </div>
          <div className="relative h-44 w-44 flex items-center justify-center bg-white rounded-full p-2.5 shadow-md">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="41" fill="#FAF9F5" stroke="#E8E6D9" strokeWidth="2" />
              {pizzaEaten.map((isActive, idx) => {
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
                const largeArc = angle > 180 ? 1 : 0;
                return (
                  <path
                    key={idx}
                    d={`M50,50 L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
                    fill={isActive ? "#FF8C42" : "#E8E6D9"}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    onClick={() => handlePizzaClick(idx)}
                    className="cursor-pointer transition-all duration-150 hover:opacity-80"
                    style={{ transformOrigin: "50% 50%" }}
                  />
                );
              })}
            </svg>
            <div className="absolute flex flex-col items-center justify-center bg-white/95 rounded-full h-18 w-18 shadow-md">
              <span className="text-2xl font-black text-natural-orange leading-none">{activeSlices}</span>
              <div className="h-0.5 w-10 bg-natural-border my-1" />
              <span className="text-xl font-black text-natural-dark leading-none">{totalSlices}</span>
            </div>
          </div>
          <div className="flex gap-4 flex-wrap justify-center">
            <span className="text-xs bg-natural-orange-tint border border-natural-orange/20 text-natural-orange px-3.5 py-1.5 rounded-full font-bold shadow-xs">
              🍰 {t("simFraction.eaten", { n: activeSlices })}
            </span>
            <span className="text-xs bg-natural-bg border border-natural-border text-natural-charcoal px-3.5 py-1.5 rounded-full font-bold shadow-xs">
              🎂 {t("simFraction.total", { n: totalSlices })}
            </span>
          </div>
        </div>
      );
    }

    if (activeTab === "perimeter_area_basic") {
      const activeArea = gridTiles.filter(Boolean).length;
      return (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="text-center text-[11px] sm:text-xs text-natural-green font-bold bg-natural-green-tint px-4 py-1.5 rounded-full border border-natural-green/20 shadow-xs animate-pulse">
            🌱 {t("simArea.hint")}
          </div>
          <div className="p-3 bg-natural-bg border border-natural-border rounded-2xl shadow-inner">
            <div className="grid grid-cols-4 gap-1.5">
              {gridTiles.map((isActive, idx) => (
                <div
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  className={`h-11 w-11 rounded border flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-100 hover:scale-110 ease-out shadow-xs active:scale-95 ${
                    isActive
                      ? "bg-natural-green-tint border-natural-green/45 text-natural-green"
                      : "bg-white border-natural-border text-gray-300"
                  }`}
                >
                  {isActive ? "🌱" : idx + 1}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 w-full">
            <div className="bg-natural-green-tint text-natural-green px-3.5 py-1.5 rounded-full border border-natural-green/20 flex items-center gap-1.5 shadow-xs text-xs font-semibold">
              <span>{t("simArea.areaLabel")}</span>
              <span className="font-extrabold text-sm">{activeArea} m²</span>
            </div>
            <div className="bg-natural-bg text-natural-dark px-3.5 py-1.5 rounded-full border border-natural-border flex items-center gap-1.5 shadow-xs text-xs font-semibold">
              <span>{t("simArea.perimeterLabel")}</span>
              <span className="font-extrabold text-sm text-natural-green">{t("simArea.perimeterValue")}</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <section id="hoc-thu" className="py-16 px-4 sm:px-6 lg:px-8 bg-natural-bg border-b border-natural-border">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-3xl font-serif italic font-medium text-natural-dark">
              {t("title")}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-natural-charcoal/80">
              {t("description")}
            </p>
          </div>
        </ScrollReveal>

        {/* Tab Selection */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 bg-white p-1.5 rounded-full border border-natural-border shadow-sm max-w-xl mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                playSound("pop");
                setActiveTab(tab.key);
                resetSandboxState(tab.key);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-tight cursor-pointer transition-all active:scale-97 ${
                activeTab === tab.key
                  ? `${tab.color} text-white shadow-xs`
                  : "text-natural-charcoal hover:bg-natural-bg"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lesson Card */}
        <ScrollReveal animation="scaleIn">
          <div className="rounded-[32px] border border-natural-border bg-white p-6 sm:p-9 shadow-lg relative overflow-hidden text-left">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-natural-green via-natural-orange to-natural-green" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-natural-border pb-5">
              <div>
                <span className="inline-block bg-natural-green-tint text-natural-green text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 border border-natural-green/10">
                  {t("gradeLabel", { grade: activeLesson.grade })}
                </span>
                <h3 className="text-lg sm:text-xl font-serif italic text-natural-dark font-medium leading-tight">
                  {activeLesson.title}
                </h3>
              </div>
              <button
                onClick={() => speakText(activeLesson.shortExplanation)}
                className={`flex items-center gap-1.5 self-start sm:self-center px-4 py-2 rounded-full border border-natural-border text-xs font-bold cursor-pointer transition-all active:scale-97 ${
                  speakingText === activeLesson.shortExplanation
                    ? "bg-natural-orange text-white border-transparent"
                    : "bg-natural-bg text-natural-charcoal/80 hover:bg-natural-bg/90"
                }`}
              >
                <span className="text-sm">🔊</span>
                <span>{speakingText === activeLesson.shortExplanation ? t("ttsPlaying") : t("ttsButton")}</span>
              </button>
            </div>

            {/* Explanation + Visualization */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-5 space-y-4">
                <div className="bg-natural-bg p-4 rounded-2xl border border-natural-border">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">{t("explanationTitle")}</h4>
                  <p className="text-xs sm:text-sm text-natural-charcoal leading-relaxed font-medium">
                    {activeLesson.shortExplanation}
                  </p>
                </div>
                <div className="bg-natural-green-tint/50 p-4 rounded-2xl border border-natural-green/10">
                  <h4 className="text-[10px] font-black uppercase text-natural-green tracking-wider mb-1">{t("visualTitle")}</h4>
                  <p className="text-xs text-natural-charcoal leading-relaxed">{activeLesson.lifeExample}</p>
                </div>
              </div>
              <div className="md:col-span-7 flex items-center justify-center bg-gradient-to-br from-white via-natural-bg to-white p-5 rounded-3xl border border-natural-border/80 min-h-[290px] shadow-inner">
                {renderSimulation()}
              </div>
            </div>

            {/* Practice Question */}
            <div className="mt-9 pt-7 border-t border-natural-border">
              <div className="bg-natural-bg p-5 rounded-2xl border border-natural-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏆</span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t("practiceTitle")}</p>
                </div>
                <p className="text-sm font-semibold text-natural-dark leading-relaxed mb-4">
                  {activeLesson.questionText}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeLesson.options.map((opt, oIdx) => {
                    const isChosen = selectedAnswer === oIdx;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => {
                          setSelectedAnswer(oIdx);
                          setAnswersChecked(true);
                          if (oIdx === activeLesson.correctAnswerIndex) {
                            playSound("correct");
                          } else {
                            playSound("synth");
                          }
                        }}
                        className={`p-3.5 rounded-xl text-left text-xs font-semibold border-2 transition-all cursor-pointer flex items-center justify-between active:scale-98 ${
                          isChosen
                            ? "bg-natural-green-tint border-natural-green text-natural-green"
                            : "bg-white border-natural-border text-natural-charcoal hover:bg-natural-bg"
                        }`}
                      >
                        <span>{opt}</span>
                        {isChosen && (
                          <svg className="h-4 w-4 text-natural-green shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {answersChecked && selectedAnswer !== null && (
                  <div
                    className={`mt-4 p-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                      selectedAnswer === activeLesson.correctAnswerIndex
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    <p className="font-extrabold flex items-center gap-1.5 mb-1 text-sm">
                      <span>
                        {selectedAnswer === activeLesson.correctAnswerIndex
                          ? `🎉 ${t("correctFeedback")}`
                          : `💡 ${t("incorrectFeedback")}`}
                      </span>
                    </p>
                    <p className="leading-relaxed">
                      {selectedAnswer === activeLesson.correctAnswerIndex
                        ? activeLesson.successMessage
                        : activeLesson.failMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
