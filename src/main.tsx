/**
 * src/main.tsx
 * Entry point for our React + TypeScript application.
 * Uses React.StrictMode for highlighting potential issues.
 * Ensure your environment is set up with the correct 'root' element in index.html.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { logger } from '@/lib/logger';
import App from './App';
import './index.css'; // Tailwind + global styles

// Initialize QueryClient with defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  logger.error('Failed to find root element');
  throw new Error('Failed to find root element. Check if index.html contains <div id="root"></div>');
}

// Create and render root
createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  </StrictMode>
);

// Log initialization
logger.info('Application initialized', {
  env: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION || 'development'
});
