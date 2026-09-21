import React, { useState, useRef } from 'react';
import { Question, STANDARD_CLASSES } from '../../types';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Edit3,
  Trash2,
  Layers,
  ArrowRight,
  GraduationCap,
  Tag,
} from 'lucide-react';

interface DocUploaderProps {
  onQuestionsGenerated: (newQuestions: Question[]) => void;
  onEditQuestion: (q: Question) => void;
  existingTopics?: string[];
  existingClasses?: string[];
  defaultSubject?: string;
}

export const DocUploader: React.FC<DocUploaderProps> = ({
  onQuestionsGenerated,
  onEditQuestion,
  existingTopics = [],
  existingClasses = [],
  defaultSubject = '',
}) => {
  const [activeInputType, setActiveInputType] = useState<'file' | 'topic'>('file');
  const [file, setFile] = useState<{
    name: string;
    size: number;
    mime: string;
    base64: string;
  } | null>(null);

  const [subject, setSubject] = useState(defaultSubject || '');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [mode, setMode] = useState<'generate' | 'extract'>('extract');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedList, setGeneratedList] = useState<Question[]>([]);
  const [generationSummary, setGenerationSummary] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Topic and Class assignment after generation
  const [assignedTopicMode, setAssignedTopicMode] = useState<'select' | 'write'>('select');
  const [assignedTopic, setAssignedTopic] = useState('General Studies');
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [assignedClassMode, setAssignedClassMode] = useState<'select' | 'write'>('select');
  const [assignedClass, setAssignedClass] = useState('Class V');
  const [customClassInput, setCustomClassInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUBJECT_PRESETS = [
    'Science',
    'Mathematics',
    'English Language',
    'Social Studies',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'History',
    'Geography',
    'General Knowledge',
  ];

  const TOPIC_PRESETS = [
    { topic: 'Photosynthesis & Plant Cellular Respiration', subject: 'Biology' },
    { topic: 'Object-Oriented Programming & Principles (OOP)', subject: 'Computer Science' },
    { topic: 'World War II: Major Battles and Timeline', subject: 'History' },
    { topic: 'Newtonian Mechanics & Laws of Motion', subject: 'Physics' },
    { topic: 'World Capitals, Continents & Ocean Geography', subject: 'Geography' },
    { topic: 'Database Normalization (1NF, 2NF, 3NF, BCNF)', subject: 'Computer Science' },
  ];

  // Combine unique topics for dropdown
  const allAvailableTopics = Array.from(
    new Set([...existingTopics, ...TOPIC_PRESETS.map((p) => p.topic), assignedTopic].filter(Boolean))
  );

  const applyTopicToAll = (newTopic: string) => {
    const clean = newTopic.trim() || 'General Studies';
    setAssignedTopic(clean);
    setGeneratedList((prev) =>
      prev.map((q) => ({ ...q, topic: clean }))
    );
  };

  const applyClassToAll = (newClass: string) => {
    const clean = newClass.trim() || 'Class V';
    setAssignedClass(clean);
    setGeneratedList((prev) =>
      prev.map((q) => ({ ...q, targetClass: clean }))
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    processFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (fileObj: File) => {
    setError('');
    // Allowed extensions
    const ext = fileObj.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png', 'webp', 'txt'];
    if (!allowed.includes(ext)) {
      setError(`Unsupported file type (.${ext}). Please upload PDF, Word (DOCX), JPEG/PNG images, or text documents.`);
      return;
    }

    if (fileObj.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFile({
        name: fileObj.name,
        size: fileObj.size,
        mime: fileObj.type || 'application/octet-stream',
        base64: result,
      });
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsDataURL(fileObj);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    setError('');
    setSavedSuccess(false);

    if (activeInputType === 'file' && !file) {
      setError('Please choose a document file (PDF, DOCX, JPG, PNG) to upload.');
      return;
    }

    if (activeInputType === 'topic' && !topic.trim() && !subject.trim()) {
      setError('Please enter a subject or topic/syllabus notes to create questions and answers.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        type: activeInputType,
        subject: subject.trim(),
        topic: topic.trim(),
        fileData: file?.base64,
        fileName: file?.name,
        fileMime: file?.mime,
        difficulty,
        mode,
      };

      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process document and generate questions');
      }

      const combinedSubjectTopic = [subject.trim(), topic.trim()].filter(Boolean).join(' - ');
      const detectedTopic = (combinedSubjectTopic || data.topicTitle || data.questions?.[0]?.topic || 'General Studies').trim();
      const defaultClass = 'Class V';
      setAssignedTopic(detectedTopic);
      setCustomTopicInput(detectedTopic);
      setAssignedClass(defaultClass);

      const enriched = (data.questions || []).map((q: Question) => ({
        ...q,
        topic: q.topic || detectedTopic,
        targetClass: q.targetClass || defaultClass,
      }));

      setGeneratedList(enriched);
      setGenerationSummary(data.summary || `Extracted & separated ${enriched.length} questions.`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred. Please verify your file or topic.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = () => {
    if (generatedList.length === 0) return;

    const effectiveTopic = (
      assignedTopicMode === 'write' && customTopicInput.trim()
        ? customTopicInput.trim()
        : assignedTopic.trim()
    ) || 'General Studies';

    const effectiveClass = (
      assignedClassMode === 'write' && customClassInput.trim()
        ? customClassInput.trim()
        : assignedClass.trim()
    ) || 'Class V';

    const finalList = generatedList.map((q) => ({
      ...q,
      topic: q.topic || effectiveTopic,
      targetClass: q.targetClass || effectiveClass,
    }));

    onQuestionsGenerated(finalList);
    setSavedSuccess(true);
    // Clear list after short timeout
    setTimeout(() => {
      setGeneratedList([]);
      setSavedSuccess(false);
      removeFile();
      setTopic('');
    }, 1800);
  };

  const handleRemoveGeneratedItem = (id: string) => {
    setGeneratedList((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-8" id="admin-doc-uploader-section">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            AI Document Reader & Question-Answer Separator
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Upload Documents or Enter Any Topic
          </h2>
          <p className="text-indigo-100/80 text-sm leading-relaxed">
            Upload PDF, Word (DOCX), JPEG, JPG, PNG exam papers or study materials. The AI will automatically analyze the content, generate or separate questions, identify correct answers, and compile the official student Answer Key.
          </p>
        </div>
      </div>

      {/* Main Creation Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
          <button
            type="button"
            id="tab-upload-doc"
            onClick={() => {
              setActiveInputType('file');
              setError('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeInputType === 'file'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload File (PDF / Word / Image)
          </button>
          <button
            type="button"
            id="tab-enter-topic"
            onClick={() => {
              setActiveInputType('topic');
              setError('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeInputType === 'topic'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Input Topic / Syllabus Notes
          </button>
        </div>

        {/* Upload Mode Config */}
        {activeInputType === 'file' && (
          <div className="space-y-4 mb-6">
            {!file ? (
              <div
                id="file-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/40 transition-all rounded-2xl p-8 text-center cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="admin-file-input"
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  Click to upload or drag & drop documents
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
                  Supports <span className="font-semibold text-slate-700">PDF (.pdf)</span>,{' '}
                  <span className="font-semibold text-slate-700">Word (.docx, .doc)</span>,{' '}
                  <span className="font-semibold text-slate-700">Images (.jpg, .jpeg, .png)</span>, and text files up to 25MB.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs shadow-xs">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  PDF / Word / JPG / PNG ready
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-200 bg-indigo-50/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    {file.mime.includes('image') ? (
                      <ImageIcon className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.mime || 'Document'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ready
                  </span>
                  <button
                    type="button"
                    id="remove-file-btn"
                    onClick={removeFile}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Document Processing Objective */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Processing Objective
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    mode === 'generate'
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-100'
                      : 'border-slate-200 bg-white/60 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="doc-mode"
                    checked={mode === 'generate'}
                    onChange={() => setMode('generate')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">
                      Read Topic & Generate New Q&A
                    </span>
                    <span className="text-xs text-slate-500">
                      Creates brand new examination questions based on the uploaded material.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    mode === 'extract'
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-100'
                      : 'border-slate-200 bg-white/60 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="doc-mode"
                    checked={mode === 'extract'}
                    onChange={() => setMode('extract')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">
                      Extract & Separate Questions & Answers
                    </span>
                    <span className="text-xs text-slate-500">
                      Extracts existing questions from an exam sheet and cleanly isolates the answer keys.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Topic & Subject Mode Config */}
        {activeInputType === 'topic' && (
          <div className="space-y-5 mb-6">
            {/* Subject Input Option */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-950">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Type Subject / Academic Discipline *
                </label>
                <span className="text-[11px] font-semibold text-indigo-600">
                  Defines subject context to create question & answer
                </span>
              </div>
              <input
                type="text"
                id="admin-subject-input"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setError('');
                }}
                placeholder="Type subject (e.g. Science, Mathematics, English, History, Computer Science)..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 text-sm placeholder-slate-400 outline-none bg-white transition-all mb-2.5"
              />

              {/* Subject Presets Quick Selection */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Or select popular subjects:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECT_PRESETS.map((presetSub) => (
                    <button
                      key={presetSub}
                      type="button"
                      onClick={() => {
                        setSubject(presetSub);
                        setError('');
                      }}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        subject.toLowerCase() === presetSub.toLowerCase()
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-slate-200'
                      }`}
                    >
                      {presetSub}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Topic / Syllabus Notes Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  Topic / Syllabus Notes *
                </label>
                <span className="text-[11px] text-slate-400">Chapters, sub-topics, or study notes</span>
              </div>
              <textarea
                id="admin-topic-input"
                rows={4}
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Photosynthesis, Cellular Respiration, Laws of Motion, or paste syllabus paragraphs & questions..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 text-sm placeholder-slate-400 outline-none transition-all"
              />
            </div>

            {/* Topic Presets */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Or pick a sample syllabus topic:
              </span>
              <div className="flex flex-wrap gap-2">
                {TOPIC_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    id={`topic-preset-${idx}`}
                    onClick={() => {
                      setTopic(preset.topic);
                      if (!subject.trim()) {
                        setSubject(preset.subject);
                      }
                      setError('');
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition-colors border border-slate-200/60"
                  >
                    + {preset.topic} <span className="text-[10px] text-indigo-500 font-semibold">({preset.subject})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generation Settings: Full Scope & difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Extraction Scope: Find All Questions
              </label>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The AI automatically scans the full uploaded document or topic to locate, separate, and format <span className="font-semibold text-indigo-900">all available questions and answer keys</span> without artificial limits.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Difficulty Tier
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['easy', 'medium', 'hard', 'mixed'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  id={`diff-btn-${diff}`}
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 text-xs font-semibold rounded-xl capitalize transition-all border ${
                    difficulty === diff
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Trigger Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            id="start-ai-generation-btn"
            disabled={loading}
            onClick={handleGenerate}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-md transition-all ${
              loading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reading Content & Separating Q&A...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {activeInputType === 'file'
                  ? mode === 'extract'
                    ? 'Extract & Separate Questions & Answers'
                    : 'Analyze Document & Create Questions'
                  : 'Generate Questions from Topic'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Questions Preview & Review Section */}
      {generatedList.length > 0 && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-lg p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {generatedList.length} Questions Generated & Separated
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Review & Confirm Questions
              </h3>
              <p className="text-xs text-slate-500">{generationSummary}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                id="save-all-questions-btn"
                onClick={handleSaveAll}
                disabled={savedSuccess}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Saved to Question Bank!
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    Save All to Question Bank
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Topic and Class Assignment Control Panel */}
          <div className="bg-slate-50 border border-indigo-100 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  Step 2: Mention Topic Name & Target Class
                </h4>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Sets classification for all {generatedList.length} extracted questions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Mention Topic (Select or Write) */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Topic Name</span>
                  </div>
                  <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      id="topic-mode-select-btn"
                      onClick={() => setAssignedTopicMode('select')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        assignedTopicMode === 'select'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Select Topic
                    </button>
                    <button
                      type="button"
                      id="topic-mode-write-btn"
                      onClick={() => setAssignedTopicMode('write')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        assignedTopicMode === 'write'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Write Topic
                    </button>
                  </div>
                </div>

                {assignedTopicMode === 'select' ? (
                  <div className="space-y-1.5">
                    <select
                      id="uploader-assigned-topic-select"
                      value={assignedTopic}
                      onChange={(e) => applyTopicToAll(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {allAvailableTopics.map((top) => (
                        <option key={top} value={top}>
                          {top}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Select an existing topic from the system repository.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="uploader-assigned-topic-write-input"
                        value={customTopicInput}
                        onChange={(e) => setCustomTopicInput(e.target.value)}
                        placeholder="Write / enter topic name..."
                        className="flex-1 px-3 py-2 text-xs font-medium text-slate-800 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        id="apply-custom-topic-btn"
                        onClick={() => {
                          if (customTopicInput.trim()) {
                            applyTopicToAll(customTopicInput.trim());
                          }
                        }}
                        className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shrink-0 cursor-pointer transition-colors"
                      >
                        Apply to All
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Type custom topic name and click Apply to update all questions.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Target Class (Select or Write) */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                    <span>Which Class / Grade?</span>
                  </div>
                  <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      id="class-mode-select-btn"
                      onClick={() => setAssignedClassMode('select')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        assignedClassMode === 'select'
                          ? 'bg-white text-teal-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Select Class
                    </button>
                    <button
                      type="button"
                      id="class-mode-write-btn"
                      onClick={() => setAssignedClassMode('write')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        assignedClassMode === 'write'
                          ? 'bg-white text-teal-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Write Class
                    </button>
                  </div>
                </div>

                {assignedClassMode === 'select' ? (
                  <div className="space-y-1.5">
                    <select
                      id="uploader-assigned-class-select"
                      value={assignedClass}
                      onChange={(e) => applyClassToAll(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold text-teal-800 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      {STANDARD_CLASSES.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Students in this class will exclusively receive these questions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="uploader-assigned-class-write-input"
                        value={customClassInput}
                        onChange={(e) => setCustomClassInput(e.target.value)}
                        placeholder="Write class (e.g. Class V, Grade 8)..."
                        className="flex-1 px-3 py-2 text-xs font-medium text-slate-800 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500"
                      />
                      <button
                        type="button"
                        id="apply-custom-class-btn"
                        onClick={() => {
                          if (customClassInput.trim()) {
                            applyClassToAll(customClassInput.trim());
                          }
                        }}
                        className="px-3 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shrink-0 cursor-pointer transition-colors"
                      >
                        Apply to All
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Type custom class designation and click Apply to update all questions.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Assignment Status Pill */}
            <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-indigo-100 text-xs">
              <span className="text-slate-600 font-medium">
                Active Assignment for this Batch:
              </span>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  Topic: {assignedTopic}
                </span>
                <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Class: {assignedClass}
                </span>
              </div>
            </div>
          </div>

          {/* List of Separated Questions and Answer Keys */}
          <div className="space-y-4">
            {generatedList.map((q, idx) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                      {q.targetClass || assignedClass}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      {q.topic || assignedTopic}
                    </span>
                    <span className="text-xs font-medium text-slate-500 capitalize bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      id={`edit-generated-${idx}`}
                      onClick={() => onEditQuestion(q)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit question and answer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Q&A
                    </button>
                    <button
                      type="button"
                      id={`remove-generated-${idx}`}
                      onClick={() => handleRemoveGeneratedItem(q.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  {q.question}
                </p>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect =
                      optIdx === q.correctOptionIndex ||
                      opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1 truncate">{opt}</span>
                        {isCorrect && (
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Answer Key
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Answer Key Explanation Box */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                  <span className="font-bold text-amber-800 shrink-0">Answer Key:</span>
                  <p className="leading-relaxed">{q.answerKeyExplanation}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              id="bottom-save-all-btn"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Add All ({generatedList.length}) Questions to Question Bank
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
