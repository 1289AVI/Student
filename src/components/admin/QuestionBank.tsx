import React, { useState } from 'react';
import { Question } from '../../types';
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface QuestionBankProps {
  questions: Question[];
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onAddNewQuestion: () => void;
  onResetDefaults: () => void;
  onSwitchToUpload: () => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  questions,
  onEditQuestion,
  onDeleteQuestion,
  onAddNewQuestion,
  onResetDefaults,
  onSwitchToUpload,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Extract unique classes & topics
  const classes = Array.from(new Set(questions.map((q) => q.targetClass || 'Class V'))).filter(Boolean);
  const topics = Array.from(new Set(questions.map((q) => q.topic))).filter(Boolean);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.targetClass || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.options.some((opt) => opt.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesClass = selectedClass === 'all' || (q.targetClass || 'Class V') === selectedClass;
    const matchesTopic = selectedTopic === 'all' || q.topic === selectedTopic;
    const matchesDiff = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;

    return matchesSearch && matchesClass && matchesTopic && matchesDiff;
  });

  return (
    <div className="space-y-6" id="admin-question-bank-section">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            Total {questions.length} Active Questions in Repository
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Question Bank & Master Editor
          </h2>
          <p className="text-xs text-slate-500">
            Admin can edit questions, alter answers, adjust options, or update answer key explanations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            id="admin-new-question-btn"
            onClick={onAddNewQuestion}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Question Manually
          </button>
          <button
            type="button"
            id="admin-ai-upload-quick-btn"
            onClick={onSwitchToUpload}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-200 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            AI Document Uploader
          </button>
          {questions.length > 0 && (
            <button
              type="button"
              id="admin-reset-questions-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all questions in the bank?')) {
                  onResetDefaults();
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Clear all questions in repository"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Bank
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="search-questions-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions or keyword..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Class Filter */}
        <div className="sm:col-span-3 relative">
          <select
            id="filter-class-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-teal-800 outline-none focus:border-teal-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Classes ({classes.length})</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Topic Filter */}
        <div className="sm:col-span-3 relative">
          <select
            id="filter-topic-select"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
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

        {/* Difficulty Filter */}
        <div className="sm:col-span-2 relative">
          <select
            id="filter-difficulty-select"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No questions matched your filters
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Try adjusting your search keywords or clear class/topic filters to see all available questions.
          </p>
          <button
            type="button"
            id="clear-filters-btn"
            onClick={() => {
              setSearchTerm('');
              setSelectedClass('all');
              setSelectedTopic('all');
              setSelectedDifficulty('all');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, index) => (
            <div
              key={q.id}
              id={`question-card-${q.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              {/* Question Header & Action Buttons */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                    {q.targetClass || 'Class V'}
                  </span>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                    {q.topic}
                  </span>
                  <span
                    className={`text-xs font-medium capitalize px-2 py-0.5 rounded-md border ${
                      q.difficulty === 'easy'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : q.difficulty === 'hard'
                        ? 'text-rose-700 bg-rose-50 border-rose-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                  {q.sourceDoc && (
                    <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      From: {q.sourceDoc}
                    </span>
                  )}
                </div>

                {/* Edit & Delete Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    id={`edit-question-btn-${q.id}`}
                    onClick={() => onEditQuestion(q)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Q&A
                  </button>
                  <button
                    type="button"
                    id={`delete-question-btn-${q.id}`}
                    onClick={() => {
                      if (window.confirm('Delete this question from question bank?')) {
                        onDeleteQuestion(q.id);
                      }
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h4 className="text-base font-semibold text-slate-800 leading-snug">
                {q.question}
              </h4>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, optIdx) => {
                  const isCorrect =
                    optIdx === q.correctOptionIndex ||
                    opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Answer Key Explanation Box */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                <span className="font-bold text-amber-800 uppercase tracking-wider text-[11px] shrink-0">
                  Answer Key Explanation:
                </span>
                <p className="leading-relaxed text-slate-700">{q.answerKeyExplanation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
