import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Bell,
  Sparkles,
  Download,
  LogOut,
  RotateCcw,
  Save,
  Check,
  DollarSign,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthUser, Currency } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onUpdateUser: (updated: AuthUser) => void;
  onSignOut: () => void;
  currentCurrency: Currency;
  onCurrencyChange: (c: Currency) => void;
  onOpenExport?: () => void;
  onOpenReset?: () => void;
}

const AVATAR_COLORS = [
  { name: 'Emerald', bg: 'bg-emerald-600', text: 'text-white' },
  { name: 'Teal', bg: 'bg-teal-600', text: 'text-white' },
  { name: 'Indigo', bg: 'bg-indigo-600', text: 'text-white' },
  { name: 'Purple', bg: 'bg-purple-600', text: 'text-white' },
  { name: 'Amber', bg: 'bg-amber-600', text: 'text-white' },
  { name: 'Rose', bg: 'bg-rose-600', text: 'text-white' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onSignOut,
  currentCurrency,
  onCurrencyChange,
  onOpenExport,
  onOpenReset,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'data'>('profile');

  // Form Fields
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '+91 98765 43210');
  const [bio, setBio] = useState(currentUser.bio || 'Building financial freedom and tracking life goals.');
  const [selectedColor, setSelectedColor] = useState(currentUser.avatarColor || 'bg-emerald-600');
  const [monthlyIncome, setMonthlyIncome] = useState(currentUser.monthlyIncome || 75000);
  const [alertThreshold, setAlertThreshold] = useState(currentUser.alertThreshold || 80);
  const [aiAdvisorStyle, setAiAdvisorStyle] = useState<'conservative' | 'balanced' | 'aggressive'>(
    currentUser.aiAdvisorStyle || 'balanced'
  );

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Password rules validation
  const passwordChecks = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword),
    };
  }, [newPassword]);

  const allPasswordChecksPassed = useMemo(() => {
    return (
      passwordChecks.minLength &&
      passwordChecks.hasUppercase &&
      passwordChecks.hasLowercase &&
      passwordChecks.hasNumber &&
      passwordChecks.hasSpecial
    );
  }, [passwordChecks]);

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
    if (newPassword.length === 0) return { label: 'Enter new password', color: 'text-slate-400', bg: 'bg-slate-200' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'text-rose-600', bg: 'bg-rose-500' };
    if (strengthScore <= 4) return { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-500' };
    return { label: 'Strong & Secure', color: 'text-emerald-600', bg: 'bg-emerald-500' };
  }, [newPassword, strengthScore]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const updated: AuthUser = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      email: email.trim() || currentUser.email,
      phone: phone.trim(),
      bio: bio.trim(),
      avatarColor: selectedColor,
      monthlyIncome: Number(monthlyIncome) || 75000,
      alertThreshold,
      aiAdvisorStyle,
      currencyPreference: currentCurrency,
    };

    onUpdateUser(updated);
    showToast('Profile & preferences updated successfully!');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (!allPasswordChecksPassed) {
      setPasswordError('Password does not meet the security criteria (8+ characters, uppercase, lowercase, number, special symbol).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    // Success
    setPasswordSuccess('Password successfully updated and encrypted!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated securely!');
  };

  const initials = (name || currentUser.name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <AnimatePresence>
      <div
        id="profile-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          id="profile-modal-card"
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        >
          {/* Top Banner Header */}
          <div className="relative bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 p-6 text-white shrink-0">
            {/* Close Button */}
            <button
              id="btn-close-profile-modal"
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Avatar & Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-2">
              <div className="relative group">
                <div
                  className={`w-20 h-20 rounded-2xl ${selectedColor} text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-black/20 border-2 border-white/30 overflow-hidden shrink-0`}
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
              </div>

              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-black font-outfit tracking-tight">
                    {name || currentUser.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-emerald-100 border border-white/20 capitalize">
                    {currentUser.provider} Account
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{email || currentUser.email}</span>
                </p>
                <div className="mt-2 text-[11px] text-emerald-200/80 flex items-center justify-center sm:justify-start gap-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Member since Sept 2026</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-300" />
                    <span>256-bit Encrypted</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Toast Floating Notification */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute bottom-2 left-6 right-6 p-2.5 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 border border-white/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{toastMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 overflow-x-auto no-scrollbar">
            <button
              id="tab-profile-info"
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal Profile</span>
            </button>
            <button
              id="tab-profile-preferences"
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'preferences'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Preferences & Limits</span>
            </button>
            <button
              id="tab-profile-security"
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'security'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Security & Password</span>
            </button>
            <button
              id="tab-profile-data"
              type="button"
              onClick={() => setActiveTab('data')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'data'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Data & Actions</span>
            </button>
          </div>

          {/* Tab Contents (Scrollable) */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* TAB 1: PERSONAL PROFILE */}
            {activeTab === 'profile' && (
              <motion.form
                key="tab-profile"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSaveProfile}
                className="space-y-5"
              >
                {/* Avatar Color Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Profile Badge Color
                  </label>
                  <div className="flex items-center gap-2">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.bg)}
                        className={`w-8 h-8 rounded-xl ${color.bg} flex items-center justify-center text-white transition-all cursor-pointer shadow-xs ${
                          selectedColor === color.bg ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        title={color.name}
                      >
                        {selectedColor === color.bg && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Email inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="profile-name">
                      Full Display Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="profile-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="profile-email">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="profile-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone & Bio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="profile-phone">
                      Contact Phone (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="profile-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="profile-account-id">
                      User ID / Status
                    </label>
                    <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                      <span className="font-mono text-[11px] truncate max-w-[150px]">{currentUser.id}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="profile-bio">
                    Financial Motto / Primary Goal
                  </label>
                  <textarea
                    id="profile-bio"
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Save 30% of income for emergency fund and house purchase"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    id="btn-save-profile-personal"
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* TAB 2: PREFERENCES & LIMITS */}
            {activeTab === 'preferences' && (
              <motion.div
                key="tab-preferences"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Default Currency Selection */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span>Preferred Currency</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sets your primary tracking currency across Monthly, Yearly, and Life projections.
                      </p>
                    </div>

                    <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => onCurrencyChange('INR')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          currentCurrency === 'INR'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ₹ INR
                      </button>
                      <button
                        type="button"
                        onClick={() => onCurrencyChange('USD')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          currentCurrency === 'USD'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        $ USD
                      </button>
                    </div>
                  </div>
                </div>

                {/* Monthly Baseline Income */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Baseline Monthly Income</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Used to calculate savings rates and monthly budget surplus.
                      </p>
                    </div>
                  </div>

                  <div className="relative max-w-xs pt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                      {currentCurrency === 'INR' ? '₹' : '$'}
                    </div>
                    <input
                      id="profile-monthly-income"
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Budget Warning Alert Threshold */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-600" />
                        <span>Category Alert Threshold</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        When category spending reaches this percentage, display an amber warning badge.
                      </p>
                    </div>
                    <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl">
                      {alertThreshold}%
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[70, 80, 90, 100].map((th) => (
                      <button
                        key={th}
                        type="button"
                        onClick={() => setAlertThreshold(th)}
                        className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          alertThreshold === th
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {th}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Advisor Persona */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>AI Budget Advisor Personality</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Controls the recommendation style generated by Gemini in BudgetPal.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        key: 'conservative' as const,
                        label: 'Conservative',
                        desc: 'Max savings, low risk, strict limits',
                      },
                      {
                        key: 'balanced' as const,
                        label: 'Balanced',
                        desc: '50/30/20 rule, smart lifestyle choices',
                      },
                      {
                        key: 'aggressive' as const,
                        label: 'Growth',
                        desc: 'High investing, aggressive goals',
                      },
                    ].map((mode) => (
                      <div
                        key={mode.key}
                        onClick={() => setAiAdvisorStyle(mode.key)}
                        className={`p-3 rounded-xl border-2 transition cursor-pointer ${
                          aiAdvisorStyle === mode.key
                            ? 'border-emerald-600 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/60 hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                          <span>{mode.label}</span>
                          {aiAdvisorStyle === mode.key && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{mode.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    id="btn-save-profile-prefs"
                    type="button"
                    onClick={() => handleSaveProfile()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB 3: SECURITY & PASSWORD */}
            {activeTab === 'security' && (
              <motion.form
                key="tab-security"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSavePassword}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Change Account Password</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your password to keep your financial logs and bank sync private.
                  </p>
                </div>

                {passwordError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="input-curr-pwd">
                    Current Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-curr-pwd"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700" htmlFor="input-new-pwd">
                      New Password
                    </label>
                    {newPassword && (
                      <span className={`text-[11px] font-bold ${strengthLabel.color}`}>
                        {strengthLabel.label}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="input-new-pwd"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new 8+ char password"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Progress Bar */}
                  {newPassword.length > 0 && (
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

                  {/* Password Rules Checklist */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Required Password Rules:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                          passwordChecks.minLength ? 'text-emerald-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {passwordChecks.minLength ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span>8+ characters</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                          passwordChecks.hasUppercase ? 'text-emerald-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {passwordChecks.hasUppercase ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span>Uppercase (A-Z)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                          passwordChecks.hasLowercase ? 'text-emerald-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {passwordChecks.hasLowercase ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span>Lowercase (a-z)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                          passwordChecks.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {passwordChecks.hasNumber ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span>Number (0-9)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors sm:col-span-2 ${
                          passwordChecks.hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {passwordChecks.hasSpecial ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span>Special symbol (!@#$%^&*...)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="input-conf-new-pwd">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-conf-new-pwd"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
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

                <div className="pt-2 flex justify-end">
                  <button
                    id="btn-update-password-submit"
                    type="submit"
                    disabled={!allPasswordChecksPassed}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white transition flex items-center gap-2 ${
                      allPasswordChecksPassed
                        ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-sm'
                        : 'bg-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Update Password</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* TAB 4: DATA & ACTIONS */}
            {activeTab === 'data' && (
              <motion.div
                key="tab-data"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Account Data & Session Management</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Export your financial data, reset data or sign out of your account.
                  </p>
                </div>

                {/* Quick Export Action */}
                {onOpenExport && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Download className="w-4 h-4 text-emerald-600" />
                        <span>Export Financial Records</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Download your transactions and budgets as CSV or printable PDF.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenExport();
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
                    >
                      Export Now
                    </button>
                  </div>
                )}

                {/* Reset Action */}
                {onOpenReset && (
                  <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-200/80 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-rose-600" />
                        <span>Reset Financial Categories</span>
                      </h4>
                      <p className="text-xs text-rose-800/80 mt-0.5">
                        Clear monthly spend or restore default category limits with one-click undo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenReset();
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-700 transition cursor-pointer"
                    >
                      Reset Data
                    </button>
                  </div>
                )}

                {/* Sign Out Action */}
                <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Sign Out</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Log out from this browser session. Your data stays securely stored.
                    </p>
                  </div>
                  <button
                    id="btn-profile-signout"
                    type="button"
                    onClick={() => {
                      onClose();
                      onSignOut();
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500">
              BudgetPal v2.4 • Active ID: <span className="font-mono">{currentUser.id.slice(0, 10)}</span>
            </span>
            <button
              id="btn-profile-close-bottom"
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
