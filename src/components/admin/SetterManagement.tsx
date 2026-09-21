import React, { useState } from 'react';
import { QuestionSetter, UserSession } from '../../types';
import { updateAdminPasswordApi } from '../../utils/api';
import { saveAdminToCloud } from '../../lib/firebase';
import {
  Users,
  UserPlus,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
  BookOpen,
  Sparkles,
  AlertCircle,
  Tag,
  AtSign,
} from 'lucide-react';

interface SetterManagementProps {
  adminUser: UserSession;
  setters: QuestionSetter[];
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

const TOPIC_PRESETS = [
  'All Topics',
  'General Science',
  'Mathematics',
  'English Language',
  'Social Studies',
  'Computer & Tech',
  'General Knowledge',
  'Environmental Studies',
];

export const SetterManagement: React.FC<SetterManagementProps> = ({
  adminUser,
  setters,
  onCreateSetter,
  onUpdateSetter,
  onDeleteSetter,
  onAdminProfileUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editSetterTarget, setEditSetterTarget] = useState<QuestionSetter | null>(null);
  const [passwordChangeTarget, setPasswordChangeTarget] = useState<QuestionSetter | null>(null);
  const [nameChangeTarget, setNameChangeTarget] = useState<QuestionSetter | null>(null);
  const [isAdminSecurityOpen, setIsAdminSecurityOpen] = useState(false);

  // Full Edit Modal Form State (Name, Username, Password, Topic)
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPasscode, setEditPasscode] = useState('');
  const [editTopic, setEditTopic] = useState('All Topics');
  const [showEditPassword, setShowEditPassword] = useState(true);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Create Setter Form State
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [newTopic, setNewTopic] = useState('All Topics');
  const [showCreatePassword, setShowCreatePassword] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Quick Password Change State
  const [quickPasswordValue, setQuickPasswordValue] = useState('');
  const [showQuickPassword, setShowQuickPassword] = useState(true);

  // Quick Name Change State
  const [quickNameValue, setQuickNameValue] = useState('');

  // Admin Change Password & Name State
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewName, setAdminNewName] = useState(adminUser.name || 'Admin');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminSecSuccess, setAdminSecSuccess] = useState('');
  const [adminSecError, setAdminSecError] = useState('');

  // Global loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter setters
  const filteredSetters = setters.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.assignedSubject && s.assignedSubject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Open Full Edit Modal for a Question Setter
  const handleOpenEditModal = (setter: QuestionSetter) => {
    setEditSetterTarget(setter);
    setEditName(setter.name);
    setEditUsername(setter.username);
    setEditPasscode(setter.passcode);
    setEditTopic(setter.assignedSubject || 'All Topics');
    setEditError('');
    setEditSuccess('');
    setShowEditPassword(true);
  };

  // Submit Full Edit Modal (Name, Username, Password, Topic)
  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSetterTarget) return;

    setEditError('');
    setEditSuccess('');

    if (!editName.trim()) {
      setEditError('Question Setter full name cannot be empty.');
      return;
    }
    if (!editUsername.trim()) {
      setEditError('Username cannot be empty.');
      return;
    }
    if (!editPasscode.trim()) {
      setEditError('Password cannot be empty.');
      return;
    }

    const cleanUsername = editUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanTopic = editTopic.trim() || 'All Topics';

    setIsSubmitting(true);
    const result = await onUpdateSetter(editSetterTarget.id, {
      name: editName.trim(),
      username: cleanUsername,
      passcode: editPasscode.trim(),
      assignedSubject: cleanTopic,
    });
    setIsSubmitting(false);

    const isSuccess = typeof result === 'boolean' ? result : result.success;
    const message = typeof result === 'object' ? result.message : '';

    if (isSuccess) {
      setEditSuccess(`Question Setter "${editName.trim()}" updated successfully!`);
      setTimeout(() => {
        setEditSetterTarget(null);
        setEditSuccess('');
      }, 900);
    } else {
      setEditError(message || 'Failed to update Question Setter. Username might already be in use.');
    }
  };

  // Create Setter Form Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newUsername.trim() || !newName.trim() || !newPasscode.trim()) {
      setFormError('Please fill in username, full name, and password.');
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanTopic = newTopic.trim() || 'All Topics';

    setIsSubmitting(true);
    const result = await onCreateSetter({
      username: cleanUsername,
      name: newName.trim(),
      passcode: newPasscode.trim(),
      assignedSubject: cleanTopic,
      topic: cleanTopic,
    });
    setIsSubmitting(false);

    const isSuccess = typeof result === 'boolean' ? result : result.success;
    const message = typeof result === 'object' ? result.message : '';

    if (isSuccess) {
      setFormSuccess(`Question Setter "${newName}" created successfully!`);
      setNewUsername('');
      setNewName('');
      setNewPasscode('');
      setNewTopic('All Topics');
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setFormSuccess('');
      }, 900);
    } else {
      setFormError(message || 'Failed to create Question Setter. Username might already exist.');
    }
  };

  // Quick Password Change Submit
  const handleSaveQuickPassword = async () => {
    if (!passwordChangeTarget || !quickPasswordValue.trim()) return;
    setIsSubmitting(true);
    const result = await onUpdateSetter(passwordChangeTarget.id, {
      passcode: quickPasswordValue.trim(),
    });
    setIsSubmitting(false);
    const isSuccess = typeof result === 'boolean' ? result : result.success;
    if (isSuccess) {
      setPasswordChangeTarget(null);
      setQuickPasswordValue('');
    }
  };

  // Quick Name Change Submit
  const handleSaveQuickName = async () => {
    if (!nameChangeTarget || !quickNameValue.trim()) return;
    setIsSubmitting(true);
    const result = await onUpdateSetter(nameChangeTarget.id, {
      name: quickNameValue.trim(),
    });
    setIsSubmitting(false);
    const isSuccess = typeof result === 'boolean' ? result : result.success;
    if (isSuccess) {
      setNameChangeTarget(null);
      setQuickNameValue('');
    }
  };

  // Toggle Active / Suspended status
  const handleToggleStatus = async (setter: QuestionSetter) => {
    const nextStatus = setter.status === 'active' ? 'suspended' : 'active';
    await onUpdateSetter(setter.id, { status: nextStatus });
  };

  // Admin Change Password & Profile Submit
  const handleSaveAdminSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSecError('');
    setAdminSecSuccess('');

    if (!adminNewPassword.trim() && !adminNewName.trim()) {
      setAdminSecError('Please enter a new password or name.');
      return;
    }

    if (adminNewPassword.trim()) {
      if (adminNewPassword.trim().length < 4) {
        setAdminSecError('New Admin password must be at least 4 characters long.');
        return;
      }
      if (adminConfirmPassword.trim() && adminNewPassword.trim() !== adminConfirmPassword.trim()) {
        setAdminSecError('New password and confirmation password do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    const res = await updateAdminPasswordApi(
      adminNewPassword.trim() || undefined,
      adminNewName.trim() || undefined,
      adminCurrentPassword.trim() || undefined
    );
    setIsSubmitting(false);

    if (res.success) {
      // Sync updated admin password & name to Google Cloud Firestore
      saveAdminToCloud({
        username: adminUser.username || 'admin',
        passcode: adminNewPassword.trim() || '12345',
        name: adminNewName.trim() || 'Master Administrator',
      }).catch((err) => console.warn('Cloud admin sync notice:', err));

      setAdminSecSuccess('Admin password and profile updated successfully!');
      if (adminNewName.trim() && onAdminProfileUpdated) {
        onAdminProfileUpdated(adminNewName.trim());
      }
      setTimeout(() => {
        setIsAdminSecurityOpen(false);
        setAdminSecSuccess('');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
        setAdminCurrentPassword('');
      }, 1200);
    } else {
      setAdminSecError(res.message || 'Failed to update admin credentials.');
    }
  };

  return (
    <div className="space-y-6" id="setter-management-container">
      {/* Top Banner with Quick Actions */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800">
              Master Admin Control
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Question Setters Management</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            You can edit any Question Setter's <strong>Name</strong>, <strong>Username</strong>, <strong>Password</strong>, and <strong>Topic</strong>. You can also change your own <strong>Master Admin Password</strong> at any time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Admin Change Password & Name Button */}
          <button
            type="button"
            id="btn-change-admin-password"
            onClick={() => {
              setAdminSecError('');
              setAdminSecSuccess('');
              setAdminNewName(adminUser.name || 'Admin');
              setAdminNewPassword('');
              setAdminConfirmPassword('');
              setAdminCurrentPassword('');
              setIsAdminSecurityOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-slate-950" />
            <span>Change Admin Password</span>
          </button>

          {/* Create Setter Button */}
          <button
            type="button"
            id="btn-create-new-setter"
            onClick={() => {
              setFormError('');
              setFormSuccess('');
              setNewTopic('All Topics');
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create Question Setter</span>
          </button>
        </div>
      </div>

      {/* Search and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="search-setters-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search setters by name, username, or topic..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 flex-wrap">
          <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
            Total Setters: <strong className="text-indigo-600">{setters.length}</strong>
          </span>
          <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
            Active: <strong className="text-emerald-600">{setters.filter((s) => s.status === 'active').length}</strong>
          </span>
        </div>
      </div>

      {/* Setters List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">Setter Name</th>
                <th className="px-4 py-3.5">Username</th>
                <th className="px-4 py-3.5">Password</th>
                <th className="px-4 py-3.5">Assigned Topic</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSetters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No Question Setters registered. Click "+ Create Question Setter" above to add faculty logins.
                  </td>
                </tr>
              ) : (
                filteredSetters.map((setter) => (
                  <tr key={setter.id} className="hover:bg-slate-50/70 transition-colors" id={`setter-row-${setter.id}`}>
                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {setter.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{setter.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">ID: {setter.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-4 py-4 font-mono font-semibold text-slate-800">
                      <span className="bg-slate-100 px-2 py-1 rounded-md text-indigo-700 border border-slate-200">
                        @{setter.username}
                      </span>
                    </td>

                    {/* Password */}
                    <td className="px-4 py-4 font-mono text-slate-700">
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-1 rounded font-bold text-[11px]">
                        {setter.passcode}
                      </span>
                    </td>

                    {/* Topic */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-[11px] font-semibold border border-indigo-200">
                        <BookOpen className="w-3 h-3 text-indigo-600" />
                        <span>{setter.assignedSubject || 'All Topics'}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(setter)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] cursor-pointer transition-all ${
                          setter.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status (Active / Suspended)"
                      >
                        {setter.status === 'active' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Suspended
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Primary Button: Edit All (Name, Username, Password, Topic) */}
                        <button
                          type="button"
                          id={`edit-setter-btn-${setter.id}`}
                          onClick={() => handleOpenEditModal(setter)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
                          title="Edit Question Setter (Name, Username, Password, Topic)"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Setter</span>
                        </button>

                        {/* Quick Password Button */}
                        <button
                          type="button"
                          id={`change-pass-btn-${setter.id}`}
                          onClick={() => {
                            setPasswordChangeTarget(setter);
                            setQuickPasswordValue(setter.passcode);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-[11px] transition-colors cursor-pointer"
                          title="Quick Change Password"
                        >
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          <span>Password</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          id={`delete-setter-btn-${setter.id}`}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete Question Setter "${setter.name}"?`)) {
                              onDeleteSetter(setter.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Delete Question Setter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: FULL EDIT QUESTION SETTER (Name, Username, Password, Topic) */}
      {editSetterTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-700">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Question Setter</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditSetterTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Update the <strong>Name</strong>, login <strong>Username</strong>, access <strong>Password</strong>, and assigned <strong>Topic</strong> for this Question Setter.
            </p>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}
            {editSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditSubmit} className="space-y-3.5 text-xs">
              {/* 1. Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Question Setter Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-setter-name-input"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Prof. A. Banerjee"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 2. Username */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Login Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">@</span>
                  <input
                    type="text"
                    id="edit-setter-username-input"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="setter1"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  The Question Setter uses this username to log in.
                </span>
              </div>

              {/* 3. Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  3. Access Password / Passcode <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    id="edit-setter-password-input"
                    required
                    value={editPasscode}
                    onChange={(e) => setEditPasscode(e.target.value)}
                    placeholder="Enter setter password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  The Question Setter uses this passcode to log in.
                </span>
              </div>

              {/* 4. Topic / Subject */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  4. Assigned Topic / Specialization
                </label>
                <input
                  type="text"
                  id="edit-setter-topic-input"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  placeholder="e.g. Science, Mathematics, English, or All Topics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 mb-1.5"
                />

                {/* Quick Topic Preset Tags */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-[10px] text-slate-400 font-semibold self-center mr-1">Quick Select:</span>
                  {TOPIC_PRESETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditTopic(t)}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium border transition-colors cursor-pointer ${
                        editTopic === t
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditSetterTarget(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-setter-edits-btn"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE NEW QUESTION SETTER (with Topic Support) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-700">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Create Question Setter Login</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Create a new Question Setter faculty login with full freedom to upload and curate questions for any topic.
            </p>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Question Setter Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="new-setter-name-input"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Sunita Sen"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Login Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">@</span>
                  <input
                    type="text"
                    id="new-setter-username-input"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="setter_sunita"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Passcode / Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    id="new-setter-passcode-input"
                    required
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    placeholder="e.g. setter2026 or pass123"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Topic / Specialization
                </label>
                <input
                  type="text"
                  id="new-setter-topic-input"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Science, Mathematics, English, or All Topics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 mb-1.5"
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-[10px] text-slate-400 font-semibold self-center mr-1">Quick Select:</span>
                  {TOPIC_PRESETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewTopic(t)}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium border transition-colors cursor-pointer ${
                        newTopic === t
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="create-setter-submit-btn"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Question Setter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK PASSWORD CHANGE OF QUESTION SETTER */}
      {passwordChangeTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Change Setter Password</h3>
            </div>

            <p className="text-xs text-slate-500">
              Change the login password for <strong>{passwordChangeTarget.name}</strong> (@{passwordChangeTarget.username}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Passcode / Password
              </label>
              <div className="relative">
                <input
                  type={showQuickPassword ? 'text' : 'password'}
                  id="change-passcode-input"
                  value={quickPasswordValue}
                  onChange={(e) => setQuickPasswordValue(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-amber-300 text-sm font-mono text-slate-800 focus:outline-none focus:border-amber-500 bg-amber-50/20"
                />
                <button
                  type="button"
                  onClick={() => setShowQuickPassword(!showQuickPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showQuickPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasswordChangeTarget(null)}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="save-new-passcode-btn"
                onClick={handleSaveQuickPassword}
                disabled={!quickPasswordValue.trim() || isSubmitting}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: MASTER ADMIN CHANGE OWN PASSWORD & NAME */}
      {isAdminSecurityOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Change Master Admin Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminSecurityOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Update your Master Administrator password and display name. Your new password will be saved immediately to the system.
            </p>

            {adminSecError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adminSecError}</span>
              </div>
            )}
            {adminSecSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{adminSecSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdminSecurity} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Admin Display Name
                </label>
                <input
                  type="text"
                  id="admin-display-name-input"
                  value={adminNewName}
                  onChange={(e) => setAdminNewName(e.target.value)}
                  placeholder="e.g. Master Administrator"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Admin Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    id="admin-new-password-input"
                    required
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Enter new admin password (min 4 characters)"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirm New Admin Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  id="admin-confirm-password-input"
                  required
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  placeholder="Re-enter new admin password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdminSecurityOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-admin-password-btn"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Update Admin Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
