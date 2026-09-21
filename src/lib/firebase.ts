import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Question, ExamAttempt, QuestionSetter } from '../types';

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with configured database ID
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Collection References
export const QUESTIONS_COLLECTION = 'questions';
export const ATTEMPTS_COLLECTION = 'attempts';
export const SETTERS_COLLECTION = 'setters';
export const SYSTEM_COLLECTION = 'system';

/**
 * Subscribe to real-time questions changes from Firestore
 */
export function subscribeToQuestions(
  onUpdate: (questions: Question[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const qCol = collection(db, QUESTIONS_COLLECTION);
    return onSnapshot(
      qCol,
      (snapshot) => {
        const questions: Question[] = [];
        snapshot.forEach((docSnap) => {
          questions.push(docSnap.data() as Question);
        });
        onUpdate(questions);
      },
      (error) => {
        console.warn('Firestore questions subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Failed to subscribe to questions:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time exam attempts from Firestore
 */
export function subscribeToAttempts(
  onUpdate: (attempts: ExamAttempt[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const aCol = collection(db, ATTEMPTS_COLLECTION);
    return onSnapshot(
      aCol,
      (snapshot) => {
        const attempts: ExamAttempt[] = [];
        snapshot.forEach((docSnap) => {
          attempts.push(docSnap.data() as ExamAttempt);
        });
        // Sort latest attempts first
        attempts.sort((a, b) => {
          const timeB = new Date(b.endTime || b.startTime || 0).getTime();
          const timeA = new Date(a.endTime || a.startTime || 0).getTime();
          return timeB - timeA;
        });
        onUpdate(attempts);
      },
      (error) => {
        console.warn('Firestore attempts subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Failed to subscribe to attempts:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time setters list from Firestore
 */
export function subscribeToSetters(
  onUpdate: (setters: QuestionSetter[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const sCol = collection(db, SETTERS_COLLECTION);
    return onSnapshot(
      sCol,
      (snapshot) => {
        const setters: QuestionSetter[] = [];
        snapshot.forEach((docSnap) => {
          setters.push(docSnap.data() as QuestionSetter);
        });
        onUpdate(setters);
      },
      (error) => {
        console.warn('Firestore setters subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Failed to subscribe to setters:', err);
    return () => {};
  }
}

/**
 * Save or update single question in Firestore
 */
export async function saveQuestionToCloud(question: Question): Promise<boolean> {
  try {
    const ref = doc(db, QUESTIONS_COLLECTION, question.id);
    await setDoc(ref, question, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save question to Firestore:', err);
    return false;
  }
}

/**
 * Batch save questions in Firestore
 */
export async function batchSaveQuestionsToCloud(questions: Question[]): Promise<boolean> {
  if (!questions || questions.length === 0) return true;
  try {
    const batch = writeBatch(db);
    questions.forEach((q) => {
      const ref = doc(db, QUESTIONS_COLLECTION, q.id);
      batch.set(ref, q, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Failed to batch save questions to Firestore:', err);
    return false;
  }
}

/**
 * Delete a question from Firestore
 */
export async function deleteQuestionFromCloud(questionId: string): Promise<boolean> {
  try {
    const ref = doc(db, QUESTIONS_COLLECTION, questionId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error('Failed to delete question from Firestore:', err);
    return false;
  }
}

/**
 * Record a student exam attempt in Firestore
 */
export async function recordAttemptToCloud(attempt: ExamAttempt): Promise<boolean> {
  try {
    const ref = doc(db, ATTEMPTS_COLLECTION, attempt.id);
    await setDoc(ref, attempt);
    return true;
  } catch (err) {
    console.error('Failed to record attempt in Firestore:', err);
    return false;
  }
}

/**
 * Save or update setter profile in Firestore
 */
export async function saveSetterToCloud(setter: QuestionSetter): Promise<boolean> {
  try {
    const ref = doc(db, SETTERS_COLLECTION, setter.id);
    await setDoc(ref, setter, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save setter in Firestore:', err);
    return false;
  }
}

/**
 * Delete setter from Firestore
 */
export async function deleteSetterFromCloud(setterId: string): Promise<boolean> {
  try {
    const ref = doc(db, SETTERS_COLLECTION, setterId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error('Failed to delete setter from Firestore:', err);
    return false;
  }
}

/**
 * Initial sync check: if Firestore is empty on first boot, seeds default setters if needed
 */
export async function initCloudStoreDefaults(): Promise<void> {
  try {
    const sCol = collection(db, SETTERS_COLLECTION);
    const snap = await getDocs(sCol);
    if (snap.empty) {
      const defaultSetters: QuestionSetter[] = [
        {
          id: 'setter-1',
          username: 'setter1',
          name: 'Prof. A. Banerjee',
          passcode: 'setter123',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'setter-2',
          username: 'setter2',
          name: 'Dr. K. Sharma',
          passcode: 'setter123',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ];
      for (const s of defaultSetters) {
        await saveSetterToCloud(s);
      }
    }

    // Initialize or sync admin credentials to Firestore
    const adminRef = doc(db, SYSTEM_COLLECTION, 'admin');
    await setDoc(
      adminRef,
      {
        username: 'admin',
        passcode: '12345',
        name: 'Master Administrator',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not initialize Firestore default setters & admin:', err);
  }
}

/**
 * Save or update Master Admin credentials in Firestore
 */
export async function saveAdminToCloud(admin: {
  username: string;
  passcode: string;
  name?: string;
}): Promise<boolean> {
  try {
    const ref = doc(db, SYSTEM_COLLECTION, 'admin');
    await setDoc(ref, { ...admin, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save admin credentials in Firestore:', err);
    return false;
  }
}

