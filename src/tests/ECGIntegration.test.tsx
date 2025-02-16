import { render, screen } from '@testing-library/react';
import ECGViewerPage from '../components/labs/ECGViewerPage';

test('renders loading state', () => {
  render(<ECGViewerPage />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
