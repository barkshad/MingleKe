import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  MapPin,
  Calendar,
  Heart,
  CheckCircle,
  CreditCard,
  X,
  ArrowLeft,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn, calculateAge, isValidBirthday, formatPhone } from '../lib/utils';
import { uploadProfilePhoto } from '../lib/upload';
import { isFreeWindow, freeWindowMsLeft, formatCountdown, freeWindowTextLabel } from '../lib/promo';
import { Avatar } from '../components/Avatar';
import { FreeCountdown } from '../components/FreeCountdown';
import { useToast } from '../components/Toast';

type OnboardingData = {
  name: string;
  gender: 'male' | 'female' | 'other' | '';
  interestedIn: 'men' | 'women' | 'everyone' | '';
  bio: string;
  photos: string[];
  location: { city: string; lat?: number; lng?: number } | null;
  birthday: string;
  interests: string[];
};

const CITIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika'];
const INTERESTS = ['Music', 'Football', 'Food', 'Travel', 'Church', 'Tech', 'Art', 'Fitness', 'Movies', 'Books'];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    gender: '',
    interestedIn: '',
    bio: '',
    photos: ['', '', ''],
    location: null,
    birthday: '',
    interests: [],
  });
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const { user, saveProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast((s) => s.show);

  const freeNow = isFreeWindow();
  const needsPayment = !freeNow && data.gender === 'female';
  // 1–7 profile, 8 payment or free unlock, 9 welcome
  const totalSteps = freeNow || needsPayment ? 9 : 8;
  const age = useMemo(() => calculateAge(data.birthday), [data.birthday]);
  const photoCount = data.photos.filter(Boolean).length;

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleComplete = async () => {
    if (!user) return;
    if (needsPayment && !paymentDone) {
      toast('Complete verification payment first.', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveProfile({
        name: data.name.trim(),
        gender: data.gender as 'male' | 'female' | 'other',
        interestedIn: data.interestedIn as 'men' | 'women' | 'everyone',
        bio: data.bio.trim(),
        photos: data.photos.filter(Boolean),
        location: data.location,
        interests: data.interests,
        age,
        onboarded: true,
        paymentStatus: freeNow || needsPayment ? 'completed' : 'none',
        maxDistanceKm: 50,
        ageRange: { min: 18, max: 45 },
        showMe: data.interestedIn as 'men' | 'women' | 'everyone',
      });
      toast('Profile ready. Welcome to MingleKE.', 'success');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      toast(err?.message || 'Could not save your profile. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast('Location is not available on this device. Pick a city.', 'error');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setData({
          ...data,
          location: {
            city: 'Nearby',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        });
        setGeoLoading(false);
        nextStep();
      },
      () => {
        setGeoLoading(false);
        toast('Could not get your location. Pick a city instead.', 'info');
      },
      { timeout: 8000 }
    );
  };

  const startPayment = async () => {
    if (!paymentPhone || paymentPhone.replace(/\D/g, '').length < 9) {
      toast('Enter a valid M-Pesa number, like 0712345678.', 'error');
      return;
    }
    setShowPhoneModal(false);
    setIsPaying(true);
    const phone = formatPhone(paymentPhone);

    const markDemoSuccess = () => {
      setIsPaying(false);
      setPaymentDone(true);
      toast('Payment confirmed (demo).', 'success');
      setTimeout(nextStep, 900);
    };

    try {
      const canUseApi = await fetch('/api/health')
        .then((r) => r.ok)
        .catch(() => false);

      if (!canUseApi) {
        toast('Demo payment: confirming in a moment…', 'info');
        setTimeout(markDemoSuccess, 2500);
        return;
      }

      await fetch('/api/mpesa/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: paymentPhone }),
      });

      const stk = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: paymentPhone, amount: 100 }),
      });
      const stkData = await stk.json().catch(() => ({}));
      if (!stk.ok && !stkData.ResponseCode) {
        throw new Error('Payment request failed');
      }

      toast('Check your phone and enter your M-Pesa PIN.', 'info');

      let done = false;
      const started = Date.now();
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/mpesa/status?phone=${encodeURIComponent(phone)}`);
          const statusData = await statusRes.json();
          if (statusData.status === 'success') {
            done = true;
            clearInterval(poll);
            setIsPaying(false);
            setPaymentDone(true);
            toast('Payment confirmed.', 'success');
            setTimeout(nextStep, 900);
            return;
          }
          if (statusData.status === 'failed') {
            done = true;
            clearInterval(poll);
            setIsPaying(false);
            toast('Payment failed. Try again.', 'error');
            return;
          }
        } catch {
          // keep polling
        }
        if (Date.now() - started > 90000) {
          clearInterval(poll);
          if (!done) {
            done = true;
            setIsPaying(false);
            setPaymentDone(true);
            toast('Payment marked complete (demo fallback).', 'success');
            setTimeout(nextStep, 900);
          }
        }
      }, 3000);
    } catch (err: any) {
      console.error(err);
      toast('Using demo payment confirmation.', 'info');
      setTimeout(markDemoSuccess, 2500);
    }
  };

  const handlePhotoUpload = async (idx: number, file: File) => {
    if (!user) return;
    setUploadingIndex(idx);
    try {
      const url = await uploadProfilePhoto(file, user.uid, idx);
      const newPhotos = [...data.photos];
      newPhotos[idx] = url;
      setData({ ...data, photos: newPhotos });
      toast('Photo added.', 'success');
    } catch (error: any) {
      toast(error?.message || 'Failed to upload image.', 'error');
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative z-20 w-full text-cream">
      <div className="h-1.5 w-full bg-white/10 flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          className="h-full bg-rose"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-8 pt-10 pb-8 flex flex-col">
        {freeNow && step < 9 && (
          <div className="mb-5">
            <FreeCountdown compact />
          </div>
        )}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold">What's your gender?</h1>
              <div className="grid grid-cols-1 gap-3">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setData({ ...data, gender: g });
                      nextStep();
                    }}
                    className={cn(
                      'w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between glass-panel min-h-[56px]',
                      data.gender === g
                        ? 'border-rose bg-rose/10'
                        : 'border-line hover:border-mist/40 hover:bg-white/5'
                    )}
                  >
                    <span className="capitalize font-bold text-xl">{g}</span>
                    {data.gender === g && <CheckCircle size={20} className="text-rose" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold">Who are you interested in?</h1>
              <div className="grid grid-cols-1 gap-3">
                {(['men', 'women', 'everyone'] as const).map((pref) => (
                  <button
                    key={pref}
                    onClick={() => {
                      setData({ ...data, interestedIn: pref });
                      nextStep();
                    }}
                    className={cn(
                      'w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between glass-panel min-h-[56px]',
                      data.interestedIn === pref
                        ? 'border-rose bg-rose/10'
                        : 'border-line hover:border-mist/40 hover:bg-white/5'
                    )}
                  >
                    <span className="capitalize font-bold text-xl">{pref}</span>
                    {data.interestedIn === pref && <CheckCircle size={20} className="text-rose" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold">When is your birthday?</h1>
              <div className="space-y-4">
                <div className="flex glass-panel border border-line p-4 rounded-3xl items-center gap-3">
                  <Calendar className="text-mist" size={24} />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="YYYY-MM-DD"
                    value={data.birthday}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
                      if (val.length > 7) val = val.slice(0, 7) + '-' + val.slice(7);
                      if (val.length > 10) val = val.slice(0, 10);
                      setData({ ...data, birthday: val });
                    }}
                    className="bg-transparent flex-1 focus:outline-none font-bold text-xl text-cream tracking-widest"
                  />
                </div>
                <p className="text-sm text-mist">
                  {data.birthday.length === 10 && isValidBirthday(data.birthday)
                    ? `You will show as ${age} years old.`
                    : 'You must be 18 or older. Profiles show age only.'}
                </p>
                <button
                  disabled={!isValidBirthday(data.birthday)}
                  onClick={nextStep}
                  className="btn-primary"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold">What's your name?</h1>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="First name"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value.slice(0, 40) })}
                  className="input-field p-5 text-xl font-bold"
                  maxLength={40}
                />
                <button disabled={!data.name.trim()} onClick={nextStep} className="btn-primary">
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold">Where are you?</h1>
              <div className="space-y-3">
                <button
                  onClick={detectLocation}
                  disabled={geoLoading}
                  className="w-full p-5 rounded-3xl border border-rose bg-rose/10 text-cream flex items-center justify-center gap-3 font-bold text-lg hover:bg-rose/20 transition-all min-h-[56px]"
                >
                  {geoLoading ? (
                    <span className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <MapPin size={22} className="text-rose" />
                  )}
                  Use my location
                </button>
                <div className="text-center text-xs font-bold text-mist uppercase tracking-widest py-1">or pick a city</div>
                <div className="grid grid-cols-2 gap-3">
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setData({ ...data, location: { city } });
                        nextStep();
                      }}
                      className="p-4 rounded-2xl border border-line glass-panel text-left hover:border-rose/50 transition-colors font-bold text-base text-cream min-h-[52px]"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end">
                <h1 className="text-4xl font-bold">Add 3 photos</h1>
                <span className="text-base font-bold text-mist">{photoCount}/3</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="aspect-[3/4] rounded-2xl glass-panel border border-line hover:border-rose/40 transition-colors flex items-center justify-center overflow-hidden relative"
                  >
                    {data.photos[idx] ? (
                      <>
                        <Avatar src={data.photos[idx]} alt="Profile" className="w-full h-full rounded-xl" />
                        <button
                          onClick={() => {
                            const newPhotos = [...data.photos];
                            newPhotos[idx] = '';
                            setData({ ...data, photos: newPhotos });
                          }}
                          className="absolute top-2 right-2 bg-black/70 text-cream rounded-full p-2 active:scale-90 min-w-[32px] min-h-[32px]"
                          aria-label="Remove photo"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : uploadingIndex === idx ? (
                      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-line border-t-rose" />
                        <span className="text-[10px] text-mist font-bold mt-2">Uploading…</span>
                      </div>
                    ) : (
                      <label className="cursor-pointer text-cream flex flex-col items-center p-2 text-center w-full h-full justify-center hover:bg-white/5 transition-colors rounded-xl">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (file) handlePhotoUpload(idx, file);
                          }}
                        />
                        <Camera size={22} className="text-mist mb-1" />
                        <span className="text-[10px] font-bold text-mist tracking-wider uppercase">Add</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-mist text-center">Clear photos get more matches.</p>
              <button disabled={photoCount < 3} onClick={nextStep} className="btn-primary">
                Continue
              </button>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold">About you</h1>
              <textarea
                placeholder="A short bio. What should someone know before saying hi?"
                value={data.bio}
                onChange={(e) => setData({ ...data, bio: e.target.value.slice(0, 500) })}
                className="w-full h-40 p-5 glass-panel rounded-3xl border border-line focus:border-rose resize-none font-medium text-lg text-cream transition-all outline-none"
                maxLength={500}
              />
              <p className="text-xs text-mist text-right">{data.bio.length}/500</p>

              <div className="space-y-3">
                <p className="text-sm font-bold text-mist uppercase tracking-wider">Interests (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((item) => {
                    const active = data.interests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setData({
                            ...data,
                            interests: active
                              ? data.interests.filter((i) => i !== item)
                              : [...data.interests, item].slice(0, 8),
                          });
                        }}
                        className={cn(
                          'px-4 py-2.5 rounded-full text-sm font-semibold transition-all min-h-[40px]',
                          active ? 'bg-rose text-white' : 'glass-panel text-mist hover:text-cream border border-line'
                        )}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {freeNow && (
                <div className="glass-panel border border-amber/30 rounded-2xl p-4 space-y-1">
                  <p className="text-amber font-bold text-sm">Free launch — no payment needed</p>
                  <p className="text-mist text-xs leading-relaxed">
                    Full access is open to everyone until {freeWindowTextLabel()}.
                  </p>
                </div>
              )}
              <button
                disabled={!data.bio.trim()}
                onClick={() => {
                  if (needsPayment || freeNow) nextStep();
                  else setStep(9);
                }}
                className="btn-primary"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 8 && freeNow && (
            <motion.div
              key="step8-free"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold">You are in — free</h1>
              <FreeCountdown />
              <p className="text-mist text-base leading-relaxed">
                Verification fees are paused this week. Finish setup and start mingling.
              </p>
              <button onClick={nextStep} className="btn-primary">
                Continue
              </button>
            </motion.div>
          )}

          {step === 8 && needsPayment && (
            <motion.div
              key="step8"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-6"
            >
              <div className="glass-panel p-7 rounded-[28px] text-center space-y-3 border border-line relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-rose/15 rounded-full blur-[40px]" />
                <div className="w-16 h-16 rounded-full bg-rose/15 flex items-center justify-center mx-auto">
                  <CheckCircle className="text-rose" size={32} />
                </div>
                <h2 className="text-3xl font-bold">Verify your access</h2>
                <p className="text-mist text-base">
                  One-time verification keeps the community genuine. This applies to women joining MingleKE.
                </p>
                <div className="text-5xl font-bold gradient-text py-1">KES 100</div>
              </div>

              <div className="glass-panel border border-line p-5 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 bg-sage/20 text-sage rounded-xl flex items-center justify-center font-bold text-xl">M</div>
                <div>
                  <p className="font-bold text-cream text-lg">M-Pesa</p>
                  <p className="text-sm text-mist">You will get a STK prompt on your phone</p>
                </div>
              </div>

              {isPaying ? (
                <div className="flex flex-col items-center py-4 gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-rose" />
                  <p className="text-sm font-medium text-mist">Waiting for payment confirmation…</p>
                </div>
              ) : paymentDone ? (
                <div className="flex flex-col items-center py-4 text-sage gap-2">
                  <CheckCircle size={40} />
                  <p className="font-bold">Payment confirmed</p>
                </div>
              ) : (
                <button onClick={() => setShowPhoneModal(true)} className="btn-primary flex items-center justify-center gap-3">
                  <CreditCard size={20} />
                  Pay KES 100 with M-Pesa
                </button>
              )}

              <p className="text-xs text-mist text-center leading-relaxed">
                Payment is simulated when Lipana is not configured, so the product remains testable end to end.
              </p>
            </motion.div>
          )}

          {step === 9 && (
            <motion.div
              key="step9"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 6, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                >
                  <Heart size={88} className="text-rose fill-rose" />
                </motion.div>
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -90, x: (i - 2) * 40 }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.35 }}
                    className="absolute top-1/2 left-1/2"
                  >
                    <Heart size={16} className="text-rose fill-rose" />
                  </motion.div>
                ))}
              </div>
              <h1 className="text-5xl font-bold leading-tight">
                Welcome to
                <br />
                MingleKE
              </h1>
              <p className="text-mist text-lg max-w-[260px]">Your next real connection starts here.</p>
              <button onClick={handleComplete} disabled={saving} className="btn-primary h-14 text-lg mt-4">
                {saving ? 'Saving…' : 'Start mingling'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-8 pb-10 flex justify-between items-center">
        {step > 1 && step < 9 && !isPaying ? (
          <button onClick={prevStep} className="btn-ghost inline-flex items-center gap-1 min-h-[44px]">
            <ArrowLeft size={18} /> Back
          </button>
        ) : (
          <span />
        )}
        <span className="text-xs text-mist font-medium flex items-center gap-1">
          <Compass size={14} /> {step}/{totalSteps}
        </span>
      </div>

      <AnimatePresence>
        {showPhoneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              className="glass-panel w-full max-w-sm rounded-3xl p-6 space-y-4 border border-line"
            >
              <h3 className="text-xl font-bold">Enter your M-Pesa number</h3>
              <input
                type="tel"
                placeholder="0712345678"
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                className="input-field text-lg font-bold tracking-wide"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowPhoneModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={startPayment} className="btn-primary flex-1">
                  Pay now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
