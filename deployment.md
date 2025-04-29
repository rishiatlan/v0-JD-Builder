# Deployment Guide for Atlan JD Builder

This document provides detailed instructions for deploying the Atlan JD Builder application to Vercel.

## Prerequisites

- A Vercel account
- A Supabase account
- A Google Cloud account with Gemini API access
- Git repository access

## Environment Variables

The following environment variables need to be set in your Vercel project:

\`\`\`
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
\`\`\`

## Deployment Steps

1. **Fork or Clone the Repository**
   - Fork the repository to your own GitHub account or clone it directly

2. **Connect to Vercel**
   - Log in to your Vercel account
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project settings:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: npm run build
     - Output Directory: .next

3. **Set Environment Variables**
   - In the Vercel project settings, add all required environment variables

4. **Deploy**
   - Click "Deploy" to start the deployment process
   - Wait for the build and deployment to complete

## Troubleshooting Common Issues

### Package Installation Errors

If you encounter package installation errors like:
\`\`\`
ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/https%3A: Not Found - 404
\`\`\`

Try these solutions:

1. **Use npm instead of pnpm**
   - Add a vercel.json file with:
   \`\`\`json
   {
     "installCommand": "npm install"
   }
   \`\`\`

2. **Check package.json**
   - Ensure all dependencies are properly formatted as package names
   - Remove any URL-based dependencies
   - Use exact versions instead of ranges (e.g., "1.0.0" instead of "^1.0.0")

3. **Clear Build Cache**
   - In Vercel project settings, go to "Build & Development Settings"
   - Click "Clear Build Cache" and redeploy

4. **Check for Circular Dependencies**
   - Review your code for circular dependencies that might cause installation issues

### Supabase Edge Function Issues

If you encounter issues with Supabase Edge Functions:

1. **Check Deno Imports**
   - Ensure all imports use the correct Deno URL format
   - Verify that imported modules are available and compatible

2. **Set Environment Variables**
   - Make sure all required environment variables are set in the Supabase dashboard

3. **Check Permissions**
   - Verify that the function has the necessary permissions

## Post-Deployment Verification

After deployment, verify that:

1. The application loads correctly
2. Authentication with Supabase works
3. The Gemini API integration functions properly
4. Document parsing works as expected
5. Job descriptions can be saved and retrieved

## Monitoring and Maintenance

- Set up monitoring for your application using Vercel Analytics
- Regularly check for dependency updates
- Monitor Supabase usage and quotas
- Keep your Gemini API key secure and monitor usage

## Support

For deployment issues, contact:
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Internal Support: [Your internal support contact]
