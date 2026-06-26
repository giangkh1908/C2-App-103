'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import {
  Bot,
  History,
  Mic,
  MicOff,
  Send,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  HelpCircle,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar';
import UsageCounter from '@/components/UsageCounter';
import UpgradeModal from '@/components/UpgradeModal';
import {
  getHistory,
  getSession,
  deleteSession,
  createSession,
  type ChatSessionSummary,
} from '@/lib/chatHistoryApi';
import { useChatStream } from '@/lib/useChatStream';
import InteractiveSimulation from './InteractiveSimulation';
import type {
  ChatTurnResponse,
  PracticeQuestion,
  ResponseMode,
  VisualData,
} from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestampLabel: string;
  responseMode?: ResponseMode;
  followUpSuggestions?: string[];
  title?: string;
  lifeExample?: string;
  visualData?: VisualData;
  practiceQuestion?: PracticeQuestion;
  practiceAnswerIdx?: number | null;
  practiceFeedbackChecked?: boolean;
  simulationConfig?: NonNullable<ChatTurnResponse['visual_card']>['simulation_config'];
}

type BrowserSpeechRecognition = {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;
type BrowserWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  webkitAudioContext?: typeof AudioContext;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const G1_SUGGESTION_GROUPS = [
  { label: 'Số và cấu tạo số', icon: '🔢', suggestions: ['Số 24 có mấy chục mấy đơn vị?', 'Biểu diễn số 36 bằng chục và đơn vị', 'Đếm 42 bằng khối chục đơn vị'] },
  { label: 'So sánh số', icon: '⚖️', suggestions: ['So sánh 37 và 42', 'Số nào lớn hơn: 58 hay 53?', 'Đặt 19, 21, 20 theo thứ tự'] },
  { label: 'Cộng trừ', icon: '➕', suggestions: ['Minh họa 24 + 13 bằng que tính', 'Bớt 15 từ 48', 'Giải thích 32 - 10 bằng chục đơn vị'] },
  { label: 'Tính nhẩm', icon: '🧠', suggestions: ['Tính nhẩm 8 + 5 bằng khung 10', 'Nhanh 30 - 10', 'Dùng tia số để tính 7 + 2'] },
  { label: 'Bài toán lời văn', icon: '📖', suggestions: ['Lan có 5 quả táo, mẹ cho thêm 3 quả', 'Bài toán bớt đi 2 con chim', 'Tóm tắt bài toán lời văn'] },
  { label: 'Vị trí không gian', icon: '📍', suggestions: ['Quả bóng ở bên trái cái hộp', 'Chỉ vị trí ở giữa', 'Minh họa trên dưới trước sau'] },
  { label: 'Nhận biết hình', icon: '🔷', suggestions: ['Nhận biết hình vuông và hình tròn', 'Vật nào là khối hộp chữ nhật?', 'Ghép đồ vật với hình học'] },
  { label: 'Ghép hình', icon: '🧩', suggestions: ['Ghép các hình để tạo ngôi nhà', 'Xếp hình từ tam giác và hình vuông', 'Tạo hình mới bằng kéo thả'] },
  { label: 'Đo độ dài / Lịch / Đồng hồ', icon: '📏', suggestions: ['So sánh bút nào dài hơn', 'Đọc giờ đúng trên đồng hồ', 'Thứ mấy đứng sau thứ ba?'] },
];

function buildWelcomeMessage(tChat: (key: string) => string): Message {
  return {
  id: 'welcome_1',
  role: 'ai',
  text: tChat('welcome'),
  timestampLabel: tChat('ready'),
  responseMode: 'explain_only',
  followUpSuggestions: [
    'Số 24 có mấy chục mấy đơn vị?',
    'So sánh 37 và 42',
    'Tính nhẩm 8 + 5',
    'Đọc giờ trên đồng hồ',
  ],
  };
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function createTimestamp(locale: string): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

function playSfx(type: 'bell' | 'error' | 'sparkle'): void {
  try {
    const win = window as BrowserWindow;
    const AudioCtx = window.AudioContext || win.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'bell') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    } else if (type === 'error') {
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    } else {
      osc.frequency.setValueAtTime(659, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    }
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch { /* ignore */ }
}



// ─── Sub-components ──────────────────────────────────────────────────────────

function ClarificationBubble({ message, onSuggestionClick }: {
  message: Message;
  onSuggestionClick: (text: string) => void;
}) {
  const t = useTranslations('learn.chat');

  return (
    <div className="flex flex-col gap-3">
      {/* Câu hỏi làm rõ */}
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 border border-violet-200 text-violet-600">
          <HelpCircle className="h-4 w-4" />
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-violet-200 bg-violet-50 px-4 py-3 shadow-sm max-w-[80%]">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 mb-1.5">
            {t('clarificationLabel')}
          </p>
          <div className="text-sm text-violet-900 leading-relaxed font-medium">
            {message.text}
          </div>
        </div>
      </div>
      {/* Quick reply chips */}
      {message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
        <div className="ml-11 flex flex-wrap gap-2">
          {message.followUpSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(s)}
              className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-xs transition-all hover:bg-violet-50 hover:border-violet-400 active:scale-97"
            >
              <ChevronRight className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VisualPanel({ message, onAnswerChoice }: {
  message: Message;
  onAnswerChoice: (msgId: string, optIdx: number, correctIdx: number) => void;
}) {
  const t = useTranslations('learn.chat');
  const { visualData, practiceQuestion, practiceAnswerIdx, practiceFeedbackChecked } = message;

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Life example */}
      {message.lifeExample && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900 leading-relaxed">
          💡 {message.lifeExample}
        </div>
      )}

      {/* Interactive simulation */}
      {visualData && (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
          <InteractiveSimulation visualData={visualData} />
        </div>
      )}

      {/* Practice question */}
      {practiceQuestion && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-natural-green">
            🎯 {t('quickPracticeLabel')}
          </p>
          <p className="mb-3 text-sm font-medium text-gray-800 leading-relaxed">
            {practiceQuestion.questionText}
          </p>
          <div className="flex flex-col gap-2">
            {practiceQuestion.options.map((opt, optIdx) => {
              const isSelected = practiceAnswerIdx === optIdx;
              const isCorrect = optIdx === practiceQuestion.correctAnswerIndex;
              const showFeedback = practiceFeedbackChecked;

              let optStyle = 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300';
              if (showFeedback && isSelected && isCorrect) optStyle = 'border-emerald-400 bg-emerald-50 text-emerald-800';
              else if (showFeedback && isSelected && !isCorrect) optStyle = 'border-red-300 bg-red-50 text-red-800';
              else if (showFeedback && !isSelected && isCorrect) optStyle = 'border-emerald-300 bg-emerald-50/60 text-emerald-700';

              return (
                <button
                  key={optIdx}
                  onClick={() => !showFeedback && onAnswerChoice(message.id, optIdx, practiceQuestion.correctAnswerIndex)}
                  disabled={!!showFeedback}
                  className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition-all ${optStyle} ${!showFeedback ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
                >
                  {showFeedback && isCorrect && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                  {showFeedback && isSelected && !isCorrect && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                  {(!showFeedback || (!isCorrect && !isSelected)) && (
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-current opacity-40" />
                  )}
                  {opt}
                </button>
              );
            })}
          </div>
          {practiceFeedbackChecked && practiceAnswerIdx !== null && practiceAnswerIdx !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold leading-relaxed ${
                practiceAnswerIdx === practiceQuestion.correctAnswerIndex
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {practiceAnswerIdx === practiceQuestion.correctAnswerIndex
                ? `✅ ${practiceQuestion.successMessage}`
                : `❌ ${practiceQuestion.failMessage}`}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}


function AiMessage({ message, onSuggestionClick, onAnswerChoice, onSpeak, isSpeaking, isLoading}: {
  message: Message;
  onSuggestionClick: (text: string) => void;
  onAnswerChoice: (msgId: string, optIdx: number, correctIdx: number) => void;
  onSpeak: (text: string, id: string) => void;
  isSpeaking: boolean;
  isLoading: boolean;
}) {
  const t = useTranslations('learn.chat');
  const isClarification = message.responseMode === 'clarification_needed';
  const hasVisual = !isClarification && message.responseMode !== 'explain_only' && message.visualData;

  if (isClarification) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ClarificationBubble message={message} onSuggestionClick={onSuggestionClick} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-natural-green/20 bg-natural-green-tint text-natural-green">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex max-w-[84%] flex-col gap-2 sm:max-w-[78%]">
        {/* Title */}
        {message.title && (
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-natural-orange" />
            <span className="text-sm font-bold italic text-gray-800">{message.title}</span>
          </div>
        )}

        {/* Main text bubble */}
        <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-900">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.text}
          </ReactMarkdown>
          {/* Cursor nhấp nháy khi đang stream */}
          {isLoading && message.text !== '' && !message.responseMode?.includes('visual') && !message.visualData && (
            <span className="inline-block h-4 w-0.5 bg-natural-green align-middle animate-pulse ml-0.5" />
          )}
        </div>

        {/* Visual panel */}
        {hasVisual && (
          <VisualPanel message={message} onAnswerChoice={onAnswerChoice} />
        )}

        {/* Footer: timestamp + TTS + follow-up suggestions */}
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-400">{message.timestampLabel}</span>
          <button
            onClick={() => onSpeak(message.text, message.id)}
            className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-natural-green"
            title={t('readAloud')}
          >
            {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </button>
        </div>

        {/* Follow-up suggestions (non-clarification) */}
        {message.followUpSuggestions && message.followUpSuggestions.length > 0 && !hasVisual && (
          <div className="flex flex-wrap gap-1.5">
            {message.followUpSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(s)}
                className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-xs transition-all hover:border-natural-green/40 hover:text-natural-green active:scale-97"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIExplanationChat() {
  const locale = useLocale();
  const { apiFetch } = useAuth();
  const tChat = useTranslations('learn.chat');
  const speechLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const welcomeMessage = useMemo(() => buildWelcomeMessage(tChat), [tChat]);

  const [messages, setMessages] = useState<Message[]>(() => [welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [expandedSuggestionGroup, setExpandedSuggestionGroup] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamStatusText, setStreamStatusText] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatTurnCount, setChatTurnCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ── Session history state ──
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const { sendStream } = useChatStream(apiFetch);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech recognition setup
  useEffect(() => {
    const win = window as BrowserWindow;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.lang = speechLocale;
    rec.interimResults = false;
    rec.onstart = () => setIsRecording(true);
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);
    rec.onresult = (e) => {
      const t = e.results?.[0]?.[0]?.transcript;
      if (t) setInputText((prev) => (prev ? `${prev} ${t}` : t));
    };
    recognitionRef.current = rec;
    return () => { recognitionRef.current?.stop(); recognitionRef.current = null; };
  }, [speechLocale]);

  // TTS cleanup
  useEffect(() => {
    return () => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); };
  }, []);

  // ── Session history ──
  const loadHistory = useCallback(async () => {
    try {
      const data = await getHistory(apiFetch);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load history', error);
    }
  }, [apiFetch]);

  useEffect(() => {
    let active = true;

    getHistory(apiFetch)
      .then((data) => {
        if (active) setSessions(data);
      })
      .catch((error) => {
        console.error('Failed to load history', error);
      });

    return () => { active = false; };
  }, [apiFetch]);

  const handleSpeak = useCallback((text: string, id: string) => {
    if (!window.speechSynthesis) return;
    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const plainText = text
      .replace(/[#>*`_-]/g, '')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1');

    const utter = new SpeechSynthesisUtterance(plainText);    utter.lang = speechLocale;
    utter.rate = 0.95;
    utter.onend = () => setSpeakingMsgId(null);
    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utter);
  }, [speakingMsgId, speechLocale]);

  const handleSuggestionClick = useCallback((text: string) => {
    setInputText(text);
    inputRef.current?.focus();
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleAnswerChoice = useCallback((msgId: string, optIdx: number, correctIdx: number) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, practiceAnswerIdx: optIdx, practiceFeedbackChecked: true }
          : m
      )
    );
    playSfx(optIdx === correctIdx ? 'sparkle' : 'error');
  }, []);

  const handleCreateNewSession = useCallback(async () => {
    try {
      const result = await createSession(apiFetch);
      if (result) {
        setActiveSessionId(result.session_id);
        setSessionId(result.session_id);
      }
      setMessages([]);
      await loadHistory();
      setIsSidebarOpen(false);
    } catch (error) {
      console.error('Failed to create session', error);
    }
  }, [apiFetch, loadHistory]);

  const handleSelectSession = useCallback(async (selectedSessionId: string) => {
    try {
      const session = await getSession(apiFetch, selectedSessionId);
      const restoredMessages: Message[] = session.messages.map((message, index) => ({
        id: `${selectedSessionId}-${index}`,
        role: message.role === 'user' ? 'user' : 'ai',
        text: message.content,
        timestampLabel: '',
      }));

      setMessages(restoredMessages);
      setActiveSessionId(selectedSessionId);
      setSessionId(selectedSessionId);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error('Failed to select session', error);
    }
  }, [apiFetch]);

  const handleDeleteSession = useCallback(async (selectedSessionId: string) => {
    try {
      await deleteSession(apiFetch, selectedSessionId);
      if (activeSessionId === selectedSessionId) {
        setMessages([]);
        setActiveSessionId(null);
        setSessionId(null);
      }
      await loadHistory();
    } catch (error) {
      console.error('Failed to delete session', error);
    }
  }, [activeSessionId, apiFetch, loadHistory]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    // Auto-create session if none is active (null-safe: history API may be unavailable)
    let currentSessionId = activeSessionId ?? sessionId;
    if (!currentSessionId) {
      const newSession = await createSession(apiFetch);
      if (newSession) {
        currentSessionId = newSession.session_id;
        setActiveSessionId(newSession.session_id);
        setSessionId(newSession.session_id);
      }
    }

    setInputText('');
    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        role: 'user',
        text,
        timestampLabel: createTimestamp(locale),
      },
    ]);
    setIsLoading(true);
    setStreamStatusText(null);

    // Tạo placeholder message cho AI – sẽ được update từng chunk
    const aiMsgId = `ai_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        role: 'ai',
        text: '',
        timestampLabel: createTimestamp(locale),
        responseMode: 'explain_only',
      },
    ]);

    try {
      await sendStream(
        {
          session_id: currentSessionId,
          grade: 1,
          message: text,
        },
        {
          onStatus: (message) => {
            setStreamStatusText(message);
          },

          onToken: (chunk) => {
            // Append chunk vào text của AI message placeholder
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, text: m.text + chunk } : m,
              ),
            );
          },

          onDone: (payload) => {
            setStreamStatusText(null);
            setSessionId(payload.session_id);
            setActiveSessionId(payload.session_id);
            setChatTurnCount((c) => c + 1);

            // Replace placeholder bằng full message với visual/practice data
            const finalMsg: Message = {
              id: aiMsgId,
              role: 'ai',
              text: payload.assistant_message,
              timestampLabel: createTimestamp(locale),
              responseMode: payload.response_mode,
              followUpSuggestions: payload.follow_up_suggestions,
              title: payload.visual_card?.title,
              lifeExample: payload.visual_card?.life_example,
              visualData: payload.visual_card
                ? {
                    type: payload.visual_card.visual_data.type,
                    primaryCount: payload.visual_card.visual_data.primary_count,
                    secondaryCount: payload.visual_card.visual_data.secondary_count,
                    totalCount: payload.visual_card.visual_data.total_count,
                    groupsLabel: payload.visual_card.visual_data.groups_label,
                    itemsLabel: payload.visual_card.visual_data.items_label,
                    config: payload.visual_card.visual_data.config,
                  }
                : undefined,
              practiceQuestion: payload.practice_question
                ? {
                    id: payload.practice_question.id,
                    questionText: payload.practice_question.question_text,
                    options: payload.practice_question.options,
                    correctAnswerIndex: payload.practice_question.correct_answer_index,
                    successMessage: payload.practice_question.success_message,
                    failMessage: payload.practice_question.fail_message,
                    hint: payload.practice_question.hint,
                  }
                : undefined,
              practiceAnswerIdx: null,
              practiceFeedbackChecked: false,
              simulationConfig: payload.visual_card?.simulation_config,
            };

            setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? finalMsg : m)));
            playSfx('bell');
            loadHistory();
          },

          onError: (message) => {
            setStreamStatusText(null);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? {
                      ...m,
                      text: message,
                      responseMode: 'explain_only' as const,
                      followUpSuggestions: [tChat('retrySuggestion'), tChat('chooseTopicSuggestion')],
                    }
                  : m,
              ),
            );
            playSfx('error');
          },
        },
      );
    } catch (err) {
      setStreamStatusText(null);
      
      // Check if it's a 429 quota error
      const isQuotaError = err instanceof Error && err.message.includes('429');
      
      if (isQuotaError) {
        setShowUpgradeModal(true);
      }
      
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: isQuotaError
                  ? 'Bạn đã hết lượt chat miễn phí hôm nay. Vui lòng nâng cấp gói để tiếp tục học.'
                  : tChat('connectionError'),
                responseMode: 'explain_only' as const,
                followUpSuggestions: isQuotaError
                  ? ['Nâng cấp gói', 'Chọn chủ đề khác']
                  : [tChat('retrySuggestion'), tChat('chooseTopicSuggestion')],
              }
            : m,
        ),
      );
      playSfx('error');
    } finally {
      setIsLoading(false);
      setStreamStatusText(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full">
      {/* ── Chat history sidebar ── */}
      <ChatHistorySidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCreateSession={handleCreateNewSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* ── Main chat panel ── */}
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-[#FAF9F5] shadow-xl relative">
      {/* ── Header ── */}
      <div className="flex shrink-0 flex-col items-start justify-between gap-3 border-b border-gray-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-natural-green text-white shadow-md shadow-natural-green/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold italic leading-none text-gray-800 sm:text-lg">
              {tChat('title')}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-natural-green">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span>{tChat('subtitle')}</span>
            </p>
          </div>
        </div>

        {/* History button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-slate-50 text-gray-500 transition-colors hover:border-natural-green/30 hover:bg-natural-green-tint hover:text-natural-green"
            title="Lịch sử hội thoại"
            aria-label="Mở lịch sử hội thoại"
          >
            <History className="h-4 w-4" />
          </button>
          <UsageCounter refreshTrigger={chatTurnCount} />
        </div>
      </div>

      {/* ── G1 Quick Suggestions ── */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-gray-100 bg-[#F4F1E8] px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 text-[9px] font-bold text-gray-400 uppercase mr-1">Gợi ý</span>
        {G1_SUGGESTION_GROUPS.map((group, idx) => (
          <div key={idx} className="relative shrink-0">
            <button
              onClick={() => setExpandedSuggestionGroup(expandedSuggestionGroup === idx ? null : idx)}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-tight transition-all ${
                expandedSuggestionGroup === idx
                  ? 'border-natural-green bg-natural-green text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-natural-green/30 hover:text-natural-green'
              }`}
            >
              <span className="text-[10px]">{group.icon}</span>
              {group.label}
            </button>
            {expandedSuggestionGroup === idx && (
              <div className="absolute top-full left-0 z-20 mt-1 flex flex-col gap-1 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
                {group.suggestions.map((s, si) => (
                  <button
                    key={si}
                    onClick={() => { handleSuggestionClick(s); setExpandedSuggestionGroup(null); }}
                    className="whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-[10px] text-gray-700 hover:bg-natural-green/10 hover:text-natural-green"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Messages ── */}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-row-reverse gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-100 text-natural-orange">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="max-w-[78%] rounded-2xl rounded-tr-sm border border-amber-200 bg-amber-50 px-4 py-3 shadow-xs">
                    <p className="text-xs leading-relaxed text-gray-800 sm:text-sm">{msg.text}</p>
                    <p className="mt-1.5 text-[10px] text-amber-400">{msg.timestampLabel}</p>
                  </div>
                </motion.div>
              );
            }

            return (
              <AiMessage
                key={msg.id}
                message={msg}
                onSuggestionClick={handleSuggestionClick}
                onAnswerChoice={handleAnswerChoice}
                onSpeak={handleSpeak}
                isSpeaking={speakingMsgId === msg.id}
                isLoading={isLoading}
              />
            );
          })}
        </AnimatePresence>

        {/* Loading indicator – chỉ hiện khi chưa có placeholder message */}
        {isLoading && !messages.some((m) => m.role === 'ai' && m.text === '' && m.id.startsWith('ai_')) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-natural-green/20 bg-natural-green-tint text-natural-green">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-5 py-4 shadow-xs">
              {streamStatusText ? (
                <p className="text-xs text-gray-400 italic">{streamStatusText}</p>
              ) : (
                <div className="flex items-center gap-1.5">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="h-2 w-2 rounded-full bg-natural-green"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Streaming status overlay khi có placeholder đang được fill */}
        {isLoading && streamStatusText && messages.some((m) => m.role === 'ai' && m.text === '') && (
          <div className="ml-11 -mt-1 text-[10px] text-gray-400 italic">{streamStatusText}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="relative min-w-0 flex-1">
            <textarea
              ref={inputRef}
              id="chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tChat('inputPlaceholder')}
              rows={1}
              className="min-h-11 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-natural-green/50 focus:bg-white focus:ring-2 focus:ring-natural-green/10"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
          </div>

          {/* Mic button */}
          <button
            type="button"
            id="mic-btn"
            onClick={toggleRecording}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all ${
              isRecording
                ? 'border-red-300 bg-red-50 text-red-500 shadow-md animate-pulse'
                : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100'
            }`}
            title={isRecording ? tChat('stopRecording') : tChat('startRecording')}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Send button */}
          <button
            type="submit"
            id="send-btn"
            disabled={!inputText.trim() || isLoading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-natural-green text-white shadow-md shadow-natural-green/20 transition-all hover:bg-natural-green-hover disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-gray-400">
          {tChat('footer')}
        </p>
      </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
