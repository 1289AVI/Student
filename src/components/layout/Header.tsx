import React, { useState } from 'react';
import { UserSession } from '../../types';
import {
  GraduationCap,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Sparkles,
  BookOpen,
  PenTool,
  Share2,
  Check,
} from 'lucide-react';
import { getPublicUrl, copyToClipboard } from '../../utils/share';

interface HeaderProps {
  user: UserSession | null;
  onSwitchRole: () => void;
  onLogout: () => void;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSwitchRole,
  onLogout,
  isCloudSynced = true,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = async () => {
    const url = getPublicUrl();
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Exam Portal
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                v3.0 Multi-Student
              </span>
              {/* Cloud Sync Status Indicator */}
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold border shadow-2xs transition-all ${
                  isCloudSynced
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
                title={isCloudSynced ? 'Connected & Synced with Google Cloud Firestore' : 'Reconnecting to Cloud...'}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCloudSynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className="hidden xs:inline">
                  {isCloudSynced ? 'Cloud Synced' : 'Syncing...'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Multi-Candidate Exams • Question Setter • Admin Authority
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Share Public Link Button (Works for anyone without Gmail/Google login) */}
          <button
            type="button"
            id="share-public-link-header-btn"
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              copiedLink
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-indigo-50/80 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
            title="Copy Public Link (Anyone can open without Gmail or Google account)"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Share Public Link</span>
                <span className="sm:hidden">Share</span>
              </>
            )}
          </button>

          {/* User Session Bar */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Active Portal Badge & Student Info */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin'
                      ? 'bg-slate-900 text-white'
                      : user.role === 'setter'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-teal-100 text-teal-800 border border-teal-200'
                  }`}
                >
                  {user.role === 'admin' ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Master Admin</span>
                    </>
                  ) : user.role === 'setter' ? (
                    <>
                      <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Question Setter</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                      <span>
                        {user.targetClass || 'Class V'} • Roll: {user.rollNumber || '01'}
                      </span>
                    </>
                  )}
                </div>

                <span className="hidden md:inline-block text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  {user.name}
                </span>
              </div>

              {/* Quick Switch / Sign In another account button */}
              <button
                type="button"
                id="switch-portal-btn"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                title="Change user or switch portal"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Switch Portal</span>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                id="logout-btn"
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Logout session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
