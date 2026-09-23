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
    'auth/email-already-in-use': 'That email already has an account. Log in instead.',
    'auth/invalid-email': 'That email does not look valid.',
    'auth/weak-password': 'Password needs at least 6 characters.',
    'auth/user-not-found': 'No account on that email. Create one.',
    'auth/wrong-password': 'Wrong password. Try again or reset it.',
    'auth/invalid-credential': 'Email or password is wrong.',
    'auth/too-many-requests': 'Too many tries. Wait a bit.',
    'auth/network-request-failed': 'Connection is weak. Try again when the network settles.',
    'auth/popup-closed-by-user': 'Sign-in closed before it finished.',
    'auth/unauthorized-domain': 'Add this domain in Firebase Authentication → Settings → Authorized domains.',
  };
  return map[codeOrMessage] || codeOrMessage.replace('Firebase: ', '').replace(/\(.+\)/, '').trim() || 'Something broke. Try again.';
}

export const PLACEHOLDER_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#1c1814"/>
      <rect x="20" y="20" width="360" height="360" fill="none" stroke="#3a3228" stroke-width="4"/>
      <text x="200" y="210" text-anchor="middle" fill="#a89a88" font-family="monospace" font-size="18">NO PHOTO</text>
    </svg>`
  );

/** Tiny stand-in while a photo loads on a slow link. */
export function platePlaceholder(w = 64, h = 80): string {
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="100%" height="100%" fill="#1c1814"/>
        <rect x="4" y="4" width="${w - 8}" height="${h - 8}" fill="none" stroke="#3a3228" stroke-width="1"/>
      </svg>`
    )
  );
}
