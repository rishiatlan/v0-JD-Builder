# Memory Optimization Guide

This document explains how to use the memory optimization utilities in the JD Builder project.

## Overview

The JD Builder application can process large documents (PDFs, DOCXs, and text files), which can consume significant memory. To prevent browser crashes and ensure smooth operation, we've implemented several memory optimization strategies.

## Key Utilities

### `processStringInChunks`

Processes a large string in smaller chunks to avoid memory issues:

\`\`\`typescript
const results = await processStringInChunks(
 largeString,
 5000, // chunk size
 async (chunk, index) => {
   // Process each chunk
   return processedChunk;
 },
 (progress) => {
   // Update progress (0-100)
   setProgress(progress);
 }
);
\`\`\`

### `isStringTooLarge`

Checks if a string is too large to process at once:

\`\`\`typescript
if (isStringTooLarge(content.length)) {
 // Process in chunks
} else {
 // Process directly
}
\`\`\`

### `efficientSubstring`

Creates a substring without keeping a reference to the original string:

\`\`\`typescript
const chunk = efficientSubstring(largeString, start, end);
\`\`\`

### `releaseMemory`

Helps release references to large objects:

\`\`\`typescript
largeObject = releaseMemory(largeObject);
\`\`\`

## Best Practices

1. **Check Memory Usage**: Use `isMemoryUsageHigh()` to check if memory usage is approaching limits

2. **Process in Chunks**: Always process large strings in chunks using `processStringInChunks`

3. **Release References**: Set large objects to null when no longer needed

4. **Use Worker Pool**: Offload CPU-intensive tasks to the worker pool

5. **Monitor Memory**: Use `logMemoryUsage(label)` to log memory usage for debugging

## Example: Processing a Large Document

\`\`\`typescript
// Check if content is too large
if (isStringTooLarge(content.length)) {
 //

\`\`\`typescript
// Check if content is too large
if (isStringTooLarge(content.length)) {
 // Process in chunks with memory monitoring
 processContentInChunksWithMemoryCheck(content, 5000, (processedContent) => {
   setContent(processedContent);
   // Original content is automatically garbage collected
 });
} else {
 // For smaller content, process directly
 setContent(content);
}
\`\`\`

## Handling Memory Warnings

When memory usage is high:

1. Show a warning to the user
2. Process in smaller chunks
3. Introduce delays between processing chunks
4. Consider using the worker pool for background processing

## Debugging Memory Issues

If you encounter memory issues:

1. Use `logMemoryUsage(label)` at key points in your code
2. Check Chrome DevTools Memory tab to identify memory leaks
3. Ensure large objects are being properly released
4. Consider reducing chunk sizes for processing
