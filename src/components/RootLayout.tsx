import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import DiagnosticsPanel from './DiagnosticsPanel';
import { GenericErrorBoundary } from './shared/GenericErrorBoundary';
import Breadcrumbs from './shared/Breadcrumbs';
import { useAuth } from '../hooks/api/core/useAuth';

const RootLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {user && <Navigation />}
      <main className="flex-1 overflow-y-auto p-6">
        {user && <Breadcrumbs />}
        <GenericErrorBoundary>
          <Outlet />
        </GenericErrorBoundary>
      </main>
      {user && <DiagnosticsPanel />}
    </div>
  );
};

export default RootLayout; 