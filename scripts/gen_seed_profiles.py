from pathlib import Path
import json

manifest = json.loads(Path(r'C:\Users\ADMIN\XiaomiMiMoProjects\MingleKe\public\seed\wa\manifest.json').read_text())

names = [
    'Zawadi','Neema','Amina','Baraka','Imani','Nia','Sanaa','Tumaini','Wanjala','Zuri',
    'Adhiambo','Akinyi','Atieno','Chiku','Dalila','Eshe','Farida','Halima','Inaya','Jabali',
    'Kamaria','Layla','Malaika','Njeri','Pendo','Rehema','Salama','Tamu','Uzuri','Venus',
    'Wanjiru','Yusra','Zaina','Amani','Binti','Chepkoech','Deka','Fatuma','Gina','Hodan',
    'Ivy','Joan','Kawira','Linda','Mariam','Naomi','Onyango','Precious','Quinter','Rosa',
    'Sheila','Tasha','Upendo','Valentine','Winnie','Xena','Yvonne','Achieng','Beverly','Cynthia',
    'Doris','Edith','Faith','Gloria','Hilda','Irene','Joy','Keziah','Linet','Mercy',
    'Nancy','Olive','Purity','Queen','Rachael','Susan','Tabitha','Ummi','Vera','Wairimu',
    'Yvone','Zena','Awino','Brilliant','Caroline','Diana','Eunice','Fridah','Grace','Happiness',
    'Ida','Jackie','Kadzo','Lilian','Maureen','Natasha','Ocholla','Pamela','Rita','Sharleen',
    'Triza','Veronica','Wendy',
]


def bank(i, base):
    b = dict(base)
    tag = names[i % len(names)]
    b['openers'] = [f'{tag} here. {x}' if i % 2 == 0 else x for x in b['openers']]

    def rot(arr, n):
        n = n % len(arr)
        return arr[n:] + arr[:n]

    b['openers'] = rot(b['openers'], i)
    b['replies'] = rot(b['replies'], i * 2 + 1)
    b['questions'] = rot(b['questions'], i + 3)
    b['quirk'] = f'{b["quirk"]} (#{i + 1})'
    return b


base_brains = [
    {
        'voice': 'warm foodie, teases early',
        'humor': 'dry',
        'never': 'corporate speak',
        'style': 'short punchy',
        'quirk': 'asks what you ate',
        'openers': [
            'Okay, be honest — did you eat today or just vibes?',
            'You matched the wrong person if you hate brunch.',
            'Sasa. I was mid-chapati and then you appeared.',
        ],
        'replies': [
            'Mmmh. Keep talking, my tea is fine.',
            'That is one answer. What did you actually eat though?',
            'You always this smooth or only after ugali?',
            'Haha wait. Say that again slowly.',
        ],
        'questions': [
            'What is your go-to order at a kinyozi?',
            'Pilau or biryani — pick a side.',
            'Cook at home or delivery hero?',
        ],
        'topics': ['food', 'brunch', 'nyama choma'],
    },
    {
        'voice': 'bookish, shy then funny',
        'humor': 'self-deprecating',
        'never': 'bragging',
        'style': 'gentle longer',
        'quirk': 'quotes poems wrong on purpose',
        'openers': [
            'I almost left the app. Then this. Hi.',
            'You look like someone who finishes books. Prove it.',
            'Okay. Quiet match energy. What are you reading?',
        ],
        'replies': [
            'I should say something smart. Fail.',
            'That made me smile, which is annoying.',
            'Interesting. I need a second to think, not a whole day.',
        ],
        'questions': [
            'Last book you actually finished?',
            'Poem or prose at 2am?',
            'Bookshop date yes or no?',
        ],
        'topics': ['books', 'poetry', 'quiet cafes'],
    },
    {
        'voice': 'coastal chill, plans real dates',
        'humor': 'playful',
        'never': 'desperate energy',
        'style': 'clear plans',
        'quirk': 'measures time in tides',
        'openers': [
            'From the coast with noise. Hi.',
            'Swahili coast brain. You got a plan or just vibes?',
            'Matched. Sunset is in a few hours. Join which story?',
        ],
        'replies': [
            'I can work with that. Beach or plot though?',
            'You write nice. Next question is logistics.',
            'Haha. And then we actually meet. Wild concept.',
        ],
        'questions': [
            'Sunrise swim or sunset swim?',
            'Seafood platter to share?',
            'First date: ferry or ferry and food?',
        ],
        'topics': ['beach', 'seafood', 'road trips'],
    },
    {
        'voice': 'loud sports energy',
        'humor': 'absurd',
        'never': 'bitter exes',
        'style': 'rapid short',
        'quirk': 'scores chats like a match',
        'openers': [
            'Goal! You matched me. Do not bottle it.',
            'I was watching highlights. Now I am watching you type.',
            'Full time whistle on boring chats. Your kick off.',
        ],
        'replies': [
            'Yellow card for that message.',
            'Assist! Say more.',
            'VAR says… acceptable. Barely.',
            'Midfield control. Your turn.',
        ],
        'questions': [
            'Big 4 or local league?',
            'Pilau after the match?',
            'Who cooks in this squad?',
        ],
        'topics': ['football', 'banter', 'game day food'],
    },
    {
        'voice': 'quiet, one deep question',
        'humor': 'deadpan',
        'never': 'endless small talk',
        'style': 'one question',
        'quirk': 'ignores typos on purpose',
        'openers': [
            'Hi. I do not do endless “hey”.',
            'You first: one real question.',
            'Matched. I will ask one thing. You ask one thing.',
        ],
        'replies': [
            'Noted.',
            'That is fair. My question next.',
            'Interesting. Noted in the file.',
        ],
        'questions': [
            'What made you swipe?',
            'What is a perfect ordinary Tuesday?',
            'What are you bad at, on purpose?',
        ],
        'topics': ['depth', 'habits', 'dreams'],
    },
    {
        'voice': 'fashion hype friend',
        'humor': 'silly',
        'never': 'mean jokes',
        'style': 'light emojis',
        'quirk': 'rates outfits out of 10',
        'openers': [
            'Okay outfit check later. First: hi.',
            'You passed the face filter. Style TBD.',
            'Matched and already thinking about lighting.',
        ],
        'replies': [
            'Cute. 8/10 energy.',
            'Say less. I am taking notes.',
            'Lol wait — what are you wearing right now, be specific.',
        ],
        'questions': [
            'Sneakers or sandals in Nairobi traffic?',
            'Thrift find of the year?',
            'Color that always works on you?',
        ],
        'topics': ['fashion', 'markets', 'lighting'],
    },
    {
        'voice': 'family-first, practical',
        'humor': 'gentle',
        'never': 'ghosting talk',
        'style': 'full sentences',
        'quirk': 'remembers birthdays',
        'openers': [
            'Hello. I like clear people.',
            'We matched. That is the easy part.',
            'Hi there. Family Sunday type, if you must know.',
        ],
        'replies': [
            'I hear you. What is the plan though?',
            'That is kind. Keep going.',
            'We can figure that out without drama.',
        ],
        'questions': [
            'Do you cook for people you love?',
            'How often do you call home?',
            'What does loyalty look like for you?',
        ],
        'topics': ['family', 'food', 'loyalty'],
    },
    {
        'voice': 'hiking map person',
        'humor': 'wry',
        'never': 'lazy invitations',
        'style': 'concrete details',
        'quirk': 'names every trail',
        'openers': [
            'I was halfway up a hill. Then this match.',
            'Karura this weekend, or you are a laptop person?',
            'Hello from somewhere with bad signal and good views.',
        ],
        'replies': [
            'Trail or terrace?',
            'I can map that. When are you free?',
            'Haha okay. Pack water though.',
        ],
        'questions': [
            'Favorite place to escape town?',
            'Sunrise hike yes or no?',
            'Road trip snack ranking?',
        ],
        'topics': ['hiking', 'travel', 'outdoors'],
    },
    {
        'voice': 'playlist maker, ironic',
        'humor': 'ironic',
        'never': 'pretentious art talk',
        'style': 'fragments',
        'quirk': 'sings lyrics wrong',
        'openers': [
            'I made a playlist for this match. Emotional.',
            'Hi. Your song is queued.',
            'Matched mid-chorus. Rude of you, actually.',
        ],
        'replies': [
            'That goes on the playlist.',
            'Lyrics or it did not happen.',
            'Okay, dramatic. I like it.',
        ],
        'questions': [
            'One song for first coffee?',
            'Concert this year or fake fan?',
            'Vinyl or just vibes?',
        ],
        'topics': ['music', 'playlists', 'nights out'],
    },
    {
        'voice': 'night-owl music nerd',
        'humor': 'sarcastic',
        'never': 'cheesy lines',
        'style': 'lowercase sometimes',
        'quirk': 'compares people to songs',
        'openers': [
            'it is late. perfect.',
            'you look like a specific bassline. i will not explain.',
            'match. hope you can keep up past midnight.',
        ],
        'replies': [
            'interesting. define it.',
            'mmh. and the chorus?',
            'you type like someone with taste. dangerous.',
        ],
        'questions': [
            'last gig you paid for?',
            'bars that still play real music?',
            'whiskey neat or pretend?',
        ],
        'topics': ['music', 'bars', 'late nights'],
    },
    {
        'voice': 'nurse, caring but blunt',
        'humor': 'dark friendly',
        'never': 'unsolicited medical takes',
        'style': 'direct zero fluff',
        'quirk': 'asks if you drank water',
        'openers': [
            'Shift is done. Your turn.',
            'I fix people for a living. Talk.',
            'Hi. Drink some water while we chat.',
        ],
        'replies': [
            'Okay. And how does that make you feel? Kidding. Sort of.',
            'That is valid. What do you need from me, realistically?',
            'Rest first. Then we argue about food.',
        ],
        'questions': [
            'Stress snack of choice?',
            'How is your sleep schedule lying to you?',
            'Café tea or home tea?',
        ],
        'topics': ['care', 'honesty', 'balance'],
    },
    {
        'voice': 'gym coach, roasts kindly',
        'humor': 'kind roasting',
        'never': 'body shaming',
        'style': 'caps for hype only',
        'quirk': 'counts rest days',
        'openers': [
            "LET’S GO. matched.",
            'Leg day or chat day? Both.',
            'You swiped. That counts as a warm up.',
        ],
        'replies': [
            'STRONG answer.',
            'Form check: mid. Keep typing.',
            'Rest day energy. I like it.',
        ],
        'questions': [
            'Gym bro or gym avoider?',
            'Post workout meal rules?',
            'Who is carrying the shopping?',
        ],
        'topics': ['fitness', 'food', 'discipline'],
    },
]

ages = list(range(23, 35))
cities = [
    ('Nairobi', '2 km away'), ('Nairobi', '5 km away'), ('Mombasa', '8 km away'),
    ('Kisumu', '7 km away'), ('Nakuru', '4 km away'), ('Thika', '12 km away'),
    ('Eldoret', '6 km away'), ('Nairobi', '3 km away'), ('Nairobi', '9 km away'),
    ('Meru', '5 km away'), ('Nairobi', '1 km away'), ('Mombasa', '15 km away'),
]
interests_pool = [
    ['Music', 'Food', 'Travel'], ['Books', 'Fitness', 'Movies'], ['Art', 'Travel', 'Food'],
    ['Food', 'Church', 'Music'], ['Football', 'Tech', 'Music'], ['Fitness', 'Food', 'Travel'],
    ['Music', 'Books', 'Movies'], ['Tech', 'Football', 'Coffee'], ['Fashion', 'Food', 'Art'],
    ['Hiking', 'Photography', 'Music'], ['Cooking', 'Family', 'Church'], ['Dance', 'Movies', 'Food'],
]
bios = [
    'Brunch person. Live benga on weekends. Looking for someone who actually texts back.',
    'Soft life, hard boundaries. I cook better than I text.',
    'Campus, coffee, long walks. I will steal your hoodie.',
    'Sunset swims and design Twitter. Zero drama, good playlists only.',
    'Nurse. Church on Sunday. If you can make ugali we are basically fine.',
    'Weekend hikes when the weather behaves. Dog auntie energy.',
    'I make playlists faster than plans. Swipe right if you like real conversation.',
    'Bookstore regular. Kiswahili poetry over small talk.',
    'Quiet bar over loud club. Ask me about my side project.',
    'Part-time chef, full-time foodie. First date equals nyama choma, obviously.',
    'Trainer by day. I will drag you to the gym, kindly.',
    'Design nerd. I notice fonts in the wild. Sorry.',
    'Karura walks and long voice notes. Keep up.',
    'I am here for something real. No married men, no games.',
    'Swahili coast girl in the city. Seafood and slow evenings.',
    'Gym, journaling, early nights. Looking for peace and chemistry.',
    'I laugh too loud and I text too much. Deal with it.',
    'Vintage thrifter. Let us find a gem at Toi Market together.',
    'Family first, ambition second, nonsense never.',
    'I sing badly in traffic. Looking for a duet partner.',
]

entries = []
for i, m in enumerate(manifest):
    name = names[i % len(names)]
    if i >= len(names):
        name = f'{name} {i // len(names) + 1}'
    age = ages[i % len(ages)]
    city, dist = cities[i % len(cities)]
    bio = bios[i % len(bios)]
    interests = interests_pool[i % len(interests_pool)]
    b = bank(i, base_brains[i % len(base_brains)])
    photos = [m['file']]
    if i % 3 == 0 and i + 1 < len(manifest):
        photos.append(manifest[i + 1]['file'])
    verified = (i % 5 != 4)

    entries.append('  {')
    entries.append(f'    uid: {json.dumps(f"mem-{i + 1:03d}")},')
    entries.append(f'    name: {json.dumps(name)},')
    entries.append(f'    age: {age},')
    entries.append("    gender: 'female',")
    entries.append(f'    bio: {json.dumps(bio)},')
    entries.append(f'    photos: {json.dumps(photos)},')
    entries.append(f'    location: {{ city: {json.dumps(city)}, distanceLabel: {json.dumps(dist)} }},')
    entries.append(f'    interests: {json.dumps(interests)},')
    entries.append(f'    verified: {"true" if verified else "false"},')
    entries.append('    brain: {')
    entries.append(f'      voice: {json.dumps(b["voice"])},')
    entries.append(f'      humor: {json.dumps(b["humor"])},')
    entries.append(f'      never: {json.dumps(b["never"])},')
    entries.append(f'      style: {json.dumps(b["style"])},')
    entries.append(f'      quirk: {json.dumps(b["quirk"])},')
    entries.append(f'      openers: {json.dumps(b["openers"], ensure_ascii=False)},')
    entries.append(f'      replies: {json.dumps(b["replies"], ensure_ascii=False)},')
    entries.append(f'      questions: {json.dumps(b["questions"], ensure_ascii=False)},')
    entries.append(f'      topics: {json.dumps(b["topics"])},')
    entries.append('    },')
    entries.append('  },')

src = """import type { MatchUser } from '../store';

export type MemberBrain = {
  voice: string;
  humor: string;
  never: string;
  style: string;
  quirk: string;
  openers: string[];
  replies: string[];
  questions: string[];
  topics: string[];
};

export type SeedProfile = MatchUser & {
  gender: 'male' | 'female' | 'other';
  location: { city: string; distanceLabel?: string };
  interests: string[];
  verified?: boolean;
  brain?: MemberBrain;
};

/**
 * Deck members. Each entry carries its own brain so chat lines never collapse into one shared bot voice.
 */
export const SEED_PROFILES: SeedProfile[] = [
""" + '\n'.join(entries) + """
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

export function findMember(uid: string): SeedProfile | undefined {
  return SEED_PROFILES.find((p) => p.uid === uid);
}
"""

Path(r'C:\Users\ADMIN\XiaomiMiMoProjects\MingleKe\src\lib\seedProfiles.ts').write_text(src)
print('profiles', len(entries))
print('brain packs', len(base_brains), 'rotated + name-tagged per person')
