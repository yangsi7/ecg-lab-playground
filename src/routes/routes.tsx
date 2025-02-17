import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { GenericErrorBoundary } from '../components/shared/GenericErrorBoundary';

// Lazy load components
const DataLab = lazy(() => import('../pages/DataLab'));
const ClinicLab = lazy(() => import('../pages/ClinicLab'));
const HolterLab = lazy(() => import('../pages/HolterLab'));
const HolterDetail = lazy(() => import('../pages/HolterLab/HolterDetail'));
const PodLab = lazy(() => import('../pages/PodLab'));
const ECGViewerPage = lazy(() => import('../components/shared/ecg/ECGViewerPage'));

export interface AppRoute extends RouteObject {
  path: string;
  element: React.ReactNode;
  label?: string;
}

export const routes: AppRoute[] = [
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