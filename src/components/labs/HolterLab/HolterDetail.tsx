/********************************************************************
 * FILE: src/components/labs/HolterLab/HolterDetail.tsx
 *
 * This file was updated to remove client-side aggregator logic
 * and instead leverage the new HourlyHistogram component,
 * which calls the "get_study_hourly_metrics" RPC for hourly data.
 ********************************************************************/
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/types/supabase';
import MainECGViewer from '@/components/shared/ecg/MainECGViewer';
import { HolterHeader } from './components/HolterHeader';
import HourlyHistogram from './components/HourlyHistogram';
import { CalendarSelector } from '@/components/shared/CalendarSelector/index';
import { useStudyDetails } from '@/hooks/api/study/useStudyDetails';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';

type StudyStatus = 'active' | 'error' | 'interrupted' | 'completed';

interface StudyDetails {
  study_id: string;
  clinic_id: string;
  pod_id: string;
  start_timestamp: string;
  end_timestamp: string;
  earliest_time: string;
  latest_time: string;
  user_id?: string;
}

interface StudyDiagnostics {
  quality_fraction_variability: number;
  total_minute_variability: number;
  interruptions: number;
  bad_hours: number;
}

interface EnhancedStudyDetails extends StudyDetails {
  auto_open_ecg: boolean;
  patient_id: string;
  clinic_name: string;
  status: StudyStatus;
  interruption_count: number;
  six_hour_variance: number;
  available_days: string[];
  diagnostics?: StudyDiagnostics;
}

interface RPCStudyDetailsResponse {
  study_id: string;
  clinic_id: string;
  pod_id: string;
  start_timestamp: string;
  end_timestamp: string;
  earliest_time: string;
  latest_time: string;
  user_id?: string;
}

interface RPCStudyDiagnosticsResponse {
  study_id: string;
  quality_fraction_variability: number;
  total_minute_variability: number;
  interruptions: number;
  bad_hours: number;
}

interface RPCPodDaysResponse {
  day_value: string;
}

// Helper function to determine study status
function getStudyStatus(study: any): StudyStatus {
  // Determine status based on timestamps
  const now = new Date();
  const endTime = new Date(study.end_timestamp);
  return now > endTime ? 'completed' : 'active';
}

export default function HolterDetail() {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [daySelected, setDaySelected] = useState<Date | null>(null);
  const [hourSelected, setHourSelected] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [ecgViewerOpen, setECGViewerOpen] = useState(false);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  // Use the useStudyDetails hook instead of direct RPC call
  const { data: studyData, error: studyError, isLoading: studyLoading } = useStudyDetails(studyId || null);

  // Get pod days 
  const { data: podDays, isLoading: podDaysLoading, error: podDaysError } = useQuery({
    queryKey: ['pod-days', studyData?.pod_id],
    enabled: !!studyData?.pod_id,
    queryFn: async () => {
      if (!studyData?.pod_id) throw new Error('No pod_id available');

      const { data, error } = await supabase.rpc('get_pod_days', {
        p_pod_id: studyData.pod_id
      });

      if (error) {
        console.error('Error fetching pod days', error);
        throw error;
      }

      return (data as RPCPodDaysResponse[]).map(day => new Date(day.day_value));
    }
  });
  
  // Study hourly diagnostics (to show in histogram)
  const { data: diagnosticsData, isLoading: diagnosticsLoading, error: diagnosticsError } = useQuery({
    queryKey: ['study-diagnostics', studyId],
    enabled: !!studyId,
    queryFn: async () => {
      if (!studyId) throw new Error('No studyId provided');

      const { data, error } = await supabase.rpc('get_study_diagnostics_hourly', {
        p_study_id: studyId
      });

      if (error) {
        console.error('Error fetching study diagnostics', error);
        throw error;
      }

      return data as RPCStudyDiagnosticsResponse;
    }
  });

  // Enhance study details with additional calculated properties
  const enhancedStudyDetails = useMemo(() => {
    if (!studyData) return undefined;

    // Convert pod_days to Date objects
    const availableDays = podDays || [];

    return {
      ...studyData,
      auto_open_ecg: false, // Could be a property on the study in the future
      available_days: availableDays.map(d => d.toISOString().substring(0, 10)),
      status: getStudyStatus(studyData),
      interruption_count: diagnosticsData?.interruptions || 0,
      six_hour_variance: diagnosticsData?.quality_fraction_variability || 0,
      diagnostics: diagnosticsData,
      clinic_name: studyData.clinic_name || 'Unknown Clinic',
      patient_id: studyData.user_id || 'Unknown' // Map user_id to patient_id
    } as EnhancedStudyDetails;
  }, [studyData, podDays, diagnosticsData]);

  function handleDaySelect(day: Date) {
    setSelectedDate(day);
    setHourSelected(null);
  }

  function handleHourSelect(hr: number) {
    setHourSelected(hr);
    if (enhancedStudyDetails?.auto_open_ecg) {
      setECGViewerOpen(true);
    }
  }

  if (!studyId) {
    return <div className="text-red-400">No studyId param</div>;
  }
  if (studyLoading) {
    return <p className="text-gray-300">Loading Holter data...</p>;
  }
  if (!enhancedStudyDetails) {
    return (
      <div className="text-gray-300">
        {studyError ? studyError.message : 'Study not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <button
        onClick={() => navigate(-1)}
        className="px-3 py-1 bg-white/10 rounded hover:bg-white/20"
      >
        Back
      </button>

      <HolterHeader
        studyId={studyId}
        podId={enhancedStudyDetails.pod_id}
        patientId={enhancedStudyDetails.patient_id}
        clinicName={enhancedStudyDetails.clinic_name}
        status={enhancedStudyDetails.status}
        interruptions={enhancedStudyDetails.interruption_count}
        sixHourVariance={enhancedStudyDetails.six_hour_variance}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarSelector
          availableDays={enhancedStudyDetails.available_days || []}
          onSelectDay={handleDaySelect}
          selectedDate={selectedDate}
        />

        {selectedDate && (
          <HourlyHistogram
            date={selectedDate}
            studyId={studyId}
            onHourClick={handleHourSelect}
          />
        )}
      </div>

      {selectedDate && hourSelected !== null && (
        <button
          onClick={() => setECGViewerOpen(true)}
          className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30"
        >
          View ECG for {selectedDate.toDateString()} {hourSelected}:00
        </button>
      )}

      {ecgViewerOpen && enhancedStudyDetails && selectedDate && hourSelected !== null && (
        <MainECGViewer
          podId={enhancedStudyDetails.pod_id}
          timeStart={new Date(
            selectedDate.setHours(hourSelected, 0, 0)
          ).toISOString()}
          timeEnd={new Date(
            selectedDate.setHours(hourSelected, 59, 59)
          ).toISOString()}
          onClose={() => setECGViewerOpen(false)}
        />
      )}
    </div>
  );
}
