import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Mail, Phone, ArrowRight } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function LandingScreen() {
  const [view, setView] = useState<'welcome' | 'email-login' | 'email-signup'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (view === 'email-login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 text-white relative z-10 w-full">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-32 h-32 rounded-3xl mb-8 flex items-center justify-center "
        >
          <Heart size={64} fill="white" className="text-white " />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold mb-3 tracking-tighter"
        >
          MingleKE
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-white/70 max-w-[280px] font-medium"
        >
          Discover meaningful connections in Kenya.
        </motion.p>
      </div>

      <div className="space-y-4 mb-8 w-full max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          {view === 'welcome' ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <button
                onClick={() => setView('email-signup')}
                className="btn-primary"
              >
                Create Account
              </button>
              <button
                onClick={() => setView('email-login')}
                className="btn-secondary"
              >
                Log In
              </button>
              
              <div className="flex items-center gap-4 my-6 opacity-60">
                <div className="h-[1px] flex-1 bg-white/30" />
                <span className="text-xs uppercase tracking-widest font-bold">or continue with</span>
                <div className="h-[1px] flex-1 bg-white/30" />
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full glass-panel text-white font-bold py-4 rounded-full flex items-center justify-center gap-3  active:scale-[0.98] transition-all"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 bg-white p-0.5 rounded-full" />
                Sign in with Google
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleEmailAuth}
              className="glass-panel p-6 rounded-[32px] space-y-6  relative overflow-hidden"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{view === 'email-login' ? 'Welcome Back' : 'Get Started'}</h2>
                <p className="text-white/70 text-sm">{view === 'email-login' ? 'Log in to find your match' : 'Join our genuine community'}</p>
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-white/50 focus:outline-hidden focus:ring-2 focus:ring-white/40 transition-all"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-white/50 focus:outline-hidden focus:ring-2 focus:ring-white/40 transition-all"
                  required
                />
              </div>

              {error && (
                <p className="text-white text-xs bg-red-500/30 p-3 rounded-lg border border-red-500/50">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-white text-white font-bold py-4 rounded-2xl  active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {view === 'email-login' ? 'Log In' : 'Sign Up'}
                <ArrowRight size={20} />
              </button>

              <button
                type="button"
                onClick={() => setView('welcome')}
                className="w-full text-white/70 text-sm font-medium pt-2"
              >
                Go Back
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <p className="text-[10px] text-center opacity-60 px-4">
        By continuing, you agree to our Terms of Service & Privacy Policy.
      </p>
    </div>
  );
}
