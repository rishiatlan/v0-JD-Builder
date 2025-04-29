-- Add created_by_email column to job_descriptions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'job_descriptions'
        AND column_name = 'created_by_email'
    ) THEN
        ALTER TABLE job_descriptions
        ADD COLUMN created_by_email VARCHAR(255);
    END IF;
END $$;

-- Create user_activity table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_activity_email ON user_activity(user_email);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_email ON job_descriptions(created_by_email);
