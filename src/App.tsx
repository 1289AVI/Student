import React, { useState, useEffect } from 'react';
import { UserSession, UserRole, Question, ExamAttempt, QuestionSetter } from './types';
import { loadQuestions, saveQuestions, loadAttempts, saveAttempts } from './utils/storage';
import {
  fetchQuestionsApi,
  syncQuestionsApi,
  updateQuestionApi,
  deleteQuestionApi,
  resetQuestionsApi,
  fetchSettersApi,
  createSetterApi,
  updateSetterApi,
  deleteSetterApi,
  fetchAttemptsApi,
  recordAttemptApi,
} from './utils/api';
import {
  subscribeToQuestions,
  subscribeToAttempts,
  subscribeToSetters,
  batchSaveQuestionsToCloud,
  saveQuestionToCloud,
  deleteQuestionFromCloud,
  recordAttemptToCloud,
  saveSetterToCloud,
  deleteSetterFromCloud,
  initCloudStoreDefaults,
} from './lib/firebase';
import { Header } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { QuestionSetterDashboard } from './components/setter/QuestionSetterDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>(() => loadQuestions());
  const [attempts, setAttempts] = useState<ExamAttempt[]>(() => loadAttempts());
  const [setters, setSetters] = useState<QuestionSetter[]>([]);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // 1. Initialize Firestore defaults & real-time subscriptions for multi-device sync
  useEffect(() => {
    initCloudStoreDefaults();

    // Subscribe to questions in Firestore
    const unsubQuestions = subscribeToQuestions(
      (cloudQuestions) => {
        setIsCloudSynced(true);
        if (cloudQuestions.length > 0) {
          setQuestions(cloudQuestions);
          saveQuestions(cloudQuestions);
        } else {
          // If Firestore is empty but local questions exist, push local questions to cloud
          const localQ = loadQuestions();
          if (localQ.length > 0) {
            batchSaveQuestionsToCloud(localQ);
          }
        }
      },
      (err) => {
        console.warn('Questions cloud sync fallback to local/polling:', err);
        setIsCloudSynced(false);
      }
    );

    // Subscribe to attempts in Firestore
    const unsubAttempts = subscribeToAttempts(
      (cloudAttempts) => {
        setIsCloudSynced(true);
        if (cloudAttempts.length > 0) {
          setAttempts(cloudAttempts);
          saveAttempts(cloudAttempts);
        } else {
          const localA = loadAttempts();
          if (localA.length > 0) {
            localA.forEach((att) => recordAttemptToCloud(att));
          }
        }
      },
      (err) => {
        console.warn('Attempts cloud sync fallback to local/polling:', err);
        setIsCloudSynced(false);
      }
    );

    // Subscribe to setters in Firestore
    const unsubSetters = subscribeToSetters(
      (cloudSetters) => {
        setIsCloudSynced(true);
        if (cloudSetters.length > 0) {
          setSetters(cloudSetters);
        }
      },
      (err) => {
        console.warn('Setters cloud sync fallback to local/polling:', err);
      }
    );

    // Initial server API fallback fetch for resilience
    async function loadServerDataFallback() {
      try {
        const [remoteQuestions, remoteSetters, remoteAttempts] = await Promise.all([
          fetchQuestionsApi(),
          fetchSettersApi(),
          fetchAttemptsApi(),
        ]);

        if (Array.isArray(remoteQuestions) && remoteQuestions.length > 0) {
          setQuestions((curr) => (curr.length === 0 ? remoteQuestions : curr));
        }
        if (Array.isArray(remoteSetters) && remoteSetters.length > 0) {
          setSetters((curr) => (curr.length === 0 ? remoteSetters : curr));
        }
        if (Array.isArray(remoteAttempts) && remoteAttempts.length > 0) {
          setAttempts((curr) => (curr.length === 0 ? remoteAttempts : curr));
        }
      } catch (e) {
        console.error('Initial data sync fallback error:', e);
      }
    }

    loadServerDataFallback();

    return () => {
      unsubQuestions();
      unsubAttempts();
      unsubSetters();
    };
  }, []);

  // Save questions when changed locally
  useEffect(() => {
    saveQuestions(questions);
  }, [questions]);

  // Save attempts when changed locally
  useEffect(() => {
    saveAttempts(attempts);
  }, [attempts]);

  const handleLogin = (
    role: UserRole,
    name: string,
    id: string,
    targetClass?: string,
    rollNumber?: string,
    username?: string,
    assignedSubject?: string
  ) => {
    setUser({
      role,
      name,
      id,
      username,
      targetClass: targetClass || undefined,
      rollNumber: rollNumber || (role === 'student' ? '01' : undefined),
      assignedSubject,
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleSwitchRole = () => {
    setUser(null);
  };

  const handleAddQuestions = async (newQuestions: Question[]) => {
    setQuestions((prev) => [...newQuestions, ...prev]);
    // Dual sync: Real-time Cloud Firestore + Server cache
    await Promise.allSettled([
      batchSaveQuestionsToCloud(newQuestions),
      syncQuestionsApi(newQuestions),
    ]);
  };

  const handleUpdateQuestion = async (updated: Question) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
    // Dual sync: Real-time Cloud Firestore + Server cache
    await Promise.allSettled([
      saveQuestionToCloud(updated),
      updateQuestionApi(updated),
    ]);
  };

  const handleDeleteQuestion = async (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    // Dual sync: Real-time Cloud Firestore + Server cache
    await Promise.allSettled([
      deleteQuestionFromCloud(id),
      deleteQuestionApi(id),
    ]);
  };

  const handleResetQuestions = async () => {
    // Delete all questions in Firestore
    for (const q of questions) {
      deleteQuestionFromCloud(q.id).catch(() => {});
    }
    await resetQuestionsApi();
    localStorage.removeItem('examportal_questions_v1');
    setQuestions([]);
    saveQuestions([]);
  };

  const handleAdminProfileUpdated = (newName: string) => {
    setUser((prev) => (prev ? { ...prev, name: newName } : null));
  };

  const handleSaveAttempt = async (attempt: ExamAttempt) => {
    setAttempts((prev) => [attempt, ...prev]);
    // Dual sync: Real-time Cloud Firestore + Server cache
    await Promise.allSettled([
      recordAttemptToCloud(attempt),
      recordAttemptApi(attempt),
    ]);
  };

  // Setter Management Handlers for Master Admin
  const handleCreateSetter = async (newSetter: {
    username: string;
    name: string;
    passcode: string;
    assignedSubject?: string;
    topic?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const res = await createSetterApi(newSetter);
    if (res.success && res.setter) {
      setSetters((prev) => [res.setter!, ...prev]);
      saveSetterToCloud(res.setter!).catch(() => {});
      return { success: true };
    }
    return { success: false, message: res.message || 'Failed to create Question Setter.' };
  };

  const handleUpdateSetter = async (id: string, updated: Partial<QuestionSetter>): Promise<{ success: boolean; message?: string }> => {
    const res = await updateSetterApi(id, updated);
    if (res.success && res.setter) {
      setSetters((prev) => prev.map((s) => (s.id === id ? res.setter! : s)));
      saveSetterToCloud(res.setter!).catch(() => {});
      return { success: true };
    }
    return { success: false, message: res.message || 'Failed to update Question Setter.' };
  };

  const handleDeleteSetter = async (id: string): Promise<boolean> => {
    const ok = await deleteSetterApi(id);
    if (ok) {
      setSetters((prev) => prev.filter((s) => s.id !== id));
      deleteSetterFromCloud(id).catch(() => {});
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Header
        user={user}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        isCloudSynced={isCloudSynced}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!user ? (
          <LoginView onLogin={handleLogin} />
        ) : user.role === 'admin' ? (
          <AdminDashboard
            user={user}
            questions={questions}
            setters={setters}
            attempts={attempts}
            onAddQuestions={handleAddQuestions}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onResetQuestions={handleResetQuestions}
            onCreateSetter={handleCreateSetter}
            onUpdateSetter={handleUpdateSetter}
            onDeleteSetter={handleDeleteSetter}
            onAdminProfileUpdated={handleAdminProfileUpdated}
          />
        ) : user.role === 'setter' ? (
          <QuestionSetterDashboard
            user={user}
            questions={questions}
            onAddQuestions={handleAddQuestions}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onResetQuestions={handleResetQuestions}
          />
        ) : (
          <StudentDashboard
            user={user}
            questions={questions}
            attempts={attempts}
            onSaveAttempt={handleSaveAttempt}
            onSwitchRole={handleSwitchRole}
          />
        )}
      </main>

      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Exam Portal • Synchronized Multi-Candidate Exam Platform</span>
          <div className="flex items-center gap-4 text-slate-400 flex-wrap justify-center">
            <span>Concurrent Student Exams</span>
            <span>•</span>
            <span>Question Setter Portal</span>
            <span>•</span>
            <span>Master Admin Supervisor</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
