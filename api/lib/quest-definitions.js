export const rarityXp = Object.freeze({ Common: 25, Uncommon: 50, Rare: 100, Epic: 250, Legendary: 500 });
export const discoveryWeights = Object.freeze({ Common: 50, Uncommon: 30, Rare: 15, Epic: 4, Legendary: 1 });
export const weeklyWeights = Object.freeze({ Uncommon: 30, Rare: 50, Epic: 20 });

export const questDefinitions = Object.freeze([
  definition('mind-read', 'Read Daily', 'Mind', 'Common', 'TEXT', 'reading', 'daily', 20, 'minutes', 3),
  definition('mind-journal', 'Journal Reflection', 'Mind', 'Common', 'TEXT', 'journal', 'daily', 80, 'words', 3),
  definition('mind-concept', 'Learn One Concept', 'Mind', 'Uncommon', 'TEXT', 'learning', 'daily', 1, 'concept', 3),
  definition('mind-deep-work', 'Deep Work', 'Mind', 'Rare', 'AUTO', 'focus_minutes', 'daily', 60, 'minutes', 3),
  definition('body-movement', 'Movement Quest', 'Body', 'Common', 'AUTO', 'movement_minutes', 'daily', 30, 'minutes', 3),
  definition('body-stretch', 'Stretch Session', 'Body', 'Common', 'AUTO', 'stretch_minutes', 'daily', 12, 'minutes', 3),
  definition('body-workout', 'Workout Routine', 'Body', 'Rare', 'AUTO', 'workout_session', 'daily', 1, 'session', 3),
  definition('body-hydration', 'Hydration Quest', 'Body', 'Uncommon', 'TEXT', 'hydration', 'daily', 2, 'litres', 3),
  definition('discovery-yellow-flower', 'Photograph a Yellow Flower', 'Discovery', 'Common', 'PHOTO', 'yellow_flower', 'daily', 1, 'photo', 3),
  definition('discovery-landmark', 'Photograph a Local Landmark', 'Discovery', 'Common', 'PHOTO', 'local_landmark', 'daily', 1, 'photo', 3),
  definition('discovery-library', 'Find a Library', 'Discovery', 'Uncommon', 'PHOTO', 'library', 'daily', 1, 'photo', 3),
  definition('discovery-banyan', 'Photograph a Banyan Tree', 'Discovery', 'Uncommon', 'PHOTO', 'banyan_tree', 'daily', 1, 'photo', 3),
  definition('discovery-orange-cat', 'Photograph an Orange Cat', 'Discovery', 'Rare', 'PHOTO', 'orange_cat', 'daily', 1, 'photo', 3, 150),
  definition('discovery-water', 'Photograph a Water Body', 'Discovery', 'Epic', 'PHOTO', 'water_body', 'daily', 1, 'photo', 3),
  definition('discovery-sunrise', 'Photograph a Sunrise or Sunset', 'Discovery', 'Epic', 'PHOTO', 'sunrise_sunset', 'daily', 1, 'photo', 3),
  definition('discovery-rainbow', 'Photograph a Rainbow', 'Discovery', 'Legendary', 'PHOTO', 'rainbow', 'daily', 1, 'photo', 90),
  definition('weekly-water', "Nature's Guardian", 'Weekly', 'Epic', 'PHOTO', 'water_body', 'weekly', 1, 'photo', 42, 300),
  definition('weekly-banyan', 'Ancient Tree Finder', 'Weekly', 'Rare', 'PHOTO', 'banyan_tree', 'weekly', 1, 'photo', 42, 300),
  definition('weekly-yoga', 'Threefold Balance', 'Weekly', 'Rare', 'PHOTO', 'yoga_sessions', 'weekly', 3, 'sessions', 42, 400),
  definition('weekly-sunrises', 'Dawn Chronicle', 'Weekly', 'Epic', 'PHOTO', 'sunrise_series', 'weekly', 3, 'photos', 42, 500),
  definition('weekly-library', 'Keeper of Knowledge', 'Weekly', 'Uncommon', 'PHOTO', 'museum_library', 'weekly', 1, 'photo', 42, 350),
  definition('weekly-plants', 'Five Species Walk', 'Weekly', 'Rare', 'PHOTO', 'plant_species', 'weekly', 5, 'photos', 42, 400),
  definition('weekly-architecture', 'Hidden Architecture', 'Weekly', 'Uncommon', 'PHOTO', 'architecture', 'weekly', 3, 'photos', 42, 350),
]);

function definition(id, title, category, rarity, verificationType, subjectTag, cadence, targetValue, unit, cooldownDays, xpOverride = null) {
  return Object.freeze({
    id,
    title,
    description: title,
    category,
    rarity,
    verificationType,
    subjectTag,
    cadence,
    targetValue,
    unit,
    cooldownDays,
    xpReward: xpOverride ?? rarityXp[rarity],
    enabled: true,
    instructions: [`Complete ${title}`, 'Submit the required proof before reset'],
  });
}
