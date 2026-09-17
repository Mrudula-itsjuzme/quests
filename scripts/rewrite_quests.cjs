const fs = require('fs');

const rarityXp = { Common: 25, Uncommon: 50, Rare: 100, Epic: 250, Legendary: 500 };

function definition(id, title, category, rarity, verificationType, subjectTag, cadence, targetValue, unit, cooldownDays, xpOverride = null, description = null, instructions = null) {
  return {
    id,
    title,
    description: description || title,
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
    instructions: instructions || [`Complete ${title}`, 'Submit the required proof before reset'],
  };
}

const mindTemplates = [
  { t: "Dawn Observation", d: "Spend a few quiet minutes observing the environment around you at dawn and record one change in light, sound, weather, or wildlife.", s: "dawn_observation", target: 80, u: "words" },
  { t: "Evening Field Notes", d: "At dusk, take notes on the transitioning environment. Note any changes in temperature or animal activity.", s: "evening_notes", target: 80, u: "words" },
  { t: "Identify a Local Species", d: "Identify a plant or animal in your area that you haven't identified before.", s: "species_identification", target: 1, u: "concept" },
  { t: "Observe a Bird", d: "Spend five minutes quietly observing a bird. Record its behavior and movements.", s: "bird_observation", target: 80, u: "words" },
  { t: "Listen for Bird Calls", d: "Close your eyes and listen for distinct bird calls. Note the number of different calls you hear.", s: "bird_calls", target: 3, u: "calls" },
  { t: "Record a Weather Change", d: "Document a shift in the weather today, such as a drop in temperature or changing clouds.", s: "weather_change", target: 50, u: "words" },
  { t: "Study One Leaf", d: "Examine a single leaf closely. Note its venation pattern, margins, and texture.", s: "leaf_study", target: 50, u: "words" },
  { t: "Learn a Local Tree", d: "Learn the identifying characteristics of a tree native to your region.", s: "tree_knowledge", target: 1, u: "concept" },
  { t: "Observe Pollinators", d: "Watch a flowering plant and note the types of pollinators that visit it.", s: "pollinator_watch", target: 50, u: "words" },
  { t: "Cloud Watch", d: "Spend time observing the clouds. Identify their type and note the wind direction.", s: "cloud_watch", target: 50, u: "words" },
  { t: "Shadow Study", d: "Observe how shadows change over the course of an hour in a natural setting.", s: "shadow_study", target: 50, u: "words" },
  { t: "Notice Seasonal Change", d: "Record one specific sign that the season is progressing or changing.", s: "seasonal_change", target: 50, u: "words" },
  { t: "Nature Sound Journal", d: "Sit quietly and write down every natural sound you hear for five minutes.", s: "sound_journal", target: 50, u: "words" },
  { t: "Habitat Observation", d: "Examine a small micro-habitat (like under a log or a puddle) and record what lives there.", s: "micro_habitat", target: 50, u: "words" },
  { t: "Track Animal Behaviour", d: "Observe an animal (insect, bird, mammal) and describe its actions without disturbing it.", s: "animal_behaviour", target: 50, u: "words" },
  { t: "Learn a Native Flower", d: "Learn the name and characteristics of a flower native to your area.", s: "flower_knowledge", target: 1, u: "concept" },
  { t: "Identify a Local Bird", d: "Use a field guide or app to properly identify a bird you see today.", s: "bird_identification", target: 1, u: "concept" },
  { t: "Learn an Invasive Species", d: "Learn about an invasive plant or animal in your region and how to identify it.", s: "invasive_species", target: 1, u: "concept" },
  { t: "Field Note of the Day", d: "Write a detailed observation of one interesting natural phenomenon you saw today.", s: "field_note", target: 80, u: "words" },
  { t: "Five-Minute Sit Spot", d: "Find a spot in nature, sit quietly for five minutes, and record your observations.", s: "sit_spot", target: 80, u: "words" },
  { t: "Observe Water Movement", d: "Watch how water flows in a stream, puddle, or rain runoff and describe the patterns.", s: "water_movement", target: 50, u: "words" },
  { t: "Identify Natural Textures", d: "Find and describe three different natural textures (e.g., rough bark, smooth stone).", s: "natural_textures", target: 3, u: "textures" },
  { t: "Learn a Local Ecosystem", d: "Research and describe the primary ecosystem type of your region.", s: "ecosystem_knowledge", target: 1, u: "concept" },
  { t: "Compare Two Leaves", d: "Find two leaves from different plants and write down the key differences in their structure.", s: "leaf_comparison", target: 50, u: "words" },
  { t: "Night Sky Observation", d: "Spend time looking at the night sky. Identify a constellation or note the moon phase.", s: "night_sky", target: 50, u: "words" },
  { t: "Soil Examination", d: "Examine the soil in a natural area. Note its moisture, texture, and any visible organic matter.", s: "soil_examination", target: 50, u: "words" }
];

const bodyTemplates = [
  { t: "Forest Walk", d: "Take a walk through a wooded area or forest, paying attention to the canopy overhead.", s: "movement_log" },
  { t: "Park Circuit", d: "Walk a full circuit around a local park or green space.", s: "movement_log" },
  { t: "Trail Walk", d: "Follow an unpaved trail or dirt path for your daily walk.", s: "movement_log" },
  { t: "Hill Climb", d: "Find a local hill or incline and walk to the top for a better vantage point.", s: "movement_log" },
  { t: "Riverside Walk", d: "Walk along the banks of a river, stream, or canal.", s: "movement_log" },
  { t: "Birding Walk", d: "Take a slow walk specifically focused on spotting and listening for birds.", s: "movement_log" },
  { t: "Photography Walk", d: "Go for a walk with the intent of finding interesting natural subjects to photograph.", s: "movement_log" },
  { t: "Sunrise Walk", d: "Start your day with a walk outdoors as the sun comes up.", s: "movement_log" },
  { t: "Sunset Walk", d: "Take a walk during the golden hour to observe the changing evening light.", s: "movement_log" },
  { t: "Botanical Garden Walk", d: "Visit and walk through a local botanical garden or planted park.", s: "movement_log" },
  { t: "Wetland Walk", d: "Explore a wetland, marsh, or coastal path.", s: "movement_log" },
  { t: "Coastal Walk", d: "Walk along a beach, cliff path, or shoreline.", s: "movement_log" },
  { t: "Tree Trail", d: "Walk through a neighborhood or park and focus on identifying the different trees.", s: "movement_log" },
  { t: "Wildlife Watch Walk", d: "Take a quiet, stealthy walk to maximize your chances of spotting local wildlife.", s: "movement_log" },
  { t: "Explore a New Green Space", d: "Visit a park or natural area you haven't been to before.", s: "movement_log" },
  { t: "Walk a New Route", d: "Change your usual walking routine and explore a new path.", s: "movement_log" },
  { t: "Slow Observation Walk", d: "Walk at half your normal pace, focusing entirely on small details you usually miss.", s: "movement_log" },
  { t: "Night Nature Walk", d: "Take a safe walk after dark to experience the nighttime environment and sounds.", s: "movement_log" },
  { t: "Dawn Trail", d: "Hit the trail early in the morning before the rest of the world wakes up.", s: "movement_log" },
  { t: "Canopy Walk", d: "Walk through an area with tall trees and focus your attention on the upper canopy.", s: "movement_log" },
  { t: "Meadow Walk", d: "Walk through an open field, meadow, or grassland area.", s: "movement_log" }
];

const discoveryTemplates = [
  { t: "Photograph a Native Flower", d: "Photograph a native flowering plant and submit the capture. Avoid picking or disturbing the plant.", s: "native_flower" },
  { t: "Photograph an Unidentified Tree", d: "Photograph a tree you cannot identify. Focus on its leaves or bark.", s: "unidentified_tree" },
  { t: "Photograph a Bird", d: "Photograph a bird from a safe distance. Do not chase or disturb it.", s: "bird" },
  { t: "Photograph a Butterfly", d: "Find and photograph a butterfly resting or feeding on nectar.", s: "butterfly" },
  { t: "Photograph a Pollinator", d: "Photograph a bee, beetle, or other pollinator at work on a flower.", s: "pollinator" },
  { t: "Photograph a Mushroom", d: "Find and photograph a wild mushroom or fungi. Do not touch or harvest it.", s: "mushroom" },
  { t: "Photograph Lichen", d: "Photograph lichen growing on a tree trunk or rock.", s: "lichen" },
  { t: "Photograph a Fern", d: "Find a shaded area and photograph a fern frond.", s: "fern" },
  { t: "Photograph a Waterfall", d: "Visit a local waterfall or cascading stream and photograph the water movement.", s: "waterfall" },
  { t: "Photograph a Stream", d: "Capture an image of a flowing stream or creek.", s: "stream" },
  { t: "Photograph a Pond", d: "Photograph a still pond or small lake, capturing its surface.", s: "pond" },
  { t: "Photograph a Wetland", d: "Photograph a marsh, bog, or wetland habitat.", s: "wetland" },
  { t: "Photograph a Rock Formation", d: "Find an interesting natural rock formation or outcrop to photograph.", s: "rock_formation" },
  { t: "Photograph Animal Tracks", d: "Look for and photograph animal footprints in mud, sand, or snow.", s: "animal_tracks" },
  { t: "Photograph a Nest", d: "Photograph an empty or inactive bird or insect nest from a safe distance.", s: "nest" },
  { t: "Photograph a Feather", d: "Find and photograph a discarded bird feather on the ground.", s: "feather" },
  { t: "Photograph an Unusual Leaf", d: "Find a leaf with an interesting shape, color, or insect damage.", s: "unusual_leaf" },
  { t: "Photograph Tree Bark", d: "Take a close-up photo of interesting or textured tree bark.", s: "tree_bark" },
  { t: "Photograph Moss", d: "Photograph moss growing in a damp, shaded area.", s: "moss" },
  { t: "Photograph a Sunset", d: "Capture the colors of the sky as the sun goes down.", s: "sunset" },
  { t: "Photograph a Sunrise", d: "Wake up early and photograph the sunrise.", s: "sunrise" },
  { t: "Photograph a Cloud Formation", d: "Photograph an interesting or dramatic cloud formation.", s: "cloud_formation" },
  { t: "Photograph a Reflection", d: "Photograph the reflection of nature in a body of still water.", s: "reflection" },
  { t: "Photograph a Natural Pattern", d: "Find and photograph a repeating pattern in nature, like ripples in sand or veins in a leaf.", s: "natural_pattern" },
  { t: "Photograph a Habitat", d: "Take a wide shot of a specific habitat, such as a meadow edge or forest understory.", s: "habitat" },
  { t: "Photograph a Native Tree", d: "Identify and photograph a tree native to your ecosystem.", s: "native_tree" },
  { t: "Photograph a Wild Grass", d: "Photograph tall wild grasses blowing in the wind.", s: "wild_grass" },
  { t: "Photograph a Bird in Flight", d: "Capture a photo of a bird while it is flying overhead.", s: "bird_in_flight" },
  { t: "Photograph a Spider Web", d: "Find a spider web, especially beautiful with morning dew, and photograph it.", s: "spider_web" },
  { t: "Photograph a Seed Pod", d: "Photograph a plant's seed pod, pinecone, or dispersed seeds.", s: "seed_pod" },
  { t: "Photograph Decaying Wood", d: "Photograph a rotting log or stump, noting the life growing on it.", s: "decaying_wood" },
  { t: "Photograph a Coastline", d: "Photograph the edge where water meets land.", s: "coastline" }
];

const weeklyTemplates = [
  { t: "Seven-Day Nature Journal", d: "Keep a daily log of nature observations for a full week.", s: "nature_journal", target: 7, u: "entries", xp: 500 },
  { t: "Five Species Week", d: "Identify and photograph five different plant or animal species this week.", s: "five_species", target: 5, u: "photos", xp: 500 },
  { t: "Local Flora Survey", d: "Document the varied plant life in your neighborhood over the week.", s: "flora_survey", target: 5, u: "photos", xp: 500 },
  { t: "Three Waterways", d: "Visit and photograph three different bodies of water.", s: "waterways", target: 3, u: "photos", xp: 500 },
  { t: "Dawn Watch", d: "Wake up early and record field notes at dawn on three different days.", s: "dawn_watch", target: 3, u: "entries", xp: 500 },
  { t: "Urban Wildlife Week", d: "Observe and document urban wildlife thriving in your city or town.", s: "urban_wildlife", target: 5, u: "photos", xp: 500 },
  { t: "Seven Green Spaces", d: "Visit seven different parks or green spaces over the course of the week.", s: "green_spaces", target: 7, u: "visits", xp: 500 },
  { t: "Birding Week", d: "Focus your week on birding and log distinct bird sightings.", s: "birding_week", target: 5, u: "photos", xp: 500 },
  { t: "Wildflower Week", d: "Find and document different blooming wildflowers.", s: "wildflowers", target: 5, u: "photos", xp: 500 },
  { t: "Nature Texture Collection", d: "Collect photographs of diverse natural textures.", s: "textures", target: 5, u: "photos", xp: 500 },
  { t: "Local Tree Survey", d: "Identify and photograph different tree species in your area.", s: "tree_survey", target: 5, u: "photos", xp: 500 },
  { t: "Five Habitat Types", d: "Visit and document five distinct types of habitats.", s: "habitats", target: 5, u: "photos", xp: 500 },
  { t: "Seven Sunset Field Notes", d: "Write a short field note observing the sunset each day for a week.", s: "sunset_notes", target: 7, u: "entries", xp: 500 }
];

const monthlyTemplates = [
  { t: "The Local Field Guide", d: "Build a comprehensive photographic field guide of your local ecosystem over the month.", s: "field_guide", target: 12, u: "photos", xp: 1800 },
  { t: "Twenty Species", d: "Successfully document twenty distinct species in the wild.", s: "twenty_species", target: 20, u: "photos", xp: 2500 },
  { t: "Twelve Wild Places", d: "Venture out and document twelve different wild or natural places.", s: "wild_places", target: 12, u: "photos", xp: 2000 },
  { t: "Seasonal Change Atlas", d: "Document the subtle progression of the season throughout the entire month.", s: "seasonal_atlas", target: 15, u: "photos", xp: 2200 },
  { t: "Urban Wildlife Atlas", d: "Create an extensive catalog of wildlife living alongside humans.", s: "urban_atlas", target: 15, u: "photos", xp: 2000 },
  { t: "Thirty Nature Observations", d: "Commit to one meaningful nature observation every day for a month.", s: "monthly_observations", target: 30, u: "entries", xp: 3000 }
];

function generateDetailedCatalog(templates, category, cadence, verificationType, cooldownDays) {
  return templates.map((tmpl, index) => {
    const rarity = cadence === 'monthly' ? (index % 3 === 0 ? 'Legendary' : 'Epic') : cadence === 'weekly' ? (index % 3 === 0 ? 'Epic' : index % 2 === 0 ? 'Rare' : 'Uncommon') : category === 'Discovery' ? ['Common', 'Common', 'Uncommon', 'Rare', 'Epic'][index % 5] : ['Common', 'Uncommon', 'Rare'][index % 3];
    
    // Fallbacks for targets if not specified in template
    let target = tmpl.target || 1;
    let unit = tmpl.u || (verificationType === 'PHOTO' ? 'photo' : 'session');
    
    let instructions = [];
    if (verificationType === 'PHOTO') {
      instructions = ['Photograph ' + tmpl.t, 'Ensure the subject is clear and in focus.'];
    } else if (verificationType === 'TEXT') {
      instructions = ['Record your observation (' + target + ' ' + unit + ')', 'Be detailed and specific about what you saw or heard.'];
    } else {
      instructions = ['Complete ' + tmpl.t, 'Submit your log when finished.'];
    }

    return definition(
      cadence + '-' + category.toLowerCase() + '-catalog-' + String(index + 1).padStart(2, '0'),
      tmpl.t,
      category,
      rarity,
      verificationType,
      tmpl.s,
      cadence,
      target,
      unit,
      cooldownDays,
      tmpl.xp || null,
      tmpl.d,
      instructions
    );
  });
}

const baseQuests = [
  definition('mind-read', 'Read a Field Guide', 'Mind', 'Common', 'TEXT', 'reading', 'daily', 20, 'minutes', 3, null, 'Spend 20 minutes reading a nature field guide or book on local ecology.'),
  definition('mind-journal', 'Field Journal Entry', 'Mind', 'Common', 'TEXT', 'journal', 'daily', 80, 'words', 3, null, 'Write an 80-word entry in your field journal detailing a recent nature walk.'),
  definition('mind-concept', 'Learn One Species', 'Mind', 'Uncommon', 'TEXT', 'learning', 'daily', 1, 'concept', 3, null, 'Learn the identifying features of one new plant or animal species today.'),
  definition('mind-deep-work', 'Quiet Watch', 'Mind', 'Rare', 'TEXT', 'focus_minutes', 'daily', 60, 'minutes', 3, null, 'Find a quiet spot outdoors and observe the environment uninterrupted for 60 minutes.'),
  definition('body-movement', 'Trail Walk', 'Body', 'Common', 'TEXT', 'movement_minutes', 'daily', 30, 'minutes', 3, null, 'Take a 30-minute walk on an unpaved nature trail.'),
  definition('body-stretch', 'Trailhead Warm-Up', 'Body', 'Common', 'TEXT', 'stretch_minutes', 'daily', 12, 'minutes', 3, null, 'Spend 12 minutes warming up and stretching before heading out for a nature hike.'),
  definition('body-workout', 'Ridge Climb', 'Body', 'Rare', 'TEXT', 'workout_session', 'daily', 1, 'session', 3, null, 'Complete a rigorous hike or climb that challenges your physical endurance.'),
  definition('body-hydration', 'Trail Hydration', 'Body', 'Uncommon', 'TEXT', 'hydration', 'daily', 2, 'litres', 3, null, 'Drink 2 litres of water throughout your day to stay hydrated for outdoor activities.'),
  definition('discovery-yellow-flower', 'Photograph a Yellow Flower', 'Discovery', 'Common', 'PHOTO', 'yellow_flower', 'daily', 1, 'photo', 3, null, 'Find and photograph a wild yellow flower.'),
  definition('discovery-landmark', 'Photograph a Nature Hotspot', 'Discovery', 'Common', 'PHOTO', 'nature_hotspot', 'daily', 1, 'photo', 3, null, 'Photograph a well-known local nature hotspot or scenic viewpoint.'),
  definition('discovery-library', 'Visit a Nature Reserve', 'Discovery', 'Uncommon', 'PHOTO', 'nature_reserve', 'daily', 1, 'photo', 3, null, 'Visit a designated nature reserve and capture a photo of its environment.'),
  definition('discovery-banyan', 'Photograph a Banyan Tree', 'Discovery', 'Uncommon', 'PHOTO', 'banyan_tree', 'daily', 1, 'photo', 3, null, 'Locate and photograph a large Banyan tree or a similarly mature native tree.'),
  definition('discovery-orange-cat', 'Photograph a Wild Fox or Cat', 'Discovery', 'Rare', 'PHOTO', 'wild_small_mammal', 'daily', 1, 'photo', 3, 150, 'Safely photograph a wild fox, feral cat, or other small mammal from a distance.'),
  definition('discovery-water', 'Photograph a Water Body', 'Discovery', 'Epic', 'PHOTO', 'water_body', 'daily', 1, 'photo', 3, null, 'Find a natural body of water like a lake or river and photograph it.'),
  definition('discovery-sunrise', 'Photograph a Sunrise or Sunset', 'Discovery', 'Epic', 'PHOTO', 'sunrise_sunset', 'daily', 1, 'photo', 3, null, 'Capture the vibrant colors of the sky at dawn or dusk.'),
  definition('discovery-rainbow', 'Photograph a Rainbow', 'Discovery', 'Legendary', 'PHOTO', 'rainbow', 'daily', 1, 'photo', 90, null, 'Spot and photograph a rainbow after a rain shower.'),
  definition('weekly-water', "Nature's Guardian", 'Weekly', 'Epic', 'PHOTO', 'water_body', 'weekly', 1, 'photo', 42, 300, 'Visit a major water body and document its condition and surrounding ecosystem.'),
  definition('weekly-banyan', 'Ancient Tree Finder', 'Weekly', 'Rare', 'PHOTO', 'banyan_tree', 'weekly', 1, 'photo', 42, 300, 'Locate one of the oldest or largest trees in your region and photograph it.'),
  definition('weekly-yoga', 'Threefold Balance', 'Weekly', 'Rare', 'TEXT', 'yoga_sessions', 'weekly', 3, 'sessions', 42, 400, 'Spend three sessions this week practicing balance and calm observation outdoors.'),
  definition('weekly-sunrises', 'Dawn Chronicle', 'Weekly', 'Epic', 'PHOTO', 'sunrise_series', 'weekly', 3, 'photos', 42, 500, 'Wake up early and photograph the sunrise on three different days this week.'),
  definition('weekly-library', 'Keeper of Knowledge', 'Weekly', 'Uncommon', 'PHOTO', 'museum_library', 'weekly', 1, 'photo', 42, 350, 'Visit a natural history museum or nature center and document an exhibit.'),
  definition('weekly-plants', 'Five Species Walk', 'Weekly', 'Rare', 'PHOTO', 'plant_species', 'weekly', 5, 'photos', 42, 400, 'Identify and photograph five different plant species on a single long walk.'),
  definition('weekly-architecture', 'Hidden Architecture', 'Weekly', 'Uncommon', 'PHOTO', 'architecture', 'weekly', 3, 'photos', 42, 350, 'Find and photograph three examples of animal architecture (nests, webs, hives).'),
  definition('monthly-sunrise-atlas', 'Atlas of Dawn', 'Monthly', 'Legendary', 'PHOTO', 'monthly_sunrises', 'monthly', 8, 'photos', 180, 2000, 'Compile an atlas of eight different sunrises over the course of the month.'),
  definition('monthly-wild-places', 'Twelve Wild Places', 'Monthly', 'Legendary', 'PHOTO', 'monthly_nature_places', 'monthly', 12, 'photos', 180, 2500, 'Venture out to twelve distinct wild places and photograph their core features.'),
  definition('monthly-reading-odyssey', 'The Reading Odyssey', 'Monthly', 'Epic', 'TEXT', 'monthly_reading', 'monthly', 6, 'books', 90, 1500, 'Read six books or extensive articles regarding local ecology, nature, or wilderness survival.'),
  definition('monthly-movement', 'Thirty Days in Motion', 'Monthly', 'Epic', 'TEXT', 'monthly_movement', 'monthly', 12, 'sessions', 90, 1800, 'Log twelve significant outdoor exploration sessions over the month.'),
  definition('monthly-city-stories', 'Stories of the City', 'Monthly', 'Epic', 'PHOTO', 'monthly_landmarks', 'monthly', 10, 'photos', 120, 1700, 'Document ten instances of nature reclaiming urban spaces.'),
  definition('monthly-plant-journal', 'The Living Field Guide', 'Monthly', 'Legendary', 'PHOTO', 'monthly_plants', 'monthly', 15, 'photos', 180, 3000, 'Photograph and correctly identify fifteen different plants to build a living field guide.')
];

const allQuests = [
  ...baseQuests,
  ...generateDetailedCatalog(mindTemplates, 'Mind', 'daily', 'TEXT', 3),
  ...generateDetailedCatalog(bodyTemplates, 'Body', 'daily', 'TEXT', 3), // Switched to TEXT per blueprint rule (no fake AUTO sensors)
  ...generateDetailedCatalog(discoveryTemplates, 'Discovery', 'daily', 'PHOTO', 3),
  ...generateDetailedCatalog(weeklyTemplates, 'Weekly', 'weekly', 'PHOTO', 42), // some are TEXT or PHOTO, templates say
  ...generateDetailedCatalog(monthlyTemplates, 'Monthly', 'monthly', 'PHOTO', 120) // some are TEXT, templates say
];

const fileContent = "export const rarityXp = Object.freeze({ Common: 25, Uncommon: 50, Rare: 100, Epic: 250, Legendary: 500 });\n" +
"export const discoveryWeights = Object.freeze({ Common: 50, Uncommon: 30, Rare: 15, Epic: 4, Legendary: 1 });\n" +
"export const weeklyWeights = Object.freeze({ Uncommon: 30, Rare: 50, Epic: 20 });\n" +
"export const monthlyWeights = Object.freeze({ Epic: 70, Legendary: 30 });\n\n" +
"export const questDefinitions = Object.freeze(\n  " +
JSON.stringify(allQuests, null, 2) + "\n);\n";

fs.writeFileSync('api/lib/quest-definitions.js', fileContent);
console.log('Successfully rewrote api/lib/quest-definitions.js');
