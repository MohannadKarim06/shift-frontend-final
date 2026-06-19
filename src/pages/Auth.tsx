import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, Department } from '../types';
import { Loader2, ArrowRight, ShieldCheck, Sparkles, LogIn, Languages, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthProps {
  onUserCreated: (user: User) => void;
}

const SUPER_ADMIN_EMAILS = ['asayeh@telfaz11.com'];

export const Auth: React.FC<AuthProps> = ({ onUserCreated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [showNewTabSuggestion, setShowNewTabSuggestion] = useState(false);
  const { language, setLanguage, t, isRTL } = useLanguage();

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    department: 'Creative' as Department,
  });

  const departments: { id: Department; name: string }[] = [
    { id: 'Biz Dev', name: t('bizDev') },
    { id: 'Client Serving', name: t('clientServing') },
    { id: 'Creative', name: t('creative') },
    { id: 'Operations', name: t('operations') },
    { id: 'Strategy & Media', name: t('strategyMedia') },
  ];

  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  // ── Pending approval screen ────────────────────────────────────────────────
  if (pendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white p-10 rounded-2xl shadow-xl shadow-zinc-200 border border-zinc-100">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Clock size={32} className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-3">Account Pending Approval</h2>
            <p className="text-zinc-500 leading-relaxed mb-6">
              Your account has been created and is waiting for admin approval.
              You'll be able to access the platform once an admin reviews your request.
            </p>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
              Please check back later or contact your admin
            </p>
            <button
              onClick={() => { setPendingApproval(false); setIsLogin(true); }}
              className="mt-6 text-sm text-red-600 hover:underline font-medium"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleExistingUser = async (uid: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      setError('User profile not found. Please contact your admin.');
      return;
    }
    const data = userDoc.data() as User;
    if (data.status === 'pending') {
      setPendingApproval(true);
      return;
    }
    onUserCreated(data);
  };

  const createNewUserProfile = async (
    uid: string,
    email: string,
    firstName: string,
    lastName: string,
    department: Department
  ) => {
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
    const newUser: User = {
      uid,
      firstName,
      lastName,
      email,
      department,
      role: isSuperAdmin ? 'Super Admin' : 'Team Member',
      status: isSuperAdmin ? 'approved' : 'pending',
      points: 0,
      level: 1,
      badges: [],
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', uid), newUser);
    return newUser;
  };

  // ── Google login ───────────────────────────────────────────────────────────

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const { user: firebaseUser } = await signInWithPopup(auth, provider);

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        await handleExistingUser(firebaseUser.uid);
      } else {
        const [firstName, ...rest] = (firebaseUser.displayName || 'User').split(' ');
        const newUser = await createNewUserProfile(
          firebaseUser.uid,
          firebaseUser.email || '',
          firstName,
          rest.join(' ') || '',
          'Creative'
        );
        if (newUser.status === 'pending') {
          setPendingApproval(true);
        } else {
          onUserCreated(newUser);
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-blocked') {
        setError(t('popupError'));
        setShowNewTabSuggestion(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Email/password ─────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { user: firebaseUser } = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        await handleExistingUser(firebaseUser.uid);
      } else {
        const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const newUser = await createNewUserProfile(
          firebaseUser.uid,
          formData.email,
          formData.firstName,
          formData.lastName,
          formData.department
        );
        if (newUser.status === 'pending') {
          setPendingApproval(true);
        } else {
          onUserCreated(newUser);
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') setError(t('emailPasswordNotEnabled'));
      else if (err.code === 'auth/network-request-failed') setError(t('networkError'));
      else if (err.code === 'auth/email-already-in-use') setError('An account with this email already exists. Try signing in.');
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 relative">
      <button
        onClick={toggleLanguage}
        className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-zinc-100 text-zinc-600 hover:bg-zinc-50 transition-all font-medium"
      >
        <Languages size={18} />
        {language === 'en' ? 'العربية' : 'English'}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl text-white font-bold text-3xl mb-4 shadow-xl shadow-red-200">S</div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('platformTitle')}</h1>
          <p className="text-zinc-500 mt-2">{t('platformSubtitle')}</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-zinc-200 border border-zinc-100">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={cn('flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                isLogin ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100')}
            >{t('signIn')}</button>
            <button
              onClick={() => setIsLogin(false)}
              className={cn('flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                !isLogin ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100')}
            >{t('register')}</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t('firstName')}</label>
                  <input required type="text" value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-50 border-zinc-200 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t('lastName')}</label>
                  <input required type="text" value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-50 border-zinc-200 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t('emailAddress')}</label>
              <input required type="email" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 border-zinc-200 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t('password')}</label>
              <input required type="password" value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 border-zinc-200 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all" />
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t('department')}</label>
                <select value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value as Department })}
                  className="w-full px-4 py-2 bg-zinc-50 border-zinc-200 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all">
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}

            {!isLogin && (
              <p className="text-xs text-zinc-400 bg-zinc-50 rounded-lg p-3 leading-relaxed">
                ⏳ New accounts require admin approval before you can access the platform.
              </p>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">{error}</div>
            )}

            <button disabled={loading} type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>{isLogin ? t('signIn') : t('createAccount')}<ArrowRight size={20} className={cn(isRTL && 'rotate-180')} /></>
              )}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-400 font-medium">{t('orContinueWith')}</span>
              </div>
            </div>

            <button type="button" onClick={handleGoogleLogin} disabled={loading}
              className="w-full py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <LogIn size={20} className="text-red-600" />
              {t('signInWithGoogle')}
            </button>

            {(isIframe || showNewTabSuggestion) && (
              <div className="mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-center space-y-3">
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  {t('clickHereToOpenNewTab')}
                </p>
                <button type="button" onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-red-200">
                  <Sparkles size={14} className="text-amber-300 animate-pulse" />
                  {t('openInNewTab')}
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-100 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck size={16} />
              <span className="text-xs font-medium">{t('secureAuth')}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 justify-end">
              <Sparkles size={16} />
              <span className="text-xs font-medium">{t('aiPowered')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
