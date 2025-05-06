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

## 🛠️ Technical Architecture

### Core Components

- **JD Builder Form**: Main interface for creating and enhancing JDs
- **Document Parser**: Processes uploaded documents with memory optimization
- **Language Processor**: AI-powered text analysis and enhancement
- **Worker Pool**: Background processing for CPU-intensive tasks
- **Memory Optimization**: Utilities for handling large documents efficiently

### Technology Stack

- Next.js (App Router)
- React with TypeScript
- Tailwind CSS for styling
- Web Workers for background processing
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

### Utility Documentation

- **Memory Optimization**: Utilities for handling large documents
- **Worker Pool**: Background processing for CPU-intensive tasks
- **Language Processor**: AI-powered text analysis

## 🔍 Troubleshooting

### Common Issues

- **Memory Issues**: If you encounter memory issues with large documents, try:
 - Breaking the document into smaller chunks
 - Using a different browser (Chrome tends to handle memory better)
 - Closing other browser tabs to free up memory

- **Worker Pool Issues**: If background processing isn't working:
 - Check if your browser supports Web Workers
 - Ensure you're not in a private/incognito window (some browsers limit Web Worker functionality)

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

### Dependency Cleanup (2023-05-06)
- Removed Supabase dependencies as they were not being used in the application
- Cleaned up related environment variables
- Simplified the project dependencies
\`\`\`

Let's restore the .env.example file:

\`\`\`plaintext file=".env.example"
# API Keys
GEMINI_API_KEY=your-gemini-api-key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
