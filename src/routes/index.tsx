import { lazy, Suspense, ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { GenericErrorBoundary } from '@/components/shared/GenericErrorBoundary';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { TimeRangeProvider } from '@/context/TimeRangeContext';
import RootLayout from '@/components/RootLayout';

// Type-safe lazy loading function that ensures default export compatibility
const lazyLoad = (importFunc: () => Promise<{ default: ComponentType<any> }>) => lazy(importFunc);

// Lazy load components with correct module imports
const Dashboard = lazyLoad(() => import('@/components/Dashboard'));
const DataLab = lazyLoad(() => import('@/components/labs/DataLab'));
const ClinicLab = lazyLoad(() => import('@/components/labs/ClinicLab'));
// For components that don't export default, use a different pattern
const ClinicList = lazyLoad(() => import('@/components/labs/ClinicLab/ClinicList'));
const ClinicDetail = lazyLoad(() => import('@/components/labs/ClinicLab/ClinicDetail'));
// Use explicit file path for HolterLab to avoid confusion with index.ts
const HolterLab = lazyLoad(() => import('@/components/labs/HolterLab'));
const HolterDetail = lazyLoad(() => import('@/components/labs/HolterLab/HolterDetail'));
const PodLab = lazyLoad(() => import('@/components/labs/PodLab'));
const ECGViewerPage = lazyLoad(() => import('@/components/shared/ecg/ECGViewerPage'));
const LoginPage = lazyLoad(() => import('@/components/auth/LoginPage'));
const ECGTestComponent = lazyLoad(() => import('@/components/shared/ecg/ECGTestComponent'));
// Create the ErrorPage component
const ErrorPage = lazyLoad(() => import('@/components/shared/ErrorPage'));
// Debug component
const DebugSupabaseClient = lazyLoad(() => import('@/components/shared/DebugSupabaseClient'));

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

// Wrap component in suspense and auth guard if needed
const wrapComponent = (Component: React.ReactNode, requiresAuth: boolean = true) => {
  const wrapped = <Suspense fallback={<LoadingSpinner />}>{Component}</Suspense>;
  return requiresAuth ? <AuthGuard>{wrapped}</AuthGuard> : wrapped;
};

// Lab routes with nested structure
const labRoutes: AppRoute[] = [
  // Dashboard home route
  {
    path: '/',
    element: wrapComponent(<Dashboard />),
    label: 'Home',
  },
  
  // Clinic routes
  {
    path: '/clinic',
    children: [
      {
        index: true,
        element: wrapComponent(<ClinicList />),
      },
      {
        path: 'analytics',
        element: wrapComponent(<ClinicLab />),
      },
      {
        path: ':clinicId',
        element: wrapComponent(<ClinicDetail />),
      }
    ]
  },
  
  // Holter routes with ECG viewer as child
  {
    path: '/holter',
    children: [
      {
        index: true,
        element: wrapComponent(<HolterLab />),
      },
      {
        path: ':studyId',
        element: wrapComponent(<HolterDetail />),
      },
      {
        path: ':studyId/ecg',
        element: wrapComponent(
          <TimeRangeProvider>
            <ECGViewerPage />
          </TimeRangeProvider>
        ),
      }
    ]
  },
  
  // Pod routes
  {
    path: '/pod',
    element: wrapComponent(<PodLab />),
    label: 'Pod',
  },
  
  // Data routes
  {
    path: '/datalab',
    element: wrapComponent(<DataLab />),
    label: 'Data',
  },
  
  // Standalone ECG Viewer route
  {
    path: '/ecg/:studyId',
    element: wrapComponent(
      <TimeRangeProvider>
        <ECGViewerPage />
      </TimeRangeProvider>
    ),
  },
  {
    path: "/edge-test",
    element: wrapComponent(<ECGTestComponent />, true),
  },
  // Debug route
  {
    path: "/debug",
    element: wrapComponent(<DebugSupabaseClient />, true),
  },
];

// Create router with root layout
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Suspense fallback={<LoadingSpinner />}><RootLayout /></Suspense>,
    errorElement: <GenericErrorBoundary><ErrorPage /></GenericErrorBoundary>,
    children: [
      ...authRoutes,
      ...labRoutes
    ],
  },
]); 