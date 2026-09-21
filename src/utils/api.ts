import { Question, ExamAttempt, QuestionSetter, UserSession, UserRole } from '../types';

export async function loginUserApi(params: {
  role: UserRole;
  username?: string;
  passcode?: string;
  name?: string;
  targetClass?: string;
  rollNumber?: string;
}): Promise<{ success: boolean; user?: UserSession; message?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data;
  } catch (e: any) {
    console.error('API login failed, fallback to client validation:', e);
    // Fallback if offline
    if (params.role === 'student') {
      const cleanName = (params.name || '').trim();
      if (!cleanName) {
        return { success: false, message: 'Please enter your student name.' };
      }
      return {
        success: true,
        user: {
          role: 'student',
          name: cleanName,
          id: `ROLL-${params.rollNumber || '01'}`,
          targetClass: params.targetClass || 'Class V',
          rollNumber: params.rollNumber || '01',
        },
      };
    }
    if (params.role === 'admin') {
      const cleanPass = (params.passcode || '').trim();
      if (cleanPass === '12345') {
        return {
          success: true,
          user: {
            role: 'admin',
            name: 'Master Administrator',
            id: 'ADM-MASTER',
            username: 'admin',
          },
        };
      }
      return { success: false, message: 'Incorrect Master Administrator passcode.' };
    }
    return { success: false, message: 'Network connection error. Please try again.' };
  }
}

export async function fetchQuestionsApi(): Promise<Question[]> {
  try {
    const res = await fetch('/api/questions');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        return data.questions;
      }
    }
  } catch (e) {
    console.warn('Could not fetch questions from server, using local store:', e);
  }
  return [];
}

export async function syncQuestionsApi(questions: Question[]): Promise<boolean> {
  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions }),
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to sync questions to server:', e);
    return false;
  }
}

export async function updateQuestionApi(question: Question): Promise<boolean> {
  try {
    const res = await fetch(`/api/questions/${question.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function deleteQuestionApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function resetQuestionsApi(mode: 'clear' | 'defaults' = 'clear'): Promise<Question[]> {
  try {
    const res = await fetch('/api/questions/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.questions || [];
    }
  } catch (e) {
    console.error('Failed to reset questions on server:', e);
  }
  return [];
}

// Question Setters Management API
export async function fetchSettersApi(): Promise<QuestionSetter[]> {
  try {
    const res = await fetch('/api/setters');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.setters)) {
        return data.setters;
      }
    }
  } catch (e) {
    console.error('Failed to fetch setters from server:', e);
  }
  return [];
}

export async function createSetterApi(setter: {
  username: string;
  name: string;
  passcode: string;
  assignedSubject?: string;
  assignedClass?: string;
}): Promise<{ success: boolean; setter?: QuestionSetter; message?: string }> {
  try {
    const res = await fetch('/api/setters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setter),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error creating setter.' };
  }
}

export async function updateSetterApi(
  id: string,
  updated: Partial<QuestionSetter>
): Promise<{ success: boolean; setter?: QuestionSetter; message?: string }> {
  try {
    const res = await fetch(`/api/setters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error updating setter.' };
  }
}

export async function deleteSetterApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/setters/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Attempts API
export async function fetchAttemptsApi(): Promise<ExamAttempt[]> {
  try {
    const res = await fetch('/api/attempts');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.attempts)) {
        return data.attempts;
      }
    }
  } catch (e) {
    console.error('Failed to fetch attempts from server:', e);
  }
  return [];
}

export async function recordAttemptApi(attempt: ExamAttempt): Promise<boolean> {
  try {
    const res = await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attempt),
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to record attempt on server:', e);
    return false;
  }
}

export async function updateAdminPasswordApi(
  newPasscode?: string,
  name?: string,
  currentPasscode?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/admin/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPasscode, name, currentPasscode }),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message || 'Error updating password.' };
  }
}
