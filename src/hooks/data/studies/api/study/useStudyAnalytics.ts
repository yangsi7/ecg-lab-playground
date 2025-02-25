import { useState, useEffect, useCallback } from 'react';
import { callRPC } from '../core/utils';
import type { UseQueryResult } from '../core/types';
import { QueryError } from '../core/errors';
import type { Database } from '../../../types/database.types';

type StudyDiagnostics = Database['public']['Functions']['get_study_diagnostics']['Returns'][number];

export interface StudyAnalytics extends StudyDiagnostics {
  qualityScore: number;
  completionPercentage: number;
  daysRemaining: number;
  status: 'on_track' | 'needs_attention' | 'critical' | 'completed';
}

export type UseStudyAnalyticsResult = UseQueryResult<StudyAnalytics>;

function calculateQualityScore(diagnostics: StudyDiagnostics): number {
  const { quality_fraction_variability, total_minute_variability, interruptions, bad_hours } = diagnostics;
  
  // Convert to a 0-100 scale where lower values are better
  const qualityVariabilityScore = Math.max(0, 100 - quality_fraction_variability * 100);
  const timeVariabilityScore = Math.max(0, 100 - total_minute_variability * 100);
  const interruptionScore = Math.max(0, 100 - (interruptions * 5)); // -5 points per interruption
  const badHoursScore = Math.max(0, 100 - (bad_hours * 2)); // -2 points per bad hour

  // Weighted average
  return (
    (qualityVariabilityScore * 0.4) +
    (timeVariabilityScore * 0.3) +
    (interruptionScore * 0.2) +
    (badHoursScore * 0.1)
  );
}

function calculateStatus(
  qualityScore: number,
  completionPercentage: number,
  daysRemaining: number
): StudyAnalytics['status'] {
  if (completionPercentage >= 100) return 'completed';
  if (qualityScore < 50 || (daysRemaining <= 2 && completionPercentage < 80)) return 'critical';
  if (qualityScore < 70 || (daysRemaining <= 5 && completionPercentage < 90)) return 'needs_attention';
  return 'on_track';
}

export function useStudyAnalytics(studyId?: string): UseStudyAnalyticsResult {
  const [data, setData] = useState<StudyAnalytics | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!studyId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch study diagnostics
      const diagnostics = await callRPC('get_study_diagnostics', {
        p_study_id: studyId
      });

      if (!diagnostics || diagnostics.length === 0) {
        throw new QueryError(`No diagnostics found for study ${studyId}`);
      }

      // Fetch study details for completion calculation
      const details = await callRPC('get_study_details_with_earliest_latest', {
        p_study_id: studyId
      });

      if (!details || details.length === 0) {
        throw new QueryError(`Study ${studyId} not found`);
      }

      const study = details[0];
      const now = new Date();
      const endDate = new Date(study.end_timestamp);
      const startDate = new Date(study.start_timestamp);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const completionPercentage = Math.min(100, (elapsedDays / totalDays) * 100);
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      const baseDiagnostics = diagnostics[0];
      const qualityScore = calculateQualityScore(baseDiagnostics);
      const status = calculateStatus(qualityScore, completionPercentage, daysRemaining);

      setData({
        ...baseDiagnostics,
        qualityScore,
        completionPercentage,
        daysRemaining,
        status
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new QueryError('Failed to fetch study analytics'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch: fetchAnalytics
  };
} 