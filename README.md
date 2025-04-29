# Atlan JD Builder

![Atlan Logo](public/images/atlan-logo.png)

## Overview

Atlan JD Builder is a powerful tool designed to help create world-class job descriptions that follow Atlan's standards of excellence. This application leverages AI to generate, analyze, and refine job descriptions that attract top talent while maintaining Atlan's unique voice and values.

## Features

- **AI-Powered JD Generation**: Create professional job descriptions using Gemini AI based on key role information
- **Document Upload**: Extract information from existing documents to jumpstart the JD creation process
- **Bias Detection**: Automatically identify and suggest alternatives for potentially biased or non-inclusive language
- **Interactive Refinement**: Get AI-powered suggestions to improve each section of your job description
- **Atlan Voice Check**: Ensure your JD aligns with Atlan's strategic, inspirational, and mission-driven voice
- **Template Library**: Start with pre-built templates for common roles to save time
- **Download & Export**: Save your finalized JD in a clean, formatted text file

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **AI Integration**: Google's Gemini 2.0 Flash model via OpenHands
- **Styling**: Tailwind CSS with custom Atlan theming

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Gemini API key

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/atlan-antfarm/jd-builder.git
   cd jd-builder
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
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage Guide

### Creating a New JD

1. Navigate to the JD Builder homepage
2. Choose between the questionnaire or document upload option
3. Fill in the required information about the role
4. Submit to generate an initial JD draft

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

## Project Structure

\`\`\`
atlan-jd-analyzer/
├── app/                  # Next.js app directory
│   ├── actions.ts        # Server actions for JD generation
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout component
│   ├── page.tsx          # Home page
│   ├── history/          # JD history page
│   ├── templates/        # Templates page
│   └── new/              # Redirect page for new JDs
├── components/           # React components
│   ├── atlan-header.tsx  # Header component
│   ├── atlan-footer.tsx  # Footer component
│   ├── atlan-logo.tsx    # Logo component
│   ├── jd-analyzer.tsx   # Main JD analyzer component
│   ├── jd-analysis.tsx   # JD analysis component
│   ├── jd-output.tsx     # JD output display component
│   ├── jd-refinement.tsx # JD refinement component
│   ├── intake-form.tsx   # Role information intake form
│   └── ui/               # UI components from shadcn
├── lib/                  # Utility functions
│   ├── openhands.ts      # OpenHands integration for Gemini
│   └── utils.ts          # General utility functions
├── public/               # Static assets
│   └── images/           # Image assets
├── tailwind.config.ts    # Tailwind configuration
└── package.json          # Project dependencies
\`\`\`

## Changelog

### v1.0.0 (Initial Release)
- Basic JD generation with Gemini AI integration
- Questionnaire and document upload options
- JD analysis and refinement tools
- Template library with common roles
- Download functionality

### v1.1.0
- Updated JD output format to match Atlan's production template
- Restructured sections with static and dynamic content
- Improved refinement interface with focused tabs
- Enhanced download format with proper section organization

### v1.1.1
- Fixed deployment error related to useSearchParams() hook
- Added Suspense boundaries for client components
- Improved component structure for better server/client separation
- Enhanced error handling for template loading

### v1.1.2
- Fixed file upload functionality with client-side parsing
- Improved LLM integration with robust error handling
- Enhanced JSON parsing with fallback mechanisms
- Added detailed logging for better debugging
- Fixed "Analyze with LLM" and "Generate JD" functionality

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and owned by Atlan.

## Maintenance

**Important**: This README.md file should be updated whenever significant changes are made to the project. This includes:

- New features or functionality
- Changes to the project structure
- Updates to installation or usage instructions
- Dependency changes
- Version updates

## Contact

For questions or support, please contact the Atlan development team.
