import React, { useState } from 'react';
import { Question, QuestionDifficulty, STANDARD_CLASSES } from '../../types';
import { X, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface EditQuestionModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedQuestion: Question) => void;
  availableTopics?: string[];
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  isOpen,
  onClose,
  onSave,
  availableTopics = [],
}) => {
  if (!isOpen || !question) return null;

  const [questionText, setQuestionText] = useState(question.question);
  const [topic, setTopic] = useState(question.topic);
  const [targetClass, setTargetClass] = useState(question.targetClass || 'Class V');
  const [isCustomClass, setIsCustomClass] = useState(!STANDARD_CLASSES.includes((question.targetClass || 'Class V') as any));
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(question.difficulty);
  const [options, setOptions] = useState<string[]>([...question.options]);
  const [correctIndex, setCorrectIndex] = useState<number>(
    question.correctOptionIndex >= 0 && question.correctOptionIndex < question.options.length
      ? question.correctOptionIndex
      : 0
  );
  const [explanation, setExplanation] = useState(question.answerKeyExplanation);
  const [error, setError] = useState('');

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setError('A question must have at least 2 options.');
      return;
    }
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    if (correctIndex >= updated.length) {
      setCorrectIndex(updated.length - 1);
    } else if (correctIndex === index) {
      setCorrectIndex(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setError('Question prompt cannot be empty.');
      return;
    }
    for (let i = 0; i < options.length; i++) {
      if (!options[i].trim()) {
        setError(`Option ${i + 1} cannot be blank.`);
        return;
      }
    }
    if (correctIndex < 0 || correctIndex >= options.length) {
      setError('Please select a valid correct answer option.');
      return;
    }

    const updated: Question = {
      ...question,
      question: questionText.trim(),
      topic: topic.trim() || 'General Studies',
      targetClass: targetClass.trim() || 'Class V',
      difficulty,
      options: options.map((opt) => opt.trim()),
      correctAnswer: options[correctIndex].trim(),
      correctOptionIndex: correctIndex,
      answerKeyExplanation: explanation.trim() || 'Verified answer key explanation.',
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      id="edit-question-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        id="edit-question-modal-card"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {question.id.startsWith('new-') ? 'Add New Question' : 'Edit Question & Answer'}
            </h3>
            <p className="text-xs text-slate-500">
              Update question prompt, options, correct answer key, or explanation.
            </p>
          </div>
          <button
            id="close-edit-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Question Text */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Question Prompt *
            </label>
            <textarea
              id="edit-question-text"
              rows={3}
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value);
                setError('');
              }}
              placeholder="Enter the question text here..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 text-sm placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* Topic, Target Class, and Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Topic / Subject *
              </label>
              <input
                id="edit-question-topic"
                type="text"
                list="topic-datalist-options"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Computer Science, Science..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 text-sm outline-none transition-all"
              />
              <datalist id="topic-datalist-options">
                {availableTopics.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Class *
              </label>
              <div className="space-y-1.5">
                <select
                  id="edit-question-class-select"
                  value={isCustomClass ? 'custom' : targetClass}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomClass(true);
                    } else {
                      setIsCustomClass(false);
                      setTargetClass(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 text-sm bg-white outline-none transition-all"
                >
                  {STANDARD_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                  <option value="custom">+ Custom Class...</option>
                </select>

                {isCustomClass && (
                  <input
                    type="text"
                    id="edit-question-custom-class"
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    placeholder="e.g. Class V, Grade 5"
                    className="w-full px-3 py-1.5 rounded-lg border border-indigo-300 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 bg-indigo-50/40"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Difficulty Level
              </label>
              <select
                id="edit-question-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 text-sm bg-white outline-none transition-all"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Options & Correct Answer Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Answer Options & Correct Answer Selection *
              </label>
              <span className="text-xs text-indigo-600 font-medium">
                Click radio to mark as Correct Answer
              </span>
            </div>

            <div className="space-y-2.5">
              {options.map((opt, idx) => {
                const isCorrect = correctIndex === idx;
                const letter = String.fromCharCode(65 + idx);
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                      isCorrect
                        ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      id={`select-correct-option-${idx}`}
                      onClick={() => setCorrectIndex(idx)}
                      title="Set as correct answer"
                      className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : letter}
                    </button>

                    <input
                      id={`option-input-${idx}`}
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${letter}`}
                      className="flex-1 px-2.5 py-1.5 text-sm text-slate-800 bg-transparent border-none focus:outline-none"
                    />

                    {isCorrect && (
                      <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full shrink-0">
                        Correct
                      </span>
                    )}

                    {options.length > 2 && (
                      <button
                        type="button"
                        id={`delete-option-${idx}`}
                        onClick={() => handleRemoveOption(idx)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                        title="Delete option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {options.length < 6 && (
              <button
                type="button"
                id="add-option-btn"
                onClick={handleAddOption}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 hover:bg-indigo-50/50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Option
              </button>
            )}
          </div>

          {/* Answer Key Explanation */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Answer Key Explanation / Rationale
            </label>
            <p className="text-xs text-slate-400 mb-2">
              This explanation appears in the Student Dashboard's Answer Key tab so students learn why this answer is correct.
            </p>
            <textarea
              id="edit-explanation-text"
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide a clear explanation for why the correct answer is right..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 text-sm placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="cancel-edit-btn"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-question-btn"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              Save Question & Answer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
