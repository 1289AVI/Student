import { Question, ExamAttempt } from '../types';

const QUESTIONS_KEY = 'examportal_questions_v1';
const ATTEMPTS_KEY = 'examportal_attempts_v1';

export function loadQuestions(): Question[] {
  try {
    const data = localStorage.getItem(QUESTIONS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((q) => ({
          ...q,
          targetClass: q.targetClass || 'Class V',
        }));
      }
    }
  } catch (e) {
    console.error('Error loading questions from storage:', e);
  }
  return [];
}

export function saveQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.error('Error saving questions:', e);
  }
}

export function loadAttempts(): ExamAttempt[] {
  try {
    const data = localStorage.getItem(ATTEMPTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading attempts:', e);
  }
  return [];
}

export function saveAttempts(attempts: ExamAttempt[]): void {
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (e) {
    console.error('Error saving attempts:', e);
  }
}
