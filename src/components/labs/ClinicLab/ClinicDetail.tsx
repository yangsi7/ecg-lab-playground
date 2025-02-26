/**
 * src/components/clinics/ClinicDetail.tsx
 * 
 * Displays detailed information about a single clinic
 * including study management and analytics charts
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClinicDetails, useClinicAnalytics } from '@/hooks/api/clinic';
import { ChevronLeft, Building2, Activity, BarChart2, Users, Download } from 'lucide-react';
import StudyManagementTable from './StudyManagementTable';
import SparklineChart from './components/SparklineChart';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { ClinicOverview, ClinicQualityBreakdown, ClinicStatusBreakdown } from '@/types/domain/clinic';

export default function ClinicDetail() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'studies'>('overview');

  // Fetch clinic details and analytics
  const {
    data: clinic,
    isLoading: isLoadingClinic,
    error: clinicError
  } = useClinicDetails(clinicId ?? null);

  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    error: analyticsError
  } = useClinicAnalytics(clinicId ?? null);

  // Handle export button click
  const handleExport = async () => {
    try {
      // Use the proper environment variable for the Supabase URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      // Correctly extract the access token from the stored session
      let accessToken = '';
      const sessionStr = localStorage.getItem('supabase.auth.token');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          // Access token is typically found in session.access_token
          accessToken = session.access_token || (session.currentSession?.access_token || '');
        } catch (e) {
          console.error('Error parsing auth session:', e);
        }
      }

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/clinic-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          clinic_id: clinicId,
          format: 'csv',
          include_studies: true,
          include_quality_metrics: true
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinic_report_${clinicId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/clinics');
  };

  if (isLoadingClinic || isLoadingAnalytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (clinicError || analyticsError) {
    return (
      <div className="p-4">
        <button 
          onClick={handleBack}
          className="flex items-center mb-4 text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Clinics
        </button>
        <div className="bg-red-50 p-4 rounded-md text-red-500">
          {clinicError ? clinicError.toString() : analyticsError?.toString()}
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="p-4">
        <button 
          onClick={handleBack}
          className="flex items-center mb-4 text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Clinics
        </button>
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-700">
          Clinic not found
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-blue-600" />
              {clinic.name}
              {clinic.vip_status && (
                <span className="ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">
                  VIP
                </span>
              )}
            </h1>
          </div>
          <button 
            onClick={handleExport}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 border-b">
        <div className="flex">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'overview' ? 'bg-white border-t-2 border-blue-500' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'studies' ? 'bg-white border-t-2 border-blue-500' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('studies')}
          >
            Studies
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gray-50 p-6 overflow-auto">
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard 
                title="Active Studies" 
                value={analytics?.overview?.active_studies || 0} 
                icon={<Activity className="text-green-500" />} 
              />
              <StatCard 
                title="Total Studies" 
                value={analytics?.overview?.total_studies || 0} 
                icon={<BarChart2 className="text-blue-500" />} 
              />
              <StatCard 
                title="Quality Hours" 
                value={analytics?.overview?.average_quality_hours || 0} 
                suffix="hrs"
                icon={<Activity className="text-purple-500" />} 
              />
              <StatCard 
                title="Growth" 
                value={analytics?.growthPercent || 0} 
                suffix="%"
                icon={<Activity className="text-amber-500" />} 
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Weekly Active Studies</h3>
                <SparklineChart 
                  data={analytics?.weeklyActiveStudies || []} 
                  xKey="week_start"
                  yKey="value"
                  color="#22c55e"
                />
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Quality Metrics</h3>
                <SparklineChart 
                  data={analytics?.weeklyAvgQuality || []} 
                  xKey="week_start"
                  yKey="value"
                  color="#3b82f6"
                />
              </div>
            </div>

            {/* Status breakdown */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Status Breakdown</h3>
              {analytics?.statusBreakdown && analytics.statusBreakdown.length > 0 ? (
                <div className="flex justify-between items-center">
                  <ProgressBar 
                    label="Intervention Needed" 
                    value={analytics.statusBreakdown[0].intervene_count} 
                    total={analytics.statusBreakdown[0].open_studies} 
                    color="bg-red-500"
                  />
                  <ProgressBar 
                    label="Monitor" 
                    value={analytics.statusBreakdown[0].monitor_count} 
                    total={analytics.statusBreakdown[0].open_studies} 
                    color="bg-yellow-500"
                  />
                  <ProgressBar 
                    label="On Target" 
                    value={analytics.statusBreakdown[0].on_target_count} 
                    total={analytics.statusBreakdown[0].open_studies} 
                    color="bg-green-500"
                  />
                  <ProgressBar 
                    label="Near Completion" 
                    value={analytics.statusBreakdown[0].near_completion_count} 
                    total={analytics.statusBreakdown[0].open_studies} 
                    color="bg-blue-500"
                  />
                </div>
              ) : (
                <p className="text-gray-500">No status data available</p>
              )}
            </div>
          </div>
        ) : (
          <StudyManagementTable clinicId={clinicId || ''} />
        )}
      </div>
    </div>
  );
}

// Helper components

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, suffix = '', icon }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-500 font-medium">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-semibold mt-2">
        {value.toLocaleString()}{suffix && <span className="text-lg ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function ProgressBar({ label, value, total, color }: ProgressBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 rounded-full border-8 flex items-center justify-center relative">
        <div 
          className={`absolute inset-0 rounded-full ${color}`}
          style={{ 
            clipPath: `polygon(50% 50%, 50% 0%, ${percentage > 25 ? '100% 0%' : `${50 + 2 * percentage}% ${50 - 2 * percentage}%`}, ${percentage > 50 ? '100% 100%' : `${50 + 2 * (percentage - 25)}% ${50 + 2 * (percentage - 25)}%`}, ${percentage > 75 ? '0% 100%' : `${50 - 2 * (percentage - 50)}% ${50 + 2 * (percentage - 50)}%`}, ${percentage > 99 ? '0% 0%' : `${50 - 2 * (percentage - 75)}% ${50 - 2 * (percentage - 75)}%`}, 50% 0%)`
          }}
        />
        <span className="text-lg font-semibold">{value}</span>
      </div>
      <span className="mt-2 text-sm text-gray-600">{label}</span>
    </div>
  );
} 