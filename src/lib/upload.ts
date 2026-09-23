import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';

function compressImage(file: File, maxSize = 1080, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not process image'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Image compression failed'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    img.src = url;
  });
}

export async function uploadProfilePhoto(file: File, uid: string, slot: number): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file (JPG or PNG).');
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Photo is too large. Keep it under 12MB.');
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const blob = await compressImage(file);

  if (cloudName && uploadPreset) {
    const formData = new FormData();
    formData.append('file', blob, file.name || 'photo.jpg');
    formData.append('upload_preset', uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Upload failed');
    if (json.secure_url) return json.secure_url as string;
  }

  const path = `users/${uid}/photos/${slot}-${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  const snap = await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(snap.ref);
}
