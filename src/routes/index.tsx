import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { GenericErrorBoundary } from '@/components/shared/GenericErrorBoundary';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { TimeRangeProvider } from '@/context/TimeRangeContext';
import RootLayout from '@/components/RootLayout';

// Lazy load components
const DataLab = lazy(() => import('@/components/labs/DataLab'));
const ClinicLab = lazy(() => import('@/components/labs/ClinicLab'));
const ClinicTable = lazy(() => import('@/components/labs/ClinicLab/ClinicTable'));
const ClinicDetail = lazy(() => import('@/components/labs/ClinicLab/ClinicDetail'));
const HolterLab = lazy(() => import('@/components/labs/HolterLab'));
const HolterDetail = lazy(() => import('@/components/labs/HolterLab/HolterDetail'));
const PodLab = lazy(() => import('@/components/labs/PodLab'));
const ECGViewerPage = lazy(() => import('@/components/shared/ecg/ECGViewerPage'));
const LoginPage = lazy(() => import('@/components/auth/LoginPage'));

// Custom route type that extends RouteObject
type AppRoute = RouteObject & {
  label?: string;
  requiresAuth?: boolean;
};

// Define route groups for better organization
const authRoutes: AppRoute[] = [
  {
    path: '/login',
    element: <Suspense fallback={<LoadingSpinner />}><LoginPage /></Suspense>,
  }
];

const labRoutes: AppRoute[] = [
  {
    path: '/',
    element: <Suspense fallback={<LoadingSpinner />}><AuthGuard><ClinicTable /></AuthGuard></Suspense>,
    label: 'Clinics',
    requiresAuth: true,
  },
  {
    path: '/clinic',
    element: <Suspense fallback={<LoadingSpinner />}><AuthGuard><ClinicTable /></AuthGuard></Suspense>,
    label: 'Clinics',
    requiresAuth: true,
  },
  {
    path: '/clinic/analytics',
    element: <Suspense fallback={<LoadingSpinner />}><AuthGuard><ClinicLab /></AuthGuard></Suspense>,
    requiresAuth: true,
  },
  {
    path: '/clinic/:clinicId',
    element: <Suspense fallback={<LoadingSpinner />}><AuthGuard><ClinicDetail /></AuthGuard></Suspense>,
    requiresAuth: true,
  },
  {
    path: '/datalab',
    element: <Suspense fallback={<LoadingSpinner />}><AuthGuard><DataLab /></AuthGuard></Suspense>,
    label: 'Data',
    requiresAuth: true,
  },
  {
    path: '/holter',
    element: <Suspense fallback={<LoadingSpinner />}><AuthGuard><HolterLab /></AuthGuard></Suspense>,
    label: 'Holter',
    requiresAuth: true,
  },
  {
    path: '/holter/:studyId',
    element: <Suspense fallback={<LoadingSpinner />}><AuthGuard><HolterDetail /></AuthGuard></Suspense>,
    requiresAuth: true,
  },
  {
    path: '/pod',
    element: <Suspense fallback={<LoadingSpinner />}><AuthGuard><PodLab /></AuthGuard></Suspense>,
    label: 'Pod',
    requiresAuth: true,
  },
  {
    path: '/ecg/:studyId',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <AuthGuard>
          <TimeRangeProvider>
            <ECGViewerPage />
          </TimeRangeProvider>
        </AuthGuard>
      </Suspense>
    ),
    requiresAuth: true,
  }
];

// Create router with root layout
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Suspense fallback={<LoadingSpinner />}><RootLayout /></Suspense>,
    errorElement: <GenericErrorBoundary><div>Something went wrong</div></GenericErrorBoundary>,
    children: [
      ...authRoutes,
      ...labRoutes
    ],
  },
]); 