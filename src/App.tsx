import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import { routes } from './routes';
import Navigation from './components/Navigation';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import { GenericErrorBoundary } from './components/shared/GenericErrorBoundary';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-white">
        <Navigation />
        <main className="flex-1 overflow-y-auto p-6">
          <GenericErrorBoundary>
            <Routes>
              {routes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Routes>
          </GenericErrorBoundary>
        </main>
        <DiagnosticsPanel />
      </div>
    </Router>
  );
}

export default App;
