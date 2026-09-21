import React, { useState } from 'react';
import { Question, UserSession } from '../../types';
import {
  Clock,
  HelpCircle,
  Play,
  Layers,
  Sparkles,
  BookOpen,
  ChevronDown,
  Info,
  GraduationCap,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface ExamSetupProps {
  questions: Question[];
  user?: UserSession;
  onStartExam: (config: {
    numQuestions: number;
    timeLimitMinutes: number;
    selectedTopic: string;
  }) => void;
  onOpenAnswerKey: () => void;
  onSwitchRole?: () => void;
}

export const ExamSetup: React.FC<ExamSetupProps> = ({
  questions,
  user,
  onStartExam,
  onOpenAnswerKey,
  onSwitchRole,
}) => {
  const totalAvailable = questions.length;
  const topics = Array.from(new Set(questions.map((q) => q.topic))).filter(Boolean);

  const [selectedTopic, setSelectedTopic] = useState('all');
  const [numQuestions, setNumQuestions] = useState(
    Math.min(5, totalAvailable > 0 ? totalAvailable : 5)
  );
  const [numQuestionsInput, setNumQuestionsInput] = useState<string>(
    String(Math.min(5, totalAvailable > 0 ? totalAvailable : 5))
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);
  const [customTime, setCustomTime] = useState(false);

  // Filter count according to topic
  const questionsInTopic =
    selectedTopic === 'all'
      ? totalAvailable
      : questions.filter((q) => q.topic === selectedTopic).length;

  const effectiveMaxQuestions = Math.max(1, questionsInTopic);

  const handleStart = () => {
    let count = parseInt(numQuestionsInput, 10);
    if (isNaN(count) || count < 1) {
      count = Math.min(numQuestions, effectiveMaxQuestions);
    } else {
      count = Math.min(count, effectiveMaxQuestions);
    }
    onStartExam({
      numQuestions: Math.max(1, count),
      timeLimitMinutes: Math.max(1, timeLimitMinutes),
      selectedTopic,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" id="student-exam-setup-section">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Customizable Student Assessment
            </div>
            {user?.targetClass && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/30 border border-teal-400/40 text-teal-200 text-xs font-bold">
                <GraduationCap className="w-3.5 h-3.5" />
                {user.targetClass} • Roll: {user.rollNumber || '01'}
              </div>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {user ? `Welcome, ${user.name}` : 'Start Examination'}
          </h2>
          <p className="text-blue-100/80 text-sm leading-relaxed">
            {user?.targetClass
              ? `Questions are strictly curated for ${user.targetClass}. You will not receive other class questions.`
              : 'Configure your exam according to your study needs.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAnswerKey}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors shrink-0"
        >
          <BookOpen className="w-4 h-4 text-emerald-300" />
          View Answer Keys First
        </button>
      </div>

      {/* Main Configuration Card or Empty State */}
      {totalAvailable === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-amber-300 p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-800">
              No Questions Available for {user?.targetClass || 'Your Class'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Examination questions are curated by Question Setters and Administrators. Currently, no questions have been published for <strong>{user?.targetClass || 'your class'}</strong> yet.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onSwitchRole && (
              <button
                type="button"
                id="switch-admin-to-add-questions-btn"
                onClick={onSwitchRole}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Switch to Question Setter / Admin Portal
              </button>
            )}
            <button
              type="button"
              onClick={onOpenAnswerKey}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Check Answer Key Tab
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
          {/* Class Filter Confirmation Tag */}
          <div className="flex items-center justify-between bg-teal-50/70 border border-teal-200 rounded-xl px-4 py-2.5 text-xs text-teal-900">
            <div className="flex items-center gap-2 font-medium">
              <GraduationCap className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                Curated Question Pool for <strong>{user?.targetClass || 'Class V'}</strong>
              </span>
            </div>
            <span className="font-bold text-teal-800">
              {totalAvailable} Question{totalAvailable > 1 ? 's' : ''} Ready
            </span>
          </div>
        {/* Step 1: Select Topic */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <label className="text-sm font-bold text-slate-800">
              Select Examination Topic / Subject
            </label>
          </div>

          <div className="relative max-w-lg">
            <select
              id="student-exam-topic-select"
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                // Adjust num questions if needed
                const count =
                  e.target.value === 'all'
                    ? totalAvailable
                    : questions.filter((q) => q.topic === e.target.value).length;
                const newMax = Math.max(1, count);
                if (numQuestions > newMax) {
                  setNumQuestions(newMax);
                  setNumQuestionsInput(String(newMax));
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Available Topics ({totalAvailable} questions)</option>
              {topics.map((t) => {
                const count = questions.filter((q) => q.topic === t).length;
                return (
                  <option key={t} value={t}>
                    {t} ({count} questions)
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Step 2: Set Number of Questions (Typing Space) */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <label htmlFor="student-num-questions-input" className="text-sm font-bold text-slate-800">
                Type Required Number of Questions:
              </label>
            </div>
            <span className="text-xs text-slate-500">
              Total available in this topic: <strong className="text-slate-800">{questionsInTopic}</strong>
            </span>
          </div>

          <div className="max-w-md space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  id="student-num-questions-input"
                  min={1}
                  max={effectiveMaxQuestions}
                  value={numQuestionsInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNumQuestionsInput(val);
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      setNumQuestions(Math.min(parsed, effectiveMaxQuestions));
                    }
                  }}
                  onBlur={() => {
                    let parsed = parseInt(numQuestionsInput, 10);
                    if (isNaN(parsed) || parsed < 1) {
                      parsed = 1;
                    } else if (parsed > effectiveMaxQuestions) {
                      parsed = effectiveMaxQuestions;
                    }
                    setNumQuestions(parsed);
                    setNumQuestionsInput(String(parsed));
                  }}
                  placeholder={`Type number (1 - ${effectiveMaxQuestions})...`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-base font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                  / {effectiveMaxQuestions} max
                </span>
              </div>

              <button
                type="button"
                id="set-all-questions-btn"
                onClick={() => {
                  setNumQuestions(effectiveMaxQuestions);
                  setNumQuestionsInput(String(effectiveMaxQuestions));
                }}
                className="px-4 py-3 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all whitespace-nowrap cursor-pointer shadow-xs"
              >
                Max ({effectiveMaxQuestions})
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Type the exact number of questions you wish to attempt in this examination (Min: 1, Max: {effectiveMaxQuestions}).
            </p>
          </div>
        </div>

        {/* Step 3: Set Timer via Dropdown (Time only, no extra details) */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <label htmlFor="exam-timer-dropdown" className="text-sm font-bold text-slate-800">
                Exam Timer (Select Duration):{' '}
                <span className="text-indigo-600 font-extrabold">{timeLimitMinutes} Minutes</span>
              </label>
            </div>
            <span className="text-xs text-slate-500">
              Avg pace: ~{(timeLimitMinutes / Math.max(1, numQuestions)).toFixed(1)} min/question
            </span>
          </div>

          <div className="space-y-3 max-w-lg">
            <div className="relative">
              <select
                id="exam-timer-dropdown"
                value={customTime ? 'custom' : timeLimitMinutes}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setCustomTime(true);
                  } else {
                    setCustomTime(false);
                    setTimeLimitMinutes(Number(e.target.value));
                  }
                }}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer shadow-xs"
              >
                <option value={1}>1 Minute</option>
                <option value={2}>2 Minutes</option>
                <option value={3}>3 Minutes</option>
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={90}>90 Minutes (1.5 Hours)</option>
                <option value={120}>120 Minutes (2 Hours)</option>
                <option value="custom">Custom Duration (Minutes)...</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {/* Custom Minutes Input if selected */}
            {customTime && (
              <div className="flex items-center gap-3 p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <label htmlFor="custom-timer-input" className="text-xs font-semibold text-indigo-900">
                  Enter Custom Minutes:
                </label>
                <input
                  type="number"
                  id="custom-timer-input"
                  min={1}
                  max={240}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24 px-3 py-1.5 text-sm font-bold text-center rounded-lg border border-indigo-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <span className="text-xs font-medium text-indigo-700">minutes</span>
              </div>
            )}
          </div>
        </div>

        {/* Overview Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              Exam Rules & Answer Key Access:
            </p>
            <p>
              Once started, the countdown timer will run continuously. The exam will automatically submit when the timer expires. Detailed solutions and explanations will be unlocked immediately in your <strong className="text-indigo-600">Answer Key</strong> dashboard tab!
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            id="start-exam-now-btn"
            disabled={totalAvailable === 0}
            onClick={handleStart}
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition-all ${
              totalAvailable === 0
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
            }`}
          >
            <Play className="w-4 h-4 fill-white" />
            Begin Examination Now ({numQuestions} Questions • {timeLimitMinutes} Min)
          </button>
        </div>
      </div>
      )}
    </div>
  );
};
