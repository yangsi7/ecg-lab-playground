import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { GenericErrorBoundary } from '../components/shared/GenericErrorBoundary';
import RootLayout from '../components/RootLayout';

// Lazy load components
const DataLab = lazy(() => import('../components/labs/DataLab'));
const ClinicLab = lazy(() => import('../components/labs/ClinicLab'));
const HolterLab = lazy(() => import('../components/labs/HolterLab'));
const HolterDetail = lazy(() => import('../components/labs/HolterLab/HolterDetail'));
const PodLab = lazy(() => import('../components/labs/PodLab'));
const ECGViewerPage = lazy(() => import('../components/shared/ecg/ECGViewerPage'));

export interface AppRoute extends Omit<RouteObject, 'path'> {
  path: string;
  label?: string;
}

const routes: AppRoute[] = [
  {
    path: '/',
    element: <GenericErrorBoundary><DataLab /></GenericErrorBoundary>,
    label: 'Data',
  },
  {
    path: '/clinic',
    element: <GenericErrorBoundary><ClinicLab /></GenericErrorBoundary>,
    label: 'Clinic',
  },
  {
    path: '/holter',
    element: <GenericErrorBoundary><HolterLab /></GenericErrorBoundary>,
    label: 'Holter',
  },
  {
    path: '/holter/:studyId',
    element: <GenericErrorBoundary><HolterDetail /></GenericErrorBoundary>,
  },
  {
    path: '/pod',
    element: <GenericErrorBoundary><PodLab /></GenericErrorBoundary>,
    label: 'Pod',
  },
  {
    path: '/ecg/:studyId',
    element: <GenericErrorBoundary><ECGViewerPage /></GenericErrorBoundary>,
  },
];

// Wrap all routes with Suspense for lazy loading
const wrappedRoutes = routes.map(route => ({
  ...route,
  element: <Suspense fallback={<LoadingSpinner />}>{route.element}</Suspense>,
  index: undefined,
} as RouteObject));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: wrappedRoutes,
  },
]); 