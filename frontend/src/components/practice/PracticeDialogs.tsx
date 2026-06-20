"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { CheckCircle2, RotateCcw, X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import type { ResumeChoiceState } from "./usePracticeWorkspace";
import { formatDateTime } from "./practice-utils";

interface ModalShellProps {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
}

function ModalShell({ title, description, children, onClose, closeLabel }: ModalShellProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#203049]/35 px-4 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="w-full max-w-lg rounded-[24px] border border-[#D9D4C7] bg-white p-6 shadow-[0_24px_60px_rgba(32,48,73,0.18)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id={titleId} className="text-2xl font-bold text-[#203049]">{title}</h3>
            <p id={descriptionId} className="mt-2 text-sm leading-7 text-[#616A63]">{description}</p>
          </div>
          <button ref={closeRef} type="button" aria-label={closeLabel} onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D9D4C7] text-[#5A645D] transition hover:bg-[#FBF8F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587849]/30">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </motion.div>
    </div>
  );
}

interface PracticeDialogsProps {
  resumeChoice: ResumeChoiceState | null;
  missingAnswerCount: number | null;
  onCloseResume: () => void;
  onContinue: () => void;
  onRestart: () => void;
  onCloseSubmit: () => void;
  onConfirmSubmit: () => void;
}

export default function PracticeDialogs({
  resumeChoice,
  missingAnswerCount,
  onCloseResume,
  onContinue,
  onRestart,
  onCloseSubmit,
  onConfirmSubmit,
}: PracticeDialogsProps) {
  const locale = useLocale();
  const t = useTranslations("practice");

  if (resumeChoice) {
    return (
      <ModalShell title={t("resume.title")} description={t("resume.description")} onClose={onCloseResume} closeLabel={t("close")}>
        <div className="rounded-xl bg-[#FBF8F0] px-4 py-4 text-sm leading-7 text-[#5F685F]">
          {t("resume.info", {
            time: formatDateTime(resumeChoice.attempt.updated_at, locale),
            count: resumeChoice.attempt.answers.length,
            total: resumeChoice.attempt.questions.length,
          })}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onContinue} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#587849] px-5 text-sm font-bold text-white">
            <CheckCircle2 className="h-4 w-4" />
            {t("resume.continue")}
          </button>
          <button type="button" onClick={onRestart} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#D9D4C7] px-5 text-sm font-semibold text-[#59635C]">
            <RotateCcw className="h-4 w-4" />
            {t("resume.restart")}
          </button>
        </div>
      </ModalShell>
    );
  }

  if (missingAnswerCount !== null) {
    return (
      <ModalShell title={t("confirm.title")} description={t("confirm.description", { count: missingAnswerCount })} onClose={onCloseSubmit} closeLabel={t("close")}>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCloseSubmit} className="min-h-12 rounded-xl border border-[#D9D4C7] px-5 text-sm font-semibold text-[#59635C]">{t("confirm.goBack")}</button>
          <button type="button" onClick={onConfirmSubmit} className="min-h-12 rounded-xl bg-[#587849] px-5 text-sm font-bold text-white">{t("confirm.submit")}</button>
        </div>
      </ModalShell>
    );
  }

  return null;
}
