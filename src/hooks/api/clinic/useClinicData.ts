import useSWR from 'swr'
import { supabase } from '@/hooks/api/core/supabase'
import type {
  ClinicTableStat,
  ClinicStatusBreakdown,
  WeeklyQualityMetric,
  WeeklyStudyCount
} from '@/types/database.types'

export const useClinicTableStats = () => {
  const { data, error, isLoading } = useSWR(
    'clinic-table-stats',
    async () => {
      const { data, error } = await supabase.rpc('get_clinic_table_stats')
      if (error) throw new Error(error.message)
      return data as ClinicTableStat[]
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000
    }
  )

  return { data, isLoading, error }
}

export const useClinicAnalytics = (clinicId: string) => {
  const fetchStatus = async () => {
    const { data, error } = await supabase.rpc('get_clinic_status_breakdown', {
      _clinic_id: clinicId
    })
    if (error) throw new Error(error.message)
    return data[0] as ClinicStatusBreakdown
  }

  const fetchQuality = async () => {
    const { data, error } = await supabase.rpc('get_clinic_weekly_quality', {
      _clinic_id: clinicId
    })
    if (error) throw new Error(error.message)
    return data as WeeklyQualityMetric[]
  }

  const fetchStudies = async () => {
    const { data, error } = await supabase.rpc('get_clinic_weekly_studies', {
      _clinic_id: clinicId
    })
    if (error) throw new Error(error.message)
    return data as WeeklyStudyCount[]
  }

  const status = useSWR(`clinic-status-${clinicId}`, fetchStatus)
  const quality = useSWR(`clinic-quality-${clinicId}`, fetchQuality)
  const studies = useSWR(`clinic-studies-${clinicId}`, fetchStudies)

  return {
    data: {
      status: status.data,
      quality: quality.data,
      studies: studies.data
    },
    isLoading: status.isLoading || quality.isLoading || studies.isLoading,
    error: status.error || quality.error || studies.error
  }
}