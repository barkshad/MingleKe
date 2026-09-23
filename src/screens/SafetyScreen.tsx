import React from 'react';
import { ChevronLeft, ShieldAlert, Flag, MapPin, HeartHandshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';

const tips = [
  {
    icon: HeartHandshake,
    title: 'Meet in public first',
    body: 'Pick a busy café. Tell a friend where you will be.',
  },
  {
    icon: MapPin,
    title: 'Skip home and work addresses',
    body: 'Share plans with a friend, not your live location with a stranger.',
  },
  {
    icon: Flag,
    title: 'Report bad behaviour',
    body: 'Use the flag on any profile. We read every report.',
  },
  {
    icon: ShieldAlert,
    title: 'Money requests are a scam',
    body: 'Never send cash, airtime, or M-Pesa to a match.',
  },
];

export default function SafetyScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col relative z-20 w-full text-bone min-h-0">
      <header className="flex items-center gap-2 page-pad py-3 pt-6 border-b border-line shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-bone-dim hover:text-bone min-w-[44px] min-h-[44px]"
          aria-label="Back"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="fluid-display-sm">Privacy & safety</h1>
      </header>

      <div className="flex-1 overflow-y-auto page-pad py-5 space-y-4 pb-24 min-h-0">
        <p className="text-mist text-sm leading-relaxed">
          Keep it real. Keep it safe.
        </p>

        {tips.map((tip) => (
          <div key={tip.title} className="glass-panel border border-line rounded-3xl p-5 flex gap-4">
            <div className="w-11 h-11 rounded-2xl bg-rose/15 text-rose flex items-center justify-center shrink-0">
              <tip.icon size={20} />
            </div>
            <div>
              <h2 className="font-bold text-cream text-base mb-1">{tip.title}</h2>
              <p className="text-mist text-sm leading-relaxed">{tip.body}</p>
            </div>
          </div>
        ))}

        <div className="glass-panel border border-line rounded-3xl p-5">
          <h2 className="font-bold mb-2">Community rules</h2>
          <ul className="text-mist text-sm space-y-2 list-disc pl-5 leading-relaxed">
            <li>Members must be 18 or older.</li>
            <li>One real person per account. No impersonation.</li>
            <li>No harassment, hate, or sexual content involving minors.</li>
            <li>No commercial spam or scam requests.</li>
          </ul>
        </div>

        <p className="text-xs text-mist/70 leading-relaxed">
          In an emergency, contact local authorities first. For in-app abuse, use the report control on the profile card.
        </p>
      </div>

      <Navigation />
    </div>
  );
}
