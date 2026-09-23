import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Mail, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { friendlyAuthError } from '../lib/utils';
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (view === 'email-login') {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else if (view === 'email-signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/onboarding');
      }
    } catch (err: any) {
      setError(friendlyAuthError(err?.code || err?.message || 'Could not continue'));
    } finally {
      setBusy(false);
    }
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
    <div className="flex-1 flex flex-col p-8 text-cream relative z-10 w-full">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-24 h-24 rounded-[28px] mb-8 flex items-center justify-center bg-rose/15 border border-rose/30"
        >
          <Heart size={48} fill="#FF4D6D" className="text-rose" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold mb-3 tracking-tight"
        >
          MingleKE
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-lg text-mist max-w-[280px] font-medium"
        >
          Meet people nearby. Keep it real.
        </motion.p>
      </div>

      <div className="w-full max-w-sm mx-auto mb-4">
        <FreeCountdown />
      </div>

      <div className="space-y-4 mb-6 w-full max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          {view === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-3"
            >
              <button onClick={() => setView('email-signup')} className="btn-primary">
                Create account
              </button>
              <button onClick={() => setView('email-login')} className="btn-secondary">
                Log in
              </button>
            </motion.div>
          )}

          {(view === 'email-login' || view === 'email-signup' || view === 'reset') && (
            <motion.form
              key={view}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              onSubmit={view === 'reset' ? handleReset : handleEmailAuth}
              className="glass-panel p-6 rounded-[28px] space-y-5 relative overflow-hidden"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">
                  {view === 'email-login' ? 'Welcome back' : view === 'email-signup' ? 'Get started' : 'Reset password'}
                </h2>
                <p className="text-mist text-sm">
                  {view === 'email-login'
                    ? 'Log in and keep swiping.'
                    : view === 'email-signup'
                      ? 'Create your account to start matching.'
                      : 'We will email you a reset link.'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    required
                    autoComplete="email"
                  />
                </div>
                {view !== 'reset' && (
                  <div className="relative">
                    <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
                    <input
                      type="password"
                      placeholder="Password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-11"
                      required
                      minLength={6}
                      autoComplete={view === 'email-login' ? 'current-password' : 'new-password'}
                    />
                  </div>
                )}
              </div>

              {error && (
                <p className="text-rose text-sm bg-rose/10 p-3 rounded-xl border border-rose/30" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn-primary flex items-center justify-center gap-2">
                {busy ? (
                  <span className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    {view === 'email-login' ? 'Log in' : view === 'email-signup' ? 'Create account' : 'Send reset link'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setView('welcome');
                  }}
                  className="text-mist hover:text-cream inline-flex items-center gap-1"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                {view === 'email-login' && (
                  <button type="button" onClick={() => setView('reset')} className="text-rose font-medium">
                    Forgot password?
                  </button>
                )}
                {view === 'email-signup' && (
                  <button type="button" onClick={() => setView('email-login')} className="text-rose font-medium">
                    Have an account?
                  </button>
                )}
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <p className="text-[11px] text-center text-mist px-4 leading-relaxed">
        By continuing you agree to our{' '}
        <Link to="/profile/safety" className="underline underline-offset-2 hover:text-cream">
          community guidelines
        </Link>
        . Members must be 18 or older.
      </p>
    </div>
  );
}
