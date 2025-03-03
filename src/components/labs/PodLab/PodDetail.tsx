import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Battery, Calendar, Laptop, AlertCircle, BarChart4 } from 'lucide-react';
import { formatDuration } from '@/utils/formatters';
import { supabase } from '@/types/supabase';
import { useRPC } from '@/hooks/api/core';
import { usePodDays } from '@/hooks/api/pod/usePodDays';
import { usePodEarliestLatest } from '@/hooks/api/pod/usePodEarliestLatest';
import { Histogram } from '@/components/shared/Histogram';
import SparklineChart from '@/components/labs/ClinicLab/components/SparklineChart';
import { logger } from '@/lib/logger';
import { TimeRangeProvider } from '@/context/TimeRangeContext';
import MainECGViewer from '@/components/shared/ecg/MainECGViewer';
import { CalendarSelector } from '@/components/shared/CalendarSelector';

// Type for studies associated with a pod
interface PodStudy {
  study_id: string;
  study_type: string;
  start_timestamp: string;
  end_timestamp: string;
  aggregated_quality_minutes: number;
  aggregated_total_minutes: number;
  quality_fraction: number;
  status: string;
  created_at: string;
}

interface PodUsageMetrics {
  totalStudies: number;
  totalHoursRecorded: number;
  qualityHours: number;
  firstUsedDate: Date | null;
  lastUsedDate: Date | null;
  daysInUse: number;
  statusCounts: Record<string, number>;
}

export default function PodDetail() {
  const { podId } = useParams<{ podId: string }>();
  const { callRPC } = useRPC();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [ecgViewerOpen, setEcgViewerOpen] = useState(false);
  
  // Fetch pod details
  const { data: podData, isLoading: podLoading } = useQuery({
    queryKey: ['pod', podId],
    queryFn: async () => {
      if (!podId) return null;
      
      const { data, error } = await supabase
        .from('pod')
        .select('*')
        .eq('id', podId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!podId
  });
  
  // Fetch pod days availability
  const { data: podDays = [] } = usePodDays(podId || null);
  
  // Fetch earliest/latest times
  const { earliest_time, latest_time } = usePodEarliestLatest(podId || null);
  
  // Auto-select most recent day from pod days when data is loaded
  useEffect(() => {
    if (podDays && podDays.length > 0) {
      // Sort days and select the most recent one
      const sortedDays = [...podDays].sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );
      setSelectedDate(new Date(sortedDays[0]));
    }
  }, [podDays]);
  
  // Fetch studies associated with this pod
  const { data: podStudies = [], isLoading: studiesLoading } = useQuery<PodStudy[]>({
    queryKey: ['pod-studies', podId],
    queryFn: async () => {
      if (!podId) return [];
      
      try {
        const studies = await callRPC('get_studies_with_pod_times', {}, { 
          component: 'PodDetail',
          context: { podId }
        });
        
        if (!Array.isArray(studies)) {
          return [];
        }
        
        // Filter studies for this pod
        return studies
          .filter(study => study.pod_id === podId)
          .map(study => ({
            study_id: study.study_id,
            study_type: study.study_type || '',
            start_timestamp: study.study_start || '',
            end_timestamp: study.study_completed || '',
            aggregated_quality_minutes: study.aggregated_quality_minutes || 0,
            aggregated_total_minutes: study.aggregated_total_minutes || 0,
            quality_fraction: study.quality_fraction || 0,
            status: study.study_status || '',
            created_at: study.created_at || ''
          }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } catch (error) {
        logger.error('Failed to fetch pod studies', { error, podId });
        return [];
      }
    },
    enabled: !!podId
  });
  
  // Calculate metrics
  const podMetrics = useMemo<PodUsageMetrics>(() => {
    const totalStudies = podStudies.length;
    const totalMinutes = podStudies.reduce((sum, study) => sum + (study.aggregated_total_minutes || 0), 0);
    const qualityMinutes = podStudies.reduce((sum, study) => sum + (study.aggregated_quality_minutes || 0), 0);
    
    const statusCounts: Record<string, number> = {};
    podStudies.forEach(study => {
      const status = study.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Calculate days in use
    let daysInUse = 0;
    if (earliest_time && latest_time) {
      const diffTime = Math.abs(latest_time.getTime() - earliest_time.getTime());
      daysInUse = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return {
      totalStudies,
      totalHoursRecorded: Math.round(totalMinutes / 60),
      qualityHours: Math.round(qualityMinutes / 60),
      firstUsedDate: earliest_time,
      lastUsedDate: latest_time,
      daysInUse,
      statusCounts
    };
  }, [podStudies, earliest_time, latest_time]);
  
  // Generate quality metrics for visualization
  const qualityByDay = useMemo(() => {
    const dayMap: Record<string, { day: string, quality: number, total: number }> = {};
    
    // Group and summarize by day
    podStudies.forEach(study => {
      const startDay = study.start_timestamp ? new Date(study.start_timestamp).toISOString().split('T')[0] : null;
      
      if (startDay) {
        if (!dayMap[startDay]) {
          dayMap[startDay] = { day: startDay, quality: 0, total: 0 };
        }
        
        dayMap[startDay].quality += study.aggregated_quality_minutes || 0;
        dayMap[startDay].total += study.aggregated_total_minutes || 0;
      }
    });
    
    // Convert to array and calculate percentages
    return Object.values(dayMap)
      .map(item => ({
        day: item.day,
        qualityPercent: item.total > 0 ? (item.quality / item.total) * 100 : 0,
        totalHours: Math.round(item.total / 60)
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [podStudies]);
  
  // Generate histogram data from pod days
  const histogramData = useMemo(() => {
    return qualityByDay.map((day, index) => ({
      hour: index,
      value: day.totalHours,
      quality: day.qualityPercent / 100,
      label: new Date(day.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
  }, [qualityByDay]);
  
  // Handle day selection
  const handleDaySelect = (day: Date) => {
    setSelectedDate(day);
    setSelectedHour(null);
  };

  // Handle hour selection
  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
  };
  
  // No data state
  if (!podId) {
    return <div className="p-6">No pod ID specified</div>;
  }
  
  return (
    <div className="w-full">
      {/* Header with back button */}
      <div className="pb-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link 
            to="/pod" 
            className="p-2 rounded-full hover:bg-gray-800 transition-colors duration-150"
            aria-label="Back to Pod List"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <h1 className="text-2xl font-semibold text-white">
            Pod Details: <span className="text-blue-400">{podId}</span>
          </h1>
        </div>
        
        {podData?.status && (
          <div className="mt-2 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-300">
              {podData.status}
            </span>
            {podData.assigned_study_id && (
              <Link 
                to={`/holter/${podData.assigned_study_id}`}
                className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                Current Study: {podData.assigned_study_id}
              </Link>
            )}
          </div>
        )}
      </div>
      
      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-4 shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex justify-between">
            <h3 className="text-gray-400 font-medium">Total Studies</h3>
            <span className="p-1.5 bg-blue-500/20 rounded-md">
              <Laptop className="w-5 h-5 text-blue-400" />
            </span>
          </div>
          <p className="text-3xl font-semibold text-white mt-2">{podMetrics.totalStudies}</p>
          <p className="text-sm text-gray-400 mt-1">
            Latest: {podMetrics.lastUsedDate?.toLocaleDateString() || 'N/A'}
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-4 shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex justify-between">
            <h3 className="text-gray-400 font-medium">Hours Recorded</h3>
            <span className="p-1.5 bg-emerald-500/20 rounded-md">
              <Clock className="w-5 h-5 text-emerald-400" />
            </span>
          </div>
          <p className="text-3xl font-semibold text-white mt-2">{podMetrics.totalHoursRecorded}</p>
          <p className="text-sm text-gray-400 mt-1">
            Quality: {podMetrics.qualityHours} hours ({podMetrics.totalHoursRecorded > 0 
              ? Math.round((podMetrics.qualityHours / podMetrics.totalHoursRecorded) * 100) 
              : 0}%)
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-4 shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex justify-between">
            <h3 className="text-gray-400 font-medium">Usage Period</h3>
            <span className="p-1.5 bg-purple-500/20 rounded-md">
              <Calendar className="w-5 h-5 text-purple-400" />
            </span>
          </div>
          <p className="text-3xl font-semibold text-white mt-2">{podMetrics.daysInUse} days</p>
          <p className="text-sm text-gray-400 mt-1">
            First used: {podMetrics.firstUsedDate?.toLocaleDateString() || 'Never'}
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-4 shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex justify-between">
            <h3 className="text-gray-400 font-medium">Status</h3>
            <span className="p-1.5 bg-amber-500/20 rounded-md">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </span>
          </div>
          <p className="text-3xl font-semibold text-white mt-2">{podData?.status || 'Unknown'}</p>
          <p className="text-sm text-gray-400 mt-1">
            Time in use: {formatDuration(podData?.time_since_first_use || 0)}
          </p>
        </div>
        
        {/* New card for earliest/latest timestamps */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-4 shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex justify-between">
            <h3 className="text-gray-400 font-medium">Time Range</h3>
            <span className="p-1.5 bg-indigo-500/20 rounded-md">
              <Clock className="w-5 h-5 text-indigo-400" />
            </span>
          </div>
          <div className="mt-2">
            {earliest_time ? (
              <div className="text-sm">
                <p className="text-gray-400">First:</p>
                <p className="text-white font-semibold">{earliest_time.toLocaleDateString()} {earliest_time.toLocaleTimeString()}</p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No data available</p>
            )}
            {latest_time && (
              <div className="text-sm mt-2">
                <p className="text-gray-400">Last:</p> 
                <p className="text-white font-semibold">{latest_time.toLocaleDateString()} {latest_time.toLocaleTimeString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
        {/* Quality over time */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Quality Metrics</h2>
            <span className="p-1.5 bg-blue-500/20 rounded-md">
              <BarChart4 className="w-5 h-5 text-blue-400" />
            </span>
          </div>
          
          {qualityByDay.length > 0 ? (
            <Histogram 
              data={histogramData}
              height={250}
              barColor="#22c55e"
              showQuality={true}
              title=""
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] border border-dashed border-gray-700 rounded-lg bg-gray-800/20">
              <AlertCircle className="w-8 h-8 text-gray-500 mb-2" />
              <p className="text-gray-400">No quality data available</p>
            </div>
          )}
          <p className="text-sm text-gray-400 mt-4">
            The chart shows recording quality by day (green bars represent quality data percentage)
          </p>
        </div>
        
        {/* Studies timeline */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Study History</h2>
            <span className="text-sm text-blue-400 font-medium">
              {podMetrics.totalStudies} studies
            </span>
          </div>
          
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {podStudies.map(study => (
              <div 
                key={study.study_id} 
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-blue-800 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Link 
                      to={`/holter/${study.study_id}`} 
                      className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors"
                    >
                      {study.study_id}
                    </Link>
                    <p className="text-gray-400 text-sm mt-1">
                      Type: {study.study_type || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${study.status === 'completed' 
                      ? 'bg-green-500/20 text-green-300' 
                      : study.status === 'on_target' 
                      ? 'bg-blue-500/20 text-blue-300' 
                      : 'bg-amber-500/20 text-amber-300'}`}
                    >
                      {study.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(study.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Time recorded</p>
                    <p className="text-sm text-white">
                      {Math.round((study.aggregated_total_minutes || 0) / 60)} hours
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Quality</p>
                    <p className="text-sm text-white">
                      {study.quality_fraction ? (study.quality_fraction * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
                
                {/* Quality bar */}
                <div className="mt-3 h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${study.quality_fraction ? study.quality_fraction * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            
            {podStudies.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[250px] border border-dashed border-gray-700 rounded-lg bg-gray-800/20">
                <AlertCircle className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-gray-400">No studies found for this pod</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* ECG Viewer Section */}
      <div className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">ECG Viewer</h2>
          <span className="text-sm text-blue-400 font-medium">
            Select a date and hour to view ECG
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Calendar Selector */}
          <div className="col-span-1">
            <CalendarSelector
              availableDays={podDays}
              onSelectDay={handleDaySelect}
              selectedDate={selectedDate}
              variant="pod"
              title="Pod Availability"
            />
          </div>
          
          {/* Hour selector */}
          {selectedDate && (
            <div className="col-span-2">
              <h3 className="text-md font-medium text-white mb-3">Select Hour</h3>
              <Histogram 
                data={Array.from({ length: 24 }, (_, i) => ({
                  hour: i,
                  value: 1,
                  label: `${String(i).padStart(2, '0')}:00`
                }))}
                height={200}
                barColor="#6366f1"
                onHourSelect={handleHourSelect}
                selectedHour={selectedHour !== null ? selectedHour : undefined}
                variant="24h"
              />
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        {selectedDate && selectedHour !== null && (
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => setEcgViewerOpen(true)}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 transition-colors gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              View ECG
            </button>
            
            <button
              className="inline-flex items-center px-4 py-2.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors gap-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download ECG
            </button>
          </div>
        )}
      </div>
      
      {/* ECG Viewer Modal */}
      {ecgViewerOpen && selectedDate && selectedHour !== null && podId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
          <div className="bg-gray-900 rounded-lg w-[95vw] h-[90vh] p-4 relative">
            <button 
              onClick={() => setEcgViewerOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="h-full overflow-hidden">
              <TimeRangeProvider>
                <MainECGViewer
                  podId={podId}
                  timeStart={new Date(
                    new Date(selectedDate.getTime()).setHours(selectedHour, 0, 0)
                  ).toISOString()}
                  timeEnd={new Date(
                    new Date(selectedDate.getTime()).setHours(selectedHour, 59, 59)
                  ).toISOString()}
                  onClose={() => setEcgViewerOpen(false)}
                />
              </TimeRangeProvider>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 