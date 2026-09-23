import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useToast } from '../components/Toast';

export default function PreferencesScreen() {
  const { profile, saveProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast((s) => s.show);
  const [interestedIn, setInterestedIn] = useState<'men' | 'women' | 'everyone'>(
    profile?.interestedIn || 'everyone'
  );
  const [minAge, setMinAge] = useState(profile?.ageRange?.min || 18);
  const [maxAge, setMaxAge] = useState(profile?.ageRange?.max || 45);
  const [maxDistanceKm, setMaxDistanceKm] = useState(profile?.maxDistanceKm || 50);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    setBusy(true);
    try {
      await saveProfile({
        interestedIn,
        showMe: interestedIn,
        ageRange: { min: minAge, max: maxAge },
        maxDistanceKm,
      });
      toast('Preferences saved.', 'success');
      navigate('/profile');
    } catch (err: any) {
      toast(err?.message || 'Could not save preferences.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative z-20 w-full text-bone min-h-0">
      <header className="flex items-center gap-2 page-pad py-3 pt-6 border-b border-line shrink-0">
        <button
          onClick={() => navigate('/profile')}
          className="p-2 text-bone-dim hover:text-bone min-w-[44px] min-h-[44px]"
          aria-label="Back"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="fluid-display-sm">Preferences</h1>
      </header>

      <div className="flex-1 overflow-y-auto page-pad py-5 space-y-8 pb-24 min-h-0">
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-mist uppercase tracking-wider">Show me</h2>
          <div className="grid grid-cols-3 gap-2">
            {(['men', 'women', 'everyone'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setInterestedIn(option)}
                className={cn(
                  'py-4 rounded-2xl border font-bold capitalize min-h-[52px] transition-all',
                  interestedIn === option
                    ? 'border-rose bg-rose/15 text-cream'
                    : 'glass-panel border-line text-mist hover:text-cream'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-mist uppercase tracking-wider">
            Age range: {minAge} – {maxAge}
          </h2>
          <div className="space-y-2">
            <label className="text-xs text-mist">Minimum age</label>
            <input
              type="range"
              min={18}
              max={60}
              value={minAge}
              onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))}
              className="w-full accent-rose"
            />
            <label className="text-xs text-mist">Maximum age</label>
            <input
              type="range"
              min={19}
              max={70}
              value={maxAge}
              onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))}
              className="w-full accent-rose"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-mist uppercase tracking-wider">Distance: up to {maxDistanceKm} km</h2>
          <input
            type="range"
            min={5}
            max={200}
            step={5}
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
            className="w-full accent-rose"
          />
        </section>

        <button onClick={handleSave} disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}
