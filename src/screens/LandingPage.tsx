import React from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FreeCountdown } from '../components/FreeCountdown';
import { isFreeWindow, freeWindowTextLabel } from '../lib/promo';
import { useAuth } from '../context/AuthContext';

const steps = [
  {
    n: '01',
    title: 'Make a plate',
    body: 'Three photos, a short bio, your town. That is the whole setup.',
  },
  {
    n: '02',
    title: 'Run the deck',
    body: 'Pass or like. When both of you like, you get a line to talk on.',
  },
  {
    n: '03',
    title: 'Meet in daylight',
    body: 'Public place first. Tell a friend. Report anyone who gets weird.',
  },
];

export default function LandingPage() {
  const free = isFreeWindow();
  const navigate = useNavigate();
  const { enterGuestMode } = useAuth();

  const openApp = () => {
    enterGuestMode();
    navigate('/');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-ink text-bone pb-16">
      {/* Masthead plate */}
      <header className="relative min-h-[72vh] flex flex-col justify-end border-b border-line">
        <img
          src="/seed/wa/p15.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, #14110E 0%, rgba(20,17,14,0.55) 42%, rgba(20,17,14,0.15) 100%)',
          }}
        />

        <div className="relative z-10 px-5 pb-7 pt-24">
          <p className="type-meta mb-3">Kenya · 18+ · Free this week</p>
          <h1 className="type-display text-[56px] sm:text-[64px] leading-[0.88] mb-4">
            Mingle
            <span className="text-hibiscus">KE</span>
          </h1>
          <p className="text-bone text-lg leading-snug max-w-[280px] mb-6">
            Real people nearby. No slogan soup, just a deck and a date.
          </p>

          {free && (
            <div className="mb-5 max-w-sm">
              <FreeCountdown />
            </div>
          )}

          <div className="flex flex-col gap-2 max-w-sm">
            <button type="button" onClick={openApp} className="btn-primary inline-flex items-center justify-center gap-2">
              {free ? 'Open the app' : 'Open MingleKE'}
              <ArrowRight size={16} />
            </button>
            <Link to="/welcome" className="btn-secondary">
              Log in
            </Link>
          </div>

          <p className="type-meta mt-4 flex items-center gap-2">
            <Shield size={12} className="text-moss shrink-0" />
            Never send money to a match
          </p>
        </div>
      </header>

      {/* How */}
      <section className="px-5 py-8 border-b border-line">
        <h2 className="type-display text-3xl mb-5">How it runs</h2>
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div
              key={step.n}
              className={`py-5 flex gap-4 ${i > 0 ? 'hairline' : ''}`}
            >
              <span className="font-mono text-hibiscus text-sm pt-0.5 w-8 shrink-0">{step.n}</span>
              <div>
                <h3 className="type-display text-xl mb-1">{step.title}</h3>
                <p className="text-bone-dim text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preview plate */}
      <section className="px-5 py-8 border-b border-line">
        <p className="type-meta mb-3">From the deck</p>
        <div className="plate">
          <div className="relative aspect-[3/4]">
            <img
              src="/seed/wa/p01.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between gap-2">
              <div>
                <span className="nameplate text-2xl">Zawadi, 24</span>
                <p className="type-meta mt-1 text-bone/80">Nairobi · 2 km</p>
              </div>
              <span className="type-meta bg-ink/80 border border-line px-2 py-1">Like</span>
            </div>
          </div>
        </div>
        <p className="type-meta mt-2">Demo member · photo from the seed deck</p>
      </section>

      {/* Install */}
      <section className="px-5 py-8 border-b border-line">
        <h2 className="type-display text-3xl mb-3">Put it on your home screen</h2>
        <p className="text-bone-dim text-sm leading-relaxed mb-4">
          Android Chrome: menu → Add to Home screen. iPhone Safari: Share → Add to Home Screen.
          Desktop browsers show an install icon in the address bar.
        </p>
        <button type="button" onClick={openApp} className="btn-primary">
          Get the app
        </button>
      </section>

      <footer className="px-5 py-8">
        {free && (
          <p className="type-meta text-hibiscus mb-2">Free until {freeWindowTextLabel()}</p>
        )}
        <p className="type-display text-2xl mb-4 leading-tight">
          Open the deck.
          <br />
          Start a conversation.
        </p>
        <button type="button" onClick={openApp} className="btn-secondary">
          Start mingling
        </button>
        <p className="type-meta mt-5">MingleKE · Nairobi</p>
      </footer>
    </div>
  );
}
