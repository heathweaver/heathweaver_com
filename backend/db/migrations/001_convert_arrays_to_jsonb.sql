-- Migration to convert TEXT[] arrays to JSONB
-- Add new JSONB columns
ALTER TABLE professional_experience 
ADD COLUMN responsibilities_jsonb JSONB,
ADD COLUMN achievements_jsonb JSONB,
ADD COLUMN narrative_jsonb JSONB;

-- Convert existing array data to JSONB
UPDATE professional_experience 
SET 
    responsibilities_jsonb = COALESCE(array_to_json(responsibilities)::jsonb, '[]'::jsonb),
    achievements_jsonb = COALESCE(array_to_json(achievements)::jsonb, '[]'::jsonb),
    narrative_jsonb = COALESCE(array_to_json(narrative)::jsonb, '[]'::jsonb);

-- Verify data before dropping old columns (you can check the data between these steps)
-- To revert until here, just drop the new jsonb columns

-- After verification, run:
-- ALTER TABLE professional_experience 
-- DROP COLUMN responsibilities,
-- DROP COLUMN achievements,
-- DROP COLUMN narrative;

-- Then rename new columns:
-- ALTER TABLE professional_experience 
-- RENAME COLUMN responsibilities_jsonb TO responsibilities;
-- ALTER TABLE professional_experience 
-- RENAME COLUMN achievements_jsonb TO achievements;
-- ALTER TABLE professional_experience 
-- RENAME COLUMN narrative_jsonb TO narrative; 