import React from 'react';
import ClinicLab from './components/labs/ClinicLab';
import HolterLab from './components/labs/HolterLab';
import HolterDetail from './components/labs/HolterDetail';
import PodLab from './components/labs/PodLab';
import DataLab from './components/labs/DataLab';
import ECGViewerPage from './components/labs/ECGViewerPage';
import { GenericErrorBoundary } from './components/shared/GenericErrorBoundary';

// Define routes with error boundaries
export const routes = [
  {
    path: '/',
    element: (
      <GenericErrorBoundary>
        <DataLab />
      </GenericErrorBoundary>
    ),
    label: 'Data',
  },
  {
    path: '/clinic',
    element: (
      <GenericErrorBoundary>
        <ClinicLab />
      </GenericErrorBoundary>
    ),
    label: 'Clinic',
  },
  {
    path: '/holter',
    element: (
      <GenericErrorBoundary>
        <HolterLab />
      </GenericErrorBoundary>
    ),
    label: 'Holter',
  },
  {
    path: '/holter/:studyId',
    element: (
      <GenericErrorBoundary>
        <HolterDetail />
      </GenericErrorBoundary>
    ),
  },
  {
    path: '/pod',
    element: (
      <GenericErrorBoundary>
        <PodLab />
      </GenericErrorBoundary>
    ),
    label: 'Pod',
  },
  {
    path: '/ecg/:studyId',
    element: (
      <GenericErrorBoundary>
        <ECGViewerPage />
      </GenericErrorBoundary>
    ),
  },
];
