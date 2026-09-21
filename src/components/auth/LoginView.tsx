import React, { useState } from 'react';
import { UserRole, STANDARD_CLASSES } from '../../types';
import { loginUserApi } from '../../utils/api';
import { getPublicUrl, copyToClipboard } from '../../utils/share';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  KeyRound,
  PenTool,
  CheckCircle2,
  Users,
  ShieldAlert,
  AlertCircle,
  Globe,
  Share2,
  Check,
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (
    role: UserRole,
    name: string,
    id: string,
    targetClass?: string,
    rollNumber?: string,
    username?: string,
    assignedSubject?: string
  ) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Student State - BLANK by default as requested: "Student name will be blank in log in. student should write his/her name."
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState<string>('');
  const [customClass, setCustomClass] = useState('');
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [studentRoll, setStudentRoll] = useState('');

  // Question Setter State
  const [setterUsername, setSetterUsername] = useState('setter1');
  const [setterPasscode, setSetterPasscode] = useState('');

  // Admin State
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPasscode, setAdminPasscode] = useState('');

  // Status & Validation
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCopyPublicLink = async () => {
    const url = getPublicUrl();
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    }
  };

  const effectiveClass = isCustomClass ? customClass.trim() : studentClass;

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanName = studentName.trim();
    if (!cleanName) {
      setLoginError('Please write your full student name to proceed.');
      return;
    }

    if (!effectiveClass) {
      setLoginError('Please select your class / grade to proceed.');
      return;
    }

    const cleanRoll = studentRoll.trim() || '01';
    const cleanClass = effectiveClass;

    setIsLoading(true);
    const res = await loginUserApi({
      role: 'student',
      name: cleanName,
      targetClass: cleanClass,
      rollNumber: cleanRoll,
    });
    setIsLoading(false);

    if (res.success && res.user) {
      onLogin('student', res.user.name, res.user.id, res.user.targetClass, res.user.rollNumber);
    } else {
      // Direct login fallback
      onLogin('student', cleanName, `ROLL-${cleanRoll}`, cleanClass, cleanRoll);
    }
  };

  const handleSetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!setterUsername.trim() || !setterPasscode.trim()) {
      setLoginError('Please enter both username and passcode for Question Setter.');
      return;
    }

    setIsLoading(true);
    const res = await loginUserApi({
      role: 'setter',
      username: setterUsername.trim(),
      passcode: setterPasscode.trim(),
    });
    setIsLoading(false);

    if (res.success && res.user) {
      onLogin('setter', res.user.name, res.user.id, res.user.targetClass, undefined, res.user.username, res.user.assignedSubject);
    } else {
      setLoginError(res.message || 'Invalid Question Setter credentials.');
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!adminPasscode.trim()) {
      setLoginError('Please enter the Master Administrator passcode.');
      return;
    }

    setIsLoading(true);
    const res = await loginUserApi({
      role: 'admin',
      username: adminUsername.trim(),
      passcode: adminPasscode.trim(),
    });
    setIsLoading(false);

    if (res.success && res.user) {
      onLogin('admin', res.user.name, res.user.id, undefined, undefined, res.user.username);
    } else {
      setLoginError(res.message || 'Invalid Master Administrator passcode.');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-2 sm:p-4" id="login-view-container">
      {/* Brand Title */}
      <div className="text-center max-w-2xl mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Synchronized Multi-Candidate Exam & Assessment Platform
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Exam Portal
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
          Concurrent examination portal for students, dedicated question setting suite for faculty, and master administration control.
        </p>
      </div>

      {/* Public Independent Access Banner */}
      <div className="max-w-xl w-full mb-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-700 text-center sm:text-left">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-1.5 justify-center sm:justify-start">
              <span>Independent Public Access</span>
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.2 rounded-full">
                No Gmail Needed
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Anyone with this URL can open and take tests immediately on any browser.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="copy-public-link-login-btn"
          onClick={handleCopyPublicLink}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
            copiedShareLink
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          {copiedShareLink ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copy Public Link</span>
            </>
          )}
        </button>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex bg-slate-200/90 p-1.5 rounded-2xl mb-6 max-w-lg w-full">
        <button
          type="button"
          id="select-student-role-tab"
          onClick={() => {
            setSelectedRole('student');
            setLoginError('');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            selectedRole === 'student'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student</span>
        </button>

        <button
          type="button"
          id="select-setter-role-tab"
          onClick={() => {
            setSelectedRole('setter');
            setLoginError('');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            selectedRole === 'setter'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Question Setter</span>
        </button>

        <button
          type="button"
          id="select-admin-role-tab"
          onClick={() => {
            setSelectedRole('admin');
            setLoginError('');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            selectedRole === 'admin'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Master Admin</span>
        </button>
      </div>

      {/* Error Banner */}
      {loginError && (
        <div className="max-w-xl w-full mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{loginError}</span>
        </div>
      )}

      {/* Cards Grid */}
      <div className="max-w-4xl w-full">
        {/* VIEW 1: STUDENT LOGIN */}
        {selectedRole === 'student' && (
          <div
            id="student-login-card"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-indigo-200 ring-2 ring-indigo-500/20 shadow-xl max-w-xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full inline-block">
                  For Test Candidates
                </div>
                <h2 className="text-xl font-bold text-slate-900">Student Portal</h2>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Multiple students can attend exams simultaneously. Please write your full name, select your class, and enter your roll number to begin.
            </p>

            <ul className="space-y-2 mb-6 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>No Gmail or email account required — open to any candidate</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Simultaneous independent sessions for every candidate</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Custom Countdown Timer, Analog Clock & Answer Key review</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Questions strictly isolated to your chosen class</span>
              </li>
            </ul>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              {/* Student Name: BLANK by default */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="student-name-input"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Write your full name (e.g. Priya Sharma)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Write your name as registered in school or college.
                </span>
              </div>

              {/* Class Selection Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class / Grade <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  <select
                    id="student-class-select"
                    value={isCustomClass ? 'custom' : studentClass}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomClass(true);
                      } else {
                        setIsCustomClass(false);
                        setStudentClass(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="" disabled>Select your class</option>
                    {STANDARD_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                    <option value="custom">+ Other Class (Write custom)</option>
                  </select>

                  {isCustomClass && (
                    <input
                      type="text"
                      id="student-custom-class-input"
                      value={customClass}
                      onChange={(e) => setCustomClass(e.target.value)}
                      placeholder="e.g. Class V, Grade 8, or Secondary"
                      className="w-full px-3.5 py-2 rounded-xl border border-indigo-300 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 bg-indigo-50/40"
                    />
                  )}
                </div>
              </div>

              {/* Roll Number: BLANK by default */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="student-roll-input"
                  required
                  value={studentRoll}
                  onChange={(e) => setStudentRoll(e.target.value)}
                  placeholder="Enter your roll number (e.g. 101, 12, or 2026-05)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                id="enter-student-portal-btn"
                disabled={isLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all cursor-pointer"
              >
                <span>{isLoading ? 'Entering Portal...' : `Enter ${effectiveClass} Exam Portal`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: QUESTION SETTER LOGIN (Formerly Admin Portal in original image) */}
        {selectedRole === 'setter' && (
          <div
            id="setter-login-card"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-indigo-200 ring-2 ring-indigo-500/20 shadow-xl max-w-xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <PenTool className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block">
                  For Question Setters & Faculty
                </div>
                <h2 className="text-xl font-bold text-slate-900">Question Setter Portal</h2>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Upload PDF, Word, or images to auto-separate questions & answers. Auto-read any topic to generate questions, and edit or change questions & answers.
            </p>

            <ul className="space-y-2 mb-6 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Upload PDF, Word (DOCX), JPEG, JPG, PNG Documents</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>AI Separation of Questions & Verified Answer Keys</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Full Power to Edit Questions, Options, or Answers</span>
              </li>
            </ul>

            <form onSubmit={handleSetterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Setter Username or Faculty Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="setter-username-input"
                  required
                  value={setterUsername}
                  onChange={(e) => setSetterUsername(e.target.value)}
                  placeholder="e.g. setter1 or Prof. A. Banerjee"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Default login options: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">setter1</code> or <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">setter2</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security Access Passcode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  id="setter-passcode-input"
                  required
                  value={setterPasscode}
                  onChange={(e) => setSetterPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Admin can create additional Question Setter logins and can change any setter's password from the Administrator portal.
                </span>
              </div>

              <button
                type="submit"
                id="enter-setter-portal-btn"
                disabled={isLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all cursor-pointer"
              >
                <span>{isLoading ? 'Verifying...' : 'Login as Question Setter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: MASTER ADMIN LOGIN (New Dedicated Admin Option) */}
        {selectedRole === 'admin' && (
          <div
            id="admin-login-card"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-800 ring-2 ring-slate-800/20 shadow-xl max-w-xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-indigo-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full inline-block border border-slate-200">
                  Supervisor & Master Authority
                </div>
                <h2 className="text-xl font-bold text-slate-900">Administrator Portal</h2>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Master Admin portal allows you to change <strong>anything</strong> in the system: change the password of any Question Setter, create more Question Setter logins, edit questions across all classes, and view all student exam submissions.
            </p>

            <ul className="space-y-2 mb-6 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Create & manage unlimited Question Setter accounts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Change or reset passwords of any Question Setter instantly</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Track live student submissions and scores in real time</span>
              </li>
            </ul>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrator Username
                </label>
                <input
                  type="text"
                  id="admin-username-input"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 font-mono focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Master Security Passcode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  id="admin-passcode-input"
                  required
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="Enter master passcode"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-slate-800"
                />
              </div>

              <button
                type="submit"
                id="enter-admin-portal-btn"
                disabled={isLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-indigo-900 hover:bg-indigo-950 shadow-md transition-all cursor-pointer"
              >
                <span>{isLoading ? 'Authenticating...' : 'Login as Master Administrator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
