# Worker Pool Documentation

This document explains how to use the worker pool for background processing in the JD Builder project.

## Overview

The worker pool manages a collection of Web Workers to perform CPU-intensive tasks in the background, keeping the UI responsive. It handles:

- Document parsing
- Text processing and enhancement
- Task queuing and prioritization
- Worker lifecycle management

## Using the Worker Pool

### Initialization

The worker pool is automatically initialized when the application starts:

\`\`\`typescript
// Get the worker pool instance
const workerPool = getWorkerPool({
 maxDocumentWorkers: 2,
 maxTextWorkers: 2,
});

// Initialize the pool
workerPool.initialize();
\`\`\`

### Processing Text

To process text in the background:

\`\`\`typescript
import useWorkerPool from "@/hooks/use-worker-pool";

function MyComponent() {
 const { processText } = useWorkerPool();
 
 const handleProcessText = () => {
   processText(
     largeText,
     chunkSize,
     {
       priority: TaskPriority.NORMAL,
       onProgress: (progress, stage) => {
         setProgress(progress);
         setStage(stage);
       },
       onComplete: (processedText) => {
         setResult(processedText);
       },
       onError: (error) => {
         setError(error);
         // Fall back to main thread processing
       },
     }
   );
 };
 
 return (/* ... */);
}
\`\`\`

### Enhancing Text

To enhance text with AI processing:

\`\`\`typescript
import useWorkerPool from "@/hooks/use-worker-pool";

function MyComponent() {
 const { enhanceText } = useWorkerPool();
 
 const handleEnhanceText = () => {
   enhanceText(
     text,
     {
       removeRedundancy: true,
       enhanceLanguage: true,
       convertPassiveToActive: true,
       removeIntensifiers: true,
     },
     {
       priority: TaskPriority.HIGH,
       onProgress: (progress, stage) => {
         setProgress(progress);
         setStage(stage);
       },
       onComplete: (enhancedText) => {
         setResult(enhancedText);
       },
       onError: (error) => {
         setError(error);
       },
     }
   );
 };
 
 return (/* ... */);
}
\`\`\`

### Getting Pool Status

To monitor the worker pool status:

\`\`\`typescript
import useWorkerPool from "@/hooks/use-worker-pool";

function MyComponent() {
 const { getPoolStatus } = useWorkerPool();
 const [poolStatus, setPoolStatus] = useState(null);
 
 useEffect(() => {
   const updateStatus = () => {
     setPoolStatus(getPoolStatus());
   };
   
   // Update immediately
   updateStatus();
   
   // Then update every second
   const interval = setInterval(updateStatus, 1000);
   
   return () => clearInterval(interval);
 }, [getPoolStatus]);
 
 return (
   <div>
     <h3>Worker Pool Status</h3>
     <p>Document Workers: {poolStatus?.workers.document.busy}/{poolStatus?.workers.document.total}</p>
     <p>Text Workers: {poolStatus?.workers.text.busy}/{poolStatus?.workers.text.total}</p>
     <p>Queued Tasks: {poolStatus?.tasks.queued}</p>
     <p>Running Tasks: {poolStatus?.tasks.running}</p>
   </div>
 );
}
\`\`\`

## Task Priorities

Tasks can be assigned different priorities:

- `TaskPriority.HIGH`: For user-initiated actions that need immediate response
- `TaskPriority.NORMAL`: For standard background processing
- `TaskPriority.LOW`: For non-urgent tasks that can wait

## Fallback Mechanism

If the worker pool fails or is not supported:

1. The `onError` callback will be triggered
2. You should implement a fallback to process on the main thread
3. Use the `isWorkerSupported` flag to check if workers are available

## Best Practices

1. **Use for CPU-Intensive Tasks**: Only use the worker pool for tasks that would block the UI
2. **Implement Fallbacks**: Always have a main thread fallback for browsers that don't support workers
3. **Show Progress**: Use the onProgress callback to keep users informed
4. **Prioritize Tasks**: Use appropriate priority levels for different tasks
5. **Clean Up**: Call `cleanupWorkerPool()` when your component unmounts

## Troubleshooting

If you encounter issues with the worker pool:

1. Check if Web Workers are supported in the browser
2. Ensure the worker files are being properly bundled
3. Check for console errors related to worker initialization
4. Verify that the worker pool is being properly initialized
