# Development Guide

This document provides detailed information for developers working on the JD Builder project.

## Project Structure

\`\`\`
jd-builder/
├── app/                  # Next.js App Router
│   ├── actions.ts        # Server actions
│   ├── builder/          # Builder page
│   ├── standards/        # JD Standards page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/               # UI components
│   ├── jd-builder-form.tsx  # Main form component
│   ├── jd-refinement.tsx    # JD refinement component
│   ├── jd-output.tsx        # JD output component
│   └── ...
├── lib/                  # Utility functions
│   ├── language-processor.ts  # Language processing utilities
│   ├── openhands.ts          # AI integration
│   └── department-data.ts    # Department data
├── public/               # Static assets
└── ...
\`\`\`

## Development Workflow

### 1. Setting Up Your Environment

Ensure you have the correct Node.js version:

\`\`\`bash
nvm use  # If you use nvm
\`\`\`

Install dependencies:

\`\`\`bash
npm install
\`\`\`

Set up pre-commit hooks:

\`\`\`bash
npm run prepare
\`\`\`

### 2. Development Process

1. Create a new branch for your feature or fix:
   \`\`\`bash
   git checkout -b feature/your-feature-name
   \`\`\`

2. Make your changes, following the code style guidelines

3. Run linting and type checking:
   \`\`\`bash
   npm run lint
   npm run type-check
   \`\`\`

4. Fix any issues that arise

5. Commit your changes with a descriptive message:
   \`\`\`bash
   git commit -m "Add feature: description of your changes"
   \`\`\`

6. Push your branch and create a pull request

### 3. Code Quality Standards

#### TypeScript

- Use proper type annotations for all variables, parameters, and return types
- Avoid using `any` type unless absolutely necessary
- Use interfaces for object shapes and types for unions/primitives

#### React Components

- Use functional components with hooks
- Split large components into smaller, reusable ones
- Use proper prop typing with TypeScript interfaces
- Follow the React hooks rules (no conditional hooks, etc.)

#### Error Handling

- Use try/catch blocks for async operations
- Provide meaningful error messages to users
- Log errors for debugging purposes
- Use fallback mechanisms when primary approaches fail

### 4. Deployment

The project is deployed using Vercel:

1. Ensure all linting and type checking passes
2. Merge your changes to the main branch
3. Vercel will automatically deploy the changes

## Troubleshooting Development Issues

### ESLint/TypeScript Errors

If you encounter linting or type errors:

1. Run `npm run lint:fix` to automatically fix simple issues
2. For TypeScript errors, check the error message for the file and line number
3. Fix the issues manually if automatic fixing doesn't work

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
