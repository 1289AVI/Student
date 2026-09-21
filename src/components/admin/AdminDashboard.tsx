import React, { useState } from 'react';
import { Question, UserSession, QuestionSetter, ExamAttempt } from '../../types';
import { DocUploader } from './DocUploader';
import { QuestionBank } from './QuestionBank';
import { EditQuestionModal } from './EditQuestionModal';
import { SetterManagement } from './SetterManagement';
import { StudentSubmissions } from './StudentSubmissions';
import {
  UploadCloud,
  Layers,
  Sparkles,
  ShieldCheck,
  Users,
  GraduationCap,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface AdminDashboardProps {
  user: UserSession;
  questions: Question[];
  setters: QuestionSetter[];
  attempts: ExamAttempt[];
  onAddQuestions: (newQuestions: Question[]) => void;
  onUpdateQuestion: (updatedQuestion: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onResetQuestions: () => void;
  onCreateSetter: (newSetter: {
    username: string;
    name: string;
    passcode: string;
    assignedSubject?: string;
    topic?: string;
  }) => Promise<{ success: boolean; message?: string } | boolean>;
  onUpdateSetter: (id: string, updated: Partial<QuestionSetter>) => Promise<{ success: boolean; message?: string } | boolean>;
  onDeleteSetter: (id: string) => Promise<boolean>;
  onAdminProfileUpdated?: (name: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  questions,
  setters,
  attempts,
  onAddQuestions,
  onUpdateQuestion,
  onDeleteQuestion,
  onResetQuestions,
  onCreateSetter,
  onUpdateSetter,
  onDeleteSetter,
  onAdminProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'setters' | 'submissions' | 'bank' | 'upload'>('setters');
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
      targetClass: 'Class V',
      difficulty: 'medium',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      correctOptionIndex: 0,
      answerKeyExplanation: '',
      createdByName: 'Administrator',
      createdAt: new Date().toISOString(),
    };
    setEditingQuestion(blank);
    setIsEditModalOpen(true);
  };

  const handleSaveQuestion = (updated: Question) => {
    onUpdateQuestion(updated);
    setIsEditModalOpen(false);
    setEditingQuestion(null);
  };

  return (
    <div className="space-y-6" id="admin-dashboard-root">
      {/* Top Authority Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
            <ShieldCheck className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Master Administrator
              </span>
              <span className="text-xs text-slate-400 font-mono">@{user.username || 'admin'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Administrator Control Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete administrative control: manage question setters, reset/change passwords, oversee questions across all grades, and track simultaneous student exams.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold self-start md:self-auto flex-wrap">
          <span className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Setters: <strong>{setters.length}</strong></span>
          </span>
          <span className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
            <span>Submissions: <strong>{attempts.length}</strong></span>
          </span>
          <span className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span>Questions: <strong>{questions.length}</strong></span>
          </span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white px-3 sm:px-6 rounded-2xl shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            id="admin-tab-setters"
            onClick={() => setActiveTab('setters')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'setters'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Question Setters</span>
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
              {setters.length}
            </span>
          </button>

          <button
            type="button"
            id="admin-tab-submissions"
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'submissions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-teal-600" />
            <span>Student Exam Submissions</span>
            <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
              {attempts.length}
            </span>
          </button>

          <button
            type="button"
            id="admin-tab-bank"
            onClick={() => setActiveTab('bank')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'bank'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Question Bank</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {questions.length}
            </span>
          </button>

          <button
            type="button"
            id="admin-tab-upload"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>AI Document & Topic Reader</span>
          </button>
        </div>
      </div>

      {/* Main Views */}
      {activeTab === 'setters' && (
        <SetterManagement
          adminUser={user}
          setters={setters}
          onCreateSetter={onCreateSetter}
          onUpdateSetter={onUpdateSetter}
          onDeleteSetter={onDeleteSetter}
          onAdminProfileUpdated={onAdminProfileUpdated}
        />
      )}

      {activeTab === 'submissions' && (
        <StudentSubmissions attempts={attempts} />
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

      {activeTab === 'upload' && (
        <DocUploader
          onQuestionsGenerated={(newQList) => {
            onAddQuestions(newQList);
            setActiveTab('bank');
          }}
          onEditQuestion={handleEditClick}
          existingTopics={existingTopics}
          existingClasses={existingClasses}
        />
      )}

      {/* Edit Question & Answer Modal */}
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
