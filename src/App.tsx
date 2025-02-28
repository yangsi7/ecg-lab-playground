import { RouterProvider } from 'react-router-dom';
import './index.css';
import { router } from './routes';
import { useEffect, useState } from 'react';

function App() {
  const [error, setError] = useState<Error | null>(null);
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    // Debug initialization
    console.log('App is initializing...');
    
    try {
      // Mark as loaded
      setAppLoaded(true);
      console.log('App has been loaded successfully');
    } catch (err) {
      console.error('Error during app initialization:', err);
      setError(err as Error);
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
        <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-6 max-w-xl">
          <h2 className="text-xl font-bold text-red-300 mb-4">Application Error</h2>
          <p className="text-red-200 mb-2">There was an error initializing the application:</p>
          <pre className="bg-black/30 p-4 rounded overflow-auto text-xs text-red-100">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <>
      {appLoaded && <RouterProvider router={router} />}
      {!appLoaded && (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4 mx-auto"></div>
            <p className="text-blue-300">Initializing application...</p>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
