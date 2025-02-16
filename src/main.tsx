/**
 * src/main.tsx
 * Entry point for our React + TypeScript application.
 * Uses React.StrictMode for highlighting potential issues.
 * Ensure your environment is set up with the correct 'root' element in index.html.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; 
import './index.css'; // Tailwind + global styles

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
