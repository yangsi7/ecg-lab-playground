/**
 * src/components/labs/ClinicLab/ClinicDetail.tsx
 * 
 * Displays detailed information about a single clinic
 * including study management and analytics charts
 * Uses the enhanced useClinicDetails hook for comprehensive data
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClinicDetails } from '@/hooks/api/clinic/useClinicDetails';
import { useClinicAnalytics } from '@/hooks/api/clinic/useClinicAnalytics';
import { ChevronLeft, Building2, Download, BarChart3, LineChart, Calendar } from 'lucide-react';
import StudyManagementTable from './StudyManagementTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { SimpleBarChart } from '../../shared/charts/SimpleBarChart';

export default function ClinicDetail(): JSX.Element {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'studies' | 'charts'>('overview');
  
  // Use our enhanced hook for clinic details including chart data
  const { 
    basicInfo, 
    charts,
    isLoading: isLoadingDetails, 
    error: detailsError 
  } = useClinicDetails(clinicId || null);
  
  // Use the analytics hook for additional analytics data
  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    error: analyticsError
  } = useClinicAnalytics(clinicId || null);
  
  const isLoading = isLoadingDetails || isLoadingAnalytics;
  const error = detailsError || analyticsError;
  
  const handleBack = () => {
    navigate('/clinic');
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
          className="flex items-center mb-4 text-white hover:text-blue-300"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Clinics
        </button>
        <div className="bg-white/10 backdrop-blur-xl border border-red-500/30 rounded-xl p-8 text-center">
          <h3 className="text-red-400 text-lg font-medium mb-2">Error Loading Data</h3>
          <p className="text-red-300/80">{error}</p>
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
    <div className="space-y-6 pb-10">
      <button 
        onClick={handleBack}
        className="flex items-center text-white hover:text-blue-300"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Clinics
      </button>
      
      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-5 flex flex-col-reverse md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center text-white">
            <Building2 className="h-6 w-6 mr-2 text-blue-400" />
            {basicInfo?.name}
          </h1>
          <p className="text-gray-400">{basicInfo?.id}</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center px-3 py-2 bg-white/5 border border-white/20 text-white rounded hover:bg-white/10 transition"
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </button>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="border-b border-white/10">
        <div className="flex space-x-6">
          <button
            className={`py-2 px-1 border-b-2 font-medium ${
              activeTab === 'overview' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium ${
              activeTab === 'charts' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('charts')}
          >
            Charts
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium ${
              activeTab === 'studies' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('studies')}
          >
            Studies
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <OverviewCard 
              title="Total Studies" 
              value={basicInfo?.totalStudies} 
              icon={<Building2 className="h-5 w-5 text-blue-400" />}
            />
            <OverviewCard 
              title="Open Studies" 
              value={basicInfo?.openStudies}
              percentage={basicInfo?.totalStudies ? 
                (basicInfo.openStudies / basicInfo.totalStudies) * 100 : 0}
              icon={<Calendar className="h-5 w-5 text-green-400" />}
            />
            <OverviewCard 
              title="Average Quality" 
              value={basicInfo?.averageQuality ? 
                `${(basicInfo.averageQuality * 100).toFixed(1)}%` : '0%'}
              icon={<LineChart className="h-5 w-5 text-amber-400" />}
            />
            <OverviewCard 
              title="Quality Hours" 
              value={basicInfo?.averageQualityHours ? 
                basicInfo.averageQualityHours.toFixed(1) : '0'}
              icon={<BarChart3 className="h-5 w-5 text-purple-400" />}
              variant="success"
            />
          </div>
          
          {/* Summary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Quality Trend */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:shadow-xl transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Weekly Quality</h3>
                <LineChart className="h-5 w-5 text-gray-400" />
              </div>
              <SimpleBarChart
                data={charts.weeklyQuality.data.map(point => ({
                  name: point.label || '',
                  value: point.value
                }))}
                xKey="name"
                yKey="value"
                label="%"
                color={charts.weeklyQuality.color || "#f59e0b"}
                height={220}
              />
            </div>
            
            {/* Weekly Studies */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:shadow-xl transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Weekly Studies</h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <SimpleBarChart
                data={charts.weeklyStudies.data.map(point => ({
                  name: point.label || '',
                  value: point.value
                }))}
                xKey="name"
                yKey="value"
                label=""
                color={charts.weeklyStudies.color || "#3b82f6"}
                height={220}
              />
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Quality Trend */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:shadow-xl transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Monthly Quality</h3>
                <LineChart className="h-5 w-5 text-gray-400" />
              </div>
              <SimpleBarChart
                data={charts.monthlyQuality.data.map(point => ({
                  name: point.label || '',
                  value: point.value
                }))}
                xKey="name"
                yKey="value"
                label="%"
                color={charts.monthlyQuality.color || "#10b981"}
                height={220}
              />
            </div>
            
            {/* Monthly Studies */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:shadow-xl transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Monthly Studies</h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <SimpleBarChart
                data={charts.monthlyStudies.data.map(point => ({
                  name: point.label || '',
                  value: point.value
                }))}
                xKey="name"
                yKey="value"
                label=""
                color={charts.monthlyStudies.color || "#8b5cf6"}
                height={220}
              />
            </div>
          </div>
          
          {/* Additional analytics from the analytics hook */}
          {analytics?.qualityBreakdown && analytics.qualityBreakdown.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:shadow-xl transition duration-300">
              <h3 className="text-lg font-semibold text-white mb-4">Quality Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <QualityMetricCard 
                  title="Good" 
                  value={analytics.qualityBreakdown[0].good_count} 
                  color="bg-emerald-400"
                />
                <QualityMetricCard 
                  title="Average" 
                  value={analytics.qualityBreakdown[0].soso_count} 
                  color="bg-amber-400"
                />
                <QualityMetricCard 
                  title="Poor" 
                  value={analytics.qualityBreakdown[0].bad_count} 
                  color="bg-orange-400"
                />
                <QualityMetricCard 
                  title="Critical" 
                  value={analytics.qualityBreakdown[0].critical_count} 
                  color="bg-red-400"
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'studies' && (
        <StudyManagementTable clinicId={clinicId || ''} />
      )}
    </div>
  );
}

interface OverviewCardProps {
  title: string;
  value?: number | string;
  percentage?: number;
  variant?: 'default' | 'warning' | 'success';
  icon?: React.ReactNode;
}

function OverviewCard({ title, value, percentage, variant = 'default', icon }: OverviewCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:shadow-xl hover:border-white/20 transition-all duration-300">
      <div className="flex justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value || 0}</h3>
          {percentage !== undefined && (
            <p className={`text-xs mt-2 ${
              variant === 'warning' ? 'text-amber-400' : 
              variant === 'success' ? 'text-emerald-400' : 
              'text-blue-400'
            }`}>
              {percentage.toFixed(1)}% of total
            </p>
          )}
        </div>
        {icon && (
          <div className={`rounded-lg p-2 h-fit ${
            variant === 'warning' ? 'bg-amber-500/20' : 
            variant === 'success' ? 'bg-emerald-500/20' : 
            'bg-blue-500/20'
          }`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function QualityMetricCard({ 
  title, 
  value,
  color
}: { 
  title: string, 
  value: number,
  color: string
}) {
  return (
    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${color}`}></div>
        <span className="text-gray-300">{title}</span>
      </div>
      <span className="text-lg font-medium text-white">{value}</span>
    </div>
  );
}
