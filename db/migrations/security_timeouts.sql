-- Configure magic link expiration (1 hour)
UPDATE auth.config
SET value = '3600'
WHERE key = 'mailer_otp_exp_seconds';

-- If the key doesn't exist, insert it
INSERT INTO auth.config (key, value)
SELECT 'mailer_otp_exp_seconds', '3600'
WHERE NOT EXISTS (SELECT 1 FROM auth.config WHERE key = 'mailer_otp_exp_seconds');

-- Configure session expiration (24 hours)
UPDATE auth.config
SET value = '86400'
WHERE key = 'session_expiry_seconds';

-- If the key doesn't exist, insert it
INSERT INTO auth.config (key, value)
SELECT 'session_expiry_seconds', '86400'
WHERE NOT EXISTS (SELECT 1 FROM auth.config WHERE key = 'session_expiry_seconds');

-- Create a function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_items()
RETURNS void AS $$
BEGIN
  -- Delete expired sessions
  DELETE FROM auth.sessions WHERE expires_at < now();
  
  -- Delete expired flow states (magic links)
  DELETE FROM auth.flow_state WHERE created_at < now() - interval '1 hour';
  
  -- Delete expired custom sessions
  DELETE FROM user_sessions WHERE expires_at < now();
  
  -- Log the cleanup
  INSERT INTO public.analytics_events (event_type, properties)
  VALUES ('security_cleanup', jsonb_build_object(
    'cleaned_at', now(),
    'auth_sessions_cleaned', (SELECT count(*) FROM auth.sessions WHERE expires_at < now()),
    'flow_states_cleaned', (SELECT count(*) FROM auth.flow_state WHERE created_at < now() - interval '1 hour'),
    'custom_sessions_cleaned', (SELECT count(*) FROM user_sessions WHERE expires_at < now())
  ));
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the cleanup function hourly
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop the job if it already exists
SELECT cron.unschedule('cleanup_expired_items_job');

-- Schedule the job to run hourly
SELECT cron.schedule('cleanup_expired_items_job', '0 * * * *', 'SELECT cleanup_expired_items()');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flow_state_created_at ON auth.flow_state(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Add a trigger to automatically clean up expired sessions on login
CREATE OR REPLACE FUNCTION trigger_cleanup_on_login()
RETURNS trigger AS $$
BEGIN
  -- Run cleanup with 10% probability to avoid doing it on every login
  IF random() < 0.1 THEN
    PERFORM cleanup_expired_items();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the sessions table
DROP TRIGGER IF EXISTS cleanup_on_login ON auth.sessions;
CREATE TRIGGER cleanup_on_login
AFTER INSERT ON auth.sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_cleanup_on_login();
