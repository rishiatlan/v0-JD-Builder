# Deployment Guide for Atlan JD Builder

This document provides detailed instructions for deploying the Atlan JD Builder application to Vercel.

## Prerequisites

- A Vercel account
- A Supabase account
- A Google Cloud account with Gemini API access
- Git repository access
- Node.js 18.17.0 or higher
- pnpm 8.0.0 or higher

## Environment Variables

The following environment variables need to be set in your Vercel project:

\`\`\`
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_here
\`\`\`

## Deployment Steps

1. **Fork or Clone the Repository**
   - Fork the repository to your own GitHub account or clone it directly

2. **Install Dependencies Locally**
   - Run `pnpm install` to install dependencies
   - Ensure the pnpm-lock.yaml file is committed to your repository

3. **Connect to Vercel**
   - Log in to your Vercel account
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project settings:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: pnpm run build
     - Output Directory: .next

4. **Set Environment Variables**
   - In the Vercel project settings, add all required environment variables

5. **Configure Build Settings**
   - In the Vercel project settings, go to "Build & Development Settings"
   - Set the "Install Command" to `pnpm install --frozen-lockfile`
   - Set the "Build Command" to `pnpm run build`

6. **Deploy**
   - Click "Deploy" to start the deployment process
   - Wait for the build and deployment to complete

## Troubleshooting Common Issues

### pnpm Installation Errors

If you encounter pnpm installation errors:

1. **Check Node.js Version**
   - Ensure you're using Node.js 18.17.0 or higher (as specified in .nvmrc)
   - Vercel should automatically detect and use this version

2. **Check pnpm Version**
   - Vercel uses pnpm 8.x by default
   - If you need a specific version, you can specify it in the "Install Command" as `npx pnpm@8.x.x install --frozen-lockfile`

3. **Clear Build Cache**
   - In Vercel project settings, go to "Build & Development Settings"
   - Click "Clear Build Cache" and redeploy

### Package Resolution Issues

If you encounter package resolution issues:

1. **Check pnpm-lock.yaml**
   - Ensure the pnpm-lock.yaml file is committed to your repository
   - If necessary, regenerate it locally with `pnpm install`

2. **Check .npmrc Configuration**
   - Ensure the .npmrc file has the correct configuration for pnpm
   - Try adjusting settings like `node-linker` if needed

## Post-Deployment Verification

After deployment, verify that:

1. The application loads correctly
2. Authentication with Supabase works
3. The Gemini API integration functions properly
4. Document parsing works as expected
5. Job descriptions can be saved and retrieved
6. Export functionality works for all formats (TXT, DOCX, PDF)

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
