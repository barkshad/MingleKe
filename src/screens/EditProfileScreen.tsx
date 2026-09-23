import React, { useState } from 'react';
import { ChevronLeft, Camera, X, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { uploadProfilePhoto } from '../lib/upload';
import { useToast } from '../components/Toast';
import { cn } from '../lib/utils';

export default function EditProfileScreen() {
  const { profile, saveProfile, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast((s) => s.show);
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [photos, setPhotos] = useState<string[]>([
    profile?.photos?.[0] || '',
    profile?.photos?.[1] || '',
    profile?.photos?.[2] || '',
  ]);
  const [city, setCity] = useState(profile?.location?.city || '');
  const [busy, setBusy] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const photoSlots = [photos[0] || '', photos[1] || '', photos[2] || ''];

  const handleUpload = async (idx: number, file: File) => {
    if (!user) return;
    setUploadingIndex(idx);
    try {
      const url = await uploadProfilePhoto(file, user.uid, idx);
      setPhotos((prev) => {
        const next = [...prev];
        while (next.length < 3) next.push('');
        next[idx] = url;
        return next;
      });
    } catch (err: any) {
      toast(err?.message || 'Upload failed.', 'error');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast('Add your first name.', 'error');
      return;
    }
    setBusy(true);
    try {
      await saveProfile({
        name: name.trim().slice(0, 40),
        bio: bio.trim().slice(0, 500),
        photos: photoSlots.filter(Boolean),
        location: city ? { city: city.trim() } : profile?.location,
      });
      toast('Profile updated.', 'success');
      navigate('/profile');
    } catch (err: any) {
      toast(err?.message || 'Could not save changes.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative z-20 w-full text-cream">
      <header className="flex items-center gap-2 p-4 pt-6 border-b border-line">
        <button
          onClick={() => navigate('/profile')}
          className="p-2 text-mist hover:text-cream min-w-[44px] min-h-[44px]"
          aria-label="Back"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-2xl font-bold">Edit profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-28">
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-mist uppercase tracking-wider">Photos</h2>
          <div className="grid grid-cols-3 gap-3">
            {photoSlots.map((photo, idx) => (
              <div
                key={idx}
                className="aspect-[3/4] rounded-2xl glass-panel border border-line overflow-hidden relative flex items-center justify-center"
              >
                {photo ? (
                  <>
                    <Avatar src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full" />
                    <button
                      onClick={() => {
                        setPhotos((prev) => {
                          const next = [...prev];
                          while (next.length < 3) next.push('');
                          next[idx] = '';
                          return next;
                        });
                      }}
                      className="absolute top-2 right-2 bg-black/70 text-cream rounded-full p-2 min-w-[32px] min-h-[32px]"
                      aria-label="Remove photo"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : uploadingIndex === idx ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-line border-t-rose" />
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) handleUpload(idx, file);
                      }}
                    />
                    {idx === 0 ? <Plus size={22} className="text-mist" /> : <Camera size={18} className="text-mist" />}
                    <span className="text-[10px] font-bold text-mist uppercase">Add</span>
                  </label>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <label className="text-sm font-bold text-mist uppercase tracking-wider">First name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            maxLength={40}
            placeholder="Your first name"
          />
        </section>

        <section className="space-y-2">
          <label className="text-sm font-bold text-mist uppercase tracking-wider">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input-field min-h-[120px] resize-none"
            maxLength={500}
            placeholder="A few lines about you"
          />
          <p className="text-xs text-mist text-right">{bio.length}/500</p>
        </section>

        <section className="space-y-2">
          <label className="text-sm font-bold text-mist uppercase tracking-wider">City</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input-field"
            maxLength={60}
            placeholder="Nairobi, Mombasa…"
          />
        </section>

        <button onClick={handleSave} disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
