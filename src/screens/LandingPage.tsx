import React from 'react';
import { motion } from 'motion/react';
import { Heart, Shield, MessageCircle, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FreeCountdown } from '../components/FreeCountdown';
import { isFreeWindow, freeWindowTextLabel } from '../lib/promo';

const steps = [
  {
    n: '01',
    title: 'Build a real profile',
    body: 'Photos, a short bio, and your city. No long forms, no noise.',
    icon: Heart,
  },
  {
    n: '02',
    title: 'Swipe people nearby',
    body: 'Pass or like. When it is mutual, you match and can talk right away.',
    icon: CheckCircle2,
  },
  {
    n: '03',
    title: 'Chat and meet up',
    body: 'Keep it respectful. Meet in public. Report anything that feels off.',
    icon: MessageCircle,
  },
];

export default function LandingPage() {
  const free = isFreeWindow();

  return (
    <div className="flex-1 overflow-y-auto bg-ink text-cream">
      {/* Hero */}
      <header className="px-6 pt-12 pb-10 sm:px-10 sm:pt-16 relative overflow-hidden">
        <div className="absolute -top-20 -right-16 w-56 h-56 bg-rose/20 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute top-40 -left-20 w-48 h-48 bg-amber/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-rose/15 border border-rose/30 flex items-center justify-center">
              <Heart size={18} className="text-rose fill-rose" />
            </div>
            <span className="font-bold text-lg tracking-tight">MingleKE</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="text-[42px] sm:text-5xl font-bold leading-[1.05] tracking-tight mb-4"
          >
            Dating in Kenya,
            <br />
            <span className="gradient-text">made human.</span>
          </motion.h1>

          <p className="text-mist text-lg leading-relaxed mb-7 max-w-[320px]">
            Meet people nearby who want the same thing you do: a real connection, not a time sink.
          </p>

          {free && (
            <div className="mb-7">
              <FreeCountdown />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              to="/welcome"
              className="btn-primary flex items-center justify-center gap-2 text-base"
            >
              {free ? 'Join free' : 'Create account'}
              <ArrowRight size={18} />
            </Link>
            <Link to="/welcome" className="btn-secondary text-base">
              I already have an account
            </Link>
          </div>

          <p className="text-xs text-mist/70 mt-5 flex items-center gap-1.5">
            <Shield size={14} className="text-sage shrink-0" />
            18+ only · report tools in every chat · never send money to matches
          </p>
        </div>
      </header>

      {/* Phone tease */}
      <section className="px-6 sm:px-10 pb-12">
        <div className="max-w-md mx-auto">
          <div className="glass-panel rounded-[32px] border border-line p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-amber bg-amber/15 border border-amber/30 rounded-full px-2.5 py-1">
              Free this week
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-20 rounded-2xl overflow-hidden bg-line flex items-center justify-center">
                <img
                  src="/seed/w1.jpg"
                  alt=""
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <p className="font-bold text-lg">Akinyi, 24</p>
                <p className="text-mist text-sm">Nairobi · 2 km away</p>
              </div>
            </div>
            <p className="text-cream/90 text-sm leading-relaxed mb-5">
              Brunch person. Live benga on weekends. Looking for someone who actually texts back.
            </p>
            <div className="flex gap-3">
              <div className="flex-1 h-14 rounded-full glass-panel border border-line flex items-center justify-center text-mist">
                Pass
              </div>
              <div className="flex-1 h-14 rounded-full bg-rose text-white flex items-center justify-center font-bold gap-1">
                <Heart size={16} fill="currentColor" /> Like
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-mist/60 mt-3">Product preview · not a real member</p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 sm:px-10 pb-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-6">How it works</h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.06 }}
                className="glass-panel border border-line rounded-3xl p-5 flex gap-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-rose/15 text-rose flex items-center justify-center shrink-0">
                  <step.icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-mist tracking-widest mb-1">{step.n}</p>
                  <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-mist text-sm leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Install */}
      <section className="px-6 sm:px-10 pb-12">
        <div className="max-w-md mx-auto glass-panel border border-line rounded-[28px] p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-amber/15 text-amber flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="font-bold text-xl">Install it like an app</h2>
              <p className="text-mist text-sm leading-relaxed mt-1">
                Add MingleKE to your home screen. Open full-screen, no browser tabs in the way.
              </p>
            </div>
          </div>
          <ul className="text-sm text-mist space-y-2 mb-5">
            <li className="flex gap-2">
              <CheckCircle2 size={16} className="text-sage mt-0.5 shrink-0" />
              Android Chrome: menu → Add to Home screen
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={16} className="text-sage mt-0.5 shrink-0" />
              iPhone Safari: Share → Add to Home Screen
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={16} className="text-sage mt-0.5 shrink-0" />
              Desktop: install icon in the address bar
            </li>
          </ul>
          <Link to="/welcome" className="btn-primary flex items-center justify-center gap-2">
            Get MingleKE
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 sm:px-10 pb-16">
        <div className="max-w-md mx-auto text-center space-y-4">
          {free && (
            <p className="text-amber font-bold text-sm uppercase tracking-wider">
              Free until {freeWindowTextLabel()}
            </p>
          )}
          <h2 className="text-3xl font-bold leading-tight">
            Your next match is
            <br />
            already on the app.
          </h2>
          <Link to="/welcome" className="btn-primary inline-flex items-center justify-center gap-2">
            Start mingling
            <ArrowRight size={18} />
          </Link>
          <p className="text-[11px] text-mist/60 pt-2">
            MingleKE · Kenya · 18+ · Community guidelines apply
          </p>
        </div>
      </section>
    </div>
  );
}
