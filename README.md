# Atlan JD Builder

## Overview

The Atlan JD Builder is a specialized tool designed to create world-class job descriptions that follow Atlan's standards of excellence. It leverages AI to generate, enhance, and refine job descriptions based on key inputs about the role, ensuring they are outcome-focused, clear, and aligned with Atlan's strategic goals.

## Key Features

- **Dynamic Questionnaire**: Generate JDs by answering key questions about the role
- **Document Upload**: Extract and analyze existing JDs from PDF, DOCX, or TXT files
- **JD Enhancement**: Improve existing JDs with AI-powered language refinement
- **Department Guardrails**: Ensure JDs align with department-specific ownership areas
- **Bias Detection**: Identify and correct potentially biased or exclusionary language
- **Sharpness Scoring**: Quantitative feedback on JD quality and clarity
- **Refinement Suggestions**: Get specific recommendations to improve each section
- **Offline Support**: Continue working even when internet connection is unstable
- **Persistent Storage**: Save work in progress and access it later
- **Circuit Breaker Pattern**: Gracefully handle API failures with fallbacks
- **Error Boundaries**: Prevent entire app crashes when components fail
- **Progressive Loading**: Load and process large documents efficiently

## Technical Architecture

The Atlan JD Builder is built with Next.js and uses a modern tech stack:

- **Next.js App Router**: For efficient server-side rendering and routing
- **React**: For building the user interface
- **TypeScript**: For type safety and better developer experience
- **Tailwind CSS**: For styling
- **Web Workers**: For heavy processing tasks off the main thread
- **Circuit Breaker Pattern**: For resilient API calls
- **IndexedDB**: For client-side persistent storage
- **Service Worker**: For offline capabilities
- **Error Boundaries**: For graceful error handling

## LLM Prompt Engineering

The Atlan JD Builder uses carefully crafted prompts to generate high-quality job descriptions. Our prompt engineering follows these key principles:

1. **Outcome-Focused**: Prompts emphasize results over tasks
2. **Clear Role Boundaries**: Using department guardrails to define ownership
3. **Inclusive Language**: Detecting and correcting bias
4. **Data-Driven**: Providing quantitative feedback on JD quality
5. **Continuous Improvement**: Enabling iterative enhancement

### Core Prompts

| Prompt Name | Purpose | When Used |
|-------------|---------|-----------|
| JD Generation | Creates complete job description from questionnaire inputs | When user submits the questionnaire form |
| Document Analysis | Extracts structured information from uploaded documents | When user uploads a document |
| JD Enhancement | Improves existing JD language and structure | When user requests JD enhancement |
| Refinement Suggestions | Provides specific improvement recommendations | When viewing JD sections in refinement mode |
| Bias Detection | Identifies potentially biased or exclusionary language | During JD generation and enhancement |

### Example Prompt Structure

\`\`\`
You are an expert job description writer for Atlan.
Your task is to create a job description for the role of {title} in the {department} department.

Key information about this role:
- Outcomes that define success: {outcomes}
- Mindset of top performers: {mindset}
- Strategic advantage for Atlan: {advantage}
- Key decisions/trade-offs: {decisions}

Department guardrails:
- Areas this role owns: {departmentGuardrails.owns}
- Areas this role should avoid: {departmentGuardrails.avoid}

Create a comprehensive job description with the following sections:
1. Overview
2. Responsibilities (outcome-focused, not task-focused)
3. Qualifications (essential skills and experience)
4. [Optional] Strategic vision (if includeStrategicVision is true)

Follow these principles:
- Use active voice and concrete language
- Focus on outcomes, not tasks
- Be specific and measurable where possible
- Use inclusive language
- Align with Atlan's values of ownership and excellence
\`\`\`

## Recent Changes

- **DOCX Parsing Fix**: Improved DOCX file parsing with better error handling and progress reporting
- **Offline Support**: Added service worker for offline capabilities
- **Persistent Storage**: Implemented IndexedDB for client-side storage
- **Circuit Breaker Pattern**: Added resilient API calls with fallbacks
- **Error Boundaries**: Implemented graceful error handling
- **Worker Pool Optimization**: Enhanced worker pool for better performance

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_KEY=your_api_key_here
\`\`\`

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
