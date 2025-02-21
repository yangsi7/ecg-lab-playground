/**
 * src/hooks/useClinicAnalytics.ts
 *
 * Provides a single, streamlined approach to fetching various clinic-level stats from Supabase
 * via RPC functions
 */

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { callRPC } from '@/hooks/api/core/utils'
import type { Database } from '@/types/database.types'
import type {
  ClinicAnalyticsResult,
  ClinicOverview,
  ClinicStatusBreakdown,
  ClinicQualityBreakdown,
  WeeklyMonthlyQuality,
  WeeklyMonthlyStudies,
  WeeklyHistogramPoint,
  ClinicStatsRow
} from '@/types/domain/clinic'

// Hook: useClinicAnalytics
// Allows an optional clinicId argument. If omitted => fetch data for all clinics.
export function useClinicAnalytics(clinicId: string | null): ClinicAnalyticsResult {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<ClinicOverview | null>(null)
  const [statusBreakdown, setStatusBreakdown] = useState<ClinicStatusBreakdown[] | null>(null)
  const [qualityBreakdown, setQualityBreakdown] = useState<ClinicQualityBreakdown[] | null>(null)
  const [weeklyQuality, setWeeklyQuality] = useState<WeeklyMonthlyQuality[]>([])
  const [monthlyQuality, setMonthlyQuality] = useState<WeeklyMonthlyQuality[]>([])
  const [weeklyStudies, setWeeklyStudies] = useState<WeeklyMonthlyStudies[]>([])
  const [monthlyStudies, setMonthlyStudies] = useState<WeeklyMonthlyStudies[]>([])
  const [weeklyActiveStudies, setWeeklyActiveStudies] = useState<WeeklyHistogramPoint[]>([])
  const [weeklyAvgQuality, setWeeklyAvgQuality] = useState<WeeklyHistogramPoint[]>([])
  const [clinicBreakdown, setClinicBreakdown] = useState<ClinicStatsRow[]>([])
  const [newStudiesLast3mo, setNewStudiesLast3mo] = useState(0)
  const [growthPercent, setGrowthPercent] = useState(0)

  useEffect(() => {
    let canceled = false

    async function fetchAnalytics() {
      if (!clinicId) {
        setOverview(null)
        setStatusBreakdown(null)
        setQualityBreakdown(null)
        setWeeklyQuality([])
        setMonthlyQuality([])
        setWeeklyStudies([])
        setMonthlyStudies([])
        setWeeklyActiveStudies([])
        setWeeklyAvgQuality([])
        setClinicBreakdown([])
        setNewStudiesLast3mo(0)
        setGrowthPercent(0)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        logger.debug('Fetching clinic analytics', { clinicId })
        const result = await callRPC('get_clinic_analytics', { clinic_id: clinicId })
        
        if (!canceled && result) {
          // Transform the result into the expected shape
          const analytics = result[0] as { totalpatients: number; activepatients: number; totalstudies: number; activestudies: number }
          setOverview({
            active_studies: analytics.activestudies,
            total_studies: analytics.totalstudies,
            average_quality_hours: 0, // Not available in the current response
            recent_alerts: null // Not available in the current response
          })
          // Other fields are not available in the current response
          setStatusBreakdown(null)
          setQualityBreakdown(null)
          setWeeklyQuality([])
          setMonthlyQuality([])
          setWeeklyStudies([])
          setMonthlyStudies([])
          setWeeklyActiveStudies([])
          setWeeklyAvgQuality([])
          setClinicBreakdown([])
          setNewStudiesLast3mo(0)
          setGrowthPercent(0)
        }
      } catch (err: any) {
        if (!canceled) {
          logger.error('Failed to fetch clinic analytics', { error: err.message })
          setError(err.message)
        }
      } finally {
        if (!canceled) {
          setLoading(false)
        }
      }
    }

    fetchAnalytics()

    return () => {
      canceled = true
    }
  }, [clinicId])

  return {
    loading,
    error,
    overview,
    statusBreakdown,
    qualityBreakdown,
    weeklyQuality,
    monthlyQuality,
    weeklyStudies,
    monthlyStudies,
    weeklyActiveStudies,
    weeklyAvgQuality,
    clinicBreakdown,
    newStudiesLast3mo,
    growthPercent
  }
}
