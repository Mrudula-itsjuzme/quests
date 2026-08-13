export const GUEST_USER = {
  id: 'guest-wayfarer-777',
  displayName: 'Guest Wayfarer',
  email: 'guest@habbit.local',
  tier: 'Gold',
  level: 14,
  totalXp: 7250,
  xpIntoLevel: 250,
  xpForCurrentLevel: 500,
  progressToNextLevel: 0.5,
  coins: 1450,
  streakDays: 7,
  onboardingCompletedAt: new Date().toISOString(),
};

export const GUEST_ACTIVE_QUESTS = [
  {
    id: 'g-q1',
    definitionId: 'def-1',
    title: 'Morning Sanctuary',
    category: 'Mind',
    description: 'Spend 10 minutes in silent reflection or meditation before checking notifications.',
    progressValue: 1,
    targetValue: 1,
    unit: 'session',
    xpReward: 120,
    cadence: 'daily',
    status: 'completed',
  },
  {
    id: 'g-q2',
    definitionId: 'def-2',
    title: 'Hydration Ritual',
    category: 'Body',
    description: 'Drink 4 full glasses of spring or filtered water throughout the day.',
    progressValue: 3,
    targetValue: 4,
    unit: 'glasses',
    xpReward: 80,
    cadence: 'daily',
    status: 'active',
  },
  {
    id: 'g-q3',
    definitionId: 'def-3',
    title: 'Digital Sunset',
    category: 'Mind',
    description: 'Disconnect all screens 30 minutes before sleep to rest your mind.',
    progressValue: 0,
    targetValue: 1,
    unit: 'night',
    xpReward: 150,
    cadence: 'daily',
    status: 'active',
  },
  {
    id: 'g-q4',
    definitionId: 'def-4',
    title: 'Forest Wanderer',
    category: 'Discovery',
    description: 'Complete 3 outdoor walks in nature or green spaces this week.',
    progressValue: 2,
    targetValue: 3,
    unit: 'walks',
    xpReward: 350,
    cadence: 'weekly',
    status: 'active',
  },
];

export const GUEST_HISTORY = [
  {
    id: 'h-1',
    title: 'Starlit Meditation',
    category: 'Mind',
    xpReward: 150,
    status: 'completed',
    completedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'h-2',
    title: '10,000 Steps Expedition',
    category: 'Body',
    xpReward: 200,
    status: 'completed',
    completedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const GUEST_COLLECTIBLES = [
  {
    assetId: 'col-1',
    title: 'Aura of First Light',
    category: 'Mind',
    rarity: 'Rare',
    unlockedAt: new Date(Date.now() - 864000000).toISOString(),
    caption: 'Awarded for completing morning meditation 5 days in a row.',
  },
  {
    assetId: 'col-2',
    title: 'Shield of Resilience',
    category: 'Body',
    rarity: 'Epic',
    unlockedAt: new Date(Date.now() - 432000000).toISOString(),
    caption: 'Forged after maintaining a 7-day wellness streak.',
  },
  {
    assetId: 'col-3',
    title: 'Compass of Discovery',
    category: 'Discovery',
    rarity: 'Legendary',
    unlockedAt: new Date(Date.now() - 172800000).toISOString(),
    caption: 'Unlocked by exploring 3 distinct outdoor pathways.',
  },
];

export const GUEST_DEFINITIONS = [
  {
    id: 'def-10',
    title: 'Gratitude Reflection',
    category: 'Mind',
    description: 'Write down 3 things you are deeply thankful for today.',
    xpReward: 100,
    cadence: 'daily',
  },
  {
    id: 'def-11',
    title: 'Core Strength Challenge',
    category: 'Body',
    description: 'Perform a 2-minute plank session with proper form.',
    xpReward: 140,
    cadence: 'daily',
  },
  {
    id: 'def-12',
    title: 'Uncharted Trail',
    category: 'Discovery',
    description: 'Visit a neighborhood park or neighborhood route you have never taken.',
    xpReward: 300,
    cadence: 'weekly',
  },
];

export const GUEST_FEED = [
  {
    id: 'f-1',
    userId: 'u-101',
    displayName: 'Lyra Moonweaver',
    rankTitle: 'Gold Seeker',
    questName: 'Celestial Night Walk',
    xpEarned: 250,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'f-2',
    userId: 'u-102',
    displayName: 'Theron Ironheart',
    rankTitle: 'Silver Pathfinder',
    questName: '100 Pushup Trial',
    xpEarned: 180,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

// Guest-mode only. Signed-in sessions always read real posts from
// /api/v1/community/posts and show an empty state when there are none.
export const GUEST_COMMUNITY_POSTS = [
  {
    id: 'gp-1',
    userId: 'u-101',
    author: { userId: 'u-101', displayName: 'Lyra Moonweaver', totalXp: 24800, rankTitle: 'Pathfinder' },
    cardId: 'gc-1',
    discovery: { itemName: 'Malabar Trogon', cardTitle: 'Malabar Trogon', rarityTier: 'S', rarityGrade: 'S', rarityStars: 5, speciesId: 'malabar-trogon', imageRef: null, capturedAt: new Date(Date.now() - 5400000).toISOString() },
    caption: 'Held still just long enough at first light.',
    hashtags: ['#birding', '#westernghats'],
    placeLabel: 'Silent Valley',
    gps: { lat: 11.08, lng: 76.44 },
    visibility: 'public',
    likeCount: 42,
    commentCount: 6,
    viewerLiked: false,
    createdAt: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: 'gp-2',
    userId: 'u-102',
    author: { userId: 'u-102', displayName: 'Theron Ironheart', totalXp: 11200, rankTitle: 'Guardian' },
    cardId: 'gc-2',
    discovery: { itemName: 'Indian Paradise Flycatcher', cardTitle: 'Indian Paradise Flycatcher', rarityTier: 'A', rarityGrade: 'A', rarityStars: 4, speciesId: 'paradise-flycatcher', imageRef: null, capturedAt: new Date(Date.now() - 18000000).toISOString() },
    caption: 'Ribbon tail caught the light on the way past.',
    hashtags: ['#wildrealm'],
    placeLabel: 'Cauvery Bank',
    gps: { lat: 12.42, lng: 77.18 },
    visibility: 'public',
    likeCount: 18,
    commentCount: 2,
    viewerLiked: true,
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
];

export const GUEST_LEADERBOARD = [
  { position: 1, userId: 'u-101', displayName: 'Lyra Moonweaver', rankTitle: 'Gold Seeker', totalXp: 12400 },
  { position: 2, userId: 'u-102', displayName: 'Theron Ironheart', rankTitle: 'Silver Pathfinder', totalXp: 9800 },
  { position: 3, userId: 'guest-wayfarer-777', displayName: 'Guest Wayfarer (You)', rankTitle: 'Gold Seeker', totalXp: 7250, isCurrentUser: true },
  { position: 4, userId: 'u-104', displayName: 'Aria Sunwalker', rankTitle: 'Novice III', totalXp: 5400 },
];

export const GUEST_CAPTURES = [
  {
    id: 'cap-1',
    itemName: 'Still lake at dusk',
    category: 'Discovery',
    cardTitle: 'The Mirror Pond',
    rarityTier: 'Gold',
    rarityScore: 0.72,
    description: 'A quietly dramatic waterline, caught right as the light turned gold.',
    capturedAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'cap-2',
    itemName: 'Cup of tea',
    category: 'Mind',
    cardTitle: 'Steepwater Sage',
    rarityTier: 'Bronze',
    rarityScore: 0.18,
    description: 'A humble but honest companion for a slow morning.',
    capturedAt: new Date(Date.now() - 604800000).toISOString(),
  },
];

export const GUEST_REWARDS = [
  { level: 10, amount: 200, rewardType: 'xp', label: 'Milestone XP Boost', status: 'claimed' },
  { level: 15, amount: 1, rewardType: 'badge', label: 'Badge of the Golden Sun', status: 'claimable' },
  { level: 20, amount: 1, rewardType: 'title', label: 'Title: Master Wayfarer', status: 'locked' },
];

export const GUEST_SPECIES = [
  { id: 'sky-house-sparrow', commonName: 'House Sparrow', scientificName: 'Passer domesticus', element: 'Sky', category: 'Fauna', baseRarity: 0.05, nocturnal: false, sensitive: false, seasonalityMonths: [] },
  { id: 'earth-red-fox', commonName: 'Red Fox', scientificName: 'Vulpes vulpes', element: 'Earth', category: 'Fauna', baseRarity: 0.45, nocturnal: true, sensitive: false, seasonalityMonths: [] },
  { id: 'water-waterfall', commonName: 'Forest Waterfall', scientificName: null, element: 'Water', category: 'Landscape', baseRarity: 0.55, nocturnal: false, sensitive: false, seasonalityMonths: [] },
  { id: 'grass-sunflower', commonName: 'Sunflower', scientificName: 'Helianthus annuus', element: 'Grass', category: 'Flora', baseRarity: 0.10, nocturnal: false, sensitive: false, seasonalityMonths: [] },
  { id: 'fire-sunset', commonName: 'Sunset', scientificName: null, element: 'Fire', category: 'Landscape', baseRarity: 0.28, nocturnal: false, sensitive: false, seasonalityMonths: [] },
];
