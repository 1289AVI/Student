export type UserRole = 'student' | 'setter' | 'admin';

export const STANDARD_CLASSES = [
  'Class I',
  'Class II',
  'Class III',
  'Class IV',
  'Class V',
  'Class VI',
  'Class VII',
  'Class VIII',
  'Class IX',
  'Class X',
  'Class XI',
  'Class XII',
] as const;

export type StandardClass = typeof STANDARD_CLASSES[number];

export interface QuestionSetter {
  id: string;
  username: string;
  name: string;
  passcode: string;
  assignedSubject?: string;
  assignedClass?: string;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt?: string;
}

export interface UserSession {
  role: UserRole;
  name: string;
  id: string;
  username?: string;
  email?: string;
  avatar?: string;
  targetClass?: string; // e.g. "Class V"
  rollNumber?: string;  // e.g. "12" or "STU-042"
  assignedSubject?: string; // Topic / Subject
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  correctOptionIndex: number;
  answerKeyExplanation: string;
  topic: string;
  targetClass?: string; // e.g. "Class V"
  difficulty: QuestionDifficulty;
  sourceDoc?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExamConfig {
  numQuestions: number;
  timeLimitMinutes: number;
  selectedTopic: string;
}

export interface ExamAttempt {
  id: string;
  studentName: string;
  studentId: string;
  studentClass?: string;
  studentRoll?: string;
  startTime: string;
  endTime: string;
  totalQuestions: number;
  timeAllocatedSeconds: number;
  timeSpentSeconds: number;
  answers: Record<string, string>; // questionId -> selectedOption string
  markedForReview: string[]; // questionIds
  score: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  attemptedCount: number;
  accuracyOnAttempt: number;
  completedDueToTimeout?: boolean;
  questionSnapshots: Question[];
}

export interface GenerateOptions {
  type: 'topic' | 'file';
  topic?: string;
  fileData?: string; // base64 string
  fileName?: string;
  fileMime?: string;
  numQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  mode: 'generate' | 'extract';
}
