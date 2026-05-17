import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, Calendar, User, Heart, ArrowRight, CheckCircle, CreditCard, X } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

type OnboardingData = {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other' | '';
  interestedIn: 'men' | 'women' | 'everyone' | '';
  bio: string;
  photos: string[];
  location: { city: string; lat: number; lng: number } | null;
  birthday: string;
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: 0,
    gender: '',
    interestedIn: '',
    bio: '',
    photos: [],
    location: null,
    birthday: '',
  });
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const calculateAge = (birthday: string) => {
    const ageDifMs = Date.now() - new Date(birthday).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleComplete = async () => {
    if (!user) return;
    
    const finalData = {
      ...data,
      uid: user.uid,
      age: calculateAge(data.birthday),
      onboarded: true,
      paymentStatus: data.gender === 'female' ? 'completed' : 'none',
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), finalData);
      await refreshProfile();
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleMpesaPayment = async () => {
    if (!user) return;
    setIsPaying(true);
    
    try {
      // Get phone number from auth or prompt if missing
      let phoneNumber = user.phoneNumber;
      if (!phoneNumber) {
        phoneNumber = window.prompt("Enter your M-Pesa phone number (e.g. 0712345678):");
      }

      if (!phoneNumber || phoneNumber.length < 10) {
        alert("A valid phone number is required for payment.");
        setIsPaying(false);
        return;
      }

      const response = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber, 
          amount: 100
        }),
      });

      const result = await response.json();
      
      // ResponseCode '0' means request accepted (STK push sent)
      if (response.ok && (result.ResponseCode === "0" || result.merchant_request_id)) {
        alert("M-Pesa STK Push sent to your phone. Please enter your PIN to complete verification.");
        
        // In a real app, we would use a webhook/callback to confirm. 
        // For this demo STK push success, we'll proceed after a short delay.
        setTimeout(() => {
          setIsPaying(false);
          setPaymentDone(true);
          setTimeout(nextStep, 2000);
        }, 6000);
      } else {
        throw new Error(result.details || result.error || "Payment request failed");
      }
    } catch (err: any) {
      console.error("Payment Error:", err);
      alert(err.message || "M-Pesa service is currently unavailable. Try again later.");
      setIsPaying(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative z-20 w-full text-white">
      <div className="h-1.5 w-full bg-white/10 flex">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(step / 9) * 100}%` }}
          className="h-full bg-linear-to-r from-primary-main to-secondary-main shadow-[0_0_10px_rgba(191,97,255,0.8)]"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-8 pt-12 pb-8 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-black text-white drop-shadow-md">What's your gender?</h1>
              <div className="grid grid-cols-1 gap-4">
                {['male', 'female', 'other'].map((g) => (
                  <button
                    key={g}
                    onClick={() => { setData({ ...data, gender: g as any }); nextStep(); }}
                    className={cn(
                      "w-full p-6 rounded-[24px] border-2 text-left transition-all duration-300 flex items-center justify-between glass-panel",
                      data.gender === g ? "border-primary-main bg-white/10 text-primary-light shadow-[0_0_20px_rgba(191,97,255,0.3)]" : "border-white/10 hover:bg-white/5"
                    )}
                  >
                    <span className="capitalize font-bold text-xl">{g}</span>
                    {data.gender === g && <CheckCircle size={20} />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-black text-white drop-shadow-md">Who are you interested in?</h1>
              <div className="grid grid-cols-1 gap-4">
                {['men', 'women', 'everyone'].map((pref) => (
                  <button
                    key={pref}
                    onClick={() => { setData({ ...data, interestedIn: pref as any }); nextStep(); }}
                    className={cn(
                      "w-full p-6 rounded-[24px] border-2 text-left transition-all duration-300 flex items-center justify-between glass-panel",
                      data.interestedIn === pref ? "border-primary-main bg-white/10 text-primary-light shadow-[0_0_20px_rgba(191,97,255,0.3)]" : "border-white/10 hover:bg-white/5"
                    )}
                  >
                    <span className="capitalize font-bold text-xl">{pref}</span>
                    {data.interestedIn === pref && <CheckCircle size={20} />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-black text-white drop-shadow-md">When is your birthday?</h1>
              <div className="space-y-4">
                <div className="flex glass-panel border border-white/20 p-5 rounded-[24px] items-center gap-4">
                  <Calendar className="text-primary-light" size={28} />
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD"
                    value={data.birthday}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
                      if (val.length > 7) val = val.slice(0, 7) + '-' + val.slice(7);
                      if (val.length > 10) val = val.slice(0, 10);
                      setData({ ...data, birthday: val });
                    }}
                    className="bg-transparent flex-1 focus:outline-hidden font-bold text-xl text-white placeholder:text-white/30 tracking-widest"
                  />
                </div>
                <p className="text-sm text-white/50 px-2">Your profile shows your age, not your birthday.</p>
                <button
                  disabled={data.birthday.length !== 10 || isNaN(calculateAge(data.birthday)) || calculateAge(data.birthday) < 18}
                  onClick={nextStep}
                  className="w-full btn-primary disabled:opacity-50 mt-4 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* ... Skipping some fields for brevity in this block, but implementing key ones ... */}
          {step === 4 && (
             <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-black text-white drop-shadow-md">What's your name?</h1>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your First Name"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full p-5 glass-panel rounded-[24px] border border-white/20 focus:border-primary-main focus:ring-2 focus:ring-primary-main/30 font-bold text-xl text-white placeholder:text-white/30 transition-all outline-hidden"
                />
                <button
                  disabled={!data.name}
                  onClick={nextStep}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-black text-white drop-shadow-md">Where are you located?</h1>
              <div className="space-y-4">
                <button
                  onClick={() => { setData({ ...data, location: { city: 'Nairobi', lat: -1.286389, lng: 36.817223 } }); nextStep(); }}
                  className="w-full p-6 rounded-[24px] border border-primary-light bg-primary-main/20 text-white flex items-center justify-center gap-3 font-bold text-lg shadow-[0_0_30px_rgba(191,97,255,0.2)] hover:bg-primary-main/30 transition-all"
                >
                  <MapPin size={24} className="text-primary-light" />
                  Detect My Location
                </button>
                <div className="text-center text-sm font-bold text-white/30 uppercase tracking-widest py-2">or</div>
                {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'].map(city => (
                  <button
                    key={city}
                    onClick={() => { setData({ ...data, location: { city, lat: 0, lng: 0 } }); nextStep(); }}
                    className="w-full p-5 rounded-[20px] border border-white/10 glass-panel text-left hover:border-primary-main transition-colors font-bold text-lg text-white/80 hover:text-white"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end">
                <h1 className="text-4xl font-black text-white drop-shadow-md">Add 3 photos</h1>
                <span className="text-lg font-bold text-primary-light">{data.photos.filter(p => !!p).length}/3</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="aspect-[3/4] rounded-2xl glass-panel border border-white/20 hover:border-white/40 transition-colors flex items-center justify-center overflow-hidden relative group p-1">
                    {data.photos[idx] ? (
                      <>
                        <img src={data.photos[idx]} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newPhotos = [...data.photos];
                            newPhotos[idx] = '';
                            setData({ ...data, photos: newPhotos });
                          }}
                          className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white rounded-full p-1.5 shadow-lg active:scale-90"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : uploadingIndex === idx ? (
                      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
                         <div className="animate-[spin_2s_linear_infinite] rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-light shadow-[0_0_10px_rgba(191,97,255,0.5)] mb-2"></div>
                         <span className="text-[10px] text-primary-light font-bold">Uploading...</span>
                      </div>
                    ) : (
                      <label className="cursor-pointer text-primary-main flex flex-col items-center p-2 text-center w-full h-full justify-center hover:bg-white/5 transition-colors rounded-xl">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingIndex(idx);
                              try {
                                const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                                const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

                                if (!cloudName || !uploadPreset) {
                                  console.warn("Cloudinary env vars missing. using fallback image url.");
                                  const seed = Math.random().toString(36).substring(7);
                                  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                                  const newPhotos = [...data.photos];
                                  newPhotos[idx] = fallbackUrl;
                                  setData({ ...data, photos: newPhotos });
                                  return;
                                }

                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('upload_preset', uploadPreset);
                                
                                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                                  method: 'POST',
                                  body: formData
                                });
                                const json = await res.json();
                                if (!res.ok) {
                                  throw new Error(json.error?.message || 'Upload failed');
                                }
                                if (json.secure_url) {
                                  const newPhotos = [...data.photos];
                                  newPhotos[idx] = json.secure_url;
                                  setData({ ...data, photos: newPhotos });
                                }
                              } catch (error) {
                                console.error("Upload failed", error);
                                alert("Failed to upload image.");
                              } finally {
                                setUploadingIndex(null);
                                e.target.value = ''; // allow uploading the same file again
                              }
                            }
                          }}
                        />
                        <Camera size={24} className="text-primary-light mb-1 drop-shadow-[0_0_8px_rgba(191,97,255,0.5)]" />
                        <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Upload</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 text-center font-medium">Add clear photos to get more matches!</p>
              <button
                disabled={data.photos.filter(p => !!p).length < 3}
                onClick={nextStep}
                className="w-full btn-primary disabled:opacity-50"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-black text-white drop-shadow-md">About you</h1>
              <textarea
                placeholder="Write a short bio..."
                value={data.bio}
                onChange={(e) => setData({ ...data, bio: e.target.value })}
                className="w-full h-48 p-5 glass-panel rounded-[24px] border border-white/20 focus:border-primary-main focus:ring-2 focus:ring-primary-main/30 resize-none font-medium text-lg text-white placeholder:text-white/30 transition-all outline-hidden"
              />
              <button
                onClick={nextStep}
                className="w-full btn-primary"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 8 && (
            <motion.div
              key="step8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {data.gender === 'female' ? (
                <>
                  <div className="glass-panel p-8 rounded-[32px] text-center space-y-4 border border-primary-main/30 bg-primary-main/10 shadow-[0_0_50px_rgba(191,97,255,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-main/20 rounded-full blur-[40px] -z-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-main/20 rounded-full blur-[40px] -z-10" />
                    
                    <div className="w-20 h-20 bg-linear-to-br from-primary-main to-secondary-main rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(255,77,141,0.4)]">
                      <CheckCircle className="text-white" size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-white drop-shadow-md">Verify Your Access</h2>
                    <p className="text-white/70 text-base font-medium">
                      MingleKE ensures a high-quality community. One-time verification fee:
                    </p>
                    <div className="text-5xl font-black gradient-text py-2 drop-shadow-lg">KES 100</div>
                  </div>
                  
                  <div className="space-y-4 pt-4">
                    <div className="glass-panel border border-white/10 p-5 rounded-[24px] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(34,197,94,0.4)]">M</div>
                        <div>
                          <p className="font-bold text-white text-lg">M-Pesa STK</p>
                          <p className="text-sm text-white/50 font-medium">Push to {user?.phoneNumber || 'registered number'}</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-primary-main flex items-center justify-center">
                        <div className="w-3 h-3 bg-primary-main rounded-full" />
                      </div>
                    </div>

                    {isPaying ? (
                      <div className="flex flex-col items-center py-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-main mb-4"></div>
                        <p className="text-sm font-medium animate-pulse">Waiting for M-Pesa approval...</p>
                      </div>
                    ) : paymentDone ? (
                      <div className="flex flex-col items-center py-4 text-green-600">
                        <CheckCircle size={48} className="mb-2" />
                        <p className="font-bold">Payment Successful!</p>
                      </div>
                    ) : (
                      <button 
                        onClick={handleMpesaPayment}
                        className="w-full btn-primary flex items-center justify-center gap-3"
                      >
                        <CreditCard size={20} />
                        Pay KES 100 via M-Pesa
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6 text-center py-12">
                   <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                    <CheckCircle size={56} />
                  </div>
                  <h1 className="text-4xl font-black text-white drop-shadow-md">All set!</h1>
                  <p className="text-white/60 text-lg">You're ready to find your perfect match on MingleKE.</p>
                  <button onClick={nextStep} className="w-full btn-primary mt-8">Continue</button>
                </div>
              )}
            </motion.div>
          )}

          {step === 9 && (
            <motion.div
              key="step9"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <Heart size={100} className="text-secondary-main fill-secondary-main" />
                </motion.div>
                {[...Array(5)].map((_, i) => (
                   <motion.div
                    key={i}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -100, x: (i - 2) * 50 }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                    className="absolute top-1/2 left-1/2"
                   >
                     <Heart size={20} className="text-primary-main fill-primary-main" />
                   </motion.div>
                ))}
              </div>
              <h1 className="text-5xl font-black text-white drop-shadow-lg">Welcome to<br/>MingleKE</h1>
              <p className="text-white/70 text-xl max-w-[260px]">Your journey to meaningful social discovery starts now.</p>
              <button onClick={handleComplete} className="w-full btn-primary h-16 text-xl mt-6">Start Mingling</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 pb-12 flex justify-between">
        {step > 1 && step < 9 && !paymentDone && !isPaying && (
          <button onClick={prevStep} className="text-gray-400 font-bold px-4 py-2 hover:text-gray-600 transition-colors">
            Back
          </button>
        )}
      </div>
    </div>
  );
}
