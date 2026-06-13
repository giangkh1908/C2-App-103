'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  CheckCircle,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Send,
  Sparkles,
  User,
  Volume2,
  X,
} from 'lucide-react';
import InteractiveSimulation from './InteractiveSimulation';
import type {
  ChatTurnResponse,
  MathDomain,
  PracticeQuestion,
  ResponseMode,
  TutorIntent,
  VisualData,
  VisualPriority,
} from '../types';

interface ChatFile {
  name: string;
  size: string;
  type: string;
  previewUrl?: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestampLabel: string;
  attachedFile?: ChatFile;
  source?: 'openai-ai' | 'presets';
  intent?: TutorIntent;
  responseMode?: ResponseMode;
  visualPriority?: VisualPriority;
  followUpSuggestions?: string[];
  concept?: string;
  title?: string;
  lifeExample?: string;
  visualData?: VisualData;
  practiceQuestion?: PracticeQuestion;
  practiceAnswerIdx?: number | null;
  practiceFeedbackChecked?: boolean;
}

interface TopicOption {
  id: MathDomain;
  label: string;
}

type SpeechRecognitionResultLike = {
  transcript: string;
};

type SpeechRecognitionEventLike = {
  results?: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type BrowserWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  webkitAudioContext?: typeof AudioContext;
};

const DEFAULT_TOPICS: TopicOption[] = [
  { id: 'multiplication', label: 'Phep nhan' },
  { id: 'division', label: 'Phep chia' },
  { id: 'fraction_basic', label: 'Phan so co ban' },
  { id: 'perimeter_area_basic', label: 'Chu vi va dien tich' },
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome_1',
  role: 'ai',
  text: 'Chao con. Co la gia su AI dong hanh cung con hoc Toan. Con cu hoi dieu con chua hieu, co se giai thich ngan gon va chi hien hinh minh hoa khi no that su giup con de hieu hon.',
  timestampLabel: 'San sang',
  source: 'presets',
  intent: 'explain_concept',
  responseMode: 'explain_only',
  visualPriority: 'low',
  followUpSuggestions: [
    'Giai thich phep nhan bang dia keo.',
    'Vi sao 3/4 lon hon 1/2?',
    'Phan biet chu vi va dien tich giup con.',
  ],
};

export default function AIExplanationChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number>(3);
  const [topics, setTopics] = useState<TopicOption[]>(DEFAULT_TOPICS);
  const [selectedTopic, setSelectedTopic] = useState<MathDomain | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<ChatFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1';

  const createTimestampLabel = () =>
    new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSearching]);

  useEffect(() => {
    const speechWindow = window as BrowserWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.lang = 'vi-VN';
    rec.interimResults = false;
    rec.onstart = () => setIsRecording(true);
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);
    rec.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognitionRef.current = rec;

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadTopics = async () => {
      try {
        const response = await fetch(`${backendBaseUrl}/topics`);
        if (!response.ok) {
          throw new Error('Khong tai duoc danh sach chu de');
        }

        const payload: { topics?: Array<{ id: MathDomain; label: string }> } = await response.json();
        if (isActive && payload.topics?.length) {
          setTopics(payload.topics);
        }
      } catch {
        if (isActive) {
          setTopics(DEFAULT_TOPICS);
        }
      }
    };

    loadTopics();

    return () => {
      isActive = false;
    };
  }, [backendBaseUrl]);

  const playSfx = (type: 'bell' | 'error' | 'sparkle') => {
    try {
      const audioWindow = window as BrowserWindow;
      const AudioCtx = window.AudioContext || audioWindow.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'bell') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === 'error') {
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
      // Ignore browser audio issues.
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInputText(text);
  };

  const toggleRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert('Trinh duyet hien chua ho tro ghi am. Con hay go cau hoi nhe.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      return;
    }

    recognition.start();
  };

  const speakVoice = (textToSpeak: string, msgId: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(textToSpeak.replace(/[\\/*_#]/g, ''));
    utter.lang = 'vi-VN';
    utter.rate = 0.95;
    utter.onend = () => setSpeakingMessageId(null);
    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utter);
  };

  const appendSelectedFiles = (fileList: FileList) => {
    const nextFiles: ChatFile[] = [];

    for (let index = 0; index < fileList.length; index += 1) {
      const file = fileList[index];
      nextFiles.push({
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        type: file.type,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    }

    setAttachedFiles((prev) => [...prev, ...nextFiles]);
    playSfx('sparkle');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      appendSelectedFiles(event.target.files);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(false);
    if (event.dataTransfer.files?.length) {
      appendSelectedFiles(event.dataTransfer.files);
    }
  };

  const createFallbackMessage = (promptText: string): Message => {
    const domain = inferDomainFromPrompt(promptText);

    const fallbackByDomain: Record<string, Omit<Message, 'id' | 'role' | 'timestamp'>> = {
      multiplication: {
        text: `Co dang dung preset an toan cho lop ${selectedGrade} vi AI that tam thoi gap van de. Minh van hoc tiep bang minh hoa phep nhan nhe.`,
        source: 'presets',
        intent: 'explain_concept',
        responseMode: 'explain_with_visual_and_practice',
        visualPriority: 'high',
        title: 'Minh hoa phep nhan bang nhom do vat',
        concept: '3 x 4',
        lifeExample: 'Con thu dem 3 dia, moi dia co 4 vien keo, roi nhin tong so vien keo de thay phep nhan la cach cong gon.',
        visualData: {
          type: 'candy',
          primaryCount: 3,
          secondaryCount: 4,
          totalCount: 12,
          groupsLabel: 'So nhom',
          itemsLabel: 'So vien moi nhom',
        },
        practiceQuestion: {
          id: 'fallback_mult_practice',
          questionText: 'Co 2 tui banh, moi tui co 5 chiec. Tong cong co bao nhieu chiec?',
          options: ['A. 7', 'B. 10', 'C. 12', 'D. 15'],
          correctAnswerIndex: 1,
          successMessage: 'Dung roi. 2 x 5 bang 10.',
          failMessage: 'Con thu dem lai theo 2 nhom, moi nhom 5 chiec nhe.',
          hint: 'So nhom nhan voi so vat moi nhom.',
        },
        followUpSuggestions: ['Giai thich de hon duoc khong?', 'Cho con vi du khac nhe.', 'Cho con xem hinh minh hoa khac.'],
        practiceAnswerIdx: null,
        practiceFeedbackChecked: false,
      },
      division: {
        text: `Co dang dung preset an toan cho lop ${selectedGrade} vi AI that tam thoi gap van de. Minh van hoc tiep bang minh hoa phep chia nhe.`,
        source: 'presets',
        intent: 'explain_concept',
        responseMode: 'explain_with_visual_and_practice',
        visualPriority: 'high',
        title: 'Minh hoa phep chia bang chia deu',
        concept: '12 : 3',
        lifeExample: 'Con co 12 qua tao va chia deu cho 3 ban. Minh nhin xem moi ban nhan bao nhieu qua nhe.',
        visualData: {
          type: 'apple',
          primaryCount: 12,
          secondaryCount: 3,
          totalCount: 4,
          groupsLabel: 'Tong so tao',
          itemsLabel: 'So ban',
        },
        practiceQuestion: {
          id: 'fallback_div_practice',
          questionText: 'Co 8 vien keo chia deu cho 2 ban. Moi ban duoc may vien?',
          options: ['A. 2', 'B. 3', 'C. 4', 'D. 6'],
          correctAnswerIndex: 2,
          successMessage: 'Dung roi. 8 chia 2 bang 4.',
          failMessage: 'Con thu chia deu 8 vien keo thanh 2 nhom nhe.',
          hint: 'Lay tong so vat chia cho so nhom.',
        },
        followUpSuggestions: ['Vi sao chia deu lai ra 4?', 'Cho con them mot vi du khac.', 'Giai thich de hon duoc khong?'],
        practiceAnswerIdx: null,
        practiceFeedbackChecked: false,
      },
      fraction_basic: {
        text: `Co dang dung preset an toan cho lop ${selectedGrade} vi AI that tam thoi gap van de. Minh van hoc tiep bang minh hoa phan so nhe.`,
        source: 'presets',
        intent: 'explain_concept',
        responseMode: 'explain_with_visual_and_practice',
        visualPriority: 'high',
        title: 'Minh hoa phan so bang pizza',
        concept: '3 / 5',
        lifeExample: 'Chiec pizza duoc cat thanh 5 mieng bang nhau. Neu con to mau 3 mieng thi do la 3/5.',
        visualData: {
          type: 'pizza',
          primaryCount: 3,
          secondaryCount: 5,
          totalCount: 0.6,
          groupsLabel: 'So phan da lay',
          itemsLabel: 'Tong so phan',
        },
        practiceQuestion: {
          id: 'fallback_frac_practice',
          questionText: 'To mau 2 phan trong tong 4 phan bang nhau la phan so nao?',
          options: ['A. 2/4', 'B. 4/2', 'C. 1/4', 'D. 4/4'],
          correctAnswerIndex: 0,
          successMessage: 'Dung roi. Da to 2 phan trong tong 4 phan nen la 2/4.',
          failMessage: 'Con nho tu so la phan da to, mau so la tong so phan nhe.',
          hint: 'So tren la so phan da lay.',
        },
        followUpSuggestions: ['Vi sao 3/5 lon hon 1/5?', 'Cho con vi du khac ve phan so.', 'Giai thich ngan hon duoc khong?'],
        practiceAnswerIdx: null,
        practiceFeedbackChecked: false,
      },
      perimeter_area_basic: {
        text: `Co dang dung preset an toan cho lop ${selectedGrade} vi AI that tam thoi gap van de. Minh van hoc tiep bang minh hoa chu vi va dien tich nhe.`,
        source: 'presets',
        intent: 'explain_concept',
        responseMode: 'explain_with_visual_and_practice',
        visualPriority: 'high',
        title: 'Minh hoa chu vi va dien tich bang o vuong',
        concept: '4 x 3',
        lifeExample: 'Con nhin mot hinh chu nhat dai 4 o, rong 3 o. So o ben trong giup hieu dien tich, duong bao quanh giup hieu chu vi.',
        visualData: {
          type: 'grid',
          primaryCount: 4,
          secondaryCount: 3,
          totalCount: 12,
          groupsLabel: 'Chieu dai',
          itemsLabel: 'Chieu rong',
        },
        practiceQuestion: {
          id: 'fallback_area_practice',
          questionText: 'Hinh chu nhat dai 5 o, rong 2 o co dien tich bao nhieu?',
          options: ['A. 7', 'B. 10', 'C. 12', 'D. 14'],
          correctAnswerIndex: 1,
          successMessage: 'Dung roi. Dien tich = 5 x 2 = 10.',
          failMessage: 'Con thu dem tong so o vuong ben trong hinh nhe.',
          hint: 'Lay chieu dai nhan chieu rong.',
        },
        followUpSuggestions: ['Phan biet chu vi voi dien tich giup con.', 'Cho con xem hinh minh hoa khac.', 'Giai thich de hon duoc khong?'],
        practiceAnswerIdx: null,
        practiceFeedbackChecked: false,
      },
    };

    return {
      id: `ai_fallback_${Date.now()}`,
      role: 'ai',
      timestampLabel: createTimestampLabel(),
      ...fallbackByDomain[domain],
    };
  };

  const handleSendMessage = async (event?: React.FormEvent) => {
    event?.preventDefault();

    const textQuery = inputText.trim();
    if (!textQuery && attachedFiles.length === 0) return;

    const attachedFile = attachedFiles[0];
    const promptText = attachedFile
      ? `[Da dinh kem tep: ${attachedFile.name}]. ${textQuery || 'Hay giai thich bai toan trong tep nay bang cach de hieu.'}`
      : textQuery;

    setInputText('');
    setAttachedFiles([]);

    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        role: 'user',
        text: textQuery || `Dinh kem tep: ${attachedFile?.name ?? ''}`,
        timestampLabel: createTimestampLabel(),
        attachedFile,
      },
    ]);
    setIsSearching(true);

    try {
      const response = await fetch(`${backendBaseUrl}/chat/turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'demo-user',
          session_id: sessionId,
          grade: selectedGrade,
          message: promptText,
          selected_topic: selectedTopic,
        }),
      });

      if (!response.ok) {
        throw new Error('Server khong phan hoi thanh cong.');
      }

      const payload: ChatTurnResponse = await response.json();
      setSessionId(payload.session_id);

      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'ai',
        text: payload.assistant_message,
        timestampLabel: createTimestampLabel(),
        source: 'openai-ai',
        intent: payload.intent,
        responseMode: payload.response_mode,
        visualPriority: payload.visual_card ? 'high' : 'low',
        followUpSuggestions: payload.follow_up_suggestions,
        concept: payload.detected_topic ?? undefined,
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
      };

      setMessages((prev) => [...prev, aiMessage]);
      playSfx('bell');
    } catch (error) {
      console.error(error);
      playSfx('error');
      setMessages((prev) => [...prev, createFallbackMessage(promptText)]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChoosePracticeAnswer = (msgId: string, optionIndex: number, correctIndex: number) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === msgId
          ? {
              ...message,
              practiceAnswerIdx: optionIndex,
              practiceFeedbackChecked: true,
            }
          : message,
      ),
    );

    playSfx(optionIndex === correctIndex ? 'sparkle' : 'error');
  };

  return (
    <div
      className={`flex h-[calc(100vh-80px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-[#FAF9F5] shadow-xl md:h-[720px] ${
        isDraggingOver ? 'ring-4 ring-[#4A6741]/40 border-[#4A6741]' : ''
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDraggingOver(false);
      }}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-between gap-3.5 border-b border-gray-200 bg-white px-5.5 py-4 shadow-2xs sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4A6741] font-serif font-black text-white shadow-lg shadow-[#4A6741]/10">
            AI
          </div>
          <div className="text-left">
            <h1 className="font-serif text-base font-bold italic leading-none text-gray-800 sm:text-lg">
              Gia su AI chat va minh hoa theo ngu canh
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#4A6741]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span>AI tra loi la trung tam, visual chi hien khi can</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-slate-50 px-2 py-1.5 text-xs font-bold">
          <span className="flex shrink-0 items-center gap-1.5 pl-2 text-gray-500">
            <GraduationCap className="h-3.5 w-3.5 text-[#FF8C42]" />
            Trinh do:
          </span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((grade) => (
              <button
                key={grade}
                onClick={() => {
                  setSelectedGrade(grade);
                  playSfx('sparkle');
                }}
                className={`flex h-7.5 w-7.5 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  selectedGrade === grade ? 'bg-[#4A6741] text-white shadow-md' : 'text-gray-600 hover:bg-gray-150'
                }`}
              >
                L{grade}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-gray-150 bg-[#F4F1E8] px-4.5 py-3">
        <button
          onClick={() => setSelectedTopic(null)}
          className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-tight transition-all ${
            selectedTopic === null
              ? 'border-[#4A6741] bg-[#4A6741] text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-[#4A6741]/30 hover:text-[#4A6741]'
          }`}
        >
          Tu do hoi
        </button>
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelectedTopic(topic.id)}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-tight transition-all ${
              selectedTopic === topic.id
                ? 'border-[#FF8C42] bg-[#FF8C42] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-[#FF8C42]/30 hover:text-[#FF8C42]'
            }`}
          >
            {topic.label}
          </button>
        ))}
      </div>

      <div className="relative flex-1 space-y-5 overflow-y-auto bg-radial from-white via-[#FAF9F5] to-white px-4.5 py-6">
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const showVisual = !isUser && message.responseMode !== 'explain_only' && message.visualData;
            const showPractice =
              !isUser && message.responseMode === 'explain_with_visual_and_practice' && message.practiceQuestion;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex max-w-full gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full border text-sm font-bold shadow-xs ${
                    isUser
                      ? 'border-amber-200 bg-amber-100 text-[#FF8C42]'
                      : 'border-[#4A6741]/20 bg-[#E9F0E6] text-[#4A6741]'
                  }`}
                >
                  {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                </div>

                <div className="flex max-w-[84%] flex-col gap-1.5 text-left sm:max-w-[76%]">
                  <div
                    className={`rounded-3xl px-5 py-4 shadow-3xs ${
                      isUser ? 'border border-amber-200 bg-amber-50 text-gray-850' : 'border border-gray-200/90 bg-white text-gray-850'
                    }`}
                  >
                    {!isUser && message.title && (
                      <div className="mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
                        <span className="text-xl">AI</span>
                        <h2 className="font-serif text-sm font-bold italic leading-tight text-gray-800 sm:text-base">
                          {message.title}
                        </h2>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap text-xs leading-relaxed font-normal sm:text-sm">{message.text}</div>

                    {isUser && message.attachedFile && (
                      <div className="mt-3.5 flex max-w-sm items-center gap-2 rounded-2xl border border-amber-200 bg-white/70 p-2">
                        {message.attachedFile.previewUrl ? (
                          <Image
                            src={message.attachedFile.previewUrl}
                            alt="preview"
                            width={48}
                            height={48}
                            unoptimized
                            className="h-12 w-12 rounded-xl border border-gray-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50">
                            <FileText className="h-5 w-5 text-[#FF8C42]" />
                          </div>
                        )}
                        <div className="overflow-hidden text-left">
                          <p className="truncate text-[10px] font-bold text-gray-700">{message.attachedFile.name}</p>
                          <span className="block text-[9px] font-bold text-gray-400">
                            {message.attachedFile.size} • {message.attachedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                          </span>
                        </div>
                      </div>
                    )}

                    {!isUser && message.lifeExample && (
                      <div className="mt-3.5 rounded-2xl border border-sky-150/40 bg-sky-50/50 p-3.5">
                        <h4 className="mb-1 text-[9px] font-black uppercase tracking-wider text-sky-500">Vi du gan gui:</h4>
                        <p className="text-[11px] font-medium leading-relaxed text-gray-700 sm:text-xs">{message.lifeExample}</p>
                      </div>
                    )}

                    {!isUser && message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap gap-2">
                        {message.followUpSuggestions.map((suggestion) => (
                          <button
                            key={`${message.id}_${suggestion}`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="rounded-full border border-[#4A6741]/20 bg-[#E9F0E6] px-3 py-1.5 text-[10px] font-black uppercase tracking-tight text-[#4A6741] transition-all hover:bg-[#dfe9da]"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {showPractice && (
                      <div className="mt-4 border-t border-gray-100 pt-4.5">
                        <div className="rounded-2xl border border-gray-150 bg-[#FAF9F5] p-3.5 text-left">
                          <p className="mb-1.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-500">
                            <span>On tap nhanh cung con</span>
                          </p>
                          <p className="mb-3 text-[11px] font-bold leading-relaxed text-gray-800 sm:text-xs">
                            {message.practiceQuestion.questionText}
                          </p>

                          <div className="space-y-1.5">
                            {message.practiceQuestion.options.map((option, optionIndex) => {
                              const isChecked = message.practiceAnswerIdx === optionIndex;
                              return (
                                <button
                                  key={option}
                                  onClick={() =>
                                    handleChoosePracticeAnswer(
                                      message.id,
                                      optionIndex,
                                      message.practiceQuestion!.correctAnswerIndex,
                                    )
                                  }
                                  className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-[11px] font-semibold transition-all ${
                                    isChecked
                                      ? 'border-[#4A6741] bg-emerald-50 text-[#4A6741]'
                                      : 'border-gray-200 bg-white text-gray-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{option}</span>
                                  {isChecked && <CheckCircle className="h-4 w-4 shrink-0 text-[#4A6741]" />}
                                </button>
                              );
                            })}
                          </div>

                          {message.practiceFeedbackChecked && message.practiceAnswerIdx !== null && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`mt-3 rounded-xl border p-3 text-[11px] font-medium leading-relaxed sm:text-xs ${
                                message.practiceAnswerIdx === message.practiceQuestion.correctAnswerIndex
                                  ? 'border-emerald-200 bg-emerald-50/75 text-emerald-800'
                                  : 'border-amber-150 bg-amber-50/75 text-amber-800'
                              }`}
                            >
                              <p className="mb-1 font-extrabold">
                                {message.practiceAnswerIdx === message.practiceQuestion.correctAnswerIndex
                                  ? 'Con lam tot lam!'
                                  : 'Khong sao, minh thu lai nhe:'}
                              </p>
                              <p>
                                {message.practiceAnswerIdx === message.practiceQuestion.correctAnswerIndex
                                  ? message.practiceQuestion.successMessage
                                  : message.practiceQuestion.failMessage}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`flex items-center gap-3.5 px-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[9px] font-bold tracking-tight text-gray-400">
                      {message.timestampLabel}
                    </span>

                    {!isUser && (
                      <button
                        onClick={() => speakVoice(`${message.text}. ${message.lifeExample ?? ''}`, message.id)}
                        className={`flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                          speakingMessageId === message.id
                            ? 'border-transparent bg-[#FF8C42] text-white'
                            : 'border-gray-200 text-gray-500 hover:text-[#4A6741]'
                        }`}
                      >
                        <Volume2 className={`h-3.5 w-3.5 ${speakingMessageId === message.id ? 'animate-pulse' : ''}`} />
                        <span>{speakingMessageId === message.id ? 'Tat phat am' : 'Nghe co giai thich'}</span>
                      </button>
                    )}
                  </div>

                  {showVisual && (
                    <motion.div
                      initial={{ scale: 0.96, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="mt-3.5 w-full max-w-lg border border-gray-100"
                    >
                      <InteractiveSimulation
                        key={`${message.id}_${message.visualData!.type}_${message.visualData!.primaryCount}_${message.visualData!.secondaryCount}`}
                        visualData={message.visualData!}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {isSearching && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3.5 text-left">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full border bg-[#E9F0E6] text-[#4A6741]">
                <Bot className="h-4.5 w-4.5 animate-bounce" />
              </div>
              <div className="rounded-3xl border bg-white px-5 py-3.5 text-gray-600 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#4A6741]" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#FF8C42]" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#4A6741]" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="pl-1 font-sans text-xs font-bold uppercase tracking-wider text-[#4A6741]">
                    Co dang nghi cach giai thich de con de hieu hon...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2.5 border-t border-gray-100 bg-white p-3">
          {attachedFiles.map((file, index) => (
            <div
              key={`${file.name}_${index}`}
              className="group relative flex items-center gap-2 rounded-2xl border border-gray-200 bg-slate-50 px-3 py-1.5 text-left shadow-2xs"
            >
              {file.previewUrl ? (
                <Image
                  src={file.previewUrl}
                  alt="prev"
                  width={28}
                  height={28}
                  unoptimized
                  className="h-7 w-7 rounded-lg object-cover"
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="max-w-[120px] truncate text-[10px] font-bold text-gray-700">{file.name}</p>
                <span className="mt-0.5 block text-[8px] font-bold leading-none text-gray-400">{file.size}</span>
              </div>
              <button onClick={() => removeFile(index)} className="ml-1 cursor-pointer text-gray-400 transition-colors hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto whitespace-nowrap border-t border-gray-150 bg-white px-4.5 py-2.5 shadow-inner">
        {[
          'Giai thich phep nhan 4 x 3 bang dia keo.',
          'Vi sao 12 chia 4 lai bang 3?',
          'Cho con hieu 3/5 bang hinh pizza.',
          'Phan biet chu vi va dien tich bang o vuong.',
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSuggestionClick(suggestion)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-[#FAF9F5] px-3 py-1.5 text-[10px] font-black uppercase tracking-tight text-gray-600 shadow-3xs transition-all hover:border-[#4A6741]/30 hover:bg-[#E9F0E6] hover:text-[#4A6741]"
          >
            <Sparkles className="h-3 w-3 text-[#FF8C42]" />
            <span>{suggestion}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-3.5">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt,.docx"
            multiple
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-gray-200 text-gray-500 shadow-3xs transition-all hover:border-[#4A6741]/20 hover:bg-[#E9F0E6]/30 hover:text-[#4A6741]"
            title="Dinh kem tep"
          >
            <Paperclip className="h-4.5 w-4.5 transition-transform duration-200 group-hover:rotate-12" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="Hoi co ve dia keo, chia tao, pizza, o vuong..."
            className="h-11 flex-1 rounded-2xl border border-gray-200 bg-slate-50/50 px-4 text-xs font-medium text-gray-850 shadow-inner focus:border-[#4A6741] focus:outline-none focus:ring-1 focus:ring-[#4A6741] sm:text-sm"
            disabled={isSearching}
          />

          <button
            type="button"
            onClick={toggleRecording}
            className={`relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border shadow-3xs transition-all ${
              isRecording
                ? 'border-transparent bg-red-500 text-white ring-4 ring-red-200'
                : 'border-gray-200 text-gray-500 hover:bg-amber-50/30 hover:text-[#FF8C42]'
            }`}
            title="Noi truc tiep"
          >
            <Mic className="h-4.5 w-4.5" />
          </button>

          <button
            type="submit"
            disabled={(!inputText.trim() && attachedFiles.length === 0) || isSearching}
            className={`flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl px-5 text-xs font-bold text-white transition-all ${
              (!inputText.trim() && attachedFiles.length === 0) || isSearching
                ? 'cursor-not-allowed bg-gray-200 text-gray-400 shadow-none'
                : 'scale-100 cursor-pointer bg-[#4A6741] shadow-md shadow-[#4a6741]/10 hover:bg-[#3D5435] active:scale-97'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Gui hoi</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function inferDomainFromPrompt(promptText: string): 'multiplication' | 'division' | 'fraction_basic' | 'perimeter_area_basic' {
  const normalized = promptText.toLowerCase();

  if (
    normalized.includes('phan so') ||
    normalized.includes('pizza') ||
    normalized.includes('1/') ||
    normalized.includes('2/') ||
    normalized.includes('3/') ||
    normalized.includes('4/') ||
    normalized.includes('5/')
  ) {
    return 'fraction_basic';
  }

  if (
    normalized.includes('chu vi') ||
    normalized.includes('dien tich') ||
    normalized.includes('hinh chu nhat') ||
    normalized.includes('o vuong')
  ) {
    return 'perimeter_area_basic';
  }

  if (
    normalized.includes('chia') ||
    normalized.includes('chia deu') ||
    normalized.includes(':')
  ) {
    return 'division';
  }

  return 'multiplication';
}
