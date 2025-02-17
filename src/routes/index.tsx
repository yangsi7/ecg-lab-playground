import { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

// Wrap all routes with Suspense for lazy loading
const wrappedRoutes = routes.map(route => ({
  ...route,
  element: <Suspense fallback={<LoadingSpinner />}>{route.element}</Suspense>,
}));

export const router = createBrowserRouter(wrappedRoutes);
export { routes } from './routes'; 