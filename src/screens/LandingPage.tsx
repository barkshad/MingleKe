import React from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FreeCountdown } from '../components/FreeCountdown';
import { ShiftingPhotoWall } from '../components/ShiftingPhotoWall';
import { isFreeWindow, freeWindowTextLabel } from '../lib/promo';
import { useAuth } from '../context/AuthContext';

const steps = [
  {
    n: '01',
    title: 'Make a plate',
    body: 'Photos, a short bio, your town.',
  },
  {
    n: '02',
    title: 'Swipe',
    body: 'Pass or like. If you both like, you match.',
  },
  {
    n: '03',
    title: 'Chat',
    body: 'Meet in public first. Report anyone who gets weird.',
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
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-ink text-bone pb-16">
      {/* Shifting plates showcase */}
      <header className="relative">
        <ShiftingPhotoWall />
      </header>

      {/* Masthead copy under the shifter so the photos stay the show */}
      <section className="page-pad py-6 border-b border-line">
        <p className="type-meta mb-3">Kenya · 18+ · Free this week</p>
        <h1 className="fluid-display mb-3">
          Mingle
          <span className="text-hibiscus">KE</span>
        </h1>
        <p className="text-bone text-base leading-snug max-w-[32ch] mb-5">
          Swipe. Match. Chat. That’s it.
        </p>

        {free && (
          <div className="mb-4 max-w-md">
            <FreeCountdown />
          </div>
        )}

        <div className="flex flex-col gap-2 max-w-md">
          <button type="button" onClick={openApp} className="btn-primary inline-flex items-center justify-center gap-2">
            {free ? 'Open the app' : 'Open MingleKE'}
            <ArrowRight size={16} />
          </button>
          <Link to="/welcome" className="btn-secondary">
            Log in
          </Link>
        </div>

        <p className="type-meta mt-5 flex items-center gap-2">
          <Shield size={12} className="text-moss shrink-0" />
          Never send money to a match
        </p>
      </section>

      {/* How */}
      <section className="page-pad py-8 border-b border-line">
        <h2 className="fluid-display-sm mb-5">How it runs</h2>
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
      <section className="page-pad py-8 border-b border-line">
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
      <section className="page-pad py-8 border-b border-line">
        <h2 className="fluid-display-sm mb-3">Add to home screen</h2>
        <p className="text-bone-dim text-sm leading-relaxed mb-4">
          In your browser menu, choose <strong className="text-bone">Add to Home screen</strong> (or Install). Then open it like an app.
        </p>
        <button type="button" onClick={openApp} className="btn-primary">
          Get the app
        </button>
      </section>

      <footer className="page-pad py-8">
        {free && (
          <p className="type-meta text-hibiscus mb-2">Free until {freeWindowTextLabel()}</p>
        )}
        <p className="fluid-display-sm mb-4 leading-tight">
          Open the deck. Say hi.
        </p>
        <button type="button" onClick={openApp} className="btn-secondary">
          Start mingling
        </button>
        <p className="type-meta mt-5">MingleKE · Nairobi</p>
      </footer>
    </div>
  );
}
