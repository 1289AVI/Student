import React, { useState } from 'react';
import { ExamAttempt } from '../../types';
import {
  GraduationCap,
  Search,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Filter,
} from 'lucide-react';

interface StudentSubmissionsProps {
  attempts: ExamAttempt[];
}

export const StudentSubmissions: React.FC<StudentSubmissionsProps> = ({ attempts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [inspectAttempt, setInspectAttempt] = useState<ExamAttempt | null>(null);

  const classes = ['ALL', ...Array.from(new Set(attempts.map((a) => a.studentClass || 'Class V').filter(Boolean)))];

  const filteredAttempts = attempts.filter((a) => {
    const matchesSearch =
      a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.studentRoll || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.studentId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'ALL' || (a.studentClass || 'Class V') === selectedClass;
    return matchesSearch && matchesClass;
  });

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / attempts.length)
    : 0;

  const highestScore = attempts.length
    ? Math.max(...attempts.map((a) => a.percentage || 0))
    : 0;

  return (
    <div className="space-y-6" id="student-submissions-container">
      {/* Top Banner with Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Exam Submissions</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{attempts.length}</span>
            <span className="text-[11px] text-slate-400">Concurrent student records</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Average Score</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">{avgScore}%</span>
            <span className="text-[11px] text-slate-400">Across all classes</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Highest Attained Score</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{highestScore}%</span>
            <span className="text-[11px] text-slate-400">Top performance</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name or roll number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls === 'ALL' ? 'All Classes' : cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-4 py-3.5">Class / Grade</th>
                <th className="px-4 py-3.5">Roll Number</th>
                <th className="px-4 py-3.5">Score</th>
                <th className="px-4 py-3.5">Performance</th>
                <th className="px-4 py-3.5">Time Spent</th>
                <th className="px-4 py-3.5">Submitted At</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No student submissions recorded yet. When students complete exams, their results will appear here in real time.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((attempt) => {
                  const minutes = Math.floor((attempt.timeSpentSeconds || 0) / 60);
                  const seconds = (attempt.timeSpentSeconds || 0) % 60;
                  const formattedTime = `${minutes}m ${seconds}s`;
                  const dateStr = attempt.endTime
                    ? new Date(attempt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now';

                  return (
                    <tr key={attempt.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                        {attempt.studentName}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-teal-50 text-teal-800 border border-teal-200">
                          {attempt.studentClass || 'Class V'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-700">
                        {attempt.studentRoll || '01'}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-800 text-sm">
                        {attempt.correctCount} / {attempt.totalQuestions}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                            (attempt.percentage || 0) >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : (attempt.percentage || 0) >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {attempt.percentage}%
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {formattedTime}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {dateStr}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectAttempt(attempt)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{inspectAttempt.studentName}'s Exam Sheet</h3>
                <p className="text-xs text-slate-500">
                  {inspectAttempt.studentClass || 'Class V'} • Roll: {inspectAttempt.studentRoll || '01'} • Score: {inspectAttempt.percentage}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectAttempt(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {(inspectAttempt.questionSnapshots || []).map((q, idx) => {
                const selected = inspectAttempt.answers[q.id];
                const isCorrect = selected === q.correctAnswer;
                return (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-slate-800">
                        {idx + 1}. {q.question}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Correct
                        </span>
                      ) : selected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                          <XCircle className="w-3 h-3" /> Incorrect
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full shrink-0">
                          Unanswered
                        </span>
                      )}
                    </div>

                    <div className="text-xs space-y-1 pt-1">
                      <div className="text-slate-600">
                        Student chose:{' '}
                        <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                          {selected || '(None)'}
                        </strong>
                      </div>
                      {!isCorrect && (
                        <div className="text-slate-600">
                          Correct Answer: <strong className="text-emerald-700">{q.correctAnswer}</strong>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 mt-2">
                        <strong>Explanation:</strong> {q.answerKeyExplanation}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectAttempt(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
