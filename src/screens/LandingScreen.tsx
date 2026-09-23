import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mail, KeyRound } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { friendlyAuthError } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { FreeCountdown } from '../components/FreeCountdown';
import { useToast } from '../components/Toast';

type View = 'welcome' | 'email-login' | 'email-signup' | 'reset';

export default function LandingScreen() {
  const [view, setView] = useState<View>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const toast = useToast((s) => s.show);
  const { enterGuestMode } = useAuth();

  const handleInspect = () => {
    enterGuestMode();
    navigate('/');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    // Inspection mode: any login opens the app without Firebase.
    handleInspect();
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast('Reset link sent. Check your inbox.', 'success');
      setView('email-login');
    } catch (err: any) {
      setError(friendlyAuthError(err?.code || err?.message || 'Could not send reset email'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-ink text-bone min-h-0">
      <div className="page-pad pt-8 sm:pt-10 pb-5 border-b border-line">
        <Link to="/home" className="type-meta hover:text-bone">
          ← MingleKE
        </Link>
        <h1 className="fluid-display mt-4 mb-2">
          {view === 'reset'
            ? 'Reset'
            : view === 'email-login'
              ? 'Log in'
              : view === 'email-signup'
                ? 'Join'
                : 'Hello'}
        </h1>
        <p className="text-bone-dim text-sm">
          {view === 'welcome'
            ? 'Members must be 18 or older.'
            : view === 'email-login'
              ? 'Email and password.'
              : view === 'email-signup'
                ? 'Takes under a minute.'
                : 'We will email a link.'}
        </p>
      </div>

      <div className="flex-1 page-pad py-6 overflow-y-auto min-h-0">
        <div className="mb-5 max-w-md">
          <FreeCountdown compact />
        </div>

        <AnimatePresence mode="wait">
          {view === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2 max-w-md"
            >
              <button type="button" onClick={handleInspect} className="btn-primary">
                Log in
              </button>
              <button type="button" onClick={handleInspect} className="btn-secondary">
                Create account
              </button>
              <p className="type-meta mt-3 normal-case tracking-normal font-sans text-xs leading-relaxed">
                Inspect mode is on: login skips Firebase and opens the full app so you can look around.
              </p>
            </motion.div>
          )}

          {view !== 'welcome' && (
            <motion.form
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onSubmit={view === 'reset' ? handleReset : handleEmailAuth}
              className="space-y-4 max-w-md"
            >
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-dim" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  required
                  autoComplete="email"
                />
              </div>
              {view !== 'reset' && (
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-dim" />
                  <input
                    type="password"
                    placeholder="Password (6+ characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    required
                    minLength={6}
                    autoComplete={view === 'email-login' ? 'current-password' : 'new-password'}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-hibiscus border border-hibiscus/40 bg-hibiscus/10 px-3 py-2 rounded" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn-primary">
                {busy
                  ? 'Working…'
                  : view === 'email-login'
                    ? 'Log in'
                    : view === 'email-signup'
                      ? 'Create account'
                      : 'Send reset link'}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setView('welcome');
                  }}
                  className="type-meta hover:text-bone inline-flex items-center gap-1"
                >
                  <ArrowLeft size={12} /> Back
                </button>
                {view === 'email-login' && (
                  <button type="button" onClick={() => setView('reset')} className="type-meta text-hibiscus">
                    Forgot password
                  </button>
                )}
                {view === 'email-signup' && (
                  <button type="button" onClick={() => setView('email-login')} className="type-meta text-hibiscus">
                    Have an account
                  </button>
                )}
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <p className="type-meta page-pad pb-8">
        By continuing you accept the community rules under{' '}
        <Link to="/profile/safety" className="text-bone underline">
          Safety
        </Link>
        .
      </p>
    </div>
  );
}
