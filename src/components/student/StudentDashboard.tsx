import React, { useState } from 'react';
import { Question, ExamAttempt, UserSession } from '../../types';
import { ExamSetup } from './ExamSetup';
import { LiveExam } from './LiveExam';
import { ExamResult } from './ExamResult';
import { AnswerKeyViewer } from './AnswerKeyViewer';
import {
  FileText,
  KeyRound,
  History,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface StudentDashboardProps {
  user: UserSession;
  questions: Question[];
  attempts: ExamAttempt[];
  onSaveAttempt: (attempt: ExamAttempt) => void;
  onSwitchRole?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  questions,
  attempts,
  onSaveAttempt,
  onSwitchRole,
}) => {
  // Tabs: 'exam' | 'answer-key' | 'history'
  const [activeTab, setActiveTab] = useState<'exam' | 'answer-key' | 'history'>('exam');
  
  // Exam sub-states: 'setup' | 'taking' | 'result'
  const [examState, setExamState] = useState<'setup' | 'taking' | 'result'>('setup');
  
  // Filter questions according to student's assigned class, with fallback to all if general or empty
  const studentClass = user.targetClass?.trim() || 'Class V';
  const classQuestions = questions.filter((q) => {
    const qClass = (q.targetClass || '').trim().toLowerCase();
    if (!qClass || qClass === 'all' || qClass === 'all classes' || qClass === 'any') return true;
    return qClass === studentClass.toLowerCase();
  });
  const effectiveQuestions = classQuestions.length > 0 ? classQuestions : questions;

  // Exam session data
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);
  const [latestAttempt, setLatestAttempt] = useState<ExamAttempt | null>(
    attempts.length > 0 ? attempts[0] : null
  );

  const handleStartExam = (config: {
    numQuestions: number;
    timeLimitMinutes: number;
    selectedTopic: string;
  }) => {
    let pool = [...effectiveQuestions];
    if (config.selectedTopic !== 'all') {
      pool = pool.filter((q) => q.topic === config.selectedTopic);
    }
    // Fallback to all effective if topic filter is empty
    if (pool.length === 0) {
      pool = [...effectiveQuestions];
    }
    // Shuffle pool for varied exams
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(config.numQuestions, pool.length));

    setExamQuestions(selected);
    setTimeLimitMinutes(config.timeLimitMinutes);
    setExamState('taking');
  };

  const handleFinishExam = (attempt: ExamAttempt) => {
    setLatestAttempt(attempt);
    onSaveAttempt(attempt);
    setExamState('result');
  };

  return (
    <div className="space-y-6" id="student-dashboard-root">
      {/* Student Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            id="student-tab-exam"
            onClick={() => {
              setActiveTab('exam');
              if (examState === 'taking') {
                // Keep taking
              }
            }}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all ${
              activeTab === 'exam'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Take Exam
          </button>

          {/* Prominent Answer Key Option */}
          <button
            type="button"
            id="student-tab-answer-key"
            onClick={() => setActiveTab('answer-key')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all ${
              activeTab === 'answer-key'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4 text-teal-600" />
            <span>Answer Key</span>
            <span className="ml-1 text-[10px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full">
              {studentClass} ({classQuestions.length})
            </span>
          </button>

          <button
            type="button"
            id="student-tab-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Exam History ({attempts.length})
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span>Student:</span>
          <strong className="text-slate-800">{user.name}</strong>
          <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-700 font-bold text-[11px]">
            {studentClass} • Roll {user.rollNumber || '01'}
          </span>
        </div>
      </div>

      {/* Tab 1: Take Exam */}
      {activeTab === 'exam' && (
        <div>
          {examState === 'setup' && (
            <ExamSetup
              questions={effectiveQuestions}
              user={user}
              onStartExam={handleStartExam}
              onOpenAnswerKey={() => setActiveTab('answer-key')}
              onSwitchRole={onSwitchRole}
            />
          )}

          {examState === 'taking' && (
            <LiveExam
              questions={examQuestions}
              timeLimitMinutes={timeLimitMinutes}
              studentName={user.name}
              studentId={user.id}
              studentClass={user.targetClass}
              studentRoll={user.rollNumber}
              onFinishExam={handleFinishExam}
              onCancelExam={() => setExamState('setup')}
              onOpenAnswerKey={() => setActiveTab('answer-key')}
            />
          )}

          {examState === 'result' && latestAttempt && (
            <ExamResult
              attempt={latestAttempt}
              onOpenAnswerKey={() => setActiveTab('answer-key')}
              onRetakeExam={() => setExamState('setup')}
            />
          )}
        </div>
      )}

      {/* Tab 2: Answer Key Option in Student Dashboard */}
      {activeTab === 'answer-key' && (
        <AnswerKeyViewer
          questions={effectiveQuestions}
          latestAttempt={latestAttempt}
        />
      )}

      {/* Tab 3: History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                My Past Examination Attempts
              </h3>
              <p className="text-xs text-slate-500">
                Track your historical performance, review answers, and study answer keys.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('exam');
                setExamState('setup');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Start New Exam
            </button>
          </div>

          {attempts.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-300 rounded-2xl">
              <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                No past exams recorded yet
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Take your first timed test to evaluate your knowledge!
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('exam');
                  setExamState('setup');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                Configure Exam Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((att, idx) => (
                <div
                  key={att.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        Exam #{attempts.length - idx}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(att.endTime).toLocaleDateString()} at{' '}
                        {new Date(att.endTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 flex items-center flex-wrap gap-1.5">
                      <span>Score: {att.score} / {att.totalQuestions} ({att.percentage}%)</span>
                      <span>•</span>
                      <span className="text-indigo-700 font-extrabold">
                        Attempt: {att.attemptedCount ?? (att.correctCount + att.incorrectCount)}/{att.totalQuestions}
                      </span>
                      <span>•</span>
                      <span className={att.percentage >= 60 ? 'text-emerald-600' : 'text-rose-600'}>
                        {att.percentage >= 60 ? 'Passed' : 'Needs Review'}
                      </span>
                      {att.completedDueToTimeout && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Time Expired
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      Basis on Attempt: {att.correctCount} Correct, {att.incorrectCount} Incorrect • Time: {Math.floor(att.timeSpentSeconds / 60)}m {att.timeSpentSeconds % 60}s
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      id={`review-attempt-btn-${idx}`}
                      onClick={() => {
                        setLatestAttempt(att);
                        setActiveTab('answer-key');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-teal-700" />
                      Study in Answer Key
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
