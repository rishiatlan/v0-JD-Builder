-- Add password reset token table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Add created_by_email field to job_descriptions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_descriptions' AND column_name = 'created_by_email'
  ) THEN
    ALTER TABLE job_descriptions ADD COLUMN created_by_email VARCHAR(255);
  END IF;
END $$;

-- Create user_activity table to track user actions
CREATE TABLE IF NOT EXISTS user_activity (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user activity lookups
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_email ON user_activity(email);

-- Create function to update created_by_email in job_descriptions
CREATE OR REPLACE FUNCTION update_job_descriptions_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by_email = (SELECT email FROM auth.users WHERE id = NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update created_by_email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_created_by_email'
  ) THEN
    CREATE TRIGGER set_created_by_email
    BEFORE INSERT OR UPDATE ON job_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_job_descriptions_email();
  END IF;
END $$;

-- Update existing job_descriptions with email if missing
UPDATE job_descriptions
SET created_by_email = (SELECT email FROM auth.users WHERE id = job_descriptions.created_by)
WHERE created_by_email IS NULL AND created_by IS NOT NULL;
