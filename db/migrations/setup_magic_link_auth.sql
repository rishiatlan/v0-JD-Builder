-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update job_descriptions table to include created_by_email if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'job_descriptions'
        AND column_name = 'created_by_email'
    ) THEN
        ALTER TABLE job_descriptions
        ADD COLUMN created_by_email TEXT;
    END IF;
END $$;

-- Create user_activity table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_descriptions_email ON job_descriptions(created_by_email);
CREATE INDEX IF NOT EXISTS idx_user_activity_email ON user_activity(user_email);

-- Drop tables that are no longer needed
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS user_history CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
