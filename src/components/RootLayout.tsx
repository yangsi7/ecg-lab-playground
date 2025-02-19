import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import DiagnosticsPanel from './DiagnosticsPanel';
import { GenericErrorBoundary } from './shared/GenericErrorBoundary';

const RootLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Navigation />
      <main className="flex-1 overflow-y-auto p-6">
        <GenericErrorBoundary>
          <Outlet />
        </GenericErrorBoundary>
      </main>
      <DiagnosticsPanel />
    </div>
  );
};

export default RootLayout; 