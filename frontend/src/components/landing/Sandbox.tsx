"use client";

import { useState, useEffect, useCallback } from "react";
import ScrollReveal from "@/components/shared/ScrollReveal";

// ── Types ──
type Domain = "multiplication" | "division" | "fraction_basic" | "perimeter_area_basic";

interface PracticeQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  successMessage: string;
  failMessage: string;
}

interface Lesson {
  domain: Domain;
  title: string;
  grade: number;
  shortExplanation: string;
  lifeExample: string;
  practiceQuestion: PracticeQuestion;
}

// ── Preset Lessons ──
const LESSONS: Record<string, Lesson> = {
  multiplication: {
    domain: "multiplication",
    title: "Phép nhân: 3 đĩa bánh, mỗi đĩa có 4 chiếc bánh kẹo dâu",
    grade: 2,
    shortExplanation:
      "Bản chất phép nhân thực chất chính là việc cộng lặp các nhóm có số lượng hoàn toàn bằng nhau nhiều lần. Thay vì cộng 4 + 4 + 4, bé có thể viết gọn là 3 × 4.",
    lifeExample:
      "Hãy tưởng tượng mẹ chuẩn bị 3 chiếc đĩa sạch sẽ. Trên mỗi đĩa, mẹ xếp đều đặn 4 viên kẹo dâu ngọt ngào. Em đếm xem chúng ta có tổng cộng bao nhiêu viên kẹo nhé!",
    practiceQuestion: {
      questionText:
        "Trong khu vườn gieo hạt, chú Thỏ Nâu trồng 4 luống cà rốt ngọt. Mỗi luống có đúng 5 củ cà rốt tròn mập. Phép tính nhân nào chỉ tổng số củ cà rốt chú Thỏ có?",
      options: ["A. 4 + 5 = 9 củ", "B. 4 × 5 = 20 củ", "C. 5 × 4 = 15 củ", "D. 4 × 5 = 24 củ"],
      correctAnswerIndex: 1,
      successMessage: "Tuyệt vời ông mặt trời! Chú thỏ đã nhổ được 20 củ cà rốt ngon lành đấy!",
      failMessage: "Chưa chính xác rồi bé yêu! Có 4 nhóm (4 luống), mỗi nhóm có 5 củ, ta lấy 4 × 5 = 20 nhé!",
    },
  },
  division: {
    domain: "division",
    title: "Phép chia: Chia đều 12 quả táo đỏ cho 3 bạn búp bê",
    grade: 2,
    shortExplanation:
      "Phép chia chính là việc chúng ta san rộng đều một số lượng đồ vật ban đầu thành các phần bằng nhau, giúp các bạn búp bê ai cũng nhận phần quà như phát đều tay.",
    lifeExample:
      "Bé có 12 quả táo đỏ giòn ngọt. Bé muốn đem chia hoàn toàn công bằng cho 3 búp bê thú bông đáng yêu đứng xếp hàng. Hỏi mỗi bạn được ôm bao nhiêu quả táo nhỉ?",
    practiceQuestion: {
      questionText:
        "Thầy giáo có 15 cuốn vở học tập. Thầy muốn chia đều cho 5 học sinh gương mẫu đạt điểm 10. Hỏi mỗi bạn được thầy tặng cho bao nhiêu cuốn vở?",
      options: ["A. Mỗi bạn được 3 cuốn vở", "B. Mỗi bạn được 5 cuốn vở", "C. Mỗi bạn được 4 cuốn vở", "D. Mỗi bạn được 6 cuốn vở"],
      correctAnswerIndex: 0,
      successMessage: "Chính xác! 15 cuốn chia đều cho 5 bạn thì mỗi bạn ôm trọn 3 cuốn đẹp đẽ!",
      failMessage: "Chưa chính xác đâu bé ơi! Thử lấy 15 chia đều cho 5 nhóm xem, mỗi nhóm sẽ có 3 quyển nhé.",
    },
  },
  fraction_basic: {
    domain: "fraction_basic",
    title: "Phân số: Ăn mất 3 phần trong chiếc bánh Pizza cắt 4 phần",
    grade: 3,
    shortExplanation:
      "Phân số thể hiện lát cắt chia đều của một đồ vật nguyên vẹn. Số ở dưới (mẫu số) là tổng số phần bánh mẹ cắt. Số ở trên (tử số) là số phần bé ăn.",
    lifeExample:
      "Mẹ nướng bánh Pizza dâu tây tuyệt ngon và dùng dao chia đều thành 4 lát bánh. Bé bụng đói đã ăn ngon lành hết 3 lát bánh. Phân số chỉ phần bánh bé ăn chính là 3/4!",
    practiceQuestion: {
      questionText:
        "Một băng giấy dài được chia thành 6 đoạn thẳng bằng nhau như thước đo. Bé Mai tô màu xanh cho 5 đoạn. Phân số nào biểu thị phần băng giấy Mai đã tô màu?",
      options: ["A. 1/6 băng giấy", "B. 5/6 băng giấy", "C. 6/5 băng giấy", "D. 5/5 băng giấy"],
      correctAnswerIndex: 1,
      successMessage: "Quá xuất sắc! Số mảnh tô màu là 5 nằm ở trên, tổng số mảnh chia 6 nằm ở dưới tạo thành 5/6!",
      failMessage: "Opps! Nhớ rằng số phần được chọn nằm ở trên tử số nhé, còn tổng số phần ở dưới mẫu số.",
    },
  },
  perimeter_area_basic: {
    domain: "perimeter_area_basic",
    title: "Diện tích và Chu vi: Mảnh vườn lưới dài 4m và rộng 3m",
    grade: 4,
    shortExplanation:
      "Chu vi chính là tổng độ dài bức rào chắn viền xung quanh mép nhà. Còn Diện tích là toàn bộ phần đất phẳng xanh rì bên trong được lát kín bằng những ô cỏ mầm tây.",
    lifeExample:
      "Bố rào quanh một mảnh vườn nhỏ có chiều dài 4 mét và chiều rộng 3 mét để bé trồng hoa cỏ dại. Diện tích gieo hạt là 12 mét vuông, còn chu vi hàng rào là 14 mét.",
    practiceQuestion: {
      questionText:
        "Mẹ tặng bé một tấm thảm học tập hình chữ nhật có chiều dài 5dm và chiều rộng 4dm. Hãy tính chu vi và diện tích chiếc thảm này giúp mẹ nhé!",
      options: [
        "A. Chu vi: 18dm | Diện tích: 20dm²",
        "B. Chu vi: 9dm | Diện tích: 20dm²",
        "C. Chu vi: 20dm | Diện tích: 9dm²",
        "D. Chu vi: 18dm | Diện tích: 18dm²",
      ],
      correctAnswerIndex: 0,
      successMessage: "Đúng rồi bé ơi! Diện tích = 5 × 4 = 20dm². Chu vi = (5 + 4) × 2 = 18dm.",
      failMessage: "Hơi nhầm một xíu rồi! Diện tích bằng Dài nhân Rộng (5 × 4), còn Chu vi bằng Dài cộng Rộng nhân đôi ((5 + 4) × 2) đó.",
    },
  },
};

const TABS: { key: Domain; label: string; color: string }[] = [
  { key: "multiplication", label: "🍬 Phép nhân (Lớp 2)", color: "bg-natural-green" },
  { key: "division", label: "🍎 Phép chia (Lớp 2)", color: "bg-natural-orange" },
  { key: "fraction_basic", label: "🍕 Phân số (Lớp 3)", color: "bg-natural-orange" },
  { key: "perimeter_area_basic", label: "🌱 Diện tích (Lớp 4)", color: "bg-natural-green" },
];

// ── Sound Effects ──
function playSound(type: "pop" | "crunch" | "correct" | "synth") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();

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
  const [activeTab, setActiveTab] = useState<Domain>("multiplication");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answersChecked, setAnswersChecked] = useState(false);

  // Sandbox states
  const [candyCounts, setCandyCounts] = useState([4, 4, 4]);
  const [appleBasket, setAppleBasket] = useState(3);
  const [applesPerDoll, setApplesPerDoll] = useState([3, 3, 3]);
  const [pizzaEaten, setPizzaEaten] = useState([true, true, true, false]);
  const [gridTiles, setGridTiles] = useState<boolean[]>(Array(12).fill(true));

  // TTS
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const speakText = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      if (speakingText === text) {
        setSpeakingText(null);
        return;
      }
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "vi-VN";
      utter.rate = 0.95;
      utter.onend = () => setSpeakingText(null);
      setSpeakingText(text);
      window.speechSynthesis.speak(utter);
    },
    [speakingText]
  );

  // Reset on tab change
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswersChecked(false);
    if (activeTab === "multiplication") setCandyCounts([4, 4, 4]);
    else if (activeTab === "division") {
      setApplesPerDoll([3, 3, 3]);
      setAppleBasket(3);
    } else if (activeTab === "fraction_basic") setPizzaEaten([true, true, true, false]);
    else if (activeTab === "perimeter_area_basic") setGridTiles(Array(12).fill(true));
  }, [activeTab]);

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
            🍬 Chạm vào từng đĩa để thay đổi số kẹo (từ 1 đến 6 viên)
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
                  Đĩa {idx + 1}
                </span>
                <div className="grid grid-cols-3 gap-1.5 min-h-[42px] items-center">
                  {Array.from({ length: count }).map((_, cIdx) => (
                    <span key={cIdx} className="text-base animate-bounce-y" style={{ animationDelay: `${cIdx * 0.1}s` }}>
                      🍬
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-bold text-natural-charcoal/60 mt-2">{count} viên</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center bg-natural-bg p-4 rounded-2xl border border-natural-border w-full max-w-md">
            <span className="text-[10px] font-black text-natural-charcoal/65 uppercase tracking-wider block mb-1">
              Công thức cộng dồn của em:
            </span>
            <p className="text-sm font-semibold text-natural-dark">
              Phép tính cộng: {candyCounts.join(" + ")} = <span className="text-natural-green font-black text-base">{total}</span> viên
            </p>
            {allEqual && (
              <p className="text-xs text-natural-green font-bold mt-2 flex items-center justify-center gap-1.5 bg-natural-green-tint px-3.5 py-1.5 rounded-full w-fit mx-auto border border-natural-green/10">
                <span>Trực quan hóa phép nhân:</span>
                <span className="font-extrabold">{candyCounts.length} đĩa × {candyCounts[0]} kẹo = {total} viên</span>
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
            🍎 Lấy táo trong giỏ phân bổ cho búp bê, chạm búp bê để thu hồi táo về giỏ!
          </div>
          <div
            onClick={handleBasketClick}
            className="flex flex-col items-center bg-natural-orange-tint p-4 rounded-2xl border border-natural-orange/20 shadow-xs cursor-pointer select-none max-w-xs w-full text-center transition-transform duration-100 hover:scale-105 ease-out active:scale-98"
          >
            <span className="text-[10px] font-bold text-natural-orange uppercase tracking-wider mb-2">
              🧺 Giỏ táo lớn của em ({appleBasket} quả)
            </span>
            {appleBasket > 0 ? (
              <div className="flex flex-wrap justify-center gap-1.5 py-1">
                {Array.from({ length: appleBasket }).map((_, idx) => (
                  <span key={idx} className="text-lg hover:scale-125 transition-transform">🍎</span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic py-1">Hết táo trong giỏ rồi!</span>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 w-full py-2">
            {applesPerDoll.map((apples, idx) => (
              <div
                key={idx}
                onClick={() => handleDollClick(idx)}
                className="flex flex-col items-center bg-natural-green-tint/50 p-4 rounded-2xl border-2 border-dashed border-natural-green/35 min-w-[105px] cursor-pointer hover:bg-natural-green-tint transition-all duration-100 hover:border-natural-green hover:-translate-y-1 text-center shadow-xs ease-out active:scale-98"
              >
                <span className="text-xs font-bold text-natural-green">🎎 Búp bê {idx + 1}</span>
                <div className="flex flex-wrap justify-center items-center gap-1 mt-2 min-h-[30px]">
                  {apples > 0 ? (
                    Array.from({ length: apples }).map((_, aIdx) => (
                      <span key={aIdx} className="text-base">🍎</span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">Đang chờ...</span>
                  )}
                </div>
                <span className="text-[10px] text-natural-green/80 font-bold mt-2 bg-white px-2 py-0.5 rounded-full border border-natural-green/15">
                  Phần ăn: {apples} quả
                </span>
              </div>
            ))}
          </div>
          <div className="text-center bg-natural-bg p-3 rounded-xl border border-natural-border w-full max-w-sm">
            <p className="text-xs text-natural-charcoal/80 font-semibold">
              Tổng số táo: <span className="text-natural-orange font-black">{total} quả</span> | Đã chia: {distributed} quả | Còn dư: {appleBasket} quả
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
            🍕 Chạm vào từng phần bánh để &quot;ăn&quot; hoặc &quot;trả lại&quot; nhé!
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
              🍰 Đã ăn: {activeSlices} phần bánh
            </span>
            <span className="text-xs bg-natural-bg border border-natural-border text-natural-charcoal px-3.5 py-1.5 rounded-full font-bold shadow-xs">
              🎂 Cả đĩa: {totalSlices} miếng bằng nhau
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
            🌱 Chạm vào từng ô vuông để &quot;gieo cỏ xanh&quot; hoặc &quot;thu hoạch xới đất&quot;
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
              <span>Diện tích =</span>
              <span className="font-extrabold text-sm">{activeArea} m²</span>
            </div>
            <div className="bg-natural-bg text-natural-dark px-3.5 py-1.5 rounded-full border border-natural-border flex items-center gap-1.5 shadow-xs text-xs font-semibold">
              <span>Chu vi = (4 + 3) × 2 =</span>
              <span className="font-extrabold text-sm text-natural-green">14 mét</span>
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
              Phòng mô phỏng trực quan 💡
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-natural-charcoal/80">
              Chọn một chủ đề Toán tiểu học bên dưới để trực tiếp chạm chuột gieo hạt, bốc kẹo, chia táo
              xem công thức thay đổi tức thì nhé!
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
                  Lớp {activeLesson.grade} • Toán Học Bản Chất
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
                <span>{speakingText === activeLesson.shortExplanation ? "Đang đọc..." : "Nghe cô giảng bài"}</span>
              </button>
            </div>

            {/* Explanation + Visualization */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-5 space-y-4">
                <div className="bg-natural-bg p-4 rounded-2xl border border-natural-border">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Trích bài giảng:</h4>
                  <p className="text-xs sm:text-sm text-natural-charcoal leading-relaxed font-medium">
                    {activeLesson.shortExplanation}
                  </p>
                </div>
                <div className="bg-natural-green-tint/50 p-4 rounded-2xl border border-natural-green/10">
                  <h4 className="text-[10px] font-black uppercase text-natural-green tracking-wider mb-1">Ẩn dụ trực quan:</h4>
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
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Bé thử ôn tập thực hành:</p>
                </div>
                <p className="text-sm font-semibold text-natural-dark leading-relaxed mb-4">
                  {activeLesson.practiceQuestion.questionText}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeLesson.practiceQuestion.options.map((opt, oIdx) => {
                    const isChosen = selectedAnswer === oIdx;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => {
                          setSelectedAnswer(oIdx);
                          setAnswersChecked(true);
                          if (oIdx === activeLesson.practiceQuestion.correctAnswerIndex) {
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
                      selectedAnswer === activeLesson.practiceQuestion.correctAnswerIndex
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    <p className="font-extrabold flex items-center gap-1.5 mb-1 text-sm">
                      <span>
                        {selectedAnswer === activeLesson.practiceQuestion.correctAnswerIndex
                          ? "🎉 Bé làm xuất sắc!"
                          : "💡 Động viên bé nghĩ lại:"}
                      </span>
                    </p>
                    <p className="leading-relaxed">
                      {selectedAnswer === activeLesson.practiceQuestion.correctAnswerIndex
                        ? activeLesson.practiceQuestion.successMessage
                        : activeLesson.practiceQuestion.failMessage}
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
