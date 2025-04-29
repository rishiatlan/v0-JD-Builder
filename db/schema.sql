-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Descriptions Table
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    content JSONB NOT NULL,
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_template BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'draft'
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_descriptions_user_email ON job_descriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_is_template ON job_descriptions(is_template);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_is_public ON job_descriptions(is_public);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_created_at ON job_descriptions(created_at DESC);

-- User History Table
CREATE TABLE IF NOT EXISTS user_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_history_user_email ON user_history(user_email);
CREATE INDEX IF NOT EXISTS idx_user_history_created_at ON user_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_history_resource_type ON user_history(resource_type);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT,
    event_type TEXT NOT NULL,
    properties JSONB,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_email ON analytics_events(user_email);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
