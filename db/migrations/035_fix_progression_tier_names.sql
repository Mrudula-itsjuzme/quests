-- 035_fix_progression_tier_names.sql

UPDATE quest_level_rewards
SET reward_key = 'adamantium_chest', label = 'Adamantium Chest'
WHERE level = 18 AND reward_key = 'mythril_chest';

UPDATE quest_level_rewards
SET reward_key = 'adamantium_explorer', label = 'Adamantium Explorer'
WHERE level = 80 AND reward_key = 'mythril_explorer';

UPDATE quest_level_rewards
SET reward_key = 'adamantium_master', label = 'The Adamantium Master'
WHERE level = 120 AND reward_key = 'ascendant';
