export const rarityXp = Object.freeze({ Common: 25, Uncommon: 50, Rare: 100, Epic: 250, Legendary: 500 });
export const discoveryWeights = Object.freeze({ Common: 50, Uncommon: 30, Rare: 15, Epic: 4, Legendary: 1 });
export const weeklyWeights = Object.freeze({ Uncommon: 30, Rare: 50, Epic: 20 });
export const monthlyWeights = Object.freeze({ Epic: 70, Legendary: 30 });

export const questDefinitions = Object.freeze(
  [
  {
    "id": "mind-read",
    "title": "Read a Field Guide",
    "description": "Spend 20 minutes reading a nature field guide or book on local ecology.",
    "category": "Mind",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "reading",
    "cadence": "daily",
    "targetValue": 20,
    "unit": "minutes",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Complete Read a Field Guide",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "mind-journal",
    "title": "Field Journal Entry",
    "description": "Write an 80-word entry in your field journal detailing a recent nature walk.",
    "category": "Mind",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "journal",
    "cadence": "daily",
    "targetValue": 80,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Complete Field Journal Entry",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "mind-concept",
    "title": "Learn One Species",
    "description": "Learn the identifying features of one new plant or animal species today.",
    "category": "Mind",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "learning",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "concept",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Complete Learn One Species",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "mind-deep-work",
    "title": "Quiet Watch",
    "description": "Find a quiet spot outdoors and observe the environment uninterrupted for 60 minutes.",
    "category": "Mind",
    "rarity": "Rare",
    "verificationType": "AUTO",
    "subjectTag": "focus_minutes",
    "cadence": "daily",
    "targetValue": 60,
    "unit": "minutes",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Complete Quiet Watch",
      "Submit your log when finished."
    ]
  },
  {
    "id": "body-movement",
    "title": "Trail Walk",
    "description": "Take a 30-minute walk on an unpaved nature trail.",
    "category": "Body",
    "rarity": "Common",
    "verificationType": "AUTO",
    "subjectTag": "movement_minutes",
    "cadence": "daily",
    "targetValue": 30,
    "unit": "minutes",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Complete Trail Walk",
      "Submit your log when finished."
    ]
  },
  {
    "id": "body-stretch",
    "title": "Trailhead Warm-Up",
    "description": "Spend 12 minutes warming up and stretching before heading out for a nature hike.",
    "category": "Body",
    "rarity": "Common",
    "verificationType": "AUTO",
    "subjectTag": "stretch_minutes",
    "cadence": "daily",
    "targetValue": 12,
    "unit": "minutes",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Complete Trailhead Warm-Up",
      "Submit your log when finished."
    ]
  },
  {
    "id": "body-workout",
    "title": "Ridge Climb",
    "description": "Complete a rigorous hike or climb that challenges your physical endurance.",
    "category": "Body",
    "rarity": "Rare",
    "verificationType": "AUTO",
    "subjectTag": "workout_session",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Complete Ridge Climb",
      "Submit your log when finished."
    ]
  },
  {
    "id": "body-hydration",
    "title": "Trail Hydration",
    "description": "Drink 2 litres of water throughout your day to stay hydrated for outdoor activities.",
    "category": "Body",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "hydration",
    "cadence": "daily",
    "targetValue": 2,
    "unit": "litres",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Complete Trail Hydration",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "discovery-yellow-flower",
    "title": "Photograph a Yellow Flower",
    "description": "Find and photograph a wild yellow flower.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "yellow_flower",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Complete Photograph a Yellow Flower",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "discovery-landmark",
    "title": "Photograph a Nature Hotspot",
    "description": "Photograph a well-known local nature hotspot or scenic viewpoint.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "nature_hotspot",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Complete Photograph a Nature Hotspot",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "discovery-library",
    "title": "Visit a Nature Reserve",
    "description": "Visit a designated nature reserve and capture a photo of its environment.",
    "category": "Discovery",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "nature_reserve",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Complete Visit a Nature Reserve",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "discovery-banyan",
    "title": "Photograph a Banyan Tree",
    "description": "Locate and photograph a large Banyan tree or a similarly mature native tree.",
    "category": "Discovery",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "banyan_tree",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Complete Photograph a Banyan Tree",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "discovery-orange-cat",
    "title": "Photograph a Wild Fox or Cat",
    "description": "Safely photograph a wild fox, feral cat, or other small mammal from a distance.",
    "category": "Discovery",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "wild_small_mammal",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 150,
    "enabled": true,
    "instructions": [
      "Complete Photograph a Wild Fox or Cat",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "discovery-water",
    "title": "Photograph a Water Body",
    "description": "Find a natural body of water like a lake or river and photograph it.",
    "category": "Discovery",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "water_body",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 250,
    "enabled": true,
    "instructions": [
      "Complete Photograph a Water Body",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "discovery-sunrise",
    "title": "Photograph a Sunrise or Sunset",
    "description": "Capture the vibrant colors of the sky at dawn or dusk.",
    "category": "Discovery",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "sunrise_sunset",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 250,
    "enabled": true,
    "instructions": [
      "Complete Photograph a Sunrise or Sunset",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "discovery-rainbow",
    "title": "Photograph a Rainbow",
    "description": "Spot and photograph a rainbow after a rain shower.",
    "category": "Discovery",
    "rarity": "Legendary",
    "verificationType": "PHOTO",
    "subjectTag": "rainbow",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 90,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Complete Photograph a Rainbow",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "weekly-water",
    "title": "Nature's Guardian",
    "description": "Visit a major water body and document its condition and surrounding ecosystem.",
    "category": "Weekly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "water_body",
    "cadence": "weekly",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 42,
    "xpReward": 300,
    "enabled": true,
    "instructions": [
      "Complete Nature's Guardian",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "weekly-banyan",
    "title": "Ancient Tree Finder",
    "description": "Locate one of the oldest or largest trees in your region and photograph it.",
    "category": "Weekly",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "banyan_tree",
    "cadence": "weekly",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 42,
    "xpReward": 300,
    "enabled": true,
    "instructions": [
      "Complete Ancient Tree Finder",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "weekly-yoga",
    "title": "Threefold Balance",
    "description": "Spend three sessions this week practicing balance and calm observation outdoors.",
    "category": "Weekly",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "yoga_sessions",
    "cadence": "weekly",
    "targetValue": 3,
    "unit": "sessions",
    "cooldownDays": 42,
    "xpReward": 400,
    "enabled": true,
    "instructions": [
      "Complete Threefold Balance",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "weekly-sunrises",
    "title": "Dawn Chronicle",
    "description": "Wake up early and photograph the sunrise on three different days this week.",
    "category": "Weekly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "sunrise_series",
    "cadence": "weekly",
    "targetValue": 3,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Complete Dawn Chronicle",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "weekly-library",
    "title": "Keeper of Knowledge",
    "description": "Visit a natural history museum or nature center and document an exhibit.",
    "category": "Weekly",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "museum_library",
    "cadence": "weekly",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 42,
    "xpReward": 350,
    "enabled": true,
    "instructions": [
      "Complete Keeper of Knowledge",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "weekly-plants",
    "title": "Five Species Walk",
    "description": "Identify and photograph five different plant species on a single long walk.",
    "category": "Weekly",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "plant_species",
    "cadence": "weekly",
    "targetValue": 5,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 400,
    "enabled": true,
    "instructions": [
      "Complete Five Species Walk",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "weekly-architecture",
    "title": "Hidden Architecture",
    "description": "Find and photograph three examples of animal architecture (nests, webs, hives).",
    "category": "Weekly",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "architecture",
    "cadence": "weekly",
    "targetValue": 3,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 350,
    "enabled": true,
    "instructions": [
      "Complete Hidden Architecture",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "monthly-sunrise-atlas",
    "title": "Atlas of Dawn",
    "description": "Compile an atlas of eight different sunrises over the course of the month.",
    "category": "Monthly",
    "rarity": "Legendary",
    "verificationType": "PHOTO",
    "subjectTag": "monthly_sunrises",
    "cadence": "monthly",
    "targetValue": 8,
    "unit": "photos",
    "cooldownDays": 180,
    "xpReward": 2000,
    "enabled": true,
    "instructions": [
      "Complete Atlas of Dawn",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "monthly-wild-places",
    "title": "Twelve Wild Places",
    "description": "Venture out to twelve distinct wild places and photograph their core features.",
    "category": "Monthly",
    "rarity": "Legendary",
    "verificationType": "PHOTO",
    "subjectTag": "monthly_nature_places",
    "cadence": "monthly",
    "targetValue": 12,
    "unit": "photos",
    "cooldownDays": 180,
    "xpReward": 2500,
    "enabled": true,
    "instructions": [
      "Complete Twelve Wild Places",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "monthly-reading-odyssey",
    "title": "The Reading Odyssey",
    "description": "Read six books or extensive articles regarding local ecology, nature, or wilderness survival.",
    "category": "Monthly",
    "rarity": "Epic",
    "verificationType": "TEXT",
    "subjectTag": "monthly_reading",
    "cadence": "monthly",
    "targetValue": 6,
    "unit": "books",
    "cooldownDays": 90,
    "xpReward": 1500,
    "enabled": true,
    "instructions": [
      "Complete The Reading Odyssey",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "monthly-movement",
    "title": "Thirty Days in Motion",
    "description": "Log twelve significant outdoor exploration sessions over the month.",
    "category": "Monthly",
    "rarity": "Epic",
    "verificationType": "TEXT",
    "subjectTag": "monthly_movement",
    "cadence": "monthly",
    "targetValue": 12,
    "unit": "sessions",
    "cooldownDays": 90,
    "xpReward": 1800,
    "enabled": true,
    "instructions": [
      "Complete Thirty Days in Motion",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "monthly-city-stories",
    "title": "Stories of the City",
    "description": "Document ten instances of nature reclaiming urban spaces.",
    "category": "Monthly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "monthly_landmarks",
    "cadence": "monthly",
    "targetValue": 10,
    "unit": "photos",
    "cooldownDays": 120,
    "xpReward": 1700,
    "enabled": true,
    "instructions": [
      "Complete Stories of the City",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "monthly-plant-journal",
    "title": "The Living Field Guide",
    "description": "Photograph and correctly identify fifteen different plants to build a living field guide.",
    "category": "Monthly",
    "rarity": "Legendary",
    "verificationType": "PHOTO",
    "subjectTag": "monthly_plants",
    "cadence": "monthly",
    "targetValue": 15,
    "unit": "photos",
    "cooldownDays": 180,
    "xpReward": 3000,
    "enabled": true,
    "instructions": [
      "Complete The Living Field Guide",
      "Submit the required proof before reset"
    ]
  },
  {
    "id": "daily-mind-catalog-01",
    "title": "Dawn Observation",
    "description": "Spend a few quiet minutes observing the environment around you at dawn and record one change in light, sound, weather, or wildlife.",
    "category": "Mind",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "dawn_observation",
    "cadence": "daily",
    "targetValue": 80,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (80 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-02",
    "title": "Evening Field Notes",
    "description": "At dusk, take notes on the transitioning environment. Note any changes in temperature or animal activity.",
    "category": "Mind",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "evening_notes",
    "cadence": "daily",
    "targetValue": 80,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (80 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-03",
    "title": "Identify a Local Species",
    "description": "Identify a plant or animal in your area that you haven't identified before.",
    "category": "Mind",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "species_identification",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "concept",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (1 concept)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-04",
    "title": "Observe a Bird",
    "description": "Spend five minutes quietly observing a bird. Record its behavior and movements.",
    "category": "Mind",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "bird_observation",
    "cadence": "daily",
    "targetValue": 80,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (80 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-05",
    "title": "Listen for Bird Calls",
    "description": "Close your eyes and listen for distinct bird calls. Note the number of different calls you hear.",
    "category": "Mind",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "bird_calls",
    "cadence": "daily",
    "targetValue": 3,
    "unit": "calls",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (3 calls)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-06",
    "title": "Record a Weather Change",
    "description": "Document a shift in the weather today, such as a drop in temperature or changing clouds.",
    "category": "Mind",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "weather_change",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-07",
    "title": "Study One Leaf",
    "description": "Examine a single leaf closely. Note its venation pattern, margins, and texture.",
    "category": "Mind",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "leaf_study",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-08",
    "title": "Learn a Local Tree",
    "description": "Learn the identifying characteristics of a tree native to your region.",
    "category": "Mind",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "tree_knowledge",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "concept",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (1 concept)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-09",
    "title": "Observe Pollinators",
    "description": "Watch a flowering plant and note the types of pollinators that visit it.",
    "category": "Mind",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "pollinator_watch",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-10",
    "title": "Cloud Watch",
    "description": "Spend time observing the clouds. Identify their type and note the wind direction.",
    "category": "Mind",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "cloud_watch",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-11",
    "title": "Shadow Study",
    "description": "Observe how shadows change over the course of an hour in a natural setting.",
    "category": "Mind",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "shadow_study",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-12",
    "title": "Notice Seasonal Change",
    "description": "Record one specific sign that the season is progressing or changing.",
    "category": "Mind",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "seasonal_change",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-13",
    "title": "Nature Sound Journal",
    "description": "Sit quietly and write down every natural sound you hear for five minutes.",
    "category": "Mind",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "sound_journal",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-14",
    "title": "Habitat Observation",
    "description": "Examine a small micro-habitat (like under a log or a puddle) and record what lives there.",
    "category": "Mind",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "micro_habitat",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-15",
    "title": "Track Animal Behaviour",
    "description": "Observe an animal (insect, bird, mammal) and describe its actions without disturbing it.",
    "category": "Mind",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "animal_behaviour",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-16",
    "title": "Learn a Native Flower",
    "description": "Learn the name and characteristics of a flower native to your area.",
    "category": "Mind",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "flower_knowledge",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "concept",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (1 concept)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-17",
    "title": "Identify a Local Bird",
    "description": "Use a field guide or app to properly identify a bird you see today.",
    "category": "Mind",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "bird_identification",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "concept",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (1 concept)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-18",
    "title": "Learn an Invasive Species",
    "description": "Learn about an invasive plant or animal in your region and how to identify it.",
    "category": "Mind",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "invasive_species",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "concept",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (1 concept)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-19",
    "title": "Field Note of the Day",
    "description": "Write a detailed observation of one interesting natural phenomenon you saw today.",
    "category": "Mind",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "field_note",
    "cadence": "daily",
    "targetValue": 80,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (80 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-20",
    "title": "Five-Minute Sit Spot",
    "description": "Find a spot in nature, sit quietly for five minutes, and record your observations.",
    "category": "Mind",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "sit_spot",
    "cadence": "daily",
    "targetValue": 80,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (80 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-21",
    "title": "Observe Water Movement",
    "description": "Watch how water flows in a stream, puddle, or rain runoff and describe the patterns.",
    "category": "Mind",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "water_movement",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-22",
    "title": "Identify Natural Textures",
    "description": "Find and describe three different natural textures (e.g., rough bark, smooth stone).",
    "category": "Mind",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "natural_textures",
    "cadence": "daily",
    "targetValue": 3,
    "unit": "textures",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (3 textures)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-23",
    "title": "Learn a Local Ecosystem",
    "description": "Research and describe the primary ecosystem type of your region.",
    "category": "Mind",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "ecosystem_knowledge",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "concept",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (1 concept)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-24",
    "title": "Compare Two Leaves",
    "description": "Find two leaves from different plants and write down the key differences in their structure.",
    "category": "Mind",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "leaf_comparison",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-25",
    "title": "Night Sky Observation",
    "description": "Spend time looking at the night sky. Identify a constellation or note the moon phase.",
    "category": "Mind",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "night_sky",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-mind-catalog-26",
    "title": "Soil Examination",
    "description": "Examine the soil in a natural area. Note its moisture, texture, and any visible organic matter.",
    "category": "Mind",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "soil_examination",
    "cadence": "daily",
    "targetValue": 50,
    "unit": "words",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (50 words)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-01",
    "title": "Forest Walk",
    "description": "Take a walk through a wooded area or forest, paying attention to the canopy overhead.",
    "category": "Body",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-02",
    "title": "Park Circuit",
    "description": "Walk a full circuit around a local park or green space.",
    "category": "Body",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-03",
    "title": "Trail Walk",
    "description": "Follow an unpaved trail or dirt path for your daily walk.",
    "category": "Body",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-04",
    "title": "Hill Climb",
    "description": "Find a local hill or incline and walk to the top for a better vantage point.",
    "category": "Body",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-05",
    "title": "Riverside Walk",
    "description": "Walk along the banks of a river, stream, or canal.",
    "category": "Body",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-06",
    "title": "Birding Walk",
    "description": "Take a slow walk specifically focused on spotting and listening for birds.",
    "category": "Body",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-07",
    "title": "Photography Walk",
    "description": "Go for a walk with the intent of finding interesting natural subjects to photograph.",
    "category": "Body",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-08",
    "title": "Sunrise Walk",
    "description": "Start your day with a walk outdoors as the sun comes up.",
    "category": "Body",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-09",
    "title": "Sunset Walk",
    "description": "Take a walk during the golden hour to observe the changing evening light.",
    "category": "Body",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-10",
    "title": "Botanical Garden Walk",
    "description": "Visit and walk through a local botanical garden or planted park.",
    "category": "Body",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-11",
    "title": "Wetland Walk",
    "description": "Explore a wetland, marsh, or coastal path.",
    "category": "Body",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-12",
    "title": "Coastal Walk",
    "description": "Walk along a beach, cliff path, or shoreline.",
    "category": "Body",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-13",
    "title": "Tree Trail",
    "description": "Walk through a neighborhood or park and focus on identifying the different trees.",
    "category": "Body",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-14",
    "title": "Wildlife Watch Walk",
    "description": "Take a quiet, stealthy walk to maximize your chances of spotting local wildlife.",
    "category": "Body",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-15",
    "title": "Explore a New Green Space",
    "description": "Visit a park or natural area you haven't been to before.",
    "category": "Body",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-16",
    "title": "Walk a New Route",
    "description": "Change your usual walking routine and explore a new path.",
    "category": "Body",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-17",
    "title": "Slow Observation Walk",
    "description": "Walk at half your normal pace, focusing entirely on small details you usually miss.",
    "category": "Body",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-18",
    "title": "Night Nature Walk",
    "description": "Take a safe walk after dark to experience the nighttime environment and sounds.",
    "category": "Body",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-19",
    "title": "Dawn Trail",
    "description": "Hit the trail early in the morning before the rest of the world wakes up.",
    "category": "Body",
    "rarity": "Common",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-20",
    "title": "Canopy Walk",
    "description": "Walk through an area with tall trees and focus your attention on the upper canopy.",
    "category": "Body",
    "rarity": "Uncommon",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-body-catalog-21",
    "title": "Meadow Walk",
    "description": "Walk through an open field, meadow, or grassland area.",
    "category": "Body",
    "rarity": "Rare",
    "verificationType": "TEXT",
    "subjectTag": "movement_log",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "session",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Record your observation (1 session)",
      "Be detailed and specific about what you saw or heard."
    ]
  },
  {
    "id": "daily-discovery-catalog-01",
    "title": "Photograph a Native Flower",
    "description": "Photograph a native flowering plant and submit the capture. Avoid picking or disturbing the plant.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "native_flower",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Native Flower",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-02",
    "title": "Photograph an Unidentified Tree",
    "description": "Photograph a tree you cannot identify. Focus on its leaves or bark.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "unidentified_tree",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph an Unidentified Tree",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-03",
    "title": "Photograph a Bird",
    "description": "Photograph a bird from a safe distance. Do not chase or disturb it.",
    "category": "Discovery",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "bird",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Bird",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-04",
    "title": "Photograph a Butterfly",
    "description": "Find and photograph a butterfly resting or feeding on nectar.",
    "category": "Discovery",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "butterfly",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Butterfly",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-05",
    "title": "Photograph a Pollinator",
    "description": "Photograph a bee, beetle, or other pollinator at work on a flower.",
    "category": "Discovery",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "pollinator",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 250,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Pollinator",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-06",
    "title": "Photograph a Mushroom",
    "description": "Find and photograph a wild mushroom or fungi. Do not touch or harvest it.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "mushroom",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Mushroom",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-07",
    "title": "Photograph Lichen",
    "description": "Photograph lichen growing on a tree trunk or rock.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "lichen",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph Lichen",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-08",
    "title": "Photograph a Fern",
    "description": "Find a shaded area and photograph a fern frond.",
    "category": "Discovery",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "fern",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Fern",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-09",
    "title": "Photograph a Waterfall",
    "description": "Visit a local waterfall or cascading stream and photograph the water movement.",
    "category": "Discovery",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "waterfall",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Waterfall",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-10",
    "title": "Photograph a Stream",
    "description": "Capture an image of a flowing stream or creek.",
    "category": "Discovery",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "stream",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 250,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Stream",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-11",
    "title": "Photograph a Pond",
    "description": "Photograph a still pond or small lake, capturing its surface.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "pond",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Pond",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-12",
    "title": "Photograph a Wetland",
    "description": "Photograph a marsh, bog, or wetland habitat.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "wetland",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Wetland",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-13",
    "title": "Photograph a Rock Formation",
    "description": "Find an interesting natural rock formation or outcrop to photograph.",
    "category": "Discovery",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "rock_formation",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Rock Formation",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-14",
    "title": "Photograph Animal Tracks",
    "description": "Look for and photograph animal footprints in mud, sand, or snow.",
    "category": "Discovery",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "animal_tracks",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Photograph Photograph Animal Tracks",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-15",
    "title": "Photograph a Nest",
    "description": "Photograph an empty or inactive bird or insect nest from a safe distance.",
    "category": "Discovery",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "nest",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 250,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Nest",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-16",
    "title": "Photograph a Feather",
    "description": "Find and photograph a discarded bird feather on the ground.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "feather",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Feather",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-17",
    "title": "Photograph an Unusual Leaf",
    "description": "Find a leaf with an interesting shape, color, or insect damage.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "unusual_leaf",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph an Unusual Leaf",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-18",
    "title": "Photograph Tree Bark",
    "description": "Take a close-up photo of interesting or textured tree bark.",
    "category": "Discovery",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "tree_bark",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Photograph Photograph Tree Bark",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-19",
    "title": "Photograph Moss",
    "description": "Photograph moss growing in a damp, shaded area.",
    "category": "Discovery",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "moss",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Photograph Photograph Moss",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-20",
    "title": "Photograph a Sunset",
    "description": "Capture the colors of the sky as the sun goes down.",
    "category": "Discovery",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "sunset",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 250,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Sunset",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-21",
    "title": "Photograph a Sunrise",
    "description": "Wake up early and photograph the sunrise.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "sunrise",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Sunrise",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-22",
    "title": "Photograph a Cloud Formation",
    "description": "Photograph an interesting or dramatic cloud formation.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "cloud_formation",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Cloud Formation",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-23",
    "title": "Photograph a Reflection",
    "description": "Photograph the reflection of nature in a body of still water.",
    "category": "Discovery",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "reflection",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Reflection",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-24",
    "title": "Photograph a Natural Pattern",
    "description": "Find and photograph a repeating pattern in nature, like ripples in sand or veins in a leaf.",
    "category": "Discovery",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "natural_pattern",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Natural Pattern",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-25",
    "title": "Photograph a Habitat",
    "description": "Take a wide shot of a specific habitat, such as a meadow edge or forest understory.",
    "category": "Discovery",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "habitat",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 250,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Habitat",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-26",
    "title": "Photograph a Native Tree",
    "description": "Identify and photograph a tree native to your ecosystem.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "native_tree",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Native Tree",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-27",
    "title": "Photograph a Wild Grass",
    "description": "Photograph tall wild grasses blowing in the wind.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "wild_grass",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Wild Grass",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-28",
    "title": "Photograph a Bird in Flight",
    "description": "Capture a photo of a bird while it is flying overhead.",
    "category": "Discovery",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "bird_in_flight",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 50,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Bird in Flight",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-29",
    "title": "Photograph a Spider Web",
    "description": "Find a spider web, especially beautiful with morning dew, and photograph it.",
    "category": "Discovery",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "spider_web",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 100,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Spider Web",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-30",
    "title": "Photograph a Seed Pod",
    "description": "Photograph a plant's seed pod, pinecone, or dispersed seeds.",
    "category": "Discovery",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "seed_pod",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 250,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Seed Pod",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-31",
    "title": "Photograph Decaying Wood",
    "description": "Photograph a rotting log or stump, noting the life growing on it.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "decaying_wood",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph Decaying Wood",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "daily-discovery-catalog-32",
    "title": "Photograph a Coastline",
    "description": "Photograph the edge where water meets land.",
    "category": "Discovery",
    "rarity": "Common",
    "verificationType": "PHOTO",
    "subjectTag": "coastline",
    "cadence": "daily",
    "targetValue": 1,
    "unit": "photo",
    "cooldownDays": 3,
    "xpReward": 25,
    "enabled": true,
    "instructions": [
      "Photograph Photograph a Coastline",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-01",
    "title": "Seven-Day Nature Journal",
    "description": "Keep a daily log of nature observations for a full week.",
    "category": "Weekly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "nature_journal",
    "cadence": "weekly",
    "targetValue": 7,
    "unit": "entries",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Seven-Day Nature Journal",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-02",
    "title": "Five Species Week",
    "description": "Identify and photograph five different plant or animal species this week.",
    "category": "Weekly",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "five_species",
    "cadence": "weekly",
    "targetValue": 5,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Five Species Week",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-03",
    "title": "Local Flora Survey",
    "description": "Document the varied plant life in your neighborhood over the week.",
    "category": "Weekly",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "flora_survey",
    "cadence": "weekly",
    "targetValue": 5,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Local Flora Survey",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-04",
    "title": "Three Waterways",
    "description": "Visit and photograph three different bodies of water.",
    "category": "Weekly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "waterways",
    "cadence": "weekly",
    "targetValue": 3,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Three Waterways",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-05",
    "title": "Dawn Watch",
    "description": "Wake up early and record field notes at dawn on three different days.",
    "category": "Weekly",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "dawn_watch",
    "cadence": "weekly",
    "targetValue": 3,
    "unit": "entries",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Dawn Watch",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-06",
    "title": "Urban Wildlife Week",
    "description": "Observe and document urban wildlife thriving in your city or town.",
    "category": "Weekly",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "urban_wildlife",
    "cadence": "weekly",
    "targetValue": 5,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Urban Wildlife Week",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-07",
    "title": "Seven Green Spaces",
    "description": "Visit seven different parks or green spaces over the course of the week.",
    "category": "Weekly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "green_spaces",
    "cadence": "weekly",
    "targetValue": 7,
    "unit": "visits",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Seven Green Spaces",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-08",
    "title": "Birding Week",
    "description": "Focus your week on birding and log distinct bird sightings.",
    "category": "Weekly",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "birding_week",
    "cadence": "weekly",
    "targetValue": 5,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Birding Week",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-09",
    "title": "Wildflower Week",
    "description": "Find and document different blooming wildflowers.",
    "category": "Weekly",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "wildflowers",
    "cadence": "weekly",
    "targetValue": 5,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Wildflower Week",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-10",
    "title": "Nature Texture Collection",
    "description": "Collect photographs of diverse natural textures.",
    "category": "Weekly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "textures",
    "cadence": "weekly",
    "targetValue": 5,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Nature Texture Collection",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-11",
    "title": "Local Tree Survey",
    "description": "Identify and photograph different tree species in your area.",
    "category": "Weekly",
    "rarity": "Rare",
    "verificationType": "PHOTO",
    "subjectTag": "tree_survey",
    "cadence": "weekly",
    "targetValue": 5,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Local Tree Survey",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-12",
    "title": "Five Habitat Types",
    "description": "Visit and document five distinct types of habitats.",
    "category": "Weekly",
    "rarity": "Uncommon",
    "verificationType": "PHOTO",
    "subjectTag": "habitats",
    "cadence": "weekly",
    "targetValue": 5,
    "unit": "photos",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Five Habitat Types",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "weekly-weekly-catalog-13",
    "title": "Seven Sunset Field Notes",
    "description": "Write a short field note observing the sunset each day for a week.",
    "category": "Weekly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "sunset_notes",
    "cadence": "weekly",
    "targetValue": 7,
    "unit": "entries",
    "cooldownDays": 42,
    "xpReward": 500,
    "enabled": true,
    "instructions": [
      "Photograph Seven Sunset Field Notes",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "monthly-monthly-catalog-01",
    "title": "The Local Field Guide",
    "description": "Build a comprehensive photographic field guide of your local ecosystem over the month.",
    "category": "Monthly",
    "rarity": "Legendary",
    "verificationType": "PHOTO",
    "subjectTag": "field_guide",
    "cadence": "monthly",
    "targetValue": 12,
    "unit": "photos",
    "cooldownDays": 120,
    "xpReward": 1800,
    "enabled": true,
    "instructions": [
      "Photograph The Local Field Guide",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "monthly-monthly-catalog-02",
    "title": "Twenty Species",
    "description": "Successfully document twenty distinct species in the wild.",
    "category": "Monthly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "twenty_species",
    "cadence": "monthly",
    "targetValue": 20,
    "unit": "photos",
    "cooldownDays": 120,
    "xpReward": 2500,
    "enabled": true,
    "instructions": [
      "Photograph Twenty Species",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "monthly-monthly-catalog-03",
    "title": "Twelve Wild Places",
    "description": "Venture out and document twelve different wild or natural places.",
    "category": "Monthly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "wild_places",
    "cadence": "monthly",
    "targetValue": 12,
    "unit": "photos",
    "cooldownDays": 120,
    "xpReward": 2000,
    "enabled": true,
    "instructions": [
      "Photograph Twelve Wild Places",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "monthly-monthly-catalog-04",
    "title": "Seasonal Change Atlas",
    "description": "Document the subtle progression of the season throughout the entire month.",
    "category": "Monthly",
    "rarity": "Legendary",
    "verificationType": "PHOTO",
    "subjectTag": "seasonal_atlas",
    "cadence": "monthly",
    "targetValue": 15,
    "unit": "photos",
    "cooldownDays": 120,
    "xpReward": 2200,
    "enabled": true,
    "instructions": [
      "Photograph Seasonal Change Atlas",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "monthly-monthly-catalog-05",
    "title": "Urban Wildlife Atlas",
    "description": "Create an extensive catalog of wildlife living alongside humans.",
    "category": "Monthly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "urban_atlas",
    "cadence": "monthly",
    "targetValue": 15,
    "unit": "photos",
    "cooldownDays": 120,
    "xpReward": 2000,
    "enabled": true,
    "instructions": [
      "Photograph Urban Wildlife Atlas",
      "Ensure the subject is clear and in focus."
    ]
  },
  {
    "id": "monthly-monthly-catalog-06",
    "title": "Thirty Nature Observations",
    "description": "Commit to one meaningful nature observation every day for a month.",
    "category": "Monthly",
    "rarity": "Epic",
    "verificationType": "PHOTO",
    "subjectTag": "monthly_observations",
    "cadence": "monthly",
    "targetValue": 30,
    "unit": "entries",
    "cooldownDays": 120,
    "xpReward": 3000,
    "enabled": true,
    "instructions": [
      "Photograph Thirty Nature Observations",
      "Ensure the subject is clear and in focus."
    ]
  }
]
);
