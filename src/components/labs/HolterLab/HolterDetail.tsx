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
import MainECGViewer from '../../shared/ecg/MainECGViewer';
import { HolterHeader } from './components/HolterHeader';
import HourlyHistogram from './components/HourlyHistogram';
import { CalendarSelector } from '../../shared/CalendarSelector'; // <-- Updated import name

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

export default function HolterDetail() {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [showECG, setShowECG] = useState(false);

  // Fetch study data (details + diagnostics)
  const {
    data: studyDetails,
    isLoading: isStudyLoading,
    error: studyError,
  } = useQuery<EnhancedStudyDetails, Error>({
    queryKey: ['study_details', studyId],
    queryFn: async () => {
      if (!studyId) throw new Error('No studyId provided');

      // Get high-level study details
      const { data: studyData, error: studyError } = await supabase.rpc(
        'get_study_details_with_earliest_latest',
        {
          p_study_id: studyId,
        }
      );

      if (studyError) throw studyError;
      if (!studyData || !Array.isArray(studyData) || studyData.length === 0) {
        throw new Error('Study not found');
      }

      // Get diagnostics
      const { data: diagnosticsData, error: diagnosticsError } =
        await supabase.rpc('get_study_diagnostics', {
          p_study_id: studyId,
        });

      if (diagnosticsError) throw diagnosticsError;
      if (
        !diagnosticsData ||
        !Array.isArray(diagnosticsData) ||
        diagnosticsData.length === 0
      ) {
        throw new Error('Study diagnostics not found');
      }

      const study = studyData[0] as RPCStudyDetailsResponse;
      const diagnostics = diagnosticsData[0] as RPCStudyDiagnosticsResponse;

      // Determine status based on timestamps
      const now = new Date();
      const endTime = new Date(study.end_timestamp);
      const status: StudyStatus = now > endTime ? 'completed' : 'active';

      const enhancedStudy: EnhancedStudyDetails = {
        study_id: study.study_id,
        clinic_id: study.clinic_id,
        pod_id: study.pod_id,
        start_timestamp: study.start_timestamp,
        end_timestamp: study.end_timestamp,
        earliest_time: study.earliest_time,
        latest_time: study.latest_time,
        auto_open_ecg: false,
        patient_id: study.user_id || 'unknown',
        clinic_name: 'Loading...',
        status,
        interruption_count: diagnostics.interruptions,
        six_hour_variance: diagnostics.quality_fraction_variability,
        available_days: [],
        diagnostics: {
          quality_fraction_variability: diagnostics.quality_fraction_variability,
          total_minute_variability: diagnostics.total_minute_variability,
          interruptions: diagnostics.interruptions,
          bad_hours: diagnostics.bad_hours,
        },
      };

      return enhancedStudy;
    },
    enabled: !!studyId,
  });

  // Fetch available days (Pod-based)
  const { data: availableDays } = useQuery<string[], Error>({
    queryKey: ['pod_days', studyDetails?.pod_id],
    queryFn: async () => {
      if (!studyDetails?.pod_id) throw new Error('No pod_id available');

      const { data, error } = await supabase.rpc('get_pod_days', {
        p_pod_id: studyDetails.pod_id,
      });

      if (error) throw error;
      if (!data || !Array.isArray(data)) return [];
      return data.map((d: RPCPodDaysResponse) => d.day_value);
    },
    enabled: !!studyDetails?.pod_id,
  });

  const study = useMemo(() => {
    if (!studyDetails) return null;
    return {
      ...studyDetails,
      available_days: availableDays || [],
    };
  }, [studyDetails, availableDays]);

  function handleDaySelect(day: Date) {
    setSelectedDate(day);
    setSelectedHour(null);
  }

  function handleHourSelect(hr: number) {
    setSelectedHour(hr);
    if (study?.auto_open_ecg) {
      setShowECG(true);
    }
  }

  if (!studyId) {
    return <div className="text-red-400">No studyId param</div>;
  }
  if (isStudyLoading) {
    return <p className="text-gray-300">Loading Holter data...</p>;
  }
  if (!study) {
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
        podId={study.pod_id}
        patientId={study.patient_id}
        clinicName={study.clinic_name}
        status={study.status}
        interruptions={study.interruption_count}
        sixHourVariance={study.six_hour_variance}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarSelector
          availableDays={study.available_days || []}
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

      {selectedDate && selectedHour !== null && (
        <button
          onClick={() => setShowECG(true)}
          className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30"
        >
          View ECG for {selectedDate.toDateString()} {selectedHour}:00
        </button>
      )}

      {showECG && study && selectedDate && selectedHour !== null && (
        <MainECGViewer
          podId={study.pod_id}
          timeStart={new Date(
            selectedDate.setHours(selectedHour, 0, 0)
          ).toISOString()}
          timeEnd={new Date(
            selectedDate.setHours(selectedHour, 59, 59)
          ).toISOString()}
          onClose={() => setShowECG(false)}
        />
      )}
    </div>
  );
}
