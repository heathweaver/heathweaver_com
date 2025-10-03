-- Add user_id column to cvs table (initially nullable)
ALTER TABLE cvs
ADD COLUMN user_id INTEGER REFERENCES users(id);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);

-- Update existing records with a default user_id (you'll need to replace 1 with your actual default user ID)
UPDATE cvs SET user_id = 1 WHERE user_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE cvs
ALTER COLUMN user_id SET NOT NULL; 