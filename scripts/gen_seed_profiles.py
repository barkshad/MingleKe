from pathlib import Path
import json

manifest = json.loads(Path(r'C:\Users\ADMIN\XiaomiMiMoProjects\MingleKe\public\seed\wa\manifest.json').read_text())

names = [
    ('Zawadi', 'female', 24, 'Nairobi'),
    ('Neema', 'female', 22, 'Nairobi'),
    ('Amina', 'female', 26, 'Mombasa'),
    ('Baraka', 'female', 25, 'Kisumu'),
    ('Imani', 'female', 23, 'Nairobi'),
    ('Nia', 'female', 27, 'Nakuru'),
    ('Sanaa', 'female', 24, 'Nairobi'),
    ('Tumaini', 'female', 22, 'Eldoret'),
    ('Wanjala', 'female', 28, 'Nairobi'),
    ('Zuri', 'female', 21, 'Thika'),
    ('Adhiambo', 'female', 26, 'Kisumu'),
    ('Akinyi', 'female', 25, 'Nairobi'),
    ('Atieno', 'female', 24, 'Kisumu'),
    ('Chiku', 'female', 23, 'Mombasa'),
    ('Dalila', 'female', 27, 'Nairobi'),
    ('Eshe', 'female', 22, 'Nairobi'),
    ('Farida', 'female', 29, 'Mombasa'),
    ('Halima', 'female', 24, 'Mombasa'),
    ('Inaya', 'female', 21, 'Nairobi'),
    ('Jabali', 'female', 26, 'Nakuru'),
    ('Kamaria', 'female', 25, 'Nairobi'),
    ('Layla', 'female', 23, 'Nairobi'),
    ('Malaika', 'female', 22, 'Thika'),
    ('Njeri', 'female', 28, 'Nairobi'),
    ('Pendo', 'female', 24, 'Nairobi'),
    ('Rehema', 'female', 27, 'Mombasa'),
    ('Salama', 'female', 25, 'Kisumu'),
    ('Tamu', 'female', 23, 'Nairobi'),
    ('Uzuri', 'female', 26, 'Nairobi'),
    ('Venus', 'female', 24, 'Nakuru'),
    ('Wanjiru', 'female', 22, 'Nairobi'),
    ('Yusra', 'female', 25, 'Mombasa'),
    ('Zaina', 'female', 27, 'Nairobi'),
    ('Amani', 'female', 24, 'Kisumu'),
    ('Binti', 'female', 21, 'Nairobi'),
    ('Chepkoech', 'female', 28, 'Eldoret'),
    ('Deka', 'female', 23, 'Nairobi'),
    ('Fatuma', 'female', 26, 'Mombasa'),
    ('Gina', 'female', 24, 'Nairobi'),
    ('Hodan', 'female', 25, 'Nairobi'),
    ('Ivy', 'female', 22, 'Thika'),
    ('Joan', 'female', 27, 'Nairobi'),
    ('Kawira', 'female', 24, 'Meru'),
    ('Linda', 'female', 23, 'Nairobi'),
    ('Mariam', 'female', 29, 'Mombasa'),
    ('Naomi', 'female', 25, 'Nairobi'),
    ('Onyango', 'female', 24, 'Kisumu'),
    ('Precious', 'female', 22, 'Nairobi'),
    ('Quinter', 'female', 26, 'Kisumu'),
    ('Rosa', 'female', 25, 'Nakuru'),
    ('Sheila', 'female', 24, 'Nairobi'),
    ('Tasha', 'female', 23, 'Nairobi'),
    ('Upendo', 'female', 27, 'Nairobi'),
    ('Valentine', 'female', 24, 'Mombasa'),
    ('Winnie', 'female', 22, 'Nairobi'),
    ('Xena', 'female', 25, 'Nairobi'),
    ('Yvonne', 'female', 26, 'Nairobi'),
    ('Zawadi M', 'female', 24, 'Thika'),
    ('Achieng', 'female', 25, 'Kisumu'),
    ('Beverly', 'female', 23, 'Nairobi'),
    ('Cynthia', 'female', 27, 'Nairobi'),
    ('Doris', 'female', 24, 'Nakuru'),
    ('Edith', 'female', 22, 'Nairobi'),
    ('Faith', 'female', 25, 'Nairobi'),
    ('Gloria', 'female', 24, 'Mombasa'),
    ('Hilda', 'female', 28, 'Kisumu'),
    ('Irene', 'female', 23, 'Nairobi'),
    ('Joy', 'female', 24, 'Nairobi'),
    ('Keziah', 'female', 22, 'Thika'),
    ('Linet', 'female', 26, 'Nairobi'),
    ('Mercy', 'female', 25, 'Nairobi'),
    ('Nancy', 'female', 24, 'Nakuru'),
    ('Olive', 'female', 27, 'Nairobi'),
    ('Purity', 'female', 23, 'Nairobi'),
    ('Queen', 'female', 24, 'Kisumu'),
    ('Rachael', 'female', 25, 'Nairobi'),
    ('Susan', 'female', 22, 'Nairobi'),
    ('Tabitha', 'female', 28, 'Nairobi'),
    ('Ummi', 'female', 24, 'Mombasa'),
    ('Vera', 'female', 26, 'Nairobi'),
    ('Wairimu', 'female', 25, 'Nairobi'),
    ('Yvone', 'female', 23, 'Eldoret'),
    ('Zena', 'female', 24, 'Nairobi'),
    ('Awino', 'female', 22, 'Kisumu'),
    ('Brilliant', 'female', 27, 'Nairobi'),
    ('Caroline', 'female', 24, 'Nairobi'),
    ('Diana', 'female', 25, 'Mombasa'),
    ('Eunice', 'female', 23, 'Nairobi'),
    ('Fridah', 'female', 26, 'Kisumu'),
    ('Grace', 'female', 24, 'Nairobi'),
    ('Happiness', 'female', 22, 'Thika'),
    ('Ida', 'female', 25, 'Nairobi'),
    ('Jackie', 'female', 27, 'Nairobi'),
    ('Kadzo', 'female', 24, 'Mombasa'),
    ('Lilian', 'female', 23, 'Nairobi'),
    ('Maureen', 'female', 25, 'Nakuru'),
    ('Natasha', 'female', 24, 'Nairobi'),
    ('Ocholla', 'female', 28, 'Kisumu'),
    ('Pamela', 'female', 22, 'Nairobi'),
    ('Rita', 'female', 25, 'Nairobi'),
    ('Sharleen', 'female', 24, 'Nairobi'),
    ('Triza', 'female', 26, 'Meru'),
    ('Veronica', 'female', 23, 'Nairobi'),
    ('Wendy', 'female', 25, 'Nairobi'),
]

bios = [
    'Brunch person. Live benga on weekends. Looking for someone who actually texts back.',
    'Soft life, hard boundaries. I cook better than I text.',
    'Campus, coffee, long walks. I will steal your hoodie.',
    'Sunset swims and design Twitter. Zero drama, good playlists only.',
    'Nurse. Church on Sunday. If you can make ugali we are basically fine.',
    'Weekend hikes when the weather behaves. Dog auntie energy.',
    'I make playlists faster than plans. Swipe right if you like real conversation.',
    'Bookstore regular. Kiswahili poetry > small talk.',
    'Sauti Sol still on rotation. Looking for a genuine hang, not pen pals.',
    'Part-time chef, full-time foodie. First date = nyama choma, obviously.',
    'Quiet bar over loud club. Ask me about my side project.',
    'Trainer by day. I will drag you to the gym, kindly.',
    'Design nerd. I notice fonts in the wild. Sorry.',
    'Karura walks and long voice notes. Keep up.',
    'I am here for something real. No married men, no games.',
    'Swahili coast girl in the city. Seafood and slow evenings.',
    'Gym, journaling, early nights. Looking for peace and chemistry.',
    'I laugh too loud and I text too much. Deal with it.',
    'Public health student. I will talk about water quality on our first date.',
    'Vintage thrifter. Let us find a gem at Toi Market together.',
    'Family first, ambition second, nonsense never.',
    'I sing badly in traffic. Looking for a duet partner.',
    'Tech girlie. I fix my own Wi-Fi and my own mood.',
    'Football on the TV, chapati on the stove. That is the vibe.',
    'Short trips to Naivasha recharge me. Plan one with me.',
    'I am allergic to mixed signals. Be clear or be gone.',
    'Photographer. Yes, I will make you pose nicely.',
    'Plant mum of seven. They all have names.',
    'Comedy podcasts and late-night mandazi. Join me.',
    'Working on my chest freezer of leftovers. Bring containers.',
    'Introvert with excellent taste in men. Prove me right.',
    'I will remember your birthday and your coffee order.',
    'Kisumu energy. Fish for dinner, lake breeze after.',
    'Fashion when I feel like it, hoodie when I do not.',
    'Looking for a best friend I can also kiss.',
    'Weekend market, then coffee, then see what happens.',
    'I do not chase. I attract. And I cook.',
    'Runner. I am slow but I finish. Same energy for relationships.',
    'Spoken word nights. Come listen with me.',
    'I keep plants alive and plants keep me honest.',
    'Ask me about my trip to Watamu. I will show photos.',
    'Baking stress-relief cookies for the office again.',
    'Old soul. Highlife and cool evenings.',
    'I like my men like my tea: strong and not bitter.',
    'Mama mboga of my own destiny.',
    'Sunday meal prep looking for a sous-chef.',
    'Dance when nobody is watching. Also when they are.',
    'Direct, warm, slightly chaotic. You will never be bored.',
    'I believe in second dates and good lighting.',
    'Here for long walks and longer conversations.',
    'Analyst by weekday, thrill-seeker by weekend.',
    'I will make you playlist for every mood.',
    'Looking for kindness first. Attraction second. Luggage never.',
    'Chapati night is sacred. Respect it.',
    'Gentle heart, sharp mind, terrible at waiting.',
    'I travel light and laugh heavy.',
    'Surprise me with food and we are good.',
    'I take my coffee black and my men honest.',
    'Karaoke in the car is non-negotiable.',
    'Beach over mountains. Tired over lies.',
    'I am building a quiet life with loud joy in it.',
    'Curly hair, full schedule, open heart.',
    'Ask me anything except my body count.',
    'I want a love that feels like home-cooked food.',
    'Weekend farmer market and a good film. That is a date.',
    'I work hard so we can play harder. Responsibly.',
    'Honesty is my love language. The rest is negotiable.',
    'Looking for chemistry and consistency.',
    'I will drive if you navigate. Teamwork.',
    'Street food critic in my spare time.',
    'I believe couples who laugh together last.',
    'Soft heart. I cry at ads sometimes.',
    'Bring me a book and I am yours forever.',
    'I want someone who texts first sometimes.',
    'Swahili food, coastal breeze, good company.',
    'Ambitious, warm, and done with games.',
    'I smile at strangers and mean it.',
    'Looking for a real one in a fake world.',
    'Gym girl who also loves cake. Balance.',
    'I keep plants and boundaries healthy.',
    'Here for a best friend with benefits of respect.',
    'I take photos of food more than people.',
    'Quiet confidence. Loud laugh.',
    'Let us skip the small talk and talk about dreams.',
    'I love a man with a plan and a joke.',
    'Sundays are for family and ugali.',
    'I dance while cooking. Safety hazard included.',
    'Looking for effort, not perfection.',
    'I will remember how you like your tea.',
    'Energy matches only. If you are dry, keep scrolling.',
    'Music, food, and peace. That is my brand.',
    'I am the friend who actually replies.',
    'Born curious, raised kind, still learning.',
    'Looking for someone to spoil me with attention.',
    'Road trips and wrong turns are fine by me.',
    'I cry at happy endings. You have been warned.',
    'My love language is acts of service and snacks.',
    'Here for a man who knows what he wants.',
    'I make a living and a life. Join both.',
    'Romantic but realistic. Swipe if that sounds like you.',
    'I will cook if you clean. Fair trade.',
    'Looking for laughter that turns into forever.',
]

cities = [
    ('Nairobi', '2 km away'), ('Nairobi', '5 km away'), ('Mombasa', '8 km away'),
    ('Kisumu', '7 km away'), ('Nakuru', '4 km away'), ('Thika', '12 km away'),
    ('Eldoret', '6 km away'), ('Nairobi', '3 km away'), ('Nairobi', '9 km away'),
    ('Meru', '5 km away'), ('Nairobi', '1 km away'), ('Mombasa', '15 km away'),
]

interest_pool = [
    ['Music', 'Food', 'Travel'], ['Books', 'Fitness', 'Movies'], ['Art', 'Travel', 'Food'],
    ['Food', 'Church', 'Music'], ['Football', 'Tech', 'Music'], ['Fitness', 'Food', 'Travel'],
    ['Music', 'Books', 'Movies'], ['Tech', 'Football', 'Coffee'], ['Fashion', 'Food', 'Art'],
    ['Hiking', 'Photography', 'Music'], ['Cooking', 'Family', 'Church'], ['Dance', 'Movies', 'Food'],
]

# Distinct bios cycle without repeating last
bio_idx = 0
entries = []
for i, m in enumerate(manifest):
    name, gender, age, home = names[i % len(names)]
    # keep names unique-ish
    if i >= len(names):
        name = f"{name} {i // len(names) + 1}"
    city, dist = cities[i % len(cities)]
    bio = bios[bio_idx % len(bios)]
    bio_idx += 1
    interests = interest_pool[i % len(interest_pool)]
    photos = [m['file']]
    # second photo if we have another nearby file for multi-shot feel
    if i + 1 < len(manifest) and (i % 3 == 0):
        photos.append(manifest[i + 1]['file'])
    verified = (i % 4 != 3)

    entries.append(f"""  {{
    uid: 'wa-{i + 1:03d}',
    name: {name!r},
    age: {age},
    gender: {gender!r},
    bio: {bio!r},
    photos: {photos!r},
    location: {{ city: {city!r}, distanceLabel: {dist!r} }},
    interests: {interests!r},
    verified: {str(verified).lower()},
  }},""")

src = '''import type { MatchUser } from '../store';

export type SeedProfile = MatchUser;

/**
 * Real-photo demo members (WhatsApp source packs, re-encoded at high JPEG quality).
 * Used so the swipe deck never feels empty when live Firestore is thin.
 */
export const SEED_PROFILES: SeedProfile[] = [
''' + '\n'.join(entries) + '''
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
    if (filters.city && p.location?.city !== filters.city) return false;
    return true;
  });
}
'''

Path(r'C:\Users\ADMIN\XiaomiMiMoProjects\MingleKe\src\lib\seedProfiles.ts').write_text(src)
print('profiles', len(entries))
print('bytes', len(src))
