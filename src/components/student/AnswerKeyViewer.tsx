import React, { useState } from 'react';
import { Question, ExamAttempt } from '../../types';
import {
  KeyRound,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Printer,
  ChevronDown,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface AnswerKeyViewerProps {
  questions: Question[];
  latestAttempt?: ExamAttempt | null;
}

export const AnswerKeyViewer: React.FC<AnswerKeyViewerProps> = ({
  questions,
  latestAttempt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [showStudentComparison, setShowStudentComparison] = useState(Boolean(latestAttempt));

  const topics = Array.from(new Set(questions.map((q) => q.topic))).filter(Boolean);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answerKeyExplanation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTopic = selectedTopic === 'all' || q.topic === selectedTopic;

    return matchesSearch && matchesTopic;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="student-answer-key-section">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            Official Student Answer Key & Solutions
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Exam Answer Key Repository
          </h2>
          <p className="text-emerald-100/80 text-sm leading-relaxed">
            Review full solutions, verified correct answer choices, and comprehensive pedagogical explanations created by teachers and examiners.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            id="print-answer-key-btn"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Comparison Toggle if an exam was taken */}
      {latestAttempt && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Compare with Your Latest Exam Attempt ({latestAttempt.score} / {latestAttempt.totalQuestions} • {latestAttempt.percentage}%)
              </h4>
              <p className="text-xs text-emerald-800">
                Toggle overlay to inspect your chosen answers alongside the verified answer key.
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
            <input
              type="checkbox"
              id="toggle-comparison-checkbox"
              checked={showStudentComparison}
              onChange={(e) => setShowStudentComparison(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-emerald-900">
              Highlight My Answers
            </span>
          </label>
        </div>
      )}

      {/* Toolbar: Search and Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="search-answer-key-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search answer keys by concept, keyword, or question..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        <div className="sm:col-span-4 relative">
          <select
            id="filter-answer-key-topic"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Topics ({topics.length})</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Answer Key Cards */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No answer key found
          </h3>
          <p className="text-xs text-slate-500">
            No questions matching your search filters. Try clearing search keywords.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const studentChosenAnswer = latestAttempt?.answers?.[q.id];
            const isAnsweredByStudent = Boolean(studentChosenAnswer);
            const isStudentCorrect =
              isAnsweredByStudent &&
              studentChosenAnswer?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

            return (
              <div
                key={q.id}
                id={`answer-key-card-${q.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 overflow-hidden break-words"
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-lg bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                      {q.targetClass || 'Class V'}
                    </span>
                    <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                      {q.topic}
                    </span>
                    <span className="text-xs font-medium text-slate-500 capitalize px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      {q.difficulty}
                    </span>
                  </div>

                  {showStudentComparison && latestAttempt && (
                    <div>
                      {isAnsweredByStudent ? (
                        isStudentCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            You Answered Correctly
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            Your Answer Was Incorrect
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Unattempted in Exam
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Question Text */}
                <h4 className="text-base font-semibold text-slate-800 leading-snug">
                  {q.question}
                </h4>

                {/* Options List with Highlighted Correct Answer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect =
                      optIdx === q.correctOptionIndex ||
                      opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

                    const isStudentChoice =
                      showStudentComparison &&
                      studentChosenAnswer &&
                      studentChosenAnswer.trim().toLowerCase() === opt.trim().toLowerCase();

                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                          isCorrect
                            ? 'border-emerald-400 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-300 font-semibold'
                            : isStudentChoice && !isCorrect
                            ? 'border-rose-300 bg-rose-50/70 text-rose-950 font-medium'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isStudentChoice && !isCorrect
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {letter}
                        </span>

                        <span className="flex-1">{opt}</span>

                        {isCorrect && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            Correct Answer Key
                          </span>
                        )}

                        {isStudentChoice && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              isCorrect
                                ? 'text-emerald-800 bg-emerald-200'
                                : 'text-rose-700 bg-rose-100'
                            }`}
                          >
                            Your Pick
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Answer Key Explanation Box */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    Verified Solution & Explanation
                  </div>
                  <p className="leading-relaxed text-slate-700 pt-0.5">{q.answerKeyExplanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
