export const rarityXp = Object.freeze({ Common: 25, Uncommon: 50, Rare: 100, Epic: 250, Legendary: 500 });
export const discoveryWeights = Object.freeze({ Common: 50, Uncommon: 30, Rare: 15, Epic: 4, Legendary: 1 });
export const weeklyWeights = Object.freeze({ Uncommon: 30, Rare: 50, Epic: 20 });
export const monthlyWeights = Object.freeze({ Epic: 70, Legendary: 30 });

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
  definition('monthly-sunrise-atlas', 'Atlas of Dawn', 'Monthly', 'Legendary', 'PHOTO', 'monthly_sunrises', 'monthly', 8, 'photos', 180, 2000),
  definition('monthly-wild-places', 'Twelve Wild Places', 'Monthly', 'Legendary', 'PHOTO', 'monthly_nature_places', 'monthly', 12, 'photos', 180, 2500),
  definition('monthly-reading-odyssey', 'The Reading Odyssey', 'Monthly', 'Epic', 'PHOTO', 'monthly_reading', 'monthly', 6, 'photos', 90, 1500),
  definition('monthly-movement', 'Thirty Days in Motion', 'Monthly', 'Epic', 'PHOTO', 'monthly_movement', 'monthly', 12, 'photos', 90, 1800),
  definition('monthly-city-stories', 'Stories of the City', 'Monthly', 'Epic', 'PHOTO', 'monthly_landmarks', 'monthly', 10, 'photos', 120, 1700),
  definition('monthly-plant-journal', 'The Living Field Guide', 'Monthly', 'Legendary', 'PHOTO', 'monthly_plants', 'monthly', 15, 'photos', 180, 3000),
  ...catalog([
    'Evening Pages','Gratitude Ledger','Memory Palace','Poetry Pause','Vocabulary Forge','Focused Listening','Digital Sunset','Idea Sketch','Question of the Day','Mindful Breathing','Chapter Notes','Creative Prompt','Decision Journal','Quiet Observation','Learning Recap','Letter to Tomorrow','Problem Reframe','Five-Minute Plan','Curiosity Trail','Article Summary','Values Check','Weekly Intention','Story Reflection','Knowledge Map','Single-Task Sprint','Calm Countdown',
  ], 'Mind', 'daily', 'TEXT', 'reflection', 80, 'words', 3),
  ...catalog([
    'Morning Mobility','Posture Reset','Balance Practice','Core Circuit','Outdoor Walk','Stair Session','Dance Break','Breath and Stretch','Recovery Routine','Desk Mobility','Evening Walk','Bodyweight Circuit','Gentle Yoga','Sun Salutation','Foam Roll','Active Commute','Strength Basics','Coordination Drill','Flexibility Flow','Movement Snack','Restorative Stretch',
  ], 'Body', 'daily', 'TEXT', 'movement_log', 1, 'session', 3),
  ...catalog([
    'Red Door','Street Mural','Bird in Flight','Stone Bridge','Old Clock','Community Garden','Interesting Shadow','Spiral Pattern','Market Stall','Historic Plaque','Public Sculpture','Blue Bicycle','Mossy Wall','City Skyline','Wild Mushroom','Butterfly','Bee at Work','Cloud Formation','Moonrise','Reflected Building','Unusual Leaf','Footpath Marker','Train Station','Bookshop Window','Fountain','Rock Formation','Coastal View','Village Shrine','Ancient Doorway','Night Lights','Rain Puddle Reflection','Hidden Courtyard',
  ], 'Discovery', 'daily', 'PHOTO', 'discovery_subject', 1, 'photo', 3),
  ...catalog([
    'Seven-Day Reading Trail','Neighbourhood Nature Map','Three Local Stories','Five-Day Mobility Chain','Community Landmark Tour','A Week of Blue Skies','Public Art Chronicle','Four Quiet Places','Weekend Walking Atlas','Local Flora Album','Architecture Through Time','Seven Acts of Reflection','Three Waters Journey',
  ], 'Weekly', 'weekly', 'PHOTO', 'weekly_series', 3, 'photos', 42, 500),
  ...catalog([
    'A Month of Small Wonders','The Neighbourhood Atlas','Twenty Pages of Place','Seasons in Detail','The Long Walking Chronicle','Thirty Days of Reflection',
  ], 'Monthly', 'monthly', 'PHOTO', 'monthly_series', 12, 'photos', 120, 1800),
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

function catalog(titles, category, cadence, verificationType, subjectTag, targetValue, unit, cooldownDays, xpOverride = null) {
  return titles.map((title, index) => definition(
    `${cadence}-${category.toLowerCase()}-catalog-${String(index + 1).padStart(2, '0')}`,
    title,
    category,
    cadence === 'monthly' ? (index % 3 === 0 ? 'Legendary' : 'Epic') : cadence === 'weekly' ? (index % 3 === 0 ? 'Epic' : index % 2 === 0 ? 'Rare' : 'Uncommon') : category === 'Discovery' ? ['Common', 'Common', 'Uncommon', 'Rare', 'Epic'][index % 5] : ['Common', 'Uncommon', 'Rare'][index % 3],
    verificationType,
    `${subjectTag}_${index + 1}`,
    cadence,
    targetValue,
    unit,
    cooldownDays,
    xpOverride,
  ));
}
