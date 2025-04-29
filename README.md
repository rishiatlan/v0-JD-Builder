# Atlan JD Builder

![Atlan Logo](public/images/atlan-logo.png)

## GitHub Repository

This project is available on GitHub at: [https://github.com/rishiatlan/v0-JD-Builder](https://github.com/rishiatlan/v0-JD-Builder)

## Overview

Atlan JD Builder is a powerful tool designed to help create world-class job descriptions that follow Atlan's standards of excellence. This application leverages AI to generate, analyze, and refine job descriptions that attract top talent while maintaining Atlan's unique voice and values.

## Features

- **AI-Powered JD Generation**: Create professional job descriptions using Gemini AI based on key role information
- **Document Upload**: Extract information from existing documents to jumpstart the JD creation process
- **Client-Side Document Parsing**: Parse PDF, DOCX, and TXT files entirely in the browser for speed and privacy
- **Bias Detection**: Automatically identify and suggest alternatives for potentially biased or non-inclusive language
- **Interactive Refinement**: Get AI-powered suggestions to improve each section of your job description
- **Atlan Voice Check**: Ensure your JD aligns with Atlan's strategic, inspirational, and mission-driven voice
- **Template Library**: Start with pre-built templates for common roles to save time
- **Download & Export**: Save your finalized JD in a clean, formatted text file
- **Supabase Integration**: Store and retrieve job descriptions with Supabase

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **AI Integration**: Google's Gemini 2.0 Flash model via OpenHands
- **Document Parsing**: pdf.js (PDF), mammoth.js (DOCX), and native FileReader (TXT)
- **Database**: Supabase
- **Styling**: Tailwind CSS with custom Atlan theming

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Gemini API key
- Supabase project

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/rishiatlan/v0-JD-Builder.git
   cd v0-JD-Builder
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following:
   \`\`\`
   GEMINI_API_KEY=your_gemini_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Deployment Notes

When deploying to Vercel or other platforms, ensure that:

1. All dependencies in package.json are properly formatted as package names, not URLs
2. The project uses the correct Node.js version (16.x or higher)
3. Environment variables are properly set in the deployment platform

### Troubleshooting Deployment Issues

If you encounter the following error during deployment:
\`\`\`
ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/https%3A: Not Found - 404
\`\`\`

This typically indicates an issue with the package.json file. Ensure that:

1. All dependencies are specified as package names, not URLs
2. There are no typos in package names
3. All packages exist in the npm registry
4. No import statements are using URLs as package names
5. Check for any hidden dependencies in configuration files

For Vercel deployments specifically:
1. Make sure the Node.js version is set correctly (16.x or higher)
2. Verify all environment variables are properly set in the Vercel dashboard
3. Consider using the Vercel CLI to debug deployment issues locally
4. Check the build logs for any specific package that's causing the error

If the issue persists:
1. Try clearing the Vercel cache and redeploying
2. Consider using npm instead of pnpm for the installation
3. Create a fresh package-lock.json file locally and commit it

For Supabase Edge Functions, make sure:
1. All imports use the correct Deno URL format
2. Environment variables are properly set in the Supabase dashboard
3. The function has the necessary permissions

## Usage Guide

### Creating a New JD

1. Navigate to the JD Builder homepage
2. Choose between the questionnaire or document upload option
3. Fill in the required information about the role
4. Submit to generate an initial JD draft

### Using Document Upload

1. Select the "Upload Document" tab
2. Click "Select File" to choose a PDF, DOCX, or TXT file
3. Wait for the document to be parsed (all parsing happens in your browser)
4. Click "Preview" to verify the extracted content
5. Click "Analyze Document" to generate a JD based on the document content

### Refining Your JD

1. Review the analysis of your JD for clarity, inclusivity, SEO, and talent attraction
2. Use the refinement tool to improve each section
3. Apply AI-powered suggestions to enhance the content
4. Finalize your JD when satisfied with all sections

### Using Templates

1. Navigate to the Templates page
2. Select a template that matches your role requirements
3. Customize the pre-filled information as needed
4. Generate and refine your JD

## Contact

For questions or support, please contact the Talent Team at Atlan.
