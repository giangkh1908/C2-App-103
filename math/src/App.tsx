import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  BrainCircuit, 
  Smile, 
  Volume2, 
  CheckCircle, 
  ChevronDown, 
  RotateCcw, 
  BookOpen, 
  MessageCircle, 
  Plus, 
  Minus,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- SELF-CONTAINED MATHEMATICAL PRESET LESSONS ---
interface PracticeQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  successMessage: string;
  failMessage: string;
  hint: string;
}

interface VisualData {
  type: 'candy' | 'apple' | 'pizza' | 'grid';
  primaryCount: number;
  secondaryCount: number;
  totalCount: number;
}

interface MathLesson {
  domain: 'multiplication' | 'division' | 'fraction_basic' | 'perimeter_area_basic';
  concept: string;
  title: string;
  grade: number;
  shortExplanation: string;
  lifeExample: string;
  visualData: VisualData;
  practiceQuestion: PracticeQuestion;
}

const PRESET_LESSONS: Record<string, MathLesson> = {
  multiplication: {
    domain: 'multiplication',
    concept: '3 x 4',
    title: 'Phép nhân: 3 đĩa bánh, mỗi đĩa có 4 chiếc bánh kẹo dâu',
    grade: 2,
    shortExplanation: 'Bản chất phép nhân thực chất chính là việc cộng lặp các nhóm có số lượng hoàn toàn bằng nhau nhiều lần. Thay vì cộng 4 + 4 + 4, bé có thể viết gọn là 3 × 4.',
    lifeExample: 'Hãy tưởng tượng mẹ chuẩn bị 3 chiếc đĩa sạch sẽ. Trên mỗi đĩa, mẹ xếp đều đặn 4 viên kẹo dâu ngọt ngào. Em đếm xem chúng ta có tổng cộng bao nhiêu viên kẹo nhé!',
    visualData: {
      type: 'candy',
      primaryCount: 3,
      secondaryCount: 4,
      totalCount: 12
    },
    practiceQuestion: {
      id: 'mult_1',
      questionText: 'Trong khu vườn gieo hạt, chú Thỏ Nâu trồng 4 luống cà rốt ngọt. Mỗi luống có đúng 5 củ cà rốt tròn mập. Phép tính nhân nào chỉ tổng số củ cà rốt chú Thỏ có?',
      options: [
        'A. 4 + 5 = 9 củ',
        'B. 4 × 5 = 20 củ',
        'C. 5 × 4 = 15 củ',
        'D. 4 × 5 = 24 củ'
      ],
      correctAnswerIndex: 1,
      successMessage: 'Tuyệt vời ông mặt trời! Chú thỏ đã nhổ được 20 củ cà rốt ngon lành đấy!',
      failMessage: 'Chưa chính xác rồi bé yêu! Có 4 nhóm (4 luống), mỗi nhóm có 5 củ, ta lấy 5 cộng với chính nó 4 lần hay 4 × 5 = 20 nhé!',
      hint: 'Lấy số luống đất nhân với số củ cà rốt trên mỗi luống bé nhé.'
    }
  },
  division: {
    domain: 'division',
    concept: '12 : 3',
    title: 'Phép chia: Chia đều 12 quả táo đỏ cho 3 bạn búp bê',
    grade: 2,
    shortExplanation: 'Phép chia chính là việc chúng ta san rộng đều một số lượng đồ vật ban đầu thành các phần bằng nhau, giúp các bạn búp bê ai cũng nhận phần quà như phát đều tay.',
    lifeExample: 'Bé có 12 quả táo đỏ giòn ngọt. Bé muốn đem chia hoàn toàn công bằng cho 3 búp bê thú bông đáng yêu đứng xếp hàng. Hỏi mỗi bạn được ôm bao nhiêu quả táo nhỉ?',
    visualData: {
      type: 'apple',
      primaryCount: 12,
      secondaryCount: 3,
      totalCount: 4
    },
    practiceQuestion: {
      id: 'div_1',
      questionText: 'Thầy giáo có 15 cuốn vở học tập. Thầy muốn chia đều cho 5 học sinh gương mẫu đạt điểm 10. Hỏi mỗi bạn được thầy tặng cho bao nhiêu cuốn vở?',
      options: [
        'A. Mỗi bạn được 3 cuốn vở',
        'B. Mỗi bạn được 5 cuốn vở',
        'C. Mỗi bạn được 4 cuốn vở',
        'D. Mỗi bạn được 6 cuốn vở'
      ],
      correctAnswerIndex: 0,
      successMessage: 'Chính xác! 15 cuốn chia đều cho 5 bạn thì mỗi bạn ôm trọn 3 cuốn đẹp đẽ!',
      failMessage: 'Chưa chính xác đâu bé ơi! Thử lấy 15 chia đều cho 5 nhóm xem, mỗi nhóm sẽ có 3 quyển nhé.',
      hint: 'Lấy tổng số cuốn vở (15) đem chia cho tổng số bạn nhỏ (5).'
    }
  },
  fraction_basic: {
    domain: 'fraction_basic',
    concept: '3 / 4',
    title: 'Phân số: Ăn mất 3 phần trong chiếc bánh Pizza cắt 4 phần',
    grade: 3,
    shortExplanation: 'Phân số thể hiện lát cắt chia đều của một đồ vật nguyên vẹn. Số ở dưới (mẫu số) là tổng số phần bánh mẹ cắt. Số ở trên (tử số) là số phần bé ăn mọc dâu tây.',
    lifeExample: 'Mẹ nướng bánh Pizza dâu tây tuyệt ngon và dùng dao chia đều thành 4 lát bánh. Bé bụng đói đã ăn ngon lành hết 3 lát bánh. Phân số chỉ phần bánh bé ăn chính là 3/4!',
    visualData: {
      type: 'pizza',
      primaryCount: 3,
      secondaryCount: 4,
      totalCount: 0.75
    },
    practiceQuestion: {
      id: 'frac_1',
      questionText: 'Một băng giấy dài được chia thành 6 đoạn thẳng bằng nhau như thước đo. Bé Mai tô màu xanh cho 5 đoạn. Phân số nào biểu thị phần băng giấy Mai đã tô màu?',
      options: [
        'A. 1/6 băng giấy',
        'B. 5/6 băng giấy',
        'C. 6/5 băng giấy',
        'D. 5/5 băng giấy'
      ],
      correctAnswerIndex: 1,
      successMessage: 'Quá xuất sắc! Số mảnh tô màu là 5 nằm ở trên, tổng số mảnh chia 6 nằm ở dưới tạo thành 5/6!',
      failMessage: 'Opps! Nhớ rằng số phần được chọn nằm ở trên tử số nhé, còn tổng số phần ở dưới mẫu số.',
      hint: 'Đếm số phần được tô màu xanh (5) trên tổng số phần bằng nhau (6).'
    }
  },
  perimeter_area_basic: {
    domain: 'perimeter_area_basic',
    concept: '4 x 3',
    title: 'Diện tích và Chu vi: Mảnh vườn lưới dài 4m và rộng 3m',
    grade: 4,
    shortExplanation: 'Chu vi chính là tổng độ dài bức rào chắn viền xung quanh mép nhà. Còn Diện tích là toàn bộ phần đất phẳng xanh rì bên trong được lát kín bằng những ô cỏ mầm tây.',
    lifeExample: 'Bố rào quanh một mảnh vườn nhỏ có chiều dài 4 mét và chiều rộng 3 mét để bé trồng hoa cỏ dại. Diện tích gieo hạt là 12 mét vuông, còn chu vi hàng rào là 14 mét.',
    visualData: {
      type: 'grid',
      primaryCount: 4,
      secondaryCount: 3,
      totalCount: 12
    },
    practiceQuestion: {
      id: 'peri_1',
      questionText: 'Mẹ tặng bé một tấm thảm học tập hình chữ nhật có chiều dài 5dm và chiều rộng 4dm. Hãy tính chu vi và diện tích chiếc thảm này giúp mẹ nhé!',
      options: [
        'A. Chu vi: 18dm | Diện tích: 20dm²',
        'B. Chu vi: 9dm | Diện tích: 20dm²',
        'C. Chu vi: 20dm | Diện tích: 9dm²',
        'D. Chu vi: 18dm | Diện tích: 18dm²'
      ],
      correctAnswerIndex: 0,
      successMessage: 'Đúng rồi bé ơi! Diện tích = 5 x 4 = 20dm². Chu vi = (5 + 4) x 2 = 18dm.',
      failMessage: 'Hơi nhầm một xíu rồi! Diện tích bằng Dài nhân Rộng (5 × 4), còn Chu vi bằng Dài cộng Rộng nhân đôi ((5 + 4) × 2) đó.',
      hint: 'Công thức diện tích chữ nhật: Dài × Rộng. Công thức chu vi: (Dài + Rộng) × 2.'
    }
  }
};

export default function App() {
  // Navigation scrolling script
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // State managers
  const [activeTab, setActiveTab] = useState<'multiplication' | 'division' | 'fraction_basic' | 'perimeter_area_basic'>('multiplication');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answersChecked, setAnswersChecked] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Kids Interactive Playground Dynamic Sandbox variables
  const [candyCounts, setCandyCounts] = useState<number[]>([4, 4, 4]); // 3 plates with candies
  const [appleBasket, setAppleBasket] = useState<number>(3); // Redundant apples in division helper
  const [applesPerDoll, setApplesPerDoll] = useState<number[]>([3, 3, 3]); // Friends share
  const [pizzaEaten, setPizzaEaten] = useState<boolean[]>([true, true, true, false]); // Fractional state
  const [gridTiles, setGridTiles] = useState<boolean[]>(Array(12).fill(true)); // soil seedlings state

  // Sync state whenever the subject tab switches
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswersChecked(false);
    
    // Reset kids sandbox values
    if (activeTab === 'multiplication') {
      setCandyCounts([4, 4, 4]);
    } else if (activeTab === 'division') {
      setApplesPerDoll([3, 3, 3]);
      setAppleBasket(3);
    } else if (activeTab === 'fraction_basic') {
      setPizzaEaten([true, true, true, false]);
    } else if (activeTab === 'perimeter_area_basic') {
      setGridTiles(Array(12).fill(true));
    }
  }, [activeTab]);

  // Singleton AudioContext — tránh rò rỉ bộ nhớ khi tạo mới mỗi lần phát âm thanh
  const getSharedAudioContext = (): AudioContext | null => {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!(window as any).__mathAudioCtx || (window as any).__mathAudioCtx.state === 'closed') {
      (window as any).__mathAudioCtx = new Ctor();
    }
    if ((window as any).__mathAudioCtx.state === 'suspended') {
      (window as any).__mathAudioCtx.resume();
    }
    return (window as any).__mathAudioCtx as AudioContext;
  };

  // Synthesizes charming children audio feedback
  const playSoundEffect = (type: 'pop' | 'crunch' | 'correct' | 'win' | 'synth') => {
    try {
      const ctx = getSharedAudioContext();
      if (!ctx) return;

      if (type === 'pop') {
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
      } else if (type === 'crunch') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'correct') {
        const notes = [261.63, 329.63, 392.00, 523.25]; // C major chime
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
          gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.2);
          osc.start(ctx.currentTime + idx * 0.05);
          osc.stop(ctx.currentTime + idx * 0.05 + 0.2);
        });
      } else if (type === 'synth') {
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
    } catch (e) {
      // Audio sandbox safeguard
    }
  };

  // Speak-aloud TTS assistant block — dùng ref để tránh stale closure
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const speakingTextRef = useRef<string | null>(null);

  useEffect(() => {
    speakingTextRef.current = speakingText;
  }, [speakingText]);

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.cancel();

    if (speakingTextRef.current === text) {
      setSpeakingText(null);
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'vi-VN';
    utter.rate = 0.95;
    utter.onend = () => setSpeakingText(null);
    setSpeakingText(text);
    synth.speak(utter);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Handle tactile sandbox element updates
  const handlePlateCandyClick = (pIdx: number) => {
    playSoundEffect('pop');
    setCandyCounts(prev => {
      const next = [...prev];
      // cycle from 1 to 6 sweets
      next[pIdx] = (next[pIdx] % 6) + 1;
      return next;
    });
  };

  const handleMainAppleClick = () => {
    if (appleBasket <= 0) {
      playSoundEffect('synth');
      return;
    }
    playSoundEffect('pop');
    // Distribute evenly to the doll box has the minimum amount
    const minVal = Math.min(...applesPerDoll);
    const targetIdx = applesPerDoll.indexOf(minVal);
    if (targetIdx !== -1) {
      setApplesPerDoll(prev => {
        const next = [...prev];
        next[targetIdx] += 1;
        return next;
      });
      setAppleBasket(prev => prev - 1);
    }
  };

  const handleDollAppleClick = (dIdx: number) => {
    if (applesPerDoll[dIdx] <= 0) return;
    playSoundEffect('crunch');
    setApplesPerDoll(prev => {
      const next = [...prev];
      next[dIdx] -= 1;
      return next;
    });
    setAppleBasket(prev => prev + 1);
  };

  const handlePizzaClick = (sIdx: number) => {
    playSoundEffect('crunch');
    setPizzaEaten(prev => {
      const next = [...prev];
      next[sIdx] = !next[sIdx];
      return next;
    });
  };

  const handleSoilTileClick = (tIdx: number) => {
    playSoundEffect('pop');
    setGridTiles(prev => {
      const next = [...prev];
      next[tIdx] = !next[tIdx];
      return next;
    });
  };

  // Render mathematical widgets in live demonstrator
  const renderVisualSimulation = () => {
    if (activeTab === 'multiplication') {
      const totalCandies = candyCounts.reduce((a, b) => a + b, 0);
      const allEqual = candyCounts.every(val => val === candyCounts[0]);
      
      return (
        <div className="flex flex-col items-center gap-4.5 w-full">
          <div className="text-center text-[11px] sm:text-xs text-[#4A6741] font-bold bg-[#E9F0E6] px-4 py-1.5 rounded-full border border-[#4A6741]/20 shadow-xs animate-pulse">
            🍬 Chạm vào từng đĩa để thay đổi số kẹo (từ 1 đến 6 viên kẹo dâu)
          </div>

          <div className="flex flex-wrap justify-center gap-4 py-3.5 w-full">
            {candyCounts.map((count, idx) => (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlateCandyClick(idx)}
                className="flex flex-col items-center bg-[#FAF9F5] p-4.5 rounded-2.5xl border-2 border-[#E8E6D9] min-w-[105px] shadow-xs cursor-pointer select-none relative group overflow-hidden transition-all duration-100 hover:scale-105 hover:border-[#4A6741] ease-out"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[#4A6741]/20" />
                <span className="text-[9px] font-bold text-[#4A6741] uppercase tracking-wider mb-2 bg-[#E9F0E6] px-2 py-0.5 rounded-full">Đĩa {idx + 1}</span>
                
                <div className="grid grid-cols-3 gap-1.5 min-h-[42px] items-center">
                  {Array.from({ length: count }).map((_, cIdx) => (
                    <motion.div
                      key={cIdx}
                      animate={{ y: [0, -2, 0], rotate: [0, 6, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 2 + (cIdx % 2) * 0.4 }}
                      className="text-base"
                    >
                      🍬
                    </motion.div>
                  ))}
                </div>
                
                <span className="text-[10px] font-bold text-[#3D3B37]/60 mt-2.5">{count} viên</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-2 text-center bg-[#FAF9F5] p-4 rounded-2xl border border-[#E8E6D9] w-full max-w-md">
            <span className="text-[10px] font-black text-[#3D3B37]/65 uppercase tracking-wider block mb-1">Công thức cộng dồn của em:</span>
            <p className="text-sm font-semibold text-[#2D2A26]">
              Phép tính cộng: {candyCounts.join(' + ')} = <span className="text-[#4A6741] font-black text-base">{totalCandies}</span> viên
            </p>
            {allEqual && (
              <p className="text-xs text-[#4A6741] font-bold mt-2 flex items-center justify-center gap-1.5 bg-[#E9F0E6] px-3.5 py-1.5 rounded-full w-fit mx-auto border border-[#4A6741]/10">
                <span>Trực quan hóa phép nhân:</span>
                <span className="font-extrabold">{candyCounts.length} đĩa × {candyCounts[0]} kẹo = {totalCandies} viên</span>
              </p>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'division') {
      const distributedCount = applesPerDoll.reduce((a, b) => a + b, 0);
      const totalApples = appleBasket + distributedCount;

      return (
        <div className="flex flex-col items-center gap-4.5 w-full">
          <div className="text-center text-[11px] sm:text-xs text-[#FF8C42] font-bold bg-[#FFF4E5] px-4 py-1.5 rounded-full border border-[#FF8C42]/20 shadow-xs animate-pulse">
            🍎 Lấy táo trong giỏ phân bổ cho búp bê, chạm búp bê để thu hồi táo về giỏ!
          </div>

          {/* Main apple basket */}
          <motion.div
            onClick={handleMainAppleClick}
            className="flex flex-col items-center bg-[#FFF4E5] p-4.5 rounded-2.5xl border border-[#FF8C42]/20 shadow-xs cursor-pointer select-none max-w-xs w-full text-center transition-transform duration-100 hover:scale-105 ease-out"
          >
            <span className="text-[10px] font-bold text-[#FF8C42] uppercase tracking-wider mb-2">🧺 Giỏ táo lớn của em ({appleBasket} quả)</span>
            {appleBasket > 0 ? (
              <div className="flex flex-wrap justify-center gap-1.5 py-1">
                {Array.from({ length: appleBasket }).map((_, idx) => (
                  <span key={idx} className="text-lg hover:scale-120 transition-transform">🍎</span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic py-1">Hết táo hồng ngọt ngào trong giỏ rồi!</span>
            )}
          </motion.div>

          {/* Share doll boxes */}
          <div className="flex flex-wrap justify-center gap-4 w-full py-2">
            {applesPerDoll.map((apples, idx) => (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDollAppleClick(idx)}
                className="flex flex-col items-center bg-[#E9F0E6]/50 p-4 rounded-2.5xl border-2 border-dashed border-[#4A6741]/35 min-w-[105px] cursor-pointer hover:bg-[#E9F0E6] transition-all duration-100 hover:border-[#4A6741] hover:-translate-y-1 text-center shadow-2xs ease-out"
              >
                <span className="text-xs font-bold text-[#4A6741]">🎎 Búp bê {idx + 1}</span>
                <div className="flex flex-wrap justify-center items-center gap-1 mt-2.5 min-h-[30px]">
                  {apples > 0 ? (
                    Array.from({ length: apples }).map((_, aIdx) => (
                      <span key={aIdx} className="text-md">🍎</span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">Đang chờ...</span>
                  )}
                </div>
                <span className="text-[10px] text-[#4A6741]/80 font-bold mt-2 bg-white px-2 py-0.5 rounded-full border border-[#4A6741]/15">Phần ăn: {apples} quả</span>
              </motion.div>
            ))}
          </div>

          <div className="text-center bg-[#FAF9F5] p-3 rounded-xl border border-[#E8E6D9] w-full max-w-sm">
            <p className="text-xs text-[#3D3B37]/80 font-semibold">
              Tổng số táo: <span className="text-[#FF8C42] font-black">{totalApples} quả</span> | Đã chia: {distributedCount} quả | Còn dư: {appleBasket} quả
            </p>
          </div>
        </div>
      );
    }

    if (activeTab === 'fraction_basic') {
      const activeSlices = pizzaEaten.filter(Boolean).length;
      const totalSlices = pizzaEaten.length;

      return (
        <div className="flex flex-col items-center gap-4.5 w-full">
          <div className="text-center text-[11px] sm:text-xs text-[#FF8C42] font-bold bg-[#FFF4E5] px-4 py-1.5 rounded-full border border-[#FF8C42]/20 shadow-xs animate-pulse">
            🍕 Chạm vào từng phần bánh để &quot;ăn&quot; hoặc &quot;trả lại&quot; bánh mỳ dâu nhé!
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

                const largeArcFlag = angle > 180 ? 1 : 0;
                const pathData = `M50,50 L${x1},${y1} A${r},${r} 0 ${largeArcFlag},1 ${x2},${y2} Z`;

                return (
                  <motion.path
                    key={idx}
                    d={pathData}
                    fill={isActive ? '#FF8C42' : '#E8E6D9'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    whileHover={{ scale: 1.04, fill: isActive ? '#FF7A29' : '#EDEBE0' }}
                    onClick={() => handlePizzaClick(idx)}
                    style={{ originX: '50%', originY: '50%', cursor: 'pointer' }}
                  />
                );
              })}
            </svg>

            <div className="absolute flex flex-col items-center justify-center bg-white/95 rounded-full h-18 w-18 shadow-md">
              <span className="text-2xl font-black text-[#FF8C42] leading-none">{activeSlices}</span>
              <div className="h-0.5 w-10 bg-[#E8E6D9] my-1" />
              <span className="text-xl font-black text-[#2D2A26] leading-none">{totalSlices}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-xs bg-[#FFF4E5] border border-[#FF8C42]/20 text-[#FF8C42] px-3.5 py-1.5 rounded-full font-bold shadow-2xs">
              🍰 Đã khoanh tô màu ăn: {activeSlices} phần bánh
            </span>
            <span className="text-xs bg-[#FAF9F5] border border-[#E8E6D9] text-[#3D3B37] px-3.5 py-1.5 rounded-full font-bold shadow-2xs">
              🎂 Cả đĩa bánh nguyên: {totalSlices} miếng bằng nhau
            </span>
          </div>
        </div>
      );
    }

    if (activeTab === 'perimeter_area_basic') {
      const activeArea = gridTiles.filter(Boolean).length;
      const width = 4;
      const height = 3;

      return (
        <div className="flex flex-col items-center gap-4.5 w-full">
          <div className="text-center text-[11px] sm:text-xs text-[#4A6741] font-bold bg-[#E9F0E6] px-4 py-1.5 rounded-full border border-[#4A6741]/20 shadow-xs animate-pulse">
            🌱 Chạm vào từng ô vuông để &quot;gieo cỏ xanh&quot; hoặc &quot;thu hoạch xới đất&quot;
          </div>

          <div className="p-3 bg-[#FAF9F5] border border-[#E8E6D9] rounded-2xl shadow-inner">
            <div className="grid grid-cols-4 gap-1.5">
              {gridTiles.map((isActive, idx) => (
                <motion.div
                  key={idx}
                  onClick={() => handleSoilTileClick(idx)}
                  className={`h-11 w-11 rounded border flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-100 hover:scale-110 ease-out shadow-2xs ${
                    isActive 
                      ? 'bg-[#E9F0E6] border-[#4A6741]/45 text-[#4A6741]' 
                      : 'bg-white border-[#E8E6D9] text-gray-300'
                  }`}
                >
                  {isActive ? '🌱' : idx + 1}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 w-full">
            <div className="bg-[#E9F0E6] text-[#4A6741] px-3.5 py-1.5 rounded-full border border-[#4A6741]/20 flex items-center gap-1.5 shadow-2xs text-xs font-semibold">
              <span>Diện tích (số ô đã lợp cỏ) =</span>
              <span className="font-extrabold text-sm text-[#4A6741]">{activeArea} m²</span>
            </div>
            <div className="bg-[#FAF9F5] text-[#2D2A26] px-3.5 py-1.5 rounded-full border border-[#E8E6D9] flex items-center gap-1.5 shadow-2xs text-xs font-semibold">
              <span>Chu vi bảo vệ hàng rào = (Dài 4 + Rộng 3) × 2 =</span>
              <span className="font-extrabold text-sm text-[#4A6741]">14 mét</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const activeLesson = PRESET_LESSONS[activeTab];

  return (
    <div className="min-h-screen bg-[#FAF9F5] font-sans text-[#3D3B37] antialiased selection:bg-[#4A6741] selection:text-white">
      
      {/* 1. STICKY BRAND HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E8E6D9] py-3.5 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <div className="h-9 w-9 rounded-xl bg-[#4A6741] flex items-center justify-center text-white font-serif font-black shadow-md shadow-[#4A6741]/10">
              T
            </div>
            <div>
              <span className="font-serif italic font-bold text-lg text-[#2D2A26] tracking-tight block leading-none">Toán Trực Quan AI</span>
              <span className="text-[9px] font-bold text-[#4A6741] tracking-widest block mt-0.5 uppercase">Visual Tutor Helper</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-bold text-[#3D3B37]/80">
            <button onClick={() => scrollToSection('loi-ich')} className="hover:text-[#4A6741] transition-colors cursor-pointer">Lợi ích cốt lõi</button>
            <button onClick={() => scrollToSection('hoc-thu')} className="hover:text-[#4A6741] transition-colors cursor-pointer">Mô phỏng học thử</button>
            <button onClick={() => scrollToSection('lo-trinh')} className="hover:text-[#4A6741] transition-colors cursor-pointer">Lộ trình lớp 1-5</button>
            <button onClick={() => scrollToSection('cau-hoi')} className="hover:text-[#4A6741] transition-colors cursor-pointer">Câu hỏi thường gặp</button>
          </nav>

          <button
            onClick={() => scrollToSection('hoc-thu')}
            className="rounded-full bg-[#4A6741] hover:bg-[#3D5435] transition-all text-white font-bold text-xs py-2.5 px-5 cursor-pointer shadow-md shadow-[#4A6741]/5 active:scale-97"
          >
            Học thử ngay
          </button>
        </div>
      </header>

      {/* 2. HEADLINE & CORE HERO BLOCK */}
      <section id="hero" className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#E8E6D9]">
        {/* Decorative elements */}
        <div className="absolute top-12 right-12 -z-10 h-72 w-72 rounded-full bg-[#E9F0E6] opacity-60 blur-2xl" />
        <div className="absolute bottom-12 left-12 -z-10 h-64 w-64 rounded-full bg-[#FFF4E5] opacity-60 blur-2xl" />

        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-12 items-center">
            
            {/* Hero Left Intro */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-[#E8E6D9] text-[#4A6741] rounded-full text-[10px] font-black uppercase tracking-wider mb-6 border border-[#E8E6D9]"
              >
                <span className="h-2 w-2 rounded-full bg-[#4A6741] animate-pulse" />
                <span>AI gia sư trực quan sinh động</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-serif italic text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-[#2D2A26] font-medium"
              >
                Hiểu sâu <span className="text-[#FF8C42] font-semibold">bản chất Toán</span> <br />
                bằng mắt nhìn, chạm thử 👋
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-base text-[#3D3B37] leading-relaxed max-w-2xl opacity-90"
              >
                <strong className="text-[#2D2A26]">AI không làm bài thay học sinh tiểu học.</strong> Trẻ em không hề thiếu bài tập khô khan, mà thiếu cách học chân thực sát sao: ít chữ ngữ pháp, nhiều minh họa đếm đĩa kẹo dâu chín mọng, chia lát pizza sinh động và giao diện kéo chạm tay thật dính dớp để học sâu sắc vĩnh viễn.
              </motion.p>

              {/* Tag Highlights */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 space-y-3"
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#3D3B37]">
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center border border-emerald-200">🍓</span>
                  <span>Ví dụ siêu gần gũi (Đĩa kẹo sáp, Táo vườn, Pizza mỏng, Ô lót gạch)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#3D3B37]">
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center border border-amber-200">🎮</span>
                  <span>Mô phỏng trải nghiệm xúc giác giúp bé tự tay kéo số liệu nhảy kết quả</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#3D3B37]">
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center border border-sky-200">🔊</span>
                  <span>Gia sư AI phát giọng nói Việt ngữ ân cần thấu đạt tâm lý của các bé</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex flex-wrap gap-4 w-full"
              >
                <button
                  onClick={() => scrollToSection('hoc-thu')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4A6741] hover:bg-[#3D5435] px-7 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-97 shrink-0"
                >
                  <span>Chạm tay trải nghiệm thử</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => scrollToSection('lo-trinh')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-[#E8E6D9] hover:bg-[#FAF9F5] px-7 py-3.5 text-sm font-bold text-[#3D3B37] transition-all cursor-pointer active:scale-97"
                >
                  <span>Lộ trình Lớp 1 - 5</span>
                </button>
              </motion.div>
            </div>

            {/* Hero Right Visual Interactive Box */}
            <div className="lg:col-span-5 mt-12 lg:mt-0 relative flex justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-sm rounded-[32px] border border-[#E8E6D9] bg-white p-7 shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-center justify-between border-b border-[#E8E6D9] pb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#FF8C42]" />
                    <span className="h-3 w-3 rounded-full bg-[#4A6741]" />
                    <span className="h-3 w-3 rounded-full bg-slate-200" />
                  </div>
                  <span className="rounded bg-[#FAF9F5] px-2.5 py-0.5 text-[9px] font-black text-[#4A6741] uppercase tracking-wider border border-[#E8E6D9] flex items-center gap-1">
                    <BrainCircuit className="h-3 w-3 text-[#FF8C42] animate-bounce" />
                    <span>Hộp Trực Quan Hóa 🍕</span>
                  </span>
                </div>

                <div className="my-auto py-6 flex flex-col items-center select-none">
                  <span className="text-[10px] font-mono font-black text-[#FF8C42] uppercase tracking-wider mb-2">Ví dụ mẫu: Phân số 3/4 chiếc bánh</span>
                  
                  {/* Embedded click state pizza */}
                  <div className="relative h-28 w-28 flex items-center justify-center bg-[#FAF9F5] rounded-full p-2 border border-[#E8E6D9] cursor-pointer"
                       onClick={() => playSoundEffect('crunch')}>
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <path d="M50,50 L90,50 A40,40 0 0,1 50,90 Z" fill="#FF8C42" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M50,50 L50,90 A40,40 0 0,1 10,50 Z" fill="#FF8C42" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M50,50 L10,50 A40,40 0 0,1 50,10 Z" fill="#FF8C42" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M50,50 L50,10 A40,40 0 0,1 90,50 Z" fill="#E8E6D9" stroke="#fff" strokeWidth="1.5" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center bg-white/95 rounded-full h-11 w-11 shadow-xs">
                      <span className="text-sm font-black text-[#FF8C42]">3</span>
                      <div className="h-0.5 w-6 bg-slate-300 my-0.5" />
                      <span className="text-xs font-black text-slate-800">4</span>
                    </div>
                  </div>

                  <p className="mt-4 text-[10px] text-gray-500 font-bold">Chạm vào bánh lò viba để cảm nhận phản hồi!</p>
                </div>

                <div className="rounded-[18px] bg-[#FAF9F5] p-3 text-left border border-[#E8E6D9]">
                  <p className="text-[11px] text-[#3D3B37] leading-relaxed">
                    💡 Mẫu số là đếm chiếc bánh cắt làm 4 phần béo, tử số là lấy đi 3 phần ngon dâu. Trẻ ghi nhớ vĩnh viễn nhờ trải nghiệm xúc giác chân thật!
                  </p>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. CORE BENEFITS SECTION */}
      <section id="loi-ich" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E8E6D9]">
        <div className="max-w-7xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl font-serif italic font-medium tracking-tight text-[#2D2A26] sm:text-4xl">
              Phác họa điểm khác biệt của <br/>
              <span className="text-[#4A6741] font-semibold">Gia Sư Toán Trực Quan AI</span>
            </h2>
            <p className="mt-3 text-[#3D3B37] max-w-2xl mx-auto text-sm opacity-90">
              Không sinh bài tập tự động mệt mỏi, không máy móc viết lại lời giải dối trá. Chúng em thắp sáng hạt mầm đam mê của bé thông qua học cụ trực quan.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6.5">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.0, ease: "easeOut" }}
              className="p-6 rounded-3xl border border-[#E8E6D9] bg-[#FAF9F5]/40 text-left flex flex-col justify-between group transition-all duration-150 ease-out hover:-translate-y-1 hover:border-[#4A6741]"
            >
              <div>
                <span className="text-3xl bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs border border-emerald-150 mb-5">💡</span>
                <h3 className="text-base font-bold text-[#2D2A26] group-hover:text-[#4A6741] transition-colors font-medium">Hiểu bản chất trước mới làm bài</h3>
                <p className="mt-2.5 text-xs sm:text-sm text-[#3D3B37]/80 leading-relaxed">
                  Thay vì bắt trẻ thuộc lầu công thức tính diện tích khô cứng như robot, chúng em đưa ra lưới ô để các bé vừa gieo mầm xanh, vừa ngộ ra diện tích mặt dính thực ra là tổng số hạt đất.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/55 flex items-center justify-between text-xs font-bold text-[#4A6741]">
                <span>Trải nghiệm trực diện</span>
                <span>→</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="p-6 rounded-3xl border border-[#E8E6D9] bg-[#FAF9F5]/40 text-left flex flex-col justify-between group transition-all duration-150 ease-out hover:-translate-y-1 hover:border-[#4A6741]"
            >
              <div>
                <span className="text-3xl bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs border border-amber-150 mb-5">🍓</span>
                <h3 className="text-base font-bold text-[#2D2A26] group-hover:text-[#4A6741] transition-colors font-medium">Ẩn dụ đời thường ngọt ngào</h3>
                <p className="mt-2.5 text-xs sm:text-sm text-[#3D3B37]/80 leading-relaxed">
                  Sử dụng kẹo ngọt bọc đường, quả táo chín đỏ căng đét và những người bạn thú bông ôm nỏn nà để mang toán học học đường về gần thế giới vui thích thường ngày của trẻ.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/55 flex items-center justify-between text-xs font-bold text-[#4A6741]">
                <span>Gần gũi &amp; vui tươi</span>
                <span>→</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="p-6 rounded-3xl border border-[#E8E6D9] bg-[#FAF9F5]/40 text-left flex flex-col justify-between group transition-all duration-150 ease-out hover:-translate-y-1 hover:border-[#4A6741]"
            >
              <div>
                <span className="text-3xl bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs border border-indigo-150 mb-5">🔊</span>
                <h3 className="text-base font-bold text-[#2D2A26] group-hover:text-[#4A6741] transition-colors">Giọng đọc Việt ngữ ân cần</h3>
                <p className="mt-2.5 text-xs sm:text-sm text-[#3D3B37]/80 leading-relaxed">
                  Được tích hợp bộ loa thông minh thuyết minh từng hoạt động, bé lớp 1 hẵng còn tập đọc đánh vần bập bẹ vẫn thoải mái tự lập học toán mà không cần ba mẹ kèm cặp thúc ép nhức đầu.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/55 flex items-center justify-between text-xs font-bold text-[#4A6741]">
                <span>Tập trung &amp; Thư giãn</span>
                <span>→</span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 4. MAIN INTERACTIVE SANDBOX PLAYGROUND */}
      <section id="hoc-thu" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FAF9F5] border-b border-[#E8E6D9]">
        <div className="max-w-4xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-xl mx-auto mb-10"
          >
            <h2 className="text-3xl font-serif italic font-medium text-[#2D2A26]">
              Phòng mô phỏng trực quan 💡
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#3D3B37]/80">
              Chọn một chủ đề Toán tiểu học bên dưới để trực tiếp chạm chuột gieo hạt, bốc kẹo, chia táo xem công thức thay đổi tức thì như thế nào nhé!
            </p>
          </motion.div>

          {/* Tab Selection */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 bg-white p-1.5 rounded-full border border-[#E8E6D9] shadow-sm max-w-xl mx-auto">
            <button
              onClick={() => { playSoundEffect('pop'); setActiveTab('multiplication'); }}
              className={`px-4.5 py-2 rounded-full text-xs font-bold tracking-tight cursor-pointer transition-all ${
                activeTab === 'multiplication' ? 'bg-[#4A6741] text-white shadow-xs' : 'text-[#3D3B37] hover:bg-[#FAF9F5]'
              }`}
            >
              🍬 Phép nhân (Lớp 2)
            </button>
            <button
              onClick={() => { playSoundEffect('pop'); setActiveTab('division'); }}
              className={`px-4.5 py-2 rounded-full text-xs font-bold tracking-tight cursor-pointer transition-all ${
                activeTab === 'division' ? 'bg-[#FF8C42] text-white shadow-xs' : 'text-[#3D3B37] hover:bg-[#FAF9F5]'
              }`}
            >
              🍎 Phép chia (Lớp 2)
            </button>
            <button
              onClick={() => { playSoundEffect('pop'); setActiveTab('fraction_basic'); }}
              className={`px-4.5 py-2 rounded-full text-xs font-bold tracking-tight cursor-pointer transition-all ${
                activeTab === 'fraction_basic' ? 'bg-[#FF8C42] text-white shadow-xs' : 'text-[#3D3B37] hover:bg-[#FAF9F5]'
              }`}
            >
              🍕 Phân số (Lớp 3)
            </button>
            <button
              onClick={() => { playSoundEffect('pop'); setActiveTab('perimeter_area_basic'); }}
              className={`px-4.5 py-2 rounded-full text-xs font-bold tracking-tight cursor-pointer transition-all ${
                activeTab === 'perimeter_area_basic' ? 'bg-[#4A6741] text-white shadow-xs' : 'text-[#3D3B37] hover:bg-[#FAF9F5]'
              }`}
            >
              🌱 Diện tích (Lớp 4)
            </button>
          </div>

          {/* Interactive Classroom Card */}
          <div className="rounded-[32px] border border-[#E8E6D9] bg-white p-6 sm:p-9 shadow-lg relative overflow-hidden text-left">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#4A6741] via-[#FF8C42] to-[#4A6741]" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E6D9] pb-5">
              <div>
                <span className="inline-block bg-[#E9F0E6] text-[#4A6741] text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 border border-[#4A6741]/10">
                  Lớp {activeLesson.grade} • Toán Học Bản Chất
                </span>
                <h3 className="text-lg sm:text-xl font-serif italic text-[#2D2A26] font-medium leading-tight">
                  {activeLesson.title}
                </h3>
              </div>

              {/* Loa phát giọng nói */}
              <button
                onClick={() => speakText(activeLesson.shortExplanation)}
                className={`flex items-center gap-1.5 self-start sm:self-center px-4 py-2 rounded-full border border-[#E8E6D9] text-xs font-bold cursor-pointer transition-all ${
                  speakingText === activeLesson.shortExplanation 
                    ? 'bg-[#FF8C42] text-white border-transparent' 
                    : 'bg-[#FAF9F5] text-[#3D3B37]/80 hover:bg-[#FAF9F5]/90'
                }`}
              >
                <Volume2 className={`h-4.5 w-4.5 ${speakingText === activeLesson.shortExplanation ? 'animate-pulse' : ''}`} />
                <span>{speakingText === activeLesson.shortExplanation ? 'Đang đọc...' : 'Nghe cô giảng bài'}</span>
              </button>
            </div>

            {/* Explanation panel */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-5 space-y-4">
                <div className="bg-[#FAF9F5] p-4.5 rounded-2xl border border-[#E8E6D9]">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Trích bài giảng:</h4>
                  <p className="text-xs sm:text-sm text-[#3D3B37] leading-relaxed font-medium">
                    {activeLesson.shortExplanation}
                  </p>
                </div>

                <div className="bg-[#E9F0E6]/50 p-4 rounded-2xl border border-[#4A6741]/10">
                  <h4 className="text-[10px] font-black uppercase text-[#4A6741] tracking-wider mb-1">Ẩn dụ trực quan:</h4>
                  <p className="text-xs text-[#3D3B37] leading-relaxed">
                    {activeLesson.lifeExample}
                  </p>
                </div>
              </div>

              {/* Dynamic visualization canvas placeholder */}
              <div className="md:col-span-7 flex items-center justify-center bg-radial from-white via-[#FAF9F5] to-white p-5 rounded-3xl border border-[#E8E6D9]/80 min-h-[290px] shadow-inner">
                {renderVisualSimulation()}
              </div>
            </div>

            {/* Integrated Practice Question Panel */}
            <div className="mt-9 pt-7 border-t border-[#E8E6D9]">
              <div className="bg-[#FAF9F5] p-5 rounded-2.5xl border border-[#E8E6D9]">
                <div className="flex items-center gap-2 mb-3.5">
                  <span className="text-xl">🏆</span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Bé thử ôn tập thực hành:</p>
                </div>
                
                <p className="text-sm font-semibold text-[#2D2A26] leading-relaxed mb-4">
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
                            playSoundEffect('correct');
                          } else {
                            playSoundEffect('synth');
                          }
                        }}
                        className={`p-3.5 rounded-xl text-left text-xs font-semibold border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isChosen 
                            ? 'bg-[#E9F0E6] border-[#4A6741] text-[#4A6741]' 
                            : 'bg-white border-[#E8E6D9] text-[#3D3B37] hover:bg-[#FAF9F5]'
                        }`}
                      >
                        <span>{opt}</span>
                        {isChosen && <CheckCircle className="h-4.5 w-4.5 text-[#4A6741] shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                {/* Animated Answer Response message */}
                <AnimatePresence mode="wait">
                  {answersChecked && selectedAnswer !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mt-4 p-4 rounded-xl text-xs sm:text-sm font-medium ${
                        selectedAnswer === activeLesson.practiceQuestion.correctAnswerIndex
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-850 border border-amber-200'
                      }`}
                    >
                      <p className="font-extrabold flex items-center gap-1.5 mb-1 text-sm">
                        <span>{selectedAnswer === activeLesson.practiceQuestion.correctAnswerIndex ? '🎉 Bé làm xuất sắc!' : '💡 Động viên bé nghĩ lại:'}</span>
                      </p>
                      <p className="leading-relaxed">
                        {selectedAnswer === activeLesson.practiceQuestion.correctAnswerIndex 
                          ? activeLesson.practiceQuestion.successMessage
                          : activeLesson.practiceQuestion.failMessage}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. COURSE CURRICULUM GRADE-BY-GRADE ROADMAP */}
      <section id="lo-trinh" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E8E6D9]">
        <div className="max-w-7xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="text-[#FF8C42] text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-2 font-mono">Bản đồ học thuật toàn diện</span>
            <h2 className="text-3xl font-serif italic text-[#2D2A26] leading-tight">
              Lộ trình đong đầy hình ảnh từ Lớp 1 - Lớp 5
            </h2>
            <p className="mt-3 text-sm text-[#3D3B37]/80 leading-relaxed">
              Mỗi bài giảng đều có sự trợ lực của đồ hình 3D dẹt xúc giác, giúp bé tiếp thu nhẹ tênh từ đếm chuối cho tới tính chu vi diện tích đa giác phức tạp.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { grade: 'Lớp 1', title: 'Đếm kẹo ngọt & so sánh dâu', color: 'border-emerald-100 bg-[#E9F0E6]/25', desc: 'Sắp xếp dãy số, thêm bớt từ 1 đến 10 dựa trên quả đào chín căng quả, sờ chạm so sánh nhiều ít.' },
              { grade: 'Lớp 2', title: 'Nối bảng nhân & chia đều táo', color: 'border-amber-100 bg-[#FFF4E5]/25', desc: 'Ghép thành các đĩa bánh đều dặn, hiểu sâu thẳm bản chất phép nhân chính là cộng lặp, phép chia là chia đều.' },
              { grade: 'Lớp 3', title: 'Cắt lát bánh Pizza dâu', color: 'border-orange-100 bg-[#FFF1F0]/25', desc: 'Bẻ vụn phân số cơ bản, nhân chia chữ số nghìn chục nghìn thông qua xếp khối hộp đồ chơi.' },
              { grade: 'Lớp 4', title: 'Lợp gạch sân thảm chu vi', color: 'border-sky-100 bg-[#F0F5FF]/25', desc: 'Tính mét vuông lợp gạch, bo đường viền mép bờ tường. Đếm diện tích cực kỳ trực diện.' },
              { grade: 'Lớp 5', title: 'Đổ nước bình đo thể tích', color: 'border-purple-100 bg-[#F9F0FF]/25', desc: 'Rót nước ngọt dâu đầy các bình đong chia độ để mường tượng tỉ số phần trăm và thể tích hộp.' },
            ].map((milestone, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                className={`p-5 rounded-2.5xl border border-[#E8E6D9] text-left flex flex-col justify-between h-56 transition-all duration-150 ease-out hover:-translate-y-1 hover:border-[#4A6741]/40 ${milestone.color}`}
              >
                <div>
                  <span className="text-xs font-black tracking-widest text-[#4A6741] uppercase bg-white px-2.5 py-0.5 rounded-md border border-[#E8E6D9] inline-block mb-3.5">
                    {milestone.grade}
                  </span>
                  <h4 className="text-sm font-bold text-[#2D2A26] mb-2 leading-snug">{milestone.title}</h4>
                  <p className="text-[11px] text-[#3D3B37]/75 leading-relaxed">{milestone.desc}</p>
                </div>
                <div className="h-1 bg-[#E8E6D9] rounded-full w-2/3 mt-3 overflow-hidden">
                  <div className="h-full bg-[#4A6741] w-3/4 rounded-full" />
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. SOCIAL PROOF TESTIMONIALS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FAF9F5] border-b border-[#E8E6D9]">
        <div className="max-w-7xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-xl mx-auto mb-11"
          >
            <h2 className="text-3xl font-serif italic text-[#2D2A26]">Phản hồi ân tình của Phụ huynh</h2>
            <p className="mt-3 text-xs sm:text-sm text-[#3D3B37]/85 max-w-md mx-auto">
              Nghe ba mẹ và các cô giáo tiểu học thuật lại hành trình từ chỗ ghét toán, giật mình sợ sệt chuyển sang tự lập chạm dứt điểm bài học.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6.5">
            {[
              {
                text: '“Cu Bin nhà mình năm nay lên lớp 2, cứ nhìn thấy trang sách toán đầy chữ số là nhăn mặt khóc thét. Từ ngày chơi app trực quan chạm đĩa kẹo dâu tây này, cháu mê tít. Bé tự kéo chỉnh số lượng và tự cười phá lên bảo hóa ra phép tính thật dễ thở.”',
                author: 'Chị Mai Lan (Phụ huynh bé Hoàng Minh, Lớp 2 - Q.3, TP.HCM)',
                avatar: '👩‍👦'
              },
              {
                text: '“Bản thân là giáo viên tiểu học, tôi cực kỳ coi trọng tính trực quan của đồ vật lúc dạy phân số. Việc app vẽ chiếc bánh pizza cho trẻ chạm từng phần ăn để đổi tử số mẫu số rất trực quan, giúp các con in sâu ký ức bọc trong não hiệu quả.”',
                author: 'Cô Thu Hương (Giáo viên trường Tiểu học thực nghiệm - Hà Nội)',
                avatar: '🏫'
              },
              {
                text: '“Gia đình bận rộn buôn bán không có giờ dạy con học toán lớp 3. Tìm trợ lý gia sư AI có chức năng đọc lên Việt ngữ kèm tiếng kẹo dâu gõ lách cách như thế này làm bé tập trung hẳn, không cần mẹ la rầy nhắc nhở mỏi miệng nữa.”',
                author: 'Anh Quốc Bảo (Ba bé Thùy Dung, Lớp 3 - Ninh Kiều, Cần Thơ)',
                avatar: '👨‍👧'
              }
            ].map((rv, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.15, ease: "easeOut" }}
                className="bg-white p-6 rounded-3xl border border-[#E8E6D9] text-left flex flex-col justify-between shadow-xs"
              >
                <p className="text-[12px] sm:text-[13px] text-[#3D3B37]/90 italic leading-relaxed">
                  {rv.text}
                </p>
                <div className="mt-5.5 pt-4.5 border-t border-[#FAF9F5] flex items-center gap-3">
                  <span className="text-2xl bg-[#E9F0E6] w-9.5 h-9.5 rounded-full flex items-center justify-center border border-[#4A6741]/10 shrink-0">
                    {rv.avatar}
                  </span>
                  <div>
                    <h5 className="text-[10px] sm:text-[11px] font-black text-[#2D2A26] leading-none mb-1">{rv.author}</h5>
                    <span className="text-[9px] text-[#4A6741] font-bold uppercase tracking-widest block">Thành viên Verified</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. STRUCTURED FAQ ACCORDIONS */}
      <section id="cau-hoi" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E8E6D9]">
        <div className="max-w-3xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-11"
          >
            <h2 className="text-3xl font-serif italic text-[#2D2A26]">Gỡ rối khúc mắc của Ba Mẹ</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Giải đáp nhanh chóng những bận tâm phổ biến nhất khi ứng dụng mô hình gia sư tương tác thông minh cho các bé.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="space-y-3"
          >
            {[
              {
                q: 'Bé học gia sư AI trực quan này có sợ quá ỷ lại và lười làm bài không?',
                a: 'Tuyệt đối KHÔNG ba mẹ nhé! Hệ thống không giải giùm bài hay điền hộ đáp án trắc nghiệm. Nhiệm vụ chính của AI là vẽ hình ảnh hóa bản chất toán học từ đĩa kẹo, chiếc bánh pizza để kích thích tư duy, sau đó bé vẫn phải tự lập suy luận đặt bút làm trắc nghiệm.'
              },
              {
                q: 'Chương trình trực quan này có bám sát đúng chuẩn của Bộ Giáo Dục VN không?',
                a: 'Có, lộ trình được tinh chỉnh cực tốt bám sát theo chuẩn chương trình Giáo dục Phổ thông mới. Toàn bộ các mốc học thuật lớp 1-5 từ bảng tính cộng dồn, phép nhân gộp nhóm, phân số hay chu vi diện tích đều tương thích 100% với bài học sách giáo khoa hiện hành.'
              },
              {
                q: 'Lợi ích lớn nhất của việc nghe giọng kể truyền cảm hứng (Loa phát)?',
                a: 'Đối với các bé lớp 1 và lớp 2, kỹ năng đọc hiểu văn bản chữ nhiều hẵng còn bỡ ngỡ chậm chạp. Có loa đọc bằng tiếng Việt sẽ ân cần dắt lối bé tự lập bấm nghe giảng bài mà không cảm thấy cô đơn hay cần ba mẹ kè kè túc trực bên cạnh.'
              },
              {
                q: 'Làm thế nào để sử dụng thử tính năng này đạt hiệu quả cao nhất?',
                a: 'Hãy để bé tự nắm quyền kiểm soát! Ba mẹ khích lệ con tự click chuột nếm trải miếng bánh pizza dâu, tự chạm nệm lót đất gieo hạt mầm mọc cây 🌱 lên màn hình. Động chạm cơ học xúc giác luôn khêu gợi vết hằn tư duy tối ưu trong trí tuệ trẻ.'
              }
            ].map((faq, fIdx) => {
              const isOpen = activeFaq === fIdx;
              return (
                <div key={fIdx} className="border border-[#E8E6D9] bg-[#FAF9F5]/30 rounded-2xl overflow-hidden transition-all text-left">
                  <button
                    onClick={() => { playSoundEffect('pop'); setActiveFaq(isOpen ? null : fIdx); }}
                    className="w-full flex items-center justify-between p-5.5 font-semibold text-xs sm:text-sm text-[#2D2A26] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#4A6741]' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-[#E8E6D9] bg-white p-5.5 text-xs text-[#3D3B37] opacity-95 leading-relaxed"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>

        </div>
      </section>

      {/* 8. SLEEK INFORMATION FOOTER */}
      <footer className="bg-[#2D2A26] text-[#E8E6D9]/80 py-12 px-4 sm:px-6 lg:px-8 border-t border-[#E8E6D9]/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#FAF9F5]/10 text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-serif italic font-bold text-lg text-white">Toán Trực Quan AI © {new Date().getFullYear()}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hiểu Bản Chất - Khơi Nguồn Niềm Vui Học Tập</span>
          </div>

          <div className="flex flex-wrap justify-center gap-7 text-[11px] font-bold">
            <button onClick={() => scrollToSection('hero')} className="hover:text-white transition-colors cursor-pointer">Về đầu trang</button>
            <button onClick={() => scrollToSection('loi-ich')} className="hover:text-white transition-colors cursor-pointer">Lợi ích</button>
            <button onClick={() => scrollToSection('hoc-thu')} className="hover:text-white transition-colors cursor-pointer">Học mô phỏng</button>
            <button onClick={() => scrollToSection('lo-trinh')} className="hover:text-white transition-colors cursor-pointer">Lộ trình phổ thông</button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-7 text-center">
          <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
            Sản phẩm được tối ưu hoàn chỉnh trên một tệp mã nguồn tinh gọn, tích hợp gia sư AI phát thanh trực quan Việt ngữ bám sát chương trình tiểu học hiện hành.
          </p>
        </div>
      </footer>

    </div>
  );
}
