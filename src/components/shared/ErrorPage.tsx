import React from 'react';
import { useNavigate, useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * A generic error page component that displays error details
 * and provides a way to navigate back to the home page.
 */
const ErrorPage: React.FC = () => {
  const error = useRouteError() as any;
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-white">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-gray-300 mb-4">
          {error instanceof Error 
            ? error.message 
            : error?.statusText || 'An unexpected error occurred'}
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default ErrorPage; 