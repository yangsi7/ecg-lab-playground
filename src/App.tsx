import { RouterProvider } from 'react-router-dom';
import './index.css';
import { router } from './routes';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
