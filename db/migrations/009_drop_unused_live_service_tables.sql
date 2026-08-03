-- Removes the "live service" schema introduced in 008. That code path
-- (services/, repositories/, routes/, lib/live-services.js) was never
-- wired to the frontend and duplicated QuestEngine with a disconnected
-- schema. Dropping the unused tables to stop the drift.
DROP TABLE IF EXISTS community_events;
DROP TABLE IF EXISTS rewards;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS live_quest_assignments;
DROP TABLE IF EXISTS eligibility_rules;
DROP TABLE IF EXISTS campaign_quests;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS quest_templates;
