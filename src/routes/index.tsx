import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { GenericErrorBoundary } from '@/components/shared/GenericErrorBoundary';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { TimeRangeProvider } from '@/context/TimeRangeContext';
import RootLayout from '@/components/RootLayout';
import React from 'react';

// Type for our routes
type AppRoute = RouteObject & {
  label?: string;
  requiresAuth?: boolean;
};

// Lazy load components
const lazyLoad = (importFunc: () => Promise<{ default: React.ComponentType<any> }>) => lazy(importFunc);

// Lazy loaded components
const Dashboard = lazyLoad(() => import('@/components/Dashboard'));
const ClinicLab = lazyLoad(() => import('@/components/labs/ClinicLab'));
const ClinicDetail = lazyLoad(() => import('@/components/labs/ClinicLab/ClinicDetail'));
const HolterLab = lazyLoad(() => import('@/components/labs/HolterLab'));
const HolterDetail = lazyLoad(() => import('@/components/labs/HolterLab/HolterDetail'));
const PodLab = lazyLoad(() => import('@/components/labs/PodLab'));
// Comment out the problematic import
// const PodDetail = lazyLoad(() => import('@/components/labs/PodLab/PodDetail'));
const DataLab = lazyLoad(() => import('@/components/labs/DataLab'));
const ECGViewerPage = lazyLoad(() => import('@/components/shared/ecg/ECGViewerPage'));
const LoginPage = lazyLoad(() => import('@/components/auth/LoginPage'));
const ErrorPage = lazyLoad(() => import('@/components/shared/ErrorPage'));

// Wrap component in suspense and auth
const wrapComponent = (Component: React.ReactNode, requiresAuth = true) => {
  const wrapped = <Suspense fallback={<LoadingSpinner />}>{Component}</Suspense>;
  return requiresAuth ? <AuthGuard>{wrapped}</AuthGuard> : wrapped;
};

// Auth routes
const authRoutes: AppRoute[] = [
  {
    path: '/login',
    element: <Suspense fallback={<LoadingSpinner />}><LoginPage /></Suspense>,
  }
];

// Main routes
const labRoutes: AppRoute[] = [
  // Dashboard
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
        element: wrapComponent(<ClinicLab />),
      },
      {
        path: ':clinicId',
        element: wrapComponent(<ClinicDetail />),
      }
    ]
  },
  
  // Holter routes
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
    children: [
      {
        index: true,
        element: wrapComponent(<PodLab />),
      },
      // Comment out the detailed route until component is fully available
      /*{
        path: ':podId',
        element: wrapComponent(<PodDetail />),
      }*/
    ],
    label: 'Pod',
  },
  
  // Data routes
  {
    path: '/datalab',
    element: wrapComponent(<DataLab />),
    label: 'Data',
  },
  
  // Legacy ECG Viewer
  {
    path: '/ecg/:studyId',
    element: wrapComponent(
      <TimeRangeProvider>
        <ECGViewerPage />
      </TimeRangeProvider>
    ),
  },
];

// Create and export the router
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
