import useSWR from 'swr'
import { supabase } from '@/types/supabase'
import type { Database } from '@/types/database.types'
import { toClinicStatsRow } from '@/types/domain/clinic'
import { useMemo } from 'react'

// Define the return type from get_clinic_table_stats RPC function
export type ClinicTableStat = Database['public']['Functions']['get_clinic_table_stats']['Returns'][0]

export type ClinicTableFilter = {
  search?: string
  status?: 'all' | 'active' | 'critical' | 'on_target' | 'monitor' | 'intervene'
  minQuality?: number
  maxQuality?: number
  qualityRange?: number[]
}

/**
 * Hook to fetch all clinic stats from the consolidated RPC function.
 * Supports filtering of results based on filter criteria.
 */
export const useClinicTableStats = (filter?: ClinicTableFilter) => {
  const { data, error, isLoading, mutate } = useSWR(
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

  // Apply client-side filtering based on filter criteria
  const filteredData = useMemo(() => {
    if (!data) return []
    
    let filtered = [...data]
    
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase()
      filtered = filtered.filter(clinic => 
        clinic.clinic_name.toLowerCase().includes(searchLower)
      )
    }
    
    if (filter?.minQuality !== undefined) {
      filtered = filtered.filter(clinic => 
        clinic.average_quality >= filter.minQuality!
      )
    }
    
    if (filter?.maxQuality !== undefined) {
      filtered = filtered.filter(clinic => 
        clinic.average_quality <= filter.maxQuality!
      )
    }
    
    if (filter?.status === 'active') {
      filtered = filtered.filter(clinic => clinic.open_studies > 0)
    } else if (filter?.status === 'critical') {
      filtered = filtered.filter(clinic => clinic.critical_count > 0)
    } else if (filter?.status === 'on_target') {
      filtered = filtered.filter(clinic => clinic.on_target_count > 0)
    } else if (filter?.status === 'monitor') {
      filtered = filtered.filter(clinic => clinic.monitor_count > 0)
    } else if (filter?.status === 'intervene') {
      filtered = filtered.filter(clinic => clinic.intervene_count > 0)
    }
    
    return filtered
  }, [data, filter])

  // Transform database types to domain types
  const transformedData = useMemo(() => {
    return filteredData.map(toClinicStatsRow)
  }, [filteredData])

  return { 
    data: transformedData, 
    rawData: filteredData,
    isLoading, 
    error,
    mutate
  }
}

/**
 * Hook to get a single clinic's stats from get_clinic_table_stats.
 * Returns null if not found.
 */
export const useClinicDetails = (clinicId: string | null) => {
  const { data: allClinics, rawData, error, isLoading, mutate } = useClinicTableStats()
  
  // Find the specific clinic in the transformed data
  const clinicData = useMemo(() => {
    if (!clinicId || !allClinics) return null
    return allClinics.find(clinic => clinic.clinic_id === clinicId) || null
  }, [clinicId, allClinics])

  // Find the raw clinic data for advanced processing
  const rawClinicData = useMemo(() => {
    if (!clinicId || !rawData) return null
    return rawData.find(clinic => clinic.clinic_id === clinicId) || null
  }, [clinicId, rawData])

  return { 
    data: clinicData,
    rawData: rawClinicData,
    isLoading,
    error,
    mutate
  }
}

/**
 * Hook to fetch weekly and monthly time series data for clinic charts
 */
export const useClinicTimeSeriesData = (clinicId: string | null) => {
  // Type definitions for the RPC function returns
  type WeeklyQualityMetric = Database['public']['Functions']['get_clinic_weekly_quality']['Returns'][0]
  type WeeklyStudyCount = Database['public']['Functions']['get_clinic_weekly_studies']['Returns'][0]

  // Weekly quality data
  const weeklyQuality = useSWR(
    clinicId ? `clinic-weekly-quality-${clinicId}` : null,
    async () => {
      const { data, error } = await supabase.rpc('get_clinic_weekly_quality', {
        _clinic_id: clinicId!
      })
      if (error) throw new Error(error.message)
      return data as WeeklyQualityMetric[]
    }
  )
  
  // Weekly studies data
  const weeklyStudies = useSWR(
    clinicId ? `clinic-weekly-studies-${clinicId}` : null,
    async () => {
      const { data, error } = await supabase.rpc('get_clinic_weekly_studies', {
        _clinic_id: clinicId!
      })
      if (error) throw new Error(error.message)
      return data as WeeklyStudyCount[]
    }
  )
  
  return {
    weeklyQuality: {
      data: weeklyQuality.data || [],
      isLoading: weeklyQuality.isLoading,
      error: weeklyQuality.error
    },
    weeklyStudies: {
      data: weeklyStudies.data || [],
      isLoading: weeklyStudies.isLoading,
      error: weeklyStudies.error
    },
    isLoading: weeklyQuality.isLoading || weeklyStudies.isLoading,
    error: weeklyQuality.error || weeklyStudies.error
  }
}