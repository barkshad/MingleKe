import type { MatchUser } from '../store';

export type SeedProfile = MatchUser;

/**
 * Demo members used when the live Firestore pool is empty (or thin),
 * so new users never open a blank swipe deck.
 */
export const SEED_PROFILES: SeedProfile[] = [
  {
    uid: 'seed-akinyi',
    name: 'Akinyi',
    age: 24,
    gender: 'female',
    bio: 'Brunch person. Live benga on weekends. Looking for someone who actually texts back.',
    photos: ['/seed/w1.jpg', '/seed/w2.jpg'],
    location: { city: 'Nairobi', distanceLabel: '2 km away' },
    interests: ['Music', 'Food', 'Travel'],
    verified: true,
  },
  {
    uid: 'seed-njeri',
    name: 'Njeri',
    age: 22,
    gender: 'female',
    bio: 'Campus, coffee, long walks in Karura. I will steal your hoodie.',
    photos: ['/seed/w2.jpg', '/seed/w4.jpg'],
    location: { city: 'Nairobi', distanceLabel: '5 km away' },
    interests: ['Books', 'Fitness', 'Movies'],
    verified: true,
  },
  {
    uid: 'seed-asha',
    name: 'Asha',
    age: 27,
    gender: 'female',
    bio: 'Product designer in Mombasa. Sunset swims, design Twitter, zero drama.',
    photos: ['/seed/w3.jpg', '/seed/w1.jpg'],
    location: { city: 'Mombasa', distanceLabel: '8 km away' },
    interests: ['Art', 'Travel', 'Food'],
    verified: true,
  },
  {
    uid: 'seed-wanjiku',
    name: 'Wanjiku',
    age: 25,
    gender: 'female',
    bio: 'Nurse. Soft life advocate. If you can cook ugali we are basically married.',
    photos: ['/seed/w4.jpg', '/seed/w3.jpg'],
    location: { city: 'Nairobi', distanceLabel: '3 km away' },
    interests: ['Food', 'Church', 'Music'],
  },
  {
    uid: 'seed-kelvin',
    name: 'Kelvin',
    age: 26,
    gender: 'male',
    bio: 'Software guy. Sunday football in Langata. I make better playlists than plans.',
    photos: ['/seed/m1.jpg', '/seed/m2.jpg'],
    location: { city: 'Nairobi', distanceLabel: '4 km away' },
    interests: ['Football', 'Tech', 'Music'],
    verified: true,
  },
  {
    uid: 'seed-brian',
    name: 'Brian',
    age: 28,
    gender: 'male',
    bio: 'Trainer and part-time chef. Hikes when the weather behaves. Dog uncle.',
    photos: ['/seed/m2.jpg', '/seed/m3.jpg'],
    location: { city: 'Nairobi', distanceLabel: '6 km away' },
    interests: ['Fitness', 'Food', 'Travel'],
    verified: true,
  },
  {
    uid: 'seed-dennis',
    name: 'Dennis',
    age: 31,
    gender: 'male',
    bio: 'Finance during the day, vinyl collector at night. Quiet bar > loud club.',
    photos: ['/seed/m3.jpg', '/seed/m4.jpg'],
    location: { city: 'Kisumu', distanceLabel: '7 km away' },
    interests: ['Music', 'Books', 'Movies'],
  },
  {
    uid: 'seed-samuel',
    name: 'Samuel',
    age: 25,
    gender: 'male',
    bio: 'CS grad building side projects. I will ask about your stack on the first date. Sorry.',
    photos: ['/seed/m4.jpg', '/seed/m1.jpg'],
    location: { city: 'Nairobi', distanceLabel: '1 km away' },
    interests: ['Tech', 'Football', 'Coffee'],
    verified: true,
  },
];

export function filterSeeds(
  filters: {
    interestedIn: 'men' | 'women' | 'everyone';
    minAge: number;
    maxAge: number;
    city?: string;
  },
  excludeUids: string[]
): SeedProfile[] {
  const exclude = new Set(excludeUids);
  return SEED_PROFILES.filter((p) => {
    if (exclude.has(p.uid)) return false;
    if (filters.interestedIn === 'men' && p.gender !== 'male') return false;
    if (filters.interestedIn === 'women' && p.gender !== 'female') return false;
    if (p.age < filters.minAge || p.age > filters.maxAge) return false;
    if (filters.city && p.location.city !== filters.city) return false;
    return true;
  });
}
