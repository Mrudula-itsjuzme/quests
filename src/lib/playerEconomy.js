const ENERGY_STORAGE_KEY = 'habbit_player_energy_v1';
const ENERGY_MAX = 100;
const ENERGY_COST_PER_QUEST = 10;
const GEM_VALUE_BY_RARITY = { Common: 1, Uncommon: 2, Rare: 5, Epic: 15, Legendary: 40 };

/**
 * Coins are a server-authoritative balance from coin_ledger, surfaced as
 * `me.coins`. This helper only supplies a safe display value while `me` is
 * still loading or when the server predates the wallet.
 */
export function coinBalance(me) {
  return Number(me?.coins ?? 0);
}

/** Gems are a count of rarity value already unlocked via collectibles. */
export function deriveGems(collectibles = []) {
  const safeList = Array.isArray(collectibles) ? collectibles : [];
  return safeList.reduce((sum, item) => sum + (GEM_VALUE_BY_RARITY[item?.rarity] || 0), 0);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readEnergyState() {
  if (typeof window === 'undefined') return { date: todayKey(), value: ENERGY_MAX };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ENERGY_STORAGE_KEY) || 'null');
    if (!parsed || parsed.date !== todayKey()) return { date: todayKey(), value: ENERGY_MAX };
    return parsed;
  } catch {
    return { date: todayKey(), value: ENERGY_MAX };
  }
}

function writeEnergyState(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(state));
}

/** Energy resets to full each day and depletes as quests are completed. */
export function getEnergy() {
  const state = readEnergyState();
  return { value: state.value, max: ENERGY_MAX };
}

export function spendEnergy(amount = ENERGY_COST_PER_QUEST) {
  const state = readEnergyState();
  const value = Math.max(0, state.value - amount);
  writeEnergyState({ date: todayKey(), value });
  return { value, max: ENERGY_MAX };
}
