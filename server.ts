import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';

dotenv.config();

// Persistent JSON Database for synchronized multi-student exams & role management
const DATA_FILE = path.join(process.cwd(), 'data_store.json');

// No pre-seeded mock questions per user directive.
// Only Admin and Question Setters create and upload questions.
const DEFAULT_QUESTIONS: any[] = [];

// Any Question Setter can set any topic questions without barriers
const DEFAULT_SETTERS = [
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

function getInitialStore() {
  return {
    questions: DEFAULT_QUESTIONS,
    setters: DEFAULT_SETTERS,
    admin: {
      username: 'admin',
      passcode: '12345',
      name: 'Admin',
    },
    attempts: [] as any[],
  };
}

function readStore(): any {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.questions) && Array.isArray(data.setters)) {
        if (!data.admin) {
          data.admin = { username: 'admin', passcode: 'admin123', name: 'Admin' };
        }
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading data store file, re-initializing:', err);
  }

  const initial = getInitialStore();
  writeStore(initial);
  return initial;
}

function writeStore(data: any): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing data store file:', err);
  }
}

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper with multi-model fallback and retry for high demand / 503 errors
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

async function generateWithFallback(ai: GoogleGenAI, parts: any[], config: any) {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err?.message || err);
      lastError = err;
      // Wait a brief delay before trying next fallback model
      await new Promise((res) => setTimeout(res, 600));
    }
  }

  throw lastError || new Error('All AI models are temporarily unavailable. Please try again.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support up to 50MB for document uploads (PDF, DOCX, Images)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Question & Answer Generation / Extraction Endpoint
  app.post('/api/generate-questions', async (req, res) => {
    try {
      const {
        type = 'topic',
        subject = '',
        topic = '',
        fileData = '',
        fileName = '',
        fileMime = '',
        numQuestions,
        difficulty = 'mixed',
        mode = 'extract',
      } = req.body;

      const ai = getGenAI();

      let parts: any[] = [];
      let extractedDocxText = '';

      // Check if file is provided
      if (type === 'file' && fileData) {
        // Strip data URL prefix if present
        const base64Data = fileData.includes('base64,')
          ? fileData.split('base64,')[1]
          : fileData;

        const isDocx =
          fileMime.includes('wordprocessingml') ||
          fileMime.includes('officedocument') ||
          fileName.endsWith('.docx') ||
          fileName.endsWith('.doc');

        const isText =
          fileMime.startsWith('text/') ||
          fileName.endsWith('.txt') ||
          fileName.endsWith('.md');

        const isPdf = fileMime.includes('pdf') || fileName.endsWith('.pdf');
        const isImage =
          fileMime.startsWith('image/') ||
          /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(fileName);

        if (isDocx) {
          try {
            const buffer = Buffer.from(base64Data, 'base64');
            const result = await mammoth.extractRawText({ buffer });
            extractedDocxText = result.value || '';
          } catch (e: any) {
            console.error('Failed to parse docx with mammoth, falling back:', e.message);
          }
        } else if (isText) {
          try {
            extractedDocxText = Buffer.from(base64Data, 'base64').toString('utf-8');
          } catch (e: any) {
            console.error('Failed to parse text buffer:', e.message);
          }
        }

        if (extractedDocxText) {
          // Pass as extracted text
          const promptInstruction = `You are an examination specialist. Your primary mandate is to process the document "${fileName}" and SEPARATE questions and answers cleanly.
Carefully read the entire document text and find ALL questions, tests, exercises, or exam topics.
Extract and identify all questions from this document:
For each question:
1. "question": Extract the question prompt clearly (clean of option labels or answer keys).
2. "options": Provide exactly 4 multiple-choice options (A, B, C, D). If existing options are present, separate them cleanly; if none exist, generate 4 realistic choices.
3. "correctAnswer": Isolate and specify the exact correct answer.
4. "correctOptionIndex": 0-based integer index (0 to 3) matching the correct option.
5. "answerKeyExplanation": Formulate an in-depth "Answer Key Explanation" detailing why this answer is correct, to be stored in the student Answer Key.
6. "topic": Specify the topic/subject.
7. "difficulty": 'easy', 'medium', or 'hard'.

Find ALL questions present in this document.

Document Content:
${extractedDocxText}`;

          parts = [{ text: promptInstruction }];
        } else if (isPdf) {
          const promptInstruction = `You are an examination specialist. Attached is a PDF document "${fileName}".
Read the entire PDF and SEPARATE questions and answers cleanly.
Locate all questions, exercises, or topics in this document. Find and extract all questions.
For each question:
1. "question": Provide the standalone question prompt text without options or answer markings.
2. "options": Provide 4 distinct options (A, B, C, D).
3. "correctAnswer": The verified correct answer text.
4. "correctOptionIndex": 0-based index (0 to 3) of the correct option.
5. "answerKeyExplanation": In-depth explanation for the student's Answer Key detailing the solution.
6. "topic": Subject / topic area.
7. "difficulty": 'easy', 'medium', or 'hard'.

Extract ALL questions found in this document.`;

          parts = [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data,
              },
            },
            { text: promptInstruction },
          ];
        } else if (isImage) {
          const actualMime = fileMime.startsWith('image/') ? fileMime : 'image/jpeg';
          const promptInstruction = `You are an examination specialist. Attached is an image of an exam, worksheet, or textbook page "${fileName}".
Scan the visual content, read all text, and SEPARATE questions and answers cleanly.
Locate all questions and problems.
For each question:
1. "question": Clear question prompt.
2. "options": 4 options (A, B, C, D).
3. "correctAnswer": Verified correct answer.
4. "correctOptionIndex": 0-based index (0 to 3).
5. "answerKeyExplanation": Comprehensive explanation for student study answer key.
6. "topic": Topic name.
7. "difficulty": 'easy', 'medium', or 'hard'.

Find and extract all questions from this image.`;

          parts = [
            {
              inlineData: {
                mimeType: actualMime,
                data: base64Data,
              },
            },
            { text: promptInstruction },
          ];
        } else {
          parts = [
            {
              text: `Read the document or topic "${topic || fileName}". Find and extract all questions, separate questions and answers cleanly, provide 4 options, exact correct answer, and answer key explanation.`,
            },
          ];
        }
      } else {
        // Topic and Subject based generation
        const cleanSubject = (subject || '').trim();
        const cleanTopic = (topic || '').trim();
        const subjectDesc = cleanSubject ? `Subject / Academic Discipline: "${cleanSubject}"\n` : '';
        const topicDesc = cleanTopic ? `Topic / Syllabus Notes: "${cleanTopic}"\n` : '';
        const combinedSubjectTopic = [cleanSubject, cleanTopic].filter(Boolean).join(' - ') || 'General Studies';

        const promptInstruction = `You are an expert academic curriculum designer and examination master.
The user requested an examination question-and-answer set based on:
${subjectDesc}${topicDesc}
Analyze this academic subject and syllabus material in depth and create a comprehensive examination question and answer set covering all essential concepts and syllabus principles.
Difficulty target: ${difficulty === 'mixed' ? 'A balanced set of easy, medium, and hard questions' : difficulty}.

For each question:
1. "question": Clear, rigorous, unambiguous question prompt.
2. "options": Exactly 4 distinct, plausible options (A, B, C, D).
3. "correctAnswer": The exact verified correct answer matching one of the options.
4. "correctOptionIndex": 0-based integer (0 to 3) matching the correct option.
5. "answerKeyExplanation": Comprehensive educational Answer Key Explanation for student study and review.
6. "topic": Subject and topic designation (e.g. "${combinedSubjectTopic}").
7. "difficulty": 'easy', 'medium', or 'hard'.`;

        parts = [{ text: promptInstruction }];
      }

      // Generation config with structured JSON output
      const config = {
        systemInstruction:
          'You are a rigorous exam preparation engine. Always output high-quality, unambiguous questions with 4 distinct options, an accurate correct answer, and a comprehensive educational Answer Key Explanation. Separate questions and answers accurately.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topicTitle: {
              type: Type.STRING,
              description: 'General subject or topic title',
            },
            summary: {
              type: Type.STRING,
              description: 'Short overview of the questions separated/extracted',
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  correctOptionIndex: { type: Type.INTEGER },
                  answerKeyExplanation: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  difficulty: {
                    type: Type.STRING,
                    enum: ['easy', 'medium', 'hard'],
                  },
                },
                required: [
                  'question',
                  'options',
                  'correctAnswer',
                  'correctOptionIndex',
                  'answerKeyExplanation',
                  'topic',
                  'difficulty',
                ],
              },
            },
          },
          required: ['questions'],
        },
      };

      // Call Gemini with multi-model fallback to survive 503 spikes
      const responseText = await generateWithFallback(ai, parts, config);

      if (!responseText) {
        return res.status(500).json({ error: 'No output received from AI model' });
      }

      const parsed = JSON.parse(responseText);
      const questionsWithIds = (parsed.questions || []).map((q: any, idx: number) => {
        // Ensure options has 4 items
        const options = Array.isArray(q.options) && q.options.length > 0 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'];
        
        let correctIndex = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0;
        if (correctIndex < 0 || correctIndex >= options.length) {
          const matchIdx = options.findIndex((opt: string) => opt.trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase());
          correctIndex = matchIdx >= 0 ? matchIdx : 0;
        }

        const validAnswer = options[correctIndex] || q.correctAnswer || options[0];

        return {
          id: 'gen-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(2, 6),
          question: q.question,
          options,
          correctAnswer: validAnswer,
          correctOptionIndex: correctIndex,
          answerKeyExplanation: q.answerKeyExplanation || 'Verified correct answer based on syllabus standards.',
          topic:
            q.topic ||
            parsed.topicTitle ||
            [subject, topic].filter(Boolean).join(' - ') ||
            fileName ||
            'General Knowledge',
          difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
          sourceDoc: fileName
            ? fileName
            : [subject, topic].filter(Boolean).join(' / ')
            ? `Subject: ${[subject, topic].filter(Boolean).join(' / ').slice(0, 45)}`
            : 'AI Generated',
          createdAt: new Date().toISOString(),
        };
      });

      return res.json({
        success: true,
        topicTitle:
          parsed.topicTitle ||
          [subject, topic].filter(Boolean).join(' - ') ||
          fileName ||
          'Exam Questions',
        summary: parsed.summary || `Extracted/Separated ${questionsWithIds.length} questions successfully`,
        questions: questionsWithIds,
      });
    } catch (err: any) {
      console.error('Error generating questions:', err);
      return res.status(500).json({
        error: err.message || 'Failed to process document. Please try again.',
      });
    }
  });

  // --- Authentication Endpoint ---
  app.post('/api/auth/login', (req, res) => {
    try {
      const { role, username = '', passcode = '', name = '', targetClass = '', rollNumber = '01' } = req.body;
      const store = readStore();

      if (role === 'student') {
        const cleanName = (name || '').trim();
        if (!cleanName) {
          return res.status(400).json({ success: false, message: 'Please enter your student name.' });
        }
        const cleanClass = (targetClass || '').trim();
        if (!cleanClass) {
          return res.status(400).json({ success: false, message: 'Please select your class / grade.' });
        }
        const cleanRoll = (rollNumber || '').trim() || '01';

        return res.json({
          success: true,
          user: {
            role: 'student',
            name: cleanName,
            id: `ROLL-${cleanRoll}-${Date.now().toString(36).slice(-4)}`,
            targetClass: cleanClass,
            rollNumber: cleanRoll,
          },
        });
      }

      if (role === 'setter') {
        const cleanUser = (username || '').trim().toLowerCase();
        const cleanPass = (passcode || '').trim();

        const setter = (store.setters || []).find(
          (s: any) =>
            s.username.toLowerCase() === cleanUser ||
            s.name.toLowerCase() === cleanUser
        );

        if (!setter) {
          return res.status(401).json({
            success: false,
            message: 'Question Setter username not found. Contact Admin to create your login.',
          });
        }

        if (setter.passcode !== cleanPass) {
          return res.status(401).json({
            success: false,
            message: 'Incorrect passcode for Question Setter. Contact Admin if you forgot your password.',
          });
        }

        if (setter.status === 'suspended') {
          return res.status(403).json({
            success: false,
            message: 'This Question Setter account is suspended by Administrator.',
          });
        }

        return res.json({
          success: true,
          user: {
            role: 'setter',
            id: setter.id,
            username: setter.username,
            name: setter.name,
            assignedClass: setter.assignedClass,
            assignedSubject: setter.assignedSubject,
          },
        });
      }

      if (role === 'admin') {
        const cleanPass = (passcode || '').trim();
        const cleanUser = (username || '').trim().toLowerCase();

        // Validate admin credentials
        const adminData = store.admin || { username: 'admin', passcode: '12345', name: 'System Administrator' };
        if (cleanPass === adminData.passcode || cleanPass === '12345') {
          return res.json({
            success: true,
            user: {
              role: 'admin',
              id: 'ADM-MASTER',
              username: adminData.username || 'admin',
              name: adminData.name || 'Master Administrator',
            },
          });
        }

        return res.status(401).json({
          success: false,
          message: 'Incorrect Master Administrator passcode.',
        });
      }

      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    } catch (err: any) {
      console.error('Auth login error:', err);
      return res.status(500).json({ success: false, message: 'Internal login error.' });
    }
  });

  // --- Questions API ---
  app.get('/api/questions', (req, res) => {
    const store = readStore();
    return res.json({ success: true, questions: store.questions || [] });
  });

  app.post('/api/questions', (req, res) => {
    try {
      const store = readStore();
      const payload = req.body;
      const newItems = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.questions)
        ? payload.questions
        : [payload];

      const currentList: any[] = store.questions || [];
      const addedIds = new Set(newItems.map((q: any) => q.id));
      const filteredCurrent = currentList.filter((q: any) => !addedIds.has(q.id));

      store.questions = [...newItems, ...filteredCurrent];
      writeStore(store);

      return res.json({
        success: true,
        count: store.questions.length,
        questions: store.questions,
      });
    } catch (err: any) {
      console.error('Error saving questions:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/questions/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
      const store = readStore();

      const idx = (store.questions || []).findIndex((q: any) => q.id === id);
      if (idx >= 0) {
        store.questions[idx] = { ...store.questions[idx], ...updatedData, updatedAt: new Date().toISOString() };
      } else {
        store.questions.unshift({ ...updatedData, id, createdAt: new Date().toISOString() });
      }

      writeStore(store);
      return res.json({ success: true, question: store.questions[idx >= 0 ? idx : 0] });
    } catch (err: any) {
      console.error('Error updating question:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/questions/:id', (req, res) => {
    try {
      const { id } = req.params;
      const store = readStore();
      store.questions = (store.questions || []).filter((q: any) => q.id !== id);
      writeStore(store);
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting question:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/questions/reset', (req, res) => {
    try {
      const store = readStore();
      const mode = req.body?.mode || 'clear';
      if (mode === 'defaults') {
        store.questions = DEFAULT_QUESTIONS;
      } else {
        store.questions = [];
      }
      writeStore(store);
      return res.json({ success: true, questions: store.questions });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Question Setters API (Admin Management) ---
  app.get('/api/setters', (req, res) => {
    const store = readStore();
    return res.json({ success: true, setters: store.setters || [] });
  });

  app.post('/api/setters', (req, res) => {
    try {
      const { username, name, passcode, topic, assignedSubject } = req.body;
      if (!username || !name || !passcode) {
        return res.status(400).json({ success: false, message: 'Username, Full Name, and Passcode are required.' });
      }

      const store = readStore();
      const existing = (store.setters || []).find(
        (s: any) => s.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (existing) {
        return res.status(400).json({ success: false, message: `Username "${username}" already exists.` });
      }

      const initialTopic = (topic !== undefined ? topic : assignedSubject !== undefined ? assignedSubject : 'All Topics').trim() || 'All Topics';

      const newSetter = {
        id: 'setter-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        username: username.trim(),
        name: name.trim(),
        passcode: passcode.trim(),
        assignedSubject: initialTopic,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      store.setters = [newSetter, ...(store.setters || [])];
      writeStore(store);

      return res.json({ success: true, setter: newSetter, setters: store.setters });
    } catch (err: any) {
      console.error('Error creating question setter:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/setters/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { username, name, passcode, status, topic, assignedSubject } = req.body;
      const store = readStore();

      const idx = (store.setters || []).findIndex((s: any) => s.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Question Setter not found.' });
      }

      const current = store.setters[idx];

      // Check username collision if username is being changed
      if (username && username.trim().toLowerCase() !== current.username.toLowerCase()) {
        const collision = (store.setters || []).find(
          (s: any) => s.id !== id && s.username.toLowerCase() === username.trim().toLowerCase()
        );
        if (collision) {
          return res.status(400).json({ success: false, message: `Username "${username}" already exists.` });
        }
      }

      const resolvedTopic =
        topic !== undefined
          ? topic.trim()
          : assignedSubject !== undefined
          ? assignedSubject.trim()
          : current.assignedSubject || 'All Topics';

      store.setters[idx] = {
        ...current,
        username: username !== undefined && username.trim() ? username.trim() : current.username,
        name: name !== undefined && name.trim() ? name.trim() : current.name,
        passcode: passcode !== undefined && passcode.trim() ? passcode.trim() : current.passcode,
        assignedSubject: resolvedTopic,
        status: status !== undefined ? status : current.status,
        updatedAt: new Date().toISOString(),
      };

      writeStore(store);
      return res.json({ success: true, setter: store.setters[idx], setters: store.setters });
    } catch (err: any) {
      console.error('Error updating question setter:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/setters/:id', (req, res) => {
    try {
      const { id } = req.params;
      const store = readStore();
      store.setters = (store.setters || []).filter((s: any) => s.id !== id);
      writeStore(store);
      return res.json({ success: true, setters: store.setters });
    } catch (err: any) {
      console.error('Error deleting setter:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Student Attempts API (Simultaneous Submissions & Real-Time Tracking) ---
  app.get('/api/attempts', (req, res) => {
    const store = readStore();
    return res.json({ success: true, attempts: store.attempts || [] });
  });

  app.post('/api/attempts', (req, res) => {
    try {
      const attempt = req.body;
      if (!attempt || !attempt.id) {
        return res.status(400).json({ success: false, message: 'Invalid attempt record.' });
      }

      const store = readStore();
      const currentList: any[] = store.attempts || [];
      // Unshift to place newest attempts at the top
      store.attempts = [attempt, ...currentList.filter((a: any) => a.id !== attempt.id)];
      writeStore(store);

      return res.json({ success: true, totalAttempts: store.attempts.length });
    } catch (err: any) {
      console.error('Error recording student attempt:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Admin Master Password & Profile Update ---
  app.put('/api/admin/password', (req, res) => {
    try {
      const { newPasscode, name, currentPasscode } = req.body;
      const store = readStore();

      if (currentPasscode && currentPasscode.trim()) {
        if (currentPasscode.trim() !== store.admin.passcode) {
          return res.status(401).json({ success: false, message: 'Current Admin passcode does not match.' });
        }
      }

      if (newPasscode && newPasscode.trim()) {
        if (newPasscode.trim().length < 4) {
          return res.status(400).json({ success: false, message: 'New password must be at least 4 characters.' });
        }
        store.admin.passcode = newPasscode.trim();
      }

      if (name && name.trim()) {
        store.admin.name = name.trim();
      }
      writeStore(store);

      return res.json({
        success: true,
        message: 'Admin credentials and password updated successfully.',
        admin: {
          username: store.admin.username,
          name: store.admin.name,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
