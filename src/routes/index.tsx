import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { GenericErrorBoundary } from '../components/shared/GenericErrorBoundary';
import { AuthGuard } from '../components/shared/AuthGuard';
import RootLayout from '../components/RootLayout';

// Lazy load components
const DataLab = lazy(() => import('../components/labs/DataLab'));
const ClinicLab = lazy(() => import('../components/labs/ClinicLab'));
const ClinicDetail = lazy(() => import('../components/labs/ClinicLab/ClinicDetail'));
const HolterLab = lazy(() => import('../components/labs/HolterLab'));
const HolterDetail = lazy(() => import('../components/labs/HolterLab/HolterDetail'));
const PodLab = lazy(() => import('../components/labs/PodLab'));
const ECGViewerPage = lazy(() => import('../components/shared/ecg/ECGViewerPage'));
const LoginPage = lazy(() => import('../components/auth/LoginPage'));

export interface AppRoute extends Omit<RouteObject, 'path'> {
  path: string;
  label?: string;
  requiresAuth?: boolean;
}

const routes: AppRoute[] = [
  {
    path: '/login',
    element: <GenericErrorBoundary><LoginPage /></GenericErrorBoundary>,
  },
  {
    path: '/clinic',
    element: <GenericErrorBoundary><AuthGuard><ClinicLab /></AuthGuard></GenericErrorBoundary>,
    label: 'Clinic',
    requiresAuth: true,
  },
  {
    path: '/clinic/:clinicId',
    element: <GenericErrorBoundary><AuthGuard><ClinicDetail /></AuthGuard></GenericErrorBoundary>,
    requiresAuth: true,
  },
  {
    path: '/datalab',
    element: <GenericErrorBoundary><AuthGuard><DataLab /></AuthGuard></GenericErrorBoundary>,
    label: 'Data',
    requiresAuth: true,
  },
  {
    path: '/holter',
    element: <GenericErrorBoundary><AuthGuard><HolterLab /></AuthGuard></GenericErrorBoundary>,
    label: 'Holter',
    requiresAuth: true,
  },
  {
    path: '/holter/:studyId',
    element: <GenericErrorBoundary><AuthGuard><HolterDetail /></AuthGuard></GenericErrorBoundary>,
    requiresAuth: true,
  },
  {
    path: '/pod',
    element: <GenericErrorBoundary><AuthGuard><PodLab /></AuthGuard></GenericErrorBoundary>,
    label: 'Pod',
    requiresAuth: true,
  },
  {
    path: '/ecg/:studyId',
    element: <GenericErrorBoundary><AuthGuard><ECGViewerPage /></AuthGuard></GenericErrorBoundary>,
    requiresAuth: true,
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