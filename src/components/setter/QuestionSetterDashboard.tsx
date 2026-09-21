import React, { useState } from 'react';
import { Question, UserSession } from '../../types';
import { DocUploader } from '../admin/DocUploader';
import { QuestionBank } from '../admin/QuestionBank';
import { EditQuestionModal } from '../admin/EditQuestionModal';
import {
  UploadCloud,
  Layers,
  Sparkles,
  PenTool,
  BookOpen,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';

interface QuestionSetterDashboardProps {
  user: UserSession;
  questions: Question[];
  onAddQuestions: (newQuestions: Question[]) => void;
  onUpdateQuestion: (updatedQuestion: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onResetQuestions: () => void;
}

export const QuestionSetterDashboard: React.FC<QuestionSetterDashboardProps> = ({
  user,
  questions,
  onAddQuestions,
  onUpdateQuestion,
  onDeleteQuestion,
  onResetQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'bank'>('upload');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const existingTopics = Array.from(new Set(questions.map((q) => q.topic).filter(Boolean)));
  const existingClasses = Array.from(
    new Set(questions.map((q) => q.targetClass || 'Class V').filter(Boolean))
  );

  const handleEditClick = (q: Question) => {
    setEditingQuestion(q);
    setIsEditModalOpen(true);
  };

  const handleAddNewClick = () => {
    const blank: Question = {
      id: 'new-' + Date.now(),
      question: '',
      topic: existingTopics[0] || 'General Studies',
      targetClass: user.targetClass || 'Class V',
      difficulty: 'medium',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      correctOptionIndex: 0,
      answerKeyExplanation: '',
      createdByName: user.name,
      createdAt: new Date().toISOString(),
    };
    setEditingQuestion(blank);
    setIsEditModalOpen(true);
  };

  const handleSaveQuestion = (updated: Question) => {
    onUpdateQuestion({
      ...updated,
      createdByName: updated.createdByName || user.name,
    });
    setIsEditModalOpen(false);
    setEditingQuestion(null);
  };

  return (
    <div className="space-y-6" id="question-setter-dashboard-root">
      {/* Question Setter Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Question Setter Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">@{user.username || 'setter'}</span>
              {user.assignedSubject && (
                <span className="text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-indigo-600" />
                  Topic: {user.assignedSubject}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Welcome, {user.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload study documents, auto-separate questions & answer keys, or manually craft syllabus questions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold self-start md:self-auto">
          <span className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bank: <strong>{questions.length}</strong> Q&A</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            id="setter-tab-upload"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>AI Document & Topic Reader</span>
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full">
              PDF / Word / Images
            </span>
          </button>

          <button
            type="button"
            id="setter-tab-bank"
            onClick={() => setActiveTab('bank')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'bank'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Question Bank & Editor</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {questions.length} Q&A
            </span>
          </button>
        </div>
      </div>

      {/* Views */}
      {activeTab === 'upload' && (
        <DocUploader
          onQuestionsGenerated={(newQList) => {
            const stamped = newQList.map((q) => ({ ...q, createdByName: user.name }));
            onAddQuestions(stamped);
            setActiveTab('bank');
          }}
          onEditQuestion={handleEditClick}
          existingTopics={existingTopics}
          existingClasses={existingClasses}
          defaultSubject={user.assignedSubject || ''}
        />
      )}

      {activeTab === 'bank' && (
        <QuestionBank
          questions={questions}
          onEditQuestion={handleEditClick}
          onDeleteQuestion={onDeleteQuestion}
          onAddNewQuestion={handleAddNewClick}
          onResetDefaults={onResetQuestions}
          onSwitchToUpload={() => setActiveTab('upload')}
        />
      )}

      <EditQuestionModal
        isOpen={isEditModalOpen}
        question={editingQuestion}
        availableTopics={existingTopics}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
      />
    </div>
  );
};
