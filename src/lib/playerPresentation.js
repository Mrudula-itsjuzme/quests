export const cosmeticOptions = {
  title: ['Wayfarer', 'Scholar', 'Pathfinder', 'Relentless'],
  banner: ['Compass', 'Oak', 'Ember', 'Moon'],
  gear: ['Forest Cloak', 'Leather Cuirass', 'Silver Blade', 'Compass Amulet', 'Signet Ring'],
  appearance: ['Wayfarer', 'Scholar', 'Vanguard'],
  outfit: ['Ranger', 'Archivist', 'Guardian'],
  mount: ['None', 'Ash Mare', 'Dawn Elk'],
  companion: ['Nyx', 'Ember Fox', 'Stone Owl'],
};

const STORAGE_KEY = 'habbit_player_cosmetics_v1';
export const defaultCosmetics = Object.fromEntries(Object.entries(cosmeticOptions).map(([key, values]) => [key, values[0]]));

export function loadCosmetics() {
  if (typeof window === 'undefined') return defaultCosmetics;
  try {
    return { ...defaultCosmetics, ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return defaultCosmetics;
  }
}

export function saveCosmetics(value) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function derivePlayerPresentation(me, active = [], history = [], collectibles = []) {
  const completed = history.filter((quest) => quest.status === 'completed');
  return {
    completedCount: completed.length,
    totalQuests: completed.length + active.length,
    rank: me?.tier ? `${me.tier} ${me.level}` : 'Adventurer',
    rankProgress: me?.progressToNextLevel ?? 0,
    nextRankXp: me?.xpForCurrentLevel ?? 0,
    achievements: [
      { id: 'first', label: 'First Steps', unlocked: completed.length >= 1, icon: 'scroll' },
      { id: 'streak', label: 'Relentless', unlocked: (me?.streakDays || 0) >= 7, icon: 'flame' },
      { id: 'seeker', label: 'Quest Seeker', unlocked: completed.length >= 10, icon: 'book' },
      { id: 'path', label: 'Pathfinder', unlocked: collectibles.length >= 5, icon: 'compass' },
    ],
  };
}
