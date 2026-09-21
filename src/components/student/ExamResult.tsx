import React from 'react';
import { ExamAttempt } from '../../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  KeyRound,
  RotateCcw,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface ExamResultProps {
  attempt: ExamAttempt;
  onOpenAnswerKey: () => void;
  onRetakeExam: () => void;
}

export const ExamResult: React.FC<ExamResultProps> = ({
  attempt,
  onOpenAnswerKey,
  onRetakeExam,
}) => {
  const isPass = attempt.percentage >= 60;
  const isMastery = attempt.percentage >= 85;

  const totalQuestions = attempt.totalQuestions || 1;
  const attemptedCount =
    attempt.attemptedCount !== undefined
      ? attempt.attemptedCount
      : attempt.correctCount + attempt.incorrectCount;
  const correctCount = attempt.correctCount;
  const incorrectCount = attempt.incorrectCount;
  const unansweredCount =
    attempt.unansweredCount !== undefined
      ? attempt.unansweredCount
      : Math.max(0, totalQuestions - attemptedCount);

  const accuracyOnAttempt =
    attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const isTimedOut = Boolean(
    attempt.completedDueToTimeout ||
      (attempt.timeAllocatedSeconds > 0 &&
        attempt.timeSpentSeconds >= attempt.timeAllocatedSeconds)
  );

  const formatSecs = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="student-exam-result-card">
      {/* Time Expired Notice if applicable */}
      {isTimedOut && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Exam Time Completed Before Submission</p>
              <p className="text-xs text-amber-700">
                Your responses have been locked and evaluated. Attempted questions and marks were counted according to what you answered before the timer expired.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 text-xs font-extrabold shrink-0">
            Time Expired
          </span>
        </div>
      )}

      {/* Hero Result Banner */}
      <div
        className={`rounded-2xl p-8 text-center text-white shadow-xl space-y-4 ${
          isMastery
            ? 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900'
            : isPass
            ? 'bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-900'
            : 'bg-gradient-to-br from-slate-800 via-slate-900 to-rose-950'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto border border-white/20">
          <Award className="w-8 h-8 text-amber-300" />
        </div>

        <div className="space-y-2">
          {/* Explicit Attempt Pill like 10/12 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold shadow-xs">
            <span className="uppercase tracking-wider text-white/80">Attempt:</span>
            <span className="text-amber-300 text-sm font-black">
              {attemptedCount} / {totalQuestions}
            </span>
            <span className="text-white/70">
              ({Math.round((attemptedCount / totalQuestions) * 100)}% of paper)
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
            Marks: {attempt.score} / {totalQuestions}
          </h2>

          <p className="text-lg sm:text-xl font-bold text-white/90">
            Total Score: {attempt.percentage}% •{' '}
            {isMastery
              ? 'Outstanding Distinction'
              : isPass
              ? 'Passed Assessment'
              : 'Needs Further Review'}
          </p>
        </div>

        <p className="text-xs sm:text-sm text-white/75 max-w-md mx-auto">
          Completed in {formatSecs(attempt.timeSpentSeconds)} (Allocated:{' '}
          {formatSecs(attempt.timeAllocatedSeconds)})
        </p>
      </div>

      {/* Attempt-Based Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <span>Result Basis on Attempt</span>
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              Attempt: {attemptedCount}/{totalQuestions}
            </span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Accuracy on attempted: <strong className="text-indigo-600">{accuracyOnAttempt}%</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Card 1: Attempt */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              Attempt
            </span>
            <span className="text-2xl font-black text-slate-800 block">
              {attemptedCount}/{totalQuestions}
            </span>
            <span className="text-[11px] text-slate-500">
              {attemptedCount} attempted
            </span>
          </div>

          {/* Card 2: Correct Answers Basis on Attempt */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-center space-y-1">
            <span className="text-xs font-semibold text-emerald-800 block uppercase tracking-wider">
              Correct Answers
            </span>
            <span className="text-2xl font-black text-emerald-700 block">
              {correctCount}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              basis on {attemptedCount} attempt{attemptedCount === 1 ? '' : 's'}
            </span>
          </div>

          {/* Card 3: Incorrect Answers Basis on Attempt */}
          <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 text-center space-y-1">
            <span className="text-xs font-semibold text-rose-800 block uppercase tracking-wider">
              Incorrect Answers
            </span>
            <span className="text-2xl font-black text-rose-600 block">
              {incorrectCount}
            </span>
            <span className="text-[11px] text-rose-700 font-medium">
              basis on {attemptedCount} attempt{attemptedCount === 1 ? '' : 's'}
            </span>
          </div>

          {/* Card 4: Unattempted Questions */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              Unattempted
            </span>
            <span className="text-2xl font-black text-slate-600 block">
              {unansweredCount}
            </span>
            <span className="text-[11px] text-slate-500">
              out of {totalQuestions} total
            </span>
          </div>
        </div>

        {/* Informative text line */}
        <p className="text-xs text-slate-500 pt-2 leading-relaxed">
          {attemptedCount === totalQuestions ? (
            <span>
              All <strong>{totalQuestions}</strong> questions were attempted. You scored{' '}
              <strong className="text-emerald-700">{correctCount}</strong> correct and{' '}
              <strong className="text-rose-600">{incorrectCount}</strong> incorrect.
            </span>
          ) : (
            <span>
              You attempted <strong>{attemptedCount}</strong> out of <strong>{totalQuestions}</strong> questions.
              Based on your attempt, you answered <strong className="text-emerald-700">{correctCount}</strong> correctly and{' '}
              <strong className="text-rose-600">{incorrectCount}</strong> incorrectly (with{' '}
              <strong>{unansweredCount}</strong> unattempted). Marks are awarded as{' '}
              <strong className="text-indigo-600">{correctCount} / {totalQuestions}</strong>.
            </span>
          )}
        </p>
      </div>

      {/* Call to Actions (Fixed container and responsive layout to prevent button overflow) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
        <div className="flex-1 min-w-0 pr-0 md:pr-4">
          <h4 className="text-base font-bold text-slate-800">
            Inspect Solutions in Answer Key
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Open the Answer Key dashboard to study the verified correct answers and comprehensive explanations.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="result-retake-exam-btn"
            onClick={onRetakeExam}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Take Another Exam</span>
          </button>

          <button
            type="button"
            id="result-view-answer-key-btn"
            onClick={onOpenAnswerKey}
            className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm transition-all whitespace-nowrap cursor-pointer"
          >
            <KeyRound className="w-4 h-4 shrink-0" />
            <span>View Answer Key</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
