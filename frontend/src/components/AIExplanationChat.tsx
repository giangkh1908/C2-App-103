'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import {
  Bot,
  GraduationCap,
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
import InteractiveSimulation from './InteractiveSimulation';
import type {
  ChatTurnResponse,
  MathDomain,
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

interface TopicOption {
  id: MathDomain;
  label: string;
  emoji: string;
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

const TOPIC_META: Array<{ id: MathDomain; emoji: string }> = [
  { id: 'multiplication', emoji: '✖️' },
  { id: 'division', emoji: '➗' },
  { id: 'fraction_basic', emoji: '🍕' },
  { id: 'perimeter_area_basic', emoji: '📐' },
];

const TOPIC_EMOJIS = new Map(TOPIC_META.map((topic) => [topic.id, topic.emoji]));

function buildWelcomeMessage(tChat: (key: string) => string): Message {
  return {
  id: 'welcome_1',
  role: 'ai',
  text: tChat('welcome'),
  timestampLabel: tChat('ready'),
  responseMode: 'explain_only',
  followUpSuggestions: [
    tChat('suggestions.multiply'),
    tChat('suggestions.compareFractions'),
    tChat('suggestions.perimeterArea'),
    tChat('suggestions.division'),
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

// Simple markdown to JSX — handles **bold**, *italic*, numbered lists, bullet lists
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ol' | 'ul' | null = null;

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    if (listType === 'ol') {
      nodes.push(
        <ol key={key} className="my-2 ml-4 list-decimal space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-xs sm:text-sm leading-relaxed">{renderInline(item)}</li>
          ))}
        </ol>
      );
    } else {
      nodes.push(
        <ul key={key} className="my-2 ml-4 list-disc space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-xs sm:text-sm leading-relaxed">{renderInline(item)}</li>
          ))}
        </ul>
      );
    }
    listItems = [];
    listType = null;
  };

  lines.forEach((line, idx) => {
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    const bulletMatch = line.match(/^[-*]\s+(.+)/);

    if (numberedMatch) {
      if (listType !== 'ol') { flushList(`list-${idx}`); listType = 'ol'; }
      listItems.push(numberedMatch[2]);
    } else if (bulletMatch) {
      if (listType !== 'ul') { flushList(`list-${idx}`); listType = 'ul'; }
      listItems.push(bulletMatch[1]);
    } else {
      flushList(`list-${idx}`);
      if (line.trim() === '') {
        nodes.push(<br key={`br-${idx}`} />);
      } else {
        nodes.push(
          <p key={`p-${idx}`} className="text-xs sm:text-sm leading-relaxed mb-1">
            {renderInline(line)}
          </p>
        );
      }
    }
  });
  flushList('list-end');
  return nodes;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1]) parts.push(<strong key={key++} className="font-bold">{match[1]}</strong>);
    else if (match[2]) parts.push(<em key={key++} className="italic">{match[2]}</em>);
    else if (match[3]) parts.push(<code key={key++} className="rounded bg-gray-100 px-1 font-mono text-[11px]">{match[3]}</code>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
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


function AiMessage({ message, onSuggestionClick, onAnswerChoice, onSpeak, isSpeaking }: {
  message: Message;
  onSuggestionClick: (text: string) => void;
  onAnswerChoice: (msgId: string, optIdx: number, correctIdx: number) => void;
  onSpeak: (text: string, id: string) => void;
  isSpeaking: boolean;
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
        <div className="rounded-2xl rounded-tl-sm border border-gray-200/90 bg-white px-4 py-3.5 shadow-xs">
          <div className="prose-xs">{renderMarkdown(message.text)}</div>
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
  const t = useTranslations('learn');
  const { apiFetch } = useAuth();
  const tChat = useTranslations('learn.chat');
  const speechLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const localizeTopic = useCallback((topic: { id: MathDomain }): TopicOption => ({
    id: topic.id,
    label: t(`topics.${topic.id}`),
    emoji: TOPIC_EMOJIS.get(topic.id) ?? '📚',
  }), [t]);
  const welcomeMessage = useMemo(() => buildWelcomeMessage(tChat), [tChat]);

  const [messages, setMessages] = useState<Message[]>(() => [welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(3);
  const [topicIds, setTopicIds] = useState<MathDomain[]>(() => TOPIC_META.map((topic) => topic.id));
  const [selectedTopic, setSelectedTopic] = useState<MathDomain | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1';
  const topics = useMemo(() => topicIds.map((id) => localizeTopic({ id })), [topicIds, localizeTopic]);

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

  // Load topics from backend
  useEffect(() => {
    let active = true;
    fetch(`${backendUrl}/topics`)
      .then((r) => r.json())
      .then((data: { topics?: Array<{ id: MathDomain; label?: string }> }) => {
        if (active && data.topics?.length) {
          setTopicIds(data.topics.map((topic) => topic.id));
        }
      })
      .catch(() => { /* use defaults */ });
    return () => { active = false; };
  }, [backendUrl]);

  const handleSpeak = useCallback((text: string, id: string) => {
    if (!window.speechSynthesis) return;
    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[\\/*_#]/g, ''));
    utter.lang = speechLocale;
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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

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

    try {
      const res = await apiFetch('/chat/turn', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          grade: selectedGrade,
          message: text,
          selected_topic: selectedTopic,
        }),
      });

      if (!res.ok) throw new Error('Server error');

      const payload: ChatTurnResponse = await res.json();
      setSessionId(payload.session_id);

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
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

      setMessages((prev) => [...prev, aiMsg]);
      playSfx('bell');
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          role: 'ai',
          text: tChat('connectionError'),
          timestampLabel: createTimestamp(locale),
          responseMode: 'explain_only',
          followUpSuggestions: [tChat('retrySuggestion'), tChat('chooseTopicSuggestion')],
        },
      ]);
      playSfx('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-[#FAF9F5] shadow-xl">
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

        {/* Grade selector */}
        <div className="flex w-full items-center justify-between gap-2 rounded-full border border-gray-200 bg-slate-50 px-2 py-1.5 text-xs font-bold sm:w-auto sm:justify-start">
          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-natural-orange" />
          <span className="text-gray-500">{tChat('gradeLabel')}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((g) => (
              <button
                key={g}
                id={`grade-btn-${g}`}
                onClick={() => { setSelectedGrade(g); playSfx('sparkle'); }}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  selectedGrade === g
                    ? 'bg-natural-green text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Topic bar ── */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-gray-100 bg-[#F4F1E8] px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          id="topic-btn-all"
          onClick={() => setSelectedTopic(null)}
          className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-tight transition-all ${
            selectedTopic === null
              ? 'border-natural-green bg-natural-green text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-natural-green/30 hover:text-natural-green'
          }`}
        >
          {tChat('freeTopic')}
        </button>
        {topics.map((topic) => (
          <button
            key={topic.id}
            id={`topic-btn-${topic.id}`}
            onClick={() => setSelectedTopic(topic.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-tight transition-all ${
              selectedTopic === topic.id
                ? 'border-natural-orange bg-natural-orange text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-natural-orange/30 hover:text-natural-orange'
            }`}
          >
            <span>{topic.emoji}</span>
            {topic.label}
          </button>
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
              />
            );
          })}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-natural-green/20 bg-natural-green-tint text-natural-green">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-5 py-4 shadow-xs">
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
            </div>
          </motion.div>
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
  );
}
