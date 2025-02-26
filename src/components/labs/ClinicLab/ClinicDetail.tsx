/**
 * src/components/clinics/ClinicDetail.tsx
 * 
 * Displays detailed information about a single clinic
 * including study management and analytics charts
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClinicDetails } from '@/hooks/api/clinic/useClinicData';
import { useClinicAnalytics } from '@/hooks/api/clinic/useClinicAnalytics';
import { ChevronLeft, Building2, Download } from 'lucide-react';
import StudyManagementTable from './StudyManagementTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { ClinicStatsRow } from '@/types/domain/clinic';

export default function ClinicDetail(): JSX.Element {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'studies'>('overview');
  
  // Use our consolidated hook for basic clinic details
  const { 
    data: clinicData, 
    isLoading: isLoadingClinic, 
    error: clinicError 
  } = useClinicDetails(clinicId || null);
  
  // Use the analytics hook for detailed analytics 
  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    error: analyticsError
  } = useClinicAnalytics(clinicId || null);
  
  const isLoading = isLoadingClinic || isLoadingAnalytics;
  const error = clinicError || analyticsError;
  
  const handleBack = () => {
    navigate('/labs/clinic');
  };
  
  const handleExport = () => {
    console.log('Exporting data for clinic:', clinicId);
    // Implementation for export functionality
  };

  if (error) {
    return (
      <div className="p-4">
        <button 
          onClick={handleBack}
          className="flex items-center mb-4 text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Clinics
        </button>
        <div className="bg-red-50 p-4 rounded-md text-red-700">
          Error loading clinic details
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <button 
        onClick={handleBack}
        className="flex items-center text-blue-600 hover:text-blue-800"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Clinics
      </button>
      
      <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Building2 className="h-6 w-6 mr-2 text-blue-600" />
            {clinicData?.clinic_name}
          </h1>
          <p className="text-gray-500">{clinicData?.clinic_id}</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center px-3 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </button>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="border-b">
        <div className="flex space-x-6">
          <button
            className={`py-2 px-1 border-b-2 font-medium ${
              activeTab === 'overview' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium ${
              activeTab === 'studies' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('studies')}
          >
            Studies
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <OverviewCard 
              title="Total Studies" 
              value={clinicData?.totalStudies} 
            />
            <OverviewCard 
              title="On Target" 
              value={clinicData?.onTargetCount}
              percentage={clinicData?.totalStudies ? 
                (clinicData.onTargetCount / clinicData.totalStudies) * 100 : 0} 
            />
            <OverviewCard 
              title="Monitor" 
              value={clinicData?.monitorCount}
              percentage={clinicData?.totalStudies ? 
                (clinicData.monitorCount / clinicData.totalStudies) * 100 : 0}
            />
            <OverviewCard 
              title="Intervene" 
              value={clinicData?.interveneCount}
              percentage={clinicData?.totalStudies ? 
                (clinicData.interveneCount / clinicData.totalStudies) * 100 : 0}
              variant="warning"
            />
          </div>
          
          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Quality Trend */}
            <ChartCard
              title="Weekly Quality Trend"
              data={analytics?.weeklyQuality}
            />
            
            {/* Weekly Studies */}
            <ChartCard
              title="Weekly Studies"
              data={analytics?.weeklyStudies}
            />
          </div>
        </div>
      ) : (
        <StudyManagementTable clinicId={clinicId || ''} />
      )}
    </div>
  );
}

interface OverviewCardProps {
  title: string;
  value?: number;
  percentage?: number;
  variant?: 'default' | 'warning' | 'success';
}

function OverviewCard({ title, value, percentage, variant = 'default' }: OverviewCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <div className="mt-2 flex justify-between items-end">
        <div className="text-2xl font-bold">{value || 0}</div>
        {percentage !== undefined && (
          <div className={`text-sm ${
            variant === 'warning' ? 'text-amber-500' : 
            variant === 'success' ? 'text-green-500' : 
            'text-blue-500'
          }`}>
            {percentage.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

function ChartCard({ 
  title, 
  data 
}: { 
  title: string, 
  data?: any[]
}) {
  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="p-4 h-64 flex items-center justify-center">
        {data ? (
          <div className="text-gray-400">Chart visualization would be rendered here</div>
        ) : (
          <div className="text-gray-400">No data available</div>
        )}
      </div>
    </div>
  );
} 