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
import App from './App'; 
import './index.css'; // Tailwind + global styles

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
            <ReactQueryDevtools />
        </QueryClientProvider>
    </StrictMode>
);
