# JD Builder (Beta)

A powerful tool for creating, enhancing, and analyzing job descriptions using AI-powered language processing.

## 🚀 Overview

JD Builder helps talent acquisition teams and hiring managers create high-quality job descriptions through:

- Dynamic questionnaires that capture key role requirements
- Document parsing and analysis of existing JDs
- AI-powered enhancement of job descriptions
- Memory-optimized processing of large documents
- Background worker processing for improved performance

## ✨ Key Features

- **Dynamic Questionnaire**: Generate JDs by answering targeted questions about the role
- **Document Upload**: Parse and analyze existing JDs from PDF, DOCX, or TXT files
- **JD Enhancement**: Improve existing JDs with AI-powered language processing
- **Memory Optimization**: Handle large documents efficiently without browser crashes
- **Worker Pool**: Process documents in the background for better UI responsiveness
- **Offline Support**: Continue working even when internet connectivity is lost
- **Persistent Storage**: Save work in progress using IndexedDB
- **Circuit Breaker Pattern**: Gracefully handle API failures and provide fallbacks
- **Error Boundaries**: Prevent cascading failures in the UI
- **Progressive Loading**: Improve perceived performance with optimized loading states

## 🧠 LLM Prompt Engineering

JD Builder leverages carefully crafted prompts to generate high-quality job descriptions aligned with Atlan's Standards of Excellence.

### Prompt Strategy

Our prompt engineering follows these key principles:

1. **Outcome-Focused**: Prompts emphasize measurable outcomes rather than tasks
2. **Role Boundary Guardrails**: Department-specific guardrails ensure JDs stay within appropriate boundaries
3. **Bias Detection**: Specialized prompts identify and eliminate biased language
4. **Structured Output**: All prompts request structured JSON responses for consistent parsing
5. **Fallback Mechanisms**: Graceful degradation when AI services are unavailable

### Core Prompts

| Prompt Type | Purpose | When Used | Key Components |
|-------------|---------|-----------|----------------|
| JD Generation | Create comprehensive job descriptions | After form submission | Role details, guardrails, formatting instructions |
| Refinement Suggestions | Improve specific sections | During refinement phase | Section content, improvement guidelines |
| Bias Detection | Identify non-inclusive language | After JD generation | Content analysis, bias categories |
| Document Analysis | Extract information from uploads | After document upload | Content extraction, structured output |
| JD Enhancement | Improve existing JDs | During enhancement workflow | Content analysis, improvement guidelines |

### Example Prompt Structure

\`\`\`
Create a comprehensive job description for the following role:

Title: ${data.title}
Department: ${data.department}

Key Outcomes: ${data.outcomes}
Measurable Outcomes: ${data.measurableOutcomes || "Not specified"}
Mindset/Instincts: ${data.mindset}
Strategic Advantage: ${data.advantage}
Key Decisions/Trade-offs: ${data.decisions}

${guardrailsPrompt}

Format the response as a JSON object with the following structure:
{
  "sections": {
    "overview": "A compelling paragraph that summarizes the role, its impact, and why it matters",
    "responsibilities": ["Responsibility 1", "Responsibility 2", ...],
    "qualifications": ["Qualification 1", "Qualification 2", ...]
  },
  "analysis": {
    "clarity": 0-100 score,
    "inclusivity": 0-100 score,
    "seo": 0-100 score,
    "attraction": 0-100 score
  },
  "biasFlags": [
    {"text": "potentially biased text", "reason": "explanation of bias", "suggestion": "alternative text"}
  ]
}

IMPORTANT GUIDELINES:
1. Make the overview compelling and outcome-focused
2. List 5-7 key responsibilities that align with the department's ownership areas
3. List 5-7 qualifications that would make someone successful
4. Ensure language is inclusive and free of bias
5. Focus on measurable outcomes rather than tasks
6. Use active voice and strong action verbs
7. Avoid jargon and buzzwords
8. Keep the tone professional but conversational
9. STRICTLY FOLLOW THE ROLE BOUNDARY GUARDRAILS

Your response must be valid JSON that can be parsed with JSON.parse().
\`\`\`

### Alignment with Atlan Standards of Excellence

Our prompt engineering aligns with Atlan's Standards of Excellence through:

1. **Outcome-Focused Language**: Prompts emphasize what success looks like rather than tasks
2. **Clear Role Boundaries**: Department guardrails ensure clear ownership and avoid overlap
3. **Inclusive Language**: Bias detection and correction promote diversity and inclusion
4. **Data-Driven Approach**: Analysis scores provide quantitative feedback on JD quality
5. **Continuous Improvement**: Refinement suggestions enable iterative enhancement

## 🛠️ Technical Architecture

### Core Components

- **JD Builder Form**: Main interface for creating and enhancing JDs
- **Document Parser**: Processes uploaded documents with memory optimization
- **Language Processor**: AI-powered text analysis and enhancement
- **Worker Pool**: Background processing for CPU-intensive tasks
- **Memory Optimization**: Utilities for handling large documents efficiently
- **Circuit Breaker**: Pattern for handling API failures gracefully
- **IndexedDB Storage**: Persistent storage for work in progress
- **Service Worker**: Offline capabilities and asset caching
- **Error Boundaries**: Prevent cascading failures in the UI

### Technology Stack

- Next.js (App Router)
- React with TypeScript
- Tailwind CSS for styling
- Web Workers for background processing
- IndexedDB for persistent storage
- Service Workers for offline capabilities
- AI integration for language processing

## 🔧 Development Setup

### Prerequisites

- Node.js 16+ and npm/yarn
- Git

### Installation

1. Clone the repository:
  \`\`\`bash
  git clone https://github.com/your-org/jd-builder.git
  cd jd-builder
  \`\`\`

2. Install dependencies:
  \`\`\`bash
  npm install
  # or
  yarn install
  \`\`\`

3. Set up environment variables:
  \`\`\`bash
  cp .env.example .env.local
  \`\`\`
  Then edit `.env.local` with your API keys and configuration.

4. Run the development server:
  \`\`\`bash
  npm run dev
  # or
  yarn dev
  \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Quality Assurance

### Code Quality Tools

- **ESLint**: Static code analysis with TypeScript-specific rules
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Husky**: Pre-commit hooks for code quality checks

### Running Quality Checks

\`\`\`bash
# Lint code
npm run lint
# or
yarn lint

# Fix linting issues automatically
npm run lint:fix
# or
yarn lint:fix

# Type check
npm run type-check
# or
yarn type-check
\`\`\`

## 📚 Documentation

### Component Documentation

- **JD Builder Form**: Main form component with tabs for questionnaire, upload, and enhance
- **Document Parser**: Handles document parsing with memory optimization
- **Progressive Document Preview**: Renders large documents efficiently
- **Error Boundary**: Prevents cascading failures in the UI
- **Network Status Monitor**: Tracks online/offline status
- **Service Worker Registration**: Manages service worker lifecycle

### Utility Documentation

- **Memory Optimization**: Utilities for handling large documents
- **Worker Pool**: Background processing for CPU-intensive tasks
- **Language Processor**: AI-powered text analysis
- **Circuit Breaker**: Pattern for handling API failures
- **IndexedDB Storage**: Persistent storage service

## 🔍 Troubleshooting

### Common Issues

- **Memory Issues**: If you encounter memory issues with large documents, try:
 - Breaking the document into smaller chunks
 - Using a different browser (Chrome tends to handle memory better)
 - Closing other browser tabs to free up memory

- **Worker Pool Issues**: If background processing isn't working:
 - Check if your browser supports Web Workers
 - Ensure you're not in a private/incognito window (some browsers limit Web Worker functionality)

- **Offline Mode Issues**: If offline mode isn't working:
 - Ensure you've visited the site at least once while online
 - Check if your browser supports Service Workers
 - Clear site data and reload if service worker is stuck

- **Deployment Errors**: For syntax errors during deployment:
 - Run `npm run lint` and `npm run type-check` to catch issues before deployment
 - Check for unbalanced tags or syntax errors in TypeScript files

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📝 Recent Changes

### Application Optimization (2023-06-15)
- Implemented circuit breaker pattern for API resilience
- Added IndexedDB storage for persistent data
- Optimized worker pool for better performance
- Added error boundaries to prevent cascading failures
- Implemented service worker for offline capabilities
- Added network status monitoring
- Enhanced document analysis with progress indicators
- Improved error recovery mechanisms
- Added document preview capabilities
- Added AI confidence indicators

### Dependency Cleanup (2023-05-06)
- Removed Supabase dependencies as they were not being used in the application
- Cleaned up related environment variables
- Simplified the project dependencies
