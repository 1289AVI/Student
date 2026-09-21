import React, { useState, useEffect, useRef } from 'react';
import { Question, ExamAttempt } from '../../types';
import { CircularClock } from './CircularClock';
import {
  Timer,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Flag,
  HelpCircle,
  KeyRound,
  Snowflake,
  Award,
  BookOpen,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveExamProps {
  questions: Question[];
  timeLimitMinutes: number;
  studentName: string;
  studentId: string;
  studentClass?: string;
  studentRoll?: string;
  onFinishExam: (attempt: ExamAttempt) => void;
  onCancelExam: () => void;
  onOpenAnswerKey?: () => void;
}

export const LiveExam: React.FC<LiveExamProps> = ({
  questions,
  timeLimitMinutes,
  studentName,
  studentId,
  studentClass,
  studentRoll,
  onFinishExam,
  onCancelExam,
  onOpenAnswerKey,
}) => {
  const totalSecondsAllocated = Math.max(timeLimitMinutes * 60, 30);
  const [secondsRemaining, setSecondsRemaining] = useState(totalSecondsAllocated);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Freeze state when time is up or exam ended
  const [isFrozen, setIsFrozen] = useState(false);
  const [showAnswerKeyInExam, setShowAnswerKeyInExam] = useState(false);
  const [computedAttempt, setComputedAttempt] = useState<ExamAttempt | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);
  const answersRef = useRef<Record<string, string>>({});
  const markedForReviewRef = useRef<string[]>([]);

  const currentQ = questions[currentIndex];

  // Helper to calculate score and attempt without stale closures
  const computeFinalScore = (isTimedOut = false) => {
    const currentAnswers = answersRef.current;
    const currentMarked = markedForReviewRef.current;
    const timeSpentSeconds = isTimedOut
      ? totalSecondsAllocated
      : Math.min(
          totalSecondsAllocated,
          Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        );

    let correctCount = 0;
    let attemptedCount = 0;

    questions.forEach((q) => {
      const studentAns = currentAnswers[q.id];
      if (studentAns !== undefined && studentAns !== null && studentAns.trim() !== '') {
        attemptedCount++;
        if (studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          correctCount++;
        }
      }
    });

    const incorrectCount = attemptedCount - correctCount;
    const unansweredCount = questions.length - attemptedCount;
    const score = correctCount;
    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const accuracyOnAttempt = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    const attempt: ExamAttempt = {
      id: 'attempt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      studentName,
      studentId,
      studentClass: studentClass || 'Class V',
      studentRoll: studentRoll || '01',
      startTime: new Date(startTimeRef.current).toISOString(),
      endTime: new Date().toISOString(),
      totalQuestions: questions.length,
      timeAllocatedSeconds: totalSecondsAllocated,
      timeSpentSeconds,
      answers: currentAnswers,
      markedForReview: currentMarked,
      score,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      attemptedCount,
      accuracyOnAttempt,
      completedDueToTimeout: isTimedOut,
      questionSnapshots: questions,
    };

    return attempt;
  };

  // Timer countdown
  useEffect(() => {
    if (isFrozen) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpiredFreeze();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFrozen]);

  // Handle completion when timer hits 0 (time is complete before exam complete)
  const handleTimeExpiredFreeze = () => {
    setIsFrozen(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const finalAttempt = computeFinalScore(true);
    setComputedAttempt(finalAttempt);
    onFinishExam(finalAttempt);

    if (finalAttempt.percentage >= 70) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }
      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      } else if (!isFrozen && ['1', '2', '3', '4'].includes(e.key)) {
        const optIndex = parseInt(e.key, 10) - 1;
        if (currentQ?.options?.[optIndex]) {
          handleSelectOption(currentQ.id, currentQ.options[optIndex]);
        }
      } else if (!isFrozen && ['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const optIndex = e.key.toLowerCase().charCodeAt(0) - 97;
        if (currentQ?.options?.[optIndex]) {
          handleSelectOption(currentQ.id, currentQ.options[optIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQ, questions.length, isFrozen]);

  const handleSelectOption = (qId: string, optionText: string) => {
    if (isFrozen) return; // Frozen: cannot change answer
    setAnswers((prev) => {
      const next = {
        ...prev,
        [qId]: optionText,
      };
      answersRef.current = next;
      return next;
    });
  };

  const handleClearOption = (qId: string) => {
    if (isFrozen) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      answersRef.current = copy;
      return copy;
    });
  };

  const handleToggleMarkReview = (qId: string) => {
    setMarkedForReview((prev) => {
      const next = prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId];
      markedForReviewRef.current = next;
      return next;
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.values(answers).filter((val) => Boolean(val && val.trim())).length;
  const markedCount = markedForReview.length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  const handleManualSubmit = () => {
    setShowSubmitModal(false);
    setIsFrozen(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const finalAttempt = computeFinalScore(false);
    setComputedAttempt(finalAttempt);
    onFinishExam(finalAttempt);

    if (finalAttempt.percentage >= 70) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
  };

  const isLowTime = secondsRemaining <= 60 && !isFrozen;
  const isUrgent = secondsRemaining <= 30 && !isFrozen;

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Questions Available</h3>
        <p className="text-sm text-slate-500">
          There are no questions configured for this examination yet. Please return to setup and select another topic or wait for the setter to upload questions.
        </p>
        <button
          type="button"
          onClick={onCancelExam}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
        >
          Return to Exam Setup
        </button>
      </div>
    );
  }

  return (
    <div id="live-exam-interface" className="max-w-6xl mx-auto space-y-6">
      {/* FROZEN STATE BANNER (When Time Expired or Exam Submitted) */}
      {isFrozen && (
        <div
          id="exam-frozen-banner"
          className="rounded-2xl p-6 bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white shadow-xl border-2 border-sky-400/50 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center shrink-0">
                <Snowflake className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-200 text-xs font-bold uppercase tracking-wider mb-1">
                  Time Expired • Exam Ended
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Questions Are Frozen
                </h2>
                <p className="text-xs text-sky-200/80">
                  The examination timer has ended. All responses are locked and cannot be altered.
                </p>
              </div>
            </div>

            {/* Total Score & Attempt Display */}
            {computedAttempt && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shrink-0">
                <Award className="w-8 h-8 text-amber-300 shrink-0" />
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-sky-200 block font-bold">
                    Attempt: {computedAttempt.attemptedCount ?? (computedAttempt.correctCount + computedAttempt.incorrectCount)} / {computedAttempt.totalQuestions}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white">
                      {computedAttempt.score}
                    </span>
                    <span className="text-sm font-semibold text-sky-200">
                      / {computedAttempt.totalQuestions} Marks
                    </span>
                    <span className="text-xs font-bold text-emerald-300 ml-1">
                      ({computedAttempt.percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Row with Active Answer Key Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sky-800/60">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 font-bold">
                Attempt: {computedAttempt?.attemptedCount ?? ((computedAttempt?.correctCount || 0) + (computedAttempt?.incorrectCount || 0))}/{computedAttempt?.totalQuestions || 0}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold">
                ✓ Correct: {computedAttempt?.correctCount || 0}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-400/30 text-rose-300 font-bold">
                ✗ Incorrect: {computedAttempt?.incorrectCount || 0}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-500/20 border border-slate-400/30 text-slate-300 font-bold">
                ○ Unattempted: {computedAttempt?.unansweredCount || 0}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Button to toggle answer key on the current frozen questions */}
              <button
                type="button"
                id="toggle-reveal-answer-key-btn"
                onClick={() => setShowAnswerKeyInExam((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  showAnswerKeyInExam
                    ? 'bg-teal-400 text-teal-950 border-teal-300 shadow-md ring-2 ring-teal-300/40'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                {showAnswerKeyInExam ? 'Hide Verified Answers' : 'Reveal Answers on Question Paper'}
              </button>

              {/* Primary Active Answer Key Button (opens full Answer Key Tab) */}
              <button
                type="button"
                id="active-answer-key-btn"
                onClick={() => {
                  if (onOpenAnswerKey) {
                    onOpenAnswerKey();
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-slate-950" />
                Active Answer Key & Explanations
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Fixed Control Bar */}
      <div className="sticky top-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-md p-4 flex items-center justify-between gap-4">
        {/* Progress Info */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
              isFrozen
                ? 'bg-sky-100 text-sky-800 ring-1 ring-sky-300'
                : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            {currentIndex + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium block">
                Question {currentIndex + 1} of {questions.length}
              </span>
              {isFrozen && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  Frozen
                </span>
              )}
            </div>
            <div className="w-32 sm:w-44 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isFrozen ? 'bg-sky-500' : 'bg-indigo-600'
                }`}
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Live Timer or Frozen indicator */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
            isFrozen
              ? 'bg-sky-50 border-sky-300 text-sky-800'
              : isUrgent
              ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
              : isLowTime
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          {isFrozen ? (
            <>
              <Snowflake className="w-4 h-4 text-sky-600" />
              <span>00:00 (Frozen)</span>
            </>
          ) : (
            <>
              <Timer className={`w-4 h-4 ${isUrgent ? 'text-rose-600' : 'text-slate-500'}`} />
              <span>{formatTime(secondsRemaining)}</span>
            </>
          )}
        </div>

        {/* Submit & Exit Buttons */}
        <div className="flex items-center gap-2">
          {!isFrozen ? (
            <>
              <button
                type="button"
                id="mark-review-btn"
                onClick={() => handleToggleMarkReview(currentQ.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  markedForReview.includes(currentQ.id)
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {markedForReview.includes(currentQ.id) ? 'Marked' : 'Review Later'}
                </span>
              </button>

              <button
                type="button"
                id="finish-exam-trigger-btn"
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Submit Exam
              </button>
            </>
          ) : (
            <button
              type="button"
              id="top-active-answer-key-btn"
              onClick={() => onOpenAnswerKey && onOpenAnswerKey()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Answer Key
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Question Card (Left) + Right Column (Clock + Palette) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Question Pane (Left/Top) */}
        <div
          className={`lg:col-span-8 rounded-2xl border p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between min-h-[500px] transition-all ${
            isFrozen
              ? 'bg-slate-50/90 border-sky-200 ring-2 ring-sky-100 shadow-sm relative'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="space-y-5">
            {/* Frozen Notice Bar above Question */}
            {isFrozen && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-100/70 border border-sky-200 text-sky-900 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Snowflake className="w-4 h-4 text-sky-600" />
                  Questions are frozen — answers cannot be edited.
                </span>
                {computedAttempt && (
                  <span className="font-bold text-sky-950">
                    Total Score: {computedAttempt.score} / {computedAttempt.totalQuestions}
                  </span>
                )}
              </div>
            )}

            {/* Question Meta Badge */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                  {currentQ.topic}
                </span>
                <span className="text-xs font-medium text-slate-500 capitalize px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                  {currentQ.difficulty}
                </span>
              </div>

              {!isFrozen && answers[currentQ.id] && (
                <button
                  type="button"
                  onClick={() => handleClearOption(currentQ.id)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Question Title */}
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
              {currentQ.question}
            </h3>

            {/* 4 Radio Options (Disabled if isFrozen) */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isSelected = answers[currentQ.id] === opt;
                const isCorrect =
                  opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

                // Distinct styling if answer key is revealed in frozen state
                let optionClasses =
                  'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800';

                if (isFrozen && showAnswerKeyInExam) {
                  if (isCorrect) {
                    optionClasses =
                      'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-400/30';
                  } else if (isSelected && !isCorrect) {
                    optionClasses =
                      'border-rose-400 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-300';
                  } else {
                    optionClasses = 'border-slate-200 bg-slate-50 text-slate-500 opacity-60';
                  }
                } else if (isSelected) {
                  optionClasses = isFrozen
                    ? 'border-sky-500 bg-sky-50/70 text-sky-950 font-semibold ring-2 ring-sky-300/30'
                    : 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold ring-2 ring-indigo-500/20 shadow-xs';
                } else if (isFrozen) {
                  optionClasses = 'border-slate-200 bg-white text-slate-600 opacity-80';
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    id={`exam-option-${optIdx}`}
                    disabled={isFrozen}
                    onClick={() => handleSelectOption(currentQ.id, opt)}
                    className={`w-full flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${optionClasses} ${
                      isFrozen ? 'cursor-default pointer-events-none' : 'cursor-pointer'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isFrozen && showAnswerKeyInExam && isCorrect
                          ? 'bg-emerald-600 text-white'
                          : isFrozen && showAnswerKeyInExam && isSelected && !isCorrect
                          ? 'bg-rose-600 text-white'
                          : isSelected
                          ? isFrozen
                            ? 'bg-sky-700 text-white'
                            : 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {letter}
                    </div>

                    <span className="text-sm flex-1 leading-snug">{opt}</span>

                    {/* Status icons when answer key active */}
                    {isFrozen && showAnswerKeyInExam ? (
                      isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Correct Answer
                        </span>
                      ) : isSelected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md shrink-0">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Your Choice
                        </span>
                      ) : null
                    ) : (
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? isFrozen
                              ? 'border-sky-600 bg-sky-600'
                              : 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Key Explanation Box (Revealed if toggled or requested) */}
            {isFrozen && showAnswerKeyInExam && (
              <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 text-xs text-teal-950 space-y-1.5 mt-3 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-teal-900 text-sm">
                  <KeyRound className="w-4 h-4 text-teal-700" />
                  Verified Answer Key & Explanation
                </div>
                <p className="font-semibold text-teal-900">
                  Correct Answer: <span className="underline">{currentQ.correctAnswer}</span>
                </p>
                <p className="text-teal-800 leading-relaxed">
                  {currentQ.answerKeyExplanation}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Controls Bottom */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              id="prev-question-btn"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentIndex === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-xs text-slate-400 font-medium">
              {isFrozen
                ? 'Exam Finished • Reviewing Frozen Paper'
                : 'Tip: Use 1-4 or A-D keys to answer'}
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                id="next-question-btn"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : !isFrozen ? (
              <button
                type="button"
                id="submit-final-question-btn"
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              >
                Submit Exam
                <CheckCircle2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="finish-review-btn"
                onClick={() => onOpenAnswerKey && onOpenAnswerKey()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all cursor-pointer"
              >
                View Full Answer Key
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR: Circular Analog Clock + Question Palette */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Circular Analog Clock Component on Right Side */}
          <CircularClock
            totalSeconds={totalSecondsAllocated}
            secondsRemaining={secondsRemaining}
            isRunning={!isFrozen}
            isFrozen={isFrozen}
          />

          {/* 2. Question Palette */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">Question Palette</h4>
              {isFrozen && (
                <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                  Locked
                </span>
              )}
            </div>

            {/* Palette Summary Legend */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="block text-emerald-800 font-bold text-base">{answeredCount}</span>
                <span className="text-[11px] text-emerald-700">Answered</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                <span className="block text-amber-800 font-bold text-base">{markedCount}</span>
                <span className="text-[11px] text-amber-700">Review</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-slate-700 font-bold text-base">{unansweredCount}</span>
                <span className="text-[11px] text-slate-500">Unanswered</span>
              </div>
            </div>

            {/* Numbers Grid */}
            <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = Boolean(answers[q.id]);
                const isMarked = markedForReview.includes(q.id);
                const isCorrect =
                  answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

                let bgClasses = 'bg-slate-100 text-slate-600 hover:bg-slate-200';

                if (isFrozen && showAnswerKeyInExam) {
                  if (isCorrect) {
                    bgClasses = 'bg-emerald-600 text-white font-bold';
                  } else if (isAnswered) {
                    bgClasses = 'bg-rose-500 text-white font-bold';
                  } else {
                    bgClasses = 'bg-slate-200 text-slate-500';
                  }
                } else if (isMarked) {
                  bgClasses = 'bg-amber-100 text-amber-800 font-bold border border-amber-300';
                } else if (isAnswered) {
                  bgClasses = 'bg-emerald-600 text-white font-bold';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    id={`palette-btn-${idx}`}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${bgClasses} ${
                      isCurrent ? 'ring-2 ring-offset-2 ring-indigo-600 shadow-xs' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Candidate Details */}
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <p>Candidate: <strong className="text-slate-700">{studentName}</strong></p>
              <p>ID / Roll: <strong className="text-slate-700">{studentId}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Submit */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Flag className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Ready to Submit Exam?</h3>
              <p className="text-xs text-slate-500 mt-1">
                You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
                {unansweredCount > 0 && (
                  <span className="block text-amber-600 font-semibold mt-1">
                    {unansweredCount} question(s) remain unanswered!
                  </span>
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Time Remaining:</span>
                <span className="font-bold text-slate-800">{formatTime(secondsRemaining)}</span>
              </div>
              <div className="flex justify-between">
                <span>Marked for Review:</span>
                <span className="font-bold text-amber-700">{markedCount} questions</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                id="cancel-submit-modal-btn"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Return to Exam
              </button>
              <button
                type="button"
                id="confirm-submit-exam-btn"
                onClick={handleManualSubmit}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
              >
                Yes, Submit & Freeze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

