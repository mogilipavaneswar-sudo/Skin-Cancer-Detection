import React, { useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import {
  authenticateWithPassword,
  registerNewUser,
  RegistrationInput
} from '../utils/authStorage';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Key,
  User,
  Eye,
  EyeOff
} from 'lucide-react';

export type AuthModalTab = 'login' | 'signup';

interface ProfileAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AuthModalTab;
  currentUser: AppUser;
  onUserChange: (user: AppUser) => void;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}

export const ProfileAuthModal: React.FC<ProfileAuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  currentUser,
  onUserChange,
  theme = 'dark',
  onThemeToggle,
}) => {
  const [activeTab, setActiveTab] = useState<AuthModalTab>(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Sign-up form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupRole, setSignupRole] = useState<UserRole>('clinician');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
    setLoginError(null);
    setSignupError(null);
    setLoginSuccess(null);
    setSignupSuccess(null);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = authenticateWithPassword(loginEmail, loginPassword);
    if (res.success && res.user) {
      onUserChange(res.user);
      setLoginSuccess(`Signed in as ${res.user.name}`);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setLoginError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickLogin = (email: string) => {
    setLoginError(null);
    const res = authenticateWithPassword(email);
    if (res.success && res.user) {
      onUserChange(res.user);
      setLoginSuccess(`Welcome back, ${res.user.name}`);
      setTimeout(() => {
        onClose();
      }, 600);
    } else {
      setLoginError(res.error || 'Could not authenticate preset user.');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    if (signupConfirmPassword && signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match. Please verify your password.');
      return;
    }
    const input: RegistrationInput = {
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      role: signupRole,
      title: signupRole === 'clinician' ? 'Attending Dermatologist' : 'Clinical Research Fellow',
      institution: 'Dermatology & Oncology Care Center',
      department: 'Cutaneous Diagnostics',
      avatar: signupRole === 'clinician' ? '👨‍⚕️' : '🔬',
    };

    const res = registerNewUser(input);
    if (res.success && res.user) {
      onUserChange(res.user);
      setSignupSuccess(`Account created for ${res.user.name}!`);
      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      setSignupError(res.error || 'Registration failed. Please check your inputs.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md rounded-[28px] bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Organic Purple Curved Wave Banner */}
        <div className="relative bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 px-6 pt-6 pb-7 overflow-hidden shrink-0">
          {/* Floating Organic Bubble Circles */}
          <div className="absolute top-2 right-10 w-12 h-12 rounded-full bg-purple-500/40 blur-[1px] pointer-events-none" />
          <div className="absolute top-8 right-4 w-7 h-7 rounded-full bg-indigo-400/50 blur-[0.5px] pointer-events-none" />
          <div className="absolute -top-3 right-28 w-14 h-14 rounded-full bg-indigo-600/40 pointer-events-none" />
          <div className="absolute -top-2 left-6 w-10 h-10 rounded-full bg-purple-400/30 pointer-events-none" />

          {/* Top Bar with Navigation Tabs and Close Button */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            {/* Modal Tabs */}
            <div className="flex items-center gap-1 bg-black/25 backdrop-blur-md p-1 rounded-full border border-white/20 text-xs">
              <button
                type="button"
                id="auth-tab-login"
                onClick={() => setActiveTab('login')}
                className={`px-4 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-slate-900 dark:bg-amber-400 dark:text-black shadow-sm'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                id="auth-tab-signup"
                onClick={() => setActiveTab('signup')}
                className={`px-4 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white text-slate-900 dark:bg-amber-400 dark:text-black shadow-sm'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                Sign up
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onThemeToggle && (
                <button
                  type="button"
                  id="modal-theme-toggle-btn"
                  onClick={onThemeToggle}
                  className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border border-white/25 cursor-pointer"
                  title="Toggle Light / Drake Mode"
                >
                  <span className="text-[10px]">{theme === 'dark' ? '🌙 Drake' : '☀️ Light'}</span>
                </button>
              )}

              <button
                type="button"
                id="close-profile-auth-modal"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors border border-white/25 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Header titles for current tab */}
          <div className="relative z-10 mt-5">
            {activeTab === 'login' ? (
              <div>
                <p className="text-purple-200 text-xs font-medium tracking-wide">Welcome back</p>
                <h2 className="text-3xl font-extrabold text-white tracking-tight mt-0.5">Login</h2>
              </div>
            ) : (
              <div>
                <p className="text-purple-200 text-xs font-medium tracking-wide">Create your profile</p>
                <h2 className="text-3xl font-extrabold text-white tracking-tight mt-0.5">Sign up</h2>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content Body - Dual Mode Surface */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-white dark:bg-black text-neutral-800 dark:text-neutral-200">
          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <div className="flex flex-col gap-4">
              {loginSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="login-email-input"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="alex.taylor@dermacare-hospital.org"
                      required
                      className="w-full pb-2 pt-1 bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none pr-8 transition-colors"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-1 bottom-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-password-input"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pb-2 pt-1 bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none pr-8 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-1 bottom-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Log In Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="submit-login-btn"
                    className="w-full py-3 px-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-black dark:hover:bg-neutral-900 dark:text-white font-bold text-sm border border-indigo-600 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-neutral-500 shadow-md transition-all text-center cursor-pointer"
                  >
                    Log In
                  </button>
                </div>

                {/* Switch to Sign Up link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('signup')}
                    className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    Don't have an account? <span className="font-semibold text-indigo-600 dark:text-purple-400">Sign Up</span>
                  </button>
                </div>
              </form>

              {/* Fast 1-Click Clinical Profiles */}
              <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex flex-col gap-2">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Fast 1-Click Clinical Profiles</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-medium">Instant Test</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('alex.taylor@dermacare-hospital.org')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-black dark:hover:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-indigo-500/40 text-left transition-all flex items-center gap-2 group cursor-pointer shadow-xs"
                  >
                    <span className="text-base">👨‍⚕️</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">
                        Alex Taylor
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Clinician</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('sarah.chen@stanford-derm.org')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-black dark:hover:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-indigo-500/40 text-left transition-all flex items-center gap-2 group cursor-pointer shadow-xs"
                  >
                    <span className="text-base">👩‍⚕️</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">
                        Dr. Sarah Chen
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Researcher</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('guest.evaluator@dermafusion.local')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-black dark:hover:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-indigo-500/40 text-left transition-all flex items-center gap-2 group cursor-pointer shadow-xs"
                  >
                    <span className="text-base">🩺</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">
                        Guest
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Evaluator</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SIGN UP TAB */}
          {activeTab === 'signup' && (
            <div className="flex flex-col gap-4">
              {signupSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{signupSuccess}</span>
                </div>
              )}

              {signupError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{signupError}</span>
                </div>
              )}

              <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="signup-name-input"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Dr. Jordan Lee"
                    required
                    className="w-full pb-2 pt-1 bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="signup-email-input"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="jordan.lee@hospital.org"
                    required
                    className="w-full pb-2 pt-1 bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        id="signup-password-input"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pb-2 pt-1 bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none pr-8 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-1 bottom-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                        title={showSignupPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      id="signup-confirm-password-input"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pb-2 pt-1 bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Clinical Role
                  </label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black border border-slate-300 dark:border-neutral-800 text-slate-900 dark:text-white text-xs focus:border-neutral-500 focus:outline-none shadow-xs cursor-pointer"
                  >
                    <option value="clinician">Clinician (Dermatologist / Oncologist)</option>
                    <option value="researcher">Researcher (AI / Bio-informatics)</option>
                  </select>
                </div>

                {/* Primary Sign Up Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="submit-signup-btn"
                    className="w-full py-3 px-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-black dark:hover:bg-neutral-900 dark:text-white font-bold text-sm border border-indigo-600 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-neutral-500 shadow-md transition-all text-center cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>

                {/* Switch to Log In link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    Already have an account? <span className="font-semibold text-indigo-600 dark:text-purple-400">Log In</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
