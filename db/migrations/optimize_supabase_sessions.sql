-- Create a function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Delete expired sessions
  DELETE FROM auth.sessions WHERE expires_at < now();
  
  -- Log the cleanup
  INSERT INTO public.analytics_events (event_type, properties)
  VALUES ('session_cleanup', jsonb_build_object('cleaned_at', now()));
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the cleanup function daily
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop the job if it already exists
SELECT cron.unschedule('cleanup_expired_sessions_job');

-- Schedule the job to run daily at 3 AM
SELECT cron.schedule('cleanup_expired_sessions_job', '0 3 * * *', 'SELECT cleanup_expired_sessions()');

-- Create an index on the expires_at column for better performance
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth.sessions(expires_at);

-- Create an index on the user_id column for better performance
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth.sessions(user_id);

-- Optimize the refresh token lookup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON auth.refresh_tokens(token);

-- Set appropriate session timeouts
UPDATE auth.flow_state
SET max_age_seconds = 86400  -- 24 hours
WHERE true;

-- Ensure we have the right configuration for session duration
INSERT INTO auth.config (key, value)
VALUES 
  ('session_expiry_seconds', '604800')  -- 7 days
ON CONFLICT (key) 
DO UPDATE SET value = '604800';
