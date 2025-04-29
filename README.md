# Atlan JD Builder

A powerful tool for creating job descriptions that follow Atlan's standards for clarity, inclusivity, and effectiveness.

## Features

- **AI-Powered JD Generation**: Create compelling job descriptions based on key inputs
- **Bias Detection**: Automatically identify and suggest alternatives for potentially biased language
- **Refinement Suggestions**: Get AI-powered suggestions to improve each section of your JD
- **Quality Scoring**: Receive scores for clarity, inclusivity, SEO optimization, and talent attraction
- **Magic Link Authentication**: Secure, email-based authentication for @atlan.com users
- **JD Standards**: Comprehensive guidelines for creating effective job descriptions

## Getting Started

1. Visit the application URL
2. Sign in with your @atlan.com email address
3. Create a new JD or view existing ones
4. Follow the guided process to generate, refine, and finalize your job description

## Authentication

The application uses magic link authentication:

1. Enter your @atlan.com email address
2. Receive a magic link via email
3. Click the link to authenticate
4. Your session remains active until you sign out

## JD Standards

Our job descriptions follow the Atlan JD Standards, which ensure:

1. **Clarity**: Clear, specific language that avoids jargon and ambiguity
2. **Inclusivity**: Gender-neutral and inclusive language throughout
3. **Completeness**: All essential components (overview, responsibilities, qualifications, benefits)
4. **Engagement**: Compelling content that connects the role to Atlan's mission
5. **Atlan Voice**: Mission-driven, ownership-focused, and inspirational language

## Technology Stack

- Next.js (App Router)
- React
- Supabase (Authentication & Database)
- Gemini AI API
- Tailwind CSS
- TypeScript

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `GEMINI_API_KEY`: Your Google Gemini API key
- `NEXT_PUBLIC_APP_URL`: The public URL of your application (for magic links)
- `DATABASE_URL`: Your PostgreSQL connection string

## Development

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## Database Setup

Run the following SQL in your Supabase SQL editor:

\`\`\`sql
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
\`\`\`

## License

Proprietary - All rights reserved
