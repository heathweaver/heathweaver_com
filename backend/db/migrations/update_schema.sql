-- Migration script to update schema to use JSONB
-- Add new JSONB columns
ALTER TABLE professional_experience 
    ADD COLUMN responsibilities_jsonb JSONB,
    ADD COLUMN achievements_jsonb JSONB,
    ADD COLUMN narrative_jsonb JSONB;

-- Copy data from TEXT[] to JSONB columns
UPDATE professional_experience 
SET 
    responsibilities_jsonb = to_jsonb(responsibilities),
    achievements_jsonb = to_jsonb(achievements),
    narrative_jsonb = to_jsonb(narrative);

-- Verify the data (run this separately and check results before proceeding)
-- SELECT id, responsibilities, responsibilities_jsonb FROM professional_experience LIMIT 1;
-- SELECT id, achievements, achievements_jsonb FROM professional_experience LIMIT 1;
-- SELECT id, narrative, narrative_jsonb FROM professional_experience LIMIT 1;

-- Once verified, drop old columns and rename new ones
-- ALTER TABLE professional_experience 
--     DROP COLUMN responsibilities,
--     DROP COLUMN achievements,
--     DROP COLUMN narrative;

-- ALTER TABLE professional_experience 
--     RENAME COLUMN responsibilities_jsonb TO responsibilities,
--     RENAME COLUMN achievements_jsonb TO achievements,
--     RENAME COLUMN narrative_jsonb TO narrative; 