INSERT INTO quest_definitions
  (id,title,description,category,rarity,cadence,verification_type,subject_tag,target_value,unit,cooldown_days,xp_reward,instructions)
VALUES
  ('mind-read','Read Daily','Read for 20 focused minutes and submit one useful idea.','Mind','Common','daily','TEXT','reading',20,'minutes',3,25,'["Read without switching apps","Submit one useful idea"]'),
  ('mind-journal','Journal Reflection','Write a short reflection about your current path.','Mind','Common','daily','TEXT','journal',80,'words',3,25,'["Write at least 80 words","Submit the reflection"]'),
  ('mind-concept','Learn One Concept','Learn a concept and explain it in your own words.','Mind','Uncommon','daily','TEXT','learning',1,'concept',3,50,'["Study one concept","Summarize it clearly"]'),
  ('mind-deep-work','Deep Work','Complete a focused 60-minute work block.','Mind','Rare','daily','AUTO','focus_minutes',60,'minutes',3,100,'["Work without distractions","Sync focus progress"]'),
  ('body-movement','Movement Quest','Move intentionally for 30 minutes.','Body','Common','daily','AUTO','movement_minutes',30,'minutes',3,25,'["Choose any movement","Sync progress"]'),
  ('body-stretch','Stretch Session','Complete a 12-minute mobility session.','Body','Common','daily','AUTO','stretch_minutes',12,'minutes',3,25,'["Move slowly","Sync progress"]'),
  ('body-workout','Workout Routine','Finish a structured workout routine.','Body','Rare','daily','AUTO','workout_session',1,'session',3,100,'["Complete every set","Sync progress"]'),
  ('body-hydration','Hydration Quest','Drink two litres of water.','Body','Uncommon','daily','TEXT','hydration',2,'litres',3,50,'["Track each refill","Submit your total"]'),
  ('discovery-yellow-flower','Photograph a Yellow Flower','Find and photograph a yellow flower.','Discovery','Common','daily','PHOTO','yellow_flower',1,'photo',3,25,'["Take a clear photo","Submit image proof"]'),
  ('discovery-landmark','Photograph a Local Landmark','Capture a landmark near you.','Discovery','Common','daily','PHOTO','local_landmark',1,'photo',3,25,'["Take a clear photo","Submit image proof"]'),
  ('discovery-library','Find a Library','Visit and photograph a library.','Discovery','Uncommon','daily','PHOTO','library',1,'photo',3,50,'["Photograph the exterior or sign","Submit image proof"]'),
  ('discovery-banyan','Photograph a Banyan Tree','Find and photograph a large or banyan tree.','Discovery','Uncommon','daily','PHOTO','banyan_tree',1,'photo',3,50,'["Frame the trunk and canopy","Submit image proof"]'),
  ('discovery-orange-cat','Photograph an Orange Cat','Capture a respectful photo of an orange cat.','Discovery','Rare','daily','PHOTO','orange_cat',1,'photo',3,150,'["Keep a respectful distance","Submit image proof"]'),
  ('discovery-water','Photograph a Water Body','Photograph a river, lake, pond, stream, or sea.','Discovery','Epic','daily','PHOTO','water_body',1,'photo',3,250,'["Take a clear photo","Submit image proof"]'),
  ('discovery-sunrise','Photograph a Sunrise or Sunset','Capture sunrise or sunset.','Discovery','Epic','daily','PHOTO','sunrise_sunset',1,'photo',3,250,'["Include the sky clearly","Submit image proof"]'),
  ('discovery-rainbow','Photograph a Rainbow','Capture a rainbow when the world offers one.','Discovery','Legendary','daily','PHOTO','rainbow',1,'photo',90,500,'["Capture the full arc if possible","Submit image proof"]'),
  ('weekly-water','Nature''s Guardian','Photograph a natural water body.','Weekly','Epic','weekly','PHOTO','water_body',1,'photo',42,300,'["Visit a natural water body","Submit image proof"]'),
  ('weekly-banyan','Ancient Tree Finder','Find and photograph a banyan tree.','Weekly','Rare','weekly','PHOTO','banyan_tree',1,'photo',42,300,'["Find a banyan tree","Submit image proof"]'),
  ('weekly-yoga','Threefold Balance','Complete three yoga sessions and upload final proof.','Weekly','Rare','weekly','PHOTO','yoga_sessions',3,'sessions',42,400,'["Complete three sessions","Submit final proof"]'),
  ('weekly-sunrises','Dawn Chronicle','Capture three distinct sunrises.','Weekly','Epic','weekly','PHOTO','sunrise_series',3,'photos',42,500,'["Capture three days","Submit proof"]'),
  ('weekly-library','Keeper of Knowledge','Visit and photograph a museum or library.','Weekly','Uncommon','weekly','PHOTO','museum_library',1,'photo',42,350,'["Visit a museum or library","Submit image proof"]'),
  ('weekly-plants','Five Species Walk','Photograph five different plant species in one walk.','Weekly','Rare','weekly','PHOTO','plant_species',5,'photos',42,400,'["Capture five distinct plants","Submit image proof"]'),
  ('weekly-architecture','Hidden Architecture','Photograph three distinctive architectural details.','Weekly','Uncommon','weekly','PHOTO','architecture',3,'photos',42,350,'["Capture three details","Submit image proof"]')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
  rarity = EXCLUDED.rarity, cadence = EXCLUDED.cadence, verification_type = EXCLUDED.verification_type,
  subject_tag = EXCLUDED.subject_tag, target_value = EXCLUDED.target_value, unit = EXCLUDED.unit,
  cooldown_days = EXCLUDED.cooldown_days, xp_reward = EXCLUDED.xp_reward, instructions = EXCLUDED.instructions,
  updated_at = NOW();
