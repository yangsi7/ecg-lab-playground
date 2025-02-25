/**
 * src/components/labs/ClinicLab/Dashboard.tsx
 * 
 * Main dashboard for the ClinicLab - serves as the single entry point
 * for all clinic-related views and components
 */

import { Routes, Route } from 'react-router-dom';
import ClinicList from './ClinicList';
import ClinicDetail from './ClinicDetail';

export default function Dashboard() {
  return (
    <div className="w-full h-full flex flex-col">
      <Routes>
        <Route path="/" element={<ClinicList />} />
        <Route path="/:clinicId" element={<ClinicDetail />} />
      </Routes>
    </div>
  );
} 