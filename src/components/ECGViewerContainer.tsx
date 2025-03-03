import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, Clock, Heart, 
  Activity, Maximize, Minimize, BarChart 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePodDays } from '@/hooks/api/pod/usePodDays';
import { useECGAggregates } from '@/hooks/api/ecg/useECGAggregates';
import { CalendarSelector } from '@/components/shared/CalendarSelector';
import { ECGTimelineBar } from '@/components/shared/ecg/ECGTimelineBar';
import MainECGViewer from '@/components/shared/ecg/MainECGViewer';
import { ECGDiagnosticsPanel } from '@/components/shared/ecg/ECGDiagnosticsPanel';

/**
 * ECGViewerContainer
 * 
 * Main container for ECG visualization that orchestrates:
 * 1. Calendar day selection
 * 2. Timeline selection
 * 3. ECG visualization
 */
export default function ECGViewerContainer() {
  const { podId } = useParams<{ podId: string }>();

  // State for selected day and time range
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [timeRange, setTimeRange] = useState<{ start: string; end: string } | null>(null);
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // Fetch available days for this pod
  const { data: availableDays, isLoading: daysLoading } = usePodDays(podId || null);

  // The CalendarSelector component now handles setting the initial day to the most recent day
  // We don't need this effect anymore as it's handled by the CalendarSelector

  // Prepare time range for the selected day (full day by default)
  useEffect(() => {
    if (selectedDay) {
      const startOfDay = new Date(selectedDay);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDay);
      endOfDay.setHours(23, 59, 59, 999);
      
      setTimeRange({
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      });
    }
  }, [selectedDay]);

  // Fetch aggregated data for timeline
  const { data: aggregateResponse, isLoading: aggregateLoading } = useECGAggregates({
    podId: podId || null,
    startTime: timeRange?.start || '',
    endTime: timeRange?.end || '',
    bucketSize: 3600, // 1 hour buckets for day view
    enabled: !!timeRange && !!podId,
  });

  // Handle timeline range selection
  const handleTimelineSelect = (startIdx: number, endIdx: number) => {
    if (!aggregateResponse || !aggregateResponse.data.length) return;
    
    setSelectedRange([startIdx, endIdx]);
    
    // Determine the actual time range based on the selected indices
    const startBucket = aggregateResponse.data[startIdx]?.time_bucket;
    const endBucket = aggregateResponse.data[endIdx]?.time_bucket;
    
    if (startBucket && endBucket) {
      setTimeRange({
        start: startBucket,
        end: new Date(new Date(endBucket).getTime() + 3600000).toISOString() // Add 1 hour to end
      });
      
      // Open the viewer with this time range
      setViewerOpen(true);
    }
  };

  // Handle day selection in calendar
  const handleDaySelect = (day: Date) => {
    setSelectedDay(day);
    setSelectedRange(null); // Reset selected range when day changes
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Select a date';
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors">
            <ChevronLeft size={16} />
            <span className="font-medium">Back to Studies</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">ECG Viewer <span className="text-blue-600">Pod {podId}</span></h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              showDiagnostics 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={showDiagnostics ? "Hide diagnostics panel" : "Show diagnostics panel"}
          >
            {showDiagnostics ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 
                     rounded-lg font-medium transition-colors"
            title="View ECG Analytics"
          >
            <BarChart className="h-4 w-4" />
            Analytics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-blue-600" />
            <h2 className="text-lg font-medium">Select Date</h2>
          </div>
          
          {daysLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <CalendarSelector
              availableDays={availableDays || []}
              selectedDate={selectedDay}
              onSelectDay={handleDaySelect}
            />
          )}
          
          {selectedDay && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">Selected: {formatDate(selectedDay)}</p>
            </div>
          )}
        </div>
        
        {/* Timeline Section */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-blue-600" />
            <h2 className="text-lg font-medium">Select Time Window</h2>
          </div>
          
          {aggregateLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !aggregateResponse || aggregateResponse.data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No ECG data available for this day
            </div>
          ) : (
            <>
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  Click and drag to select a time range for detailed view
                </p>
              </div>
              <ECGTimelineBar
                data={aggregateResponse.data}
                width={800}
                height={60}
                onSelectRange={handleTimelineSelect}
                selectedRange={selectedRange}
              />
              
              {timeRange && (
                <div className="mt-3 flex justify-between text-sm text-gray-600">
                  <span>{new Date(timeRange.start).toLocaleTimeString()}</span>
                  <span>{new Date(timeRange.end).toLocaleTimeString()}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Main ECG Viewer */}
      {viewerOpen && timeRange && (
        <div className="bg-gray-900 rounded-lg shadow-lg p-4 border border-gray-800">
          <MainECGViewer
            podId={podId || ''}
            timeStart={timeRange.start}
            timeEnd={timeRange.end}
            onClose={() => setViewerOpen(false)}
          />
        </div>
      )}
      
      {/* Diagnostics Panel */}
      {showDiagnostics && (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-medium text-gray-800">ECG Diagnostics</h2>
            </div>
            <button
              onClick={() => setShowDiagnostics(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close diagnostics"
            >
              <Minimize className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <ECGDiagnosticsPanel
            initiallyOpen={true}
            onClose={() => setShowDiagnostics(false)}
          />
        </div>
      )}
    </div>
  );
}
