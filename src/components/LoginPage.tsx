import React, { useState, useMemo } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Chrome,
  Github,
  Apple,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Wallet,
  User,
  AlertCircle,
  KeyRound,
  Fingerprint,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthUser } from '../types';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [activeTab, setActiveTab] = useState<'email' | 'social' | 'guest'>('email');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Google Account Select Modal
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('ihaquekhan35@gmail.com');
  const [customGoogleName, setCustomGoogleName] = useState('Ihaque Khan');

  // Password Requirement Checks
  // Password must be 8 characters long, uppercase, lowercase, special characters/symbols, numbers
  const passwordChecks = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
    };
  }, [password]);

  const allPasswordChecksPassed = useMemo(() => {
    return (
      passwordChecks.minLength &&
      passwordChecks.hasUppercase &&
      passwordChecks.hasLowercase &&
      passwordChecks.hasNumber &&
      passwordChecks.hasSpecial
    );
  }, [passwordChecks]);

  // Calculate password strength score (0 to 5)
  const strengthScore = useMemo(() => {
    let score = 0;
    if (passwordChecks.minLength) score += 1;
    if (passwordChecks.hasUppercase) score += 1;
    if (passwordChecks.hasLowercase) score += 1;
    if (passwordChecks.hasNumber) score += 1;
    if (passwordChecks.hasSpecial) score += 1;
    return score;
  }, [passwordChecks]);

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return { label: 'Enter password', color: 'text-slate-400', bg: 'bg-slate-200' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'text-rose-600', bg: 'bg-rose-500' };
    if (strengthScore <= 4) return { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-500' };
    return { label: 'Strong & Secure', color: 'text-emerald-600', bg: 'bg-emerald-500' };
  }, [password, strengthScore]);

  // Handle Email form submission
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Strict validation requirement verification
    if (!allPasswordChecksPassed) {
      setErrorMessage(
        'Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special symbol.'
      );
      return;
    }

    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      const userName = name.trim() || email.split('@')[0];
      setSuccessMessage('Account created successfully! Logging you in...');
      setTimeout(() => {
        onLogin({
          id: `user-${Date.now()}`,
          name: userName,
          email: email.trim(),
          provider: 'email',
        });
      }, 600);
    } else {
      // Sign In mode
      const userName = email.split('@')[0];
      setSuccessMessage('Signed in successfully! Opening BudgetPal...');
      setTimeout(() => {
        onLogin({
          id: `user-${Date.now()}`,
          name: userName.charAt(0).toUpperCase() + userName.slice(1),
          email: email.trim(),
          provider: 'email',
        });
      }, 600);
    }
  };

  // Google Login Handler
  const handleGoogleLogin = (emailAddress?: string, displayName?: string) => {
    const finalEmail = emailAddress || customGoogleEmail || 'ihaquekhan35@gmail.com';
    const finalName = displayName || customGoogleName || 'Google User';
    setIsGoogleModalOpen(false);

    onLogin({
      id: `google-${Date.now()}`,
      name: finalName,
      email: finalEmail,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`,
      provider: 'google',
    });
  };

  // GitHub Login Handler
  const handleGithubLogin = () => {
    onLogin({
      id: `github-${Date.now()}`,
      name: 'GitHub Developer',
      email: 'dev@github.com',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Github',
      provider: 'github',
    });
  };

  // Apple Login Handler
  const handleAppleLogin = () => {
    onLogin({
      id: `apple-${Date.now()}`,
      name: 'Apple User',
      email: 'user@icloud.com',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Apple',
      provider: 'apple',
    });
  };

  // Guest Instant Access Handler
  const handleGuestLogin = () => {
    onLogin({
      id: `guest-${Date.now()}`,
      name: 'Guest Explorer',
      email: 'guest@budgetpal.app',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Guest',
      provider: 'guest',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background radial elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-100/60 via-teal-50/30 to-transparent pointer-events-none -z-10 blur-3xl" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl pointer-events-none -z-10" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 mb-4">
          <Wallet className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">
          Remix BudgetPal
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
          AI-powered personal finance, smart budget limits, and life milestone planner.
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80 relative">
          {/* Quick Option Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'social'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Chrome className="w-4 h-4 text-emerald-600" />
              <span>Google & More</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guest')}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'guest'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Quick Guest</span>
            </button>
          </div>

          {/* TAB 1: EMAIL & PASSWORD */}
          {activeTab === 'email' && (
            <motion.div
              key="email-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Sign In vs Sign Up Toggle */}
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {authMode === 'signup' ? 'Create Your Account' : 'Sign In with Email'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {authMode === 'signup'
                      ? 'Set up a secure password to get started'
                      : 'Welcome back! Enter your login details'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                >
                  {authMode === 'signup' ? 'Existing user? Sign in' : 'New here? Sign up'}
                </button>
              </div>

              {/* Alert / Error Messages */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="input-name">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="input-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="input-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="input-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700" htmlFor="input-password">
                      Password
                    </label>
                    {password && (
                      <span className={`text-[11px] font-bold ${strengthLabel.color}`}>
                        {strengthLabel.label}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a strong password"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Progress Bar */}
                  {password.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            strengthScore >= lvl ? strengthLabel.bg : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Password Requirements Checklist */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Required Password Rules:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {/* Rule 1: 8 characters */}
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                          passwordChecks.minLength ? 'text-emerald-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {passwordChecks.minLength ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>8+ characters</span>
                      </div>

                      {/* Rule 2: Uppercase */}
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                          passwordChecks.hasUppercase ? 'text-emerald-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {passwordChecks.hasUppercase ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>Uppercase (A-Z)</span>
                      </div>

                      {/* Rule 3: Lowercase */}
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                          passwordChecks.hasLowercase ? 'text-emerald-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {passwordChecks.hasLowercase ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>Lowercase (a-z)</span>
                      </div>

                      {/* Rule 4: Number */}
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                          passwordChecks.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {passwordChecks.hasNumber ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>Number (0-9)</span>
                      </div>

                      {/* Rule 5: Special Symbol */}
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors sm:col-span-2 ${
                          passwordChecks.hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {passwordChecks.hasSpecial ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>Special symbols (!@#$%^&*...)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm Password (only for Sign Up) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="input-confirm-password">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        id="input-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember Me / Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="text-slate-600">Remember session</span>
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          'Password reset instructions have been dispatched to your email address.'
                        )
                      }
                      className="text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  id="btn-auth-submit"
                  type="submit"
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                    allPasswordChecksPassed
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                      : 'bg-emerald-600/70 hover:bg-emerald-600 cursor-pointer'
                  }`}
                >
                  <span>{authMode === 'signup' ? 'Create Account & Enter' : 'Sign In to BudgetPal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Google separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-semibold">
                    or continue with Google
                  </span>
                </div>
              </div>

              {/* Primary Google Login Button */}
              <button
                id="btn-google-login-quick"
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-2xs transition flex items-center justify-center gap-3 cursor-pointer"
              >
                <Chrome className="w-4 h-4 text-red-500" />
                <span>Continue with Google</span>
              </button>
            </motion.div>
          )}

          {/* TAB 2: SOCIAL & FAST LOGINS */}
          {activeTab === 'social' && (
            <motion.div
              key="social-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="text-center mb-5">
                <h2 className="text-lg font-bold text-slate-900">Choose Your Sign-in Method</h2>
                <p className="text-xs text-slate-500">
                  Instant, one-click access using your verified social identity
                </p>
              </div>

              {/* Google Button */}
              <button
                id="btn-social-google"
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 text-slate-800 text-sm font-bold shadow-xs transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition">
                    <Chrome className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-900">Google Account</div>
                    <div className="text-[11px] text-slate-500">Fast sign-in with Google</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
              </button>

              {/* GitHub Button */}
              <button
                id="btn-social-github"
                type="button"
                onClick={handleGithubLogin}
                className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 hover:border-slate-800 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-xs transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-105 transition">
                    <Github className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-900">GitHub</div>
                    <div className="text-[11px] text-slate-500">For developers & creators</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition" />
              </button>

              {/* Apple Button */}
              <button
                id="btn-social-apple"
                type="button"
                onClick={handleAppleLogin}
                className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 hover:border-slate-800 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-xs transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center group-hover:scale-105 transition">
                    <Apple className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-900">Apple ID</div>
                    <div className="text-[11px] text-slate-500">Sign in with Apple</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition" />
              </button>

              {/* Password Requirement Note */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero passwords needed. Identity secured by standard OAuth providers.</span>
              </div>
            </motion.div>
          )}

          {/* TAB 3: QUICK GUEST ACCESS */}
          {activeTab === 'guest' && (
            <motion.div
              key="guest-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center py-4 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Instant Guest Mode</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Explore BudgetPal with pre-filled sample bank accounts, expense projections, and AI advisor without registering right now.
                </p>
              </div>

              <button
                id="btn-guest-login"
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue as Guest</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-slate-400">
                You can save or export your data anytime later.
              </p>
            </motion.div>
          )}
        </div>

        {/* Security badges */}
        <div className="mt-6 text-center flex items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fingerprint className="w-4 h-4 text-emerald-600" />
            <span>Biometric Ready</span>
          </div>
        </div>
      </div>

      {/* Interactive Google Sign In Dialog */}
      <AnimatePresence>
        {isGoogleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <Chrome className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sign in with Google</h3>
                  <p className="text-xs text-slate-500">to continue to Remix BudgetPal</p>
                </div>
              </div>

              {/* Account selection list */}
              <div className="space-y-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleGoogleLogin('ihaquekhan35@gmail.com', 'Ihaque Khan')}
                  className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition flex items-center gap-3 text-left cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                    IK
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">Ihaque Khan</p>
                    <p className="text-[11px] text-slate-500 truncate">ihaquekhan35@gmail.com</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition" />
                </button>

                {/* Custom Google Account input option */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Or sign in with another Google Account:
                  </span>
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin(customGoogleEmail, customGoogleName)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Confirm & Proceed
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
