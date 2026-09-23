import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(birthday: string): number {
  const dob = new Date(birthday);
  if (Number.isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function isValidBirthday(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const [y, m, d] = value.split('-').map(Number);
  return (
    date.getFullYear() === y &&
    date.getMonth() + 1 === m &&
    date.getDate() === d &&
    calculateAge(value) >= 18 &&
    calculateAge(value) <= 100
  );
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
  if (digits.length === 9) return `+254${digits}`;
  return `+${digits}`;
}

export function friendlyAuthError(codeOrMessage: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'That email already has an account. Try logging in.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Password needs at least 6 characters.',
    'auth/user-not-found': 'No account with that email. Create one instead.',
    'auth/wrong-password': 'Incorrect password. Try again or reset it.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/network-request-failed': 'Network issue. Check your connection.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/unauthorized-domain': 'This domain is not on the Firebase authorized list. Add it under Authentication → Settings.',
  };
  return map[codeOrMessage] || codeOrMessage.replace('Firebase: ', '').replace(/\(.+\)/, '').trim() || 'Something went wrong. Try again.';
}

export const PLACEHOLDER_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2a2233"/>
          <stop offset="100%" stop-color="#16101c"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#g)"/>
      <circle cx="200" cy="160" r="70" fill="#a89bb0" opacity="0.35"/>
      <ellipse cx="200" cy="320" rx="110" ry="80" fill="#a89bb0" opacity="0.35"/>
    </svg>`
  );
