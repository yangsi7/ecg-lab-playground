/**
 * src/hooks/api/clinic/useClinicDetails.ts
 * 
 * Enhanced hook for fetching detailed clinic data including time series data for charts.
 * This hook combines multiple data sources to provide a comprehensive view of clinic metrics.
 */

import { useQuery } from '@tanstack/react-query';
import { useRPC } from '@/hooks/api/core';
import { logger } from '@/lib/logger';
import { useMemo } from 'react';
import { useClinicTableStats } from './useClinicData';
import type { Database } from '@/types/database.types';

// Define types for the RPC function returns based on database.types.ts
type MonthlyQualityData = Database['public']['Functions']['get_clinic_monthly_quality']['Returns'][0];
type MonthlyStudiesData = Database['public']['Functions']['get_clinic_monthly_studies']['Returns'][0];
type WeeklyQualityData = Database['public']['Functions']['get_clinic_weekly_quality']['Returns'][0];
type WeeklyStudiesData = Database['public']['Functions']['get_clinic_weekly_studies']['Returns'][0];

// Chart data types
type ChartDataPoint = {
  date: string;
  value: number;
  label?: string;
};

type ChartSeries = {
  name: string;
  data: ChartDataPoint[];
  color?: string;
};

// Combined return type for the hook
interface ClinicDetailsResult {
  basicInfo: {
    id: string;
    name: string;
    totalStudies: number;
    openStudies: number;
    averageQuality: number;
    averageQualityHours: number;
  } | null;
  charts: {
    monthlyQuality: ChartSeries;
    monthlyStudies: ChartSeries;
    weeklyQuality: ChartSeries;
    weeklyStudies: ChartSeries;
  };
  qualityDistribution: {
    good: number;
    soso: number;
    bad: number;
    critical: number;
  } | null;
  statusDistribution: {
    intervene: number;
    monitor: number;
    onTarget: number;
    nearCompletion: number;
    needsExtension: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Format a date string to a more readable format
 */
function formatDateString(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Hook to fetch detailed clinic data including time series data for charts
 */
export function useClinicDetails(clinicId: string | null): ClinicDetailsResult {
  const { callRPC } = useRPC();
  
  // Get basic clinic info from the table stats
  const { 
    rawData: clinicsRawData, 
    data: clinicsData,
    isLoading: isLoadingBasicInfo, 
    error: basicInfoError 
  } = useClinicTableStats();

  // Query for monthly quality data
  const monthlyQuality = useQuery({
    queryKey: ['clinic-monthly-quality', clinicId],
    queryFn: async () => {
      logger.debug('Fetching clinic monthly quality', { clinicId });
      
      try {
        // If clinicId is null, fetch data for all clinics
        // The get_clinic_monthly_quality function has an overload that takes no arguments
        const data = await callRPC(
          'get_clinic_monthly_quality', 
          {}, // Empty object for no arguments
          { component: 'useClinicDetails', context: { metric: 'monthly-quality', clinicId } }
        );
        
        logger.debug('Received monthly quality data', {
          dataReceived: !!data,
          itemCount: Array.isArray(data) ? data.length : 0
        });
        
        if (clinicId) {
          // Filter for the specific clinic if clinicId is provided
          return (data as MonthlyQualityData[]).filter(item => 
            item.clinic_id === clinicId
          );
        }
        
        return data as MonthlyQualityData[];
      } catch (error) {
        logger.error('Failed to fetch clinic monthly quality', { error, clinicId });
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
    enabled: true, // Always enabled, even if clinicId is null
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Query for monthly studies data
  const monthlyStudies = useQuery({
    queryKey: ['clinic-monthly-studies', clinicId],
    queryFn: async () => {
      logger.debug('Fetching clinic monthly studies', { clinicId });
      
      try {
        // If clinicId is null, fetch data for all clinics
        // The get_clinic_monthly_studies function has an overload that takes no arguments
        const data = await callRPC(
          'get_clinic_monthly_studies', 
          {}, // Empty object for no arguments
          { component: 'useClinicDetails', context: { metric: 'monthly-studies', clinicId } }
        );
        
        logger.debug('Received monthly studies data', {
          dataReceived: !!data,
          itemCount: Array.isArray(data) ? data.length : 0
        });
        
        if (clinicId) {
          // Filter for the specific clinic if clinicId is provided
          return (data as MonthlyStudiesData[]).filter(item => 
            item.clinic_id === clinicId
          );
        }
        
        return data as MonthlyStudiesData[];
      } catch (error) {
        logger.error('Failed to fetch clinic monthly studies', { error, clinicId });
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
    enabled: true, // Always enabled, even if clinicId is null
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Query for weekly quality data
  const weeklyQuality = useQuery({
    queryKey: ['clinic-weekly-quality', clinicId],
    queryFn: async () => {
      logger.debug('Fetching clinic weekly quality', { clinicId });
      
      try {
        // If clinicId is null, fetch data for all clinics
        // The get_clinic_weekly_quality function has an overload that takes no arguments
        const data = await callRPC(
          'get_clinic_weekly_quality', 
          clinicId ? { _clinic_id: clinicId } : {}, // Empty object for no arguments
          { component: 'useClinicDetails', context: { metric: 'weekly-quality', clinicId } }
        );
        
        logger.debug('Received weekly quality data', {
          dataReceived: !!data,
          itemCount: Array.isArray(data) ? data.length : 0
        });
        
        return data as WeeklyQualityData[];
      } catch (error) {
        logger.error('Failed to fetch clinic weekly quality', { error, clinicId });
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
    enabled: true, // Always enabled, even if clinicId is null
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Query for weekly studies data
  const weeklyStudies = useQuery({
    queryKey: ['clinic-weekly-studies', clinicId],
    queryFn: async () => {
      logger.debug('Fetching clinic weekly studies', { clinicId });
      
      try {
        // If clinicId is null, return an empty array since the get_clinic_weekly_studies function
        // requires a clinic_id parameter
        if (!clinicId) {
          logger.debug('No clinicId provided for weekly studies, returning empty array');
          return [];
        }
        
        const data = await callRPC(
          'get_clinic_weekly_studies', 
          { _clinic_id: clinicId },
          { component: 'useClinicDetails', context: { metric: 'weekly-studies', clinicId } }
        );
        
        logger.debug('Received weekly studies data', {
          dataReceived: !!data,
          itemCount: Array.isArray(data) ? data.length : 0
        });
        
        return data as WeeklyStudiesData[];
      } catch (error) {
        logger.error('Failed to fetch clinic weekly studies', { error, clinicId });
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
    enabled: !!clinicId, // Only enabled if clinicId is provided
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Process the basic clinic info
  const basicInfo = useMemo(() => {
    if (!clinicId || !clinicsData || clinicsData.length === 0) return null;
    
    const clinic = clinicsData.find(c => c.clinic_id === clinicId);
    if (!clinic) return null;
    
    return {
      id: clinic.clinic_id,
      name: clinic.clinic_name,
      totalStudies: clinic.totalStudies,
      openStudies: clinic.openStudies,
      averageQuality: clinic.averageQuality,
      averageQualityHours: clinic.averageQualityHours
    };
  }, [clinicId, clinicsData]);

  // Process quality distribution
  const qualityDistribution = useMemo(() => {
    if (!clinicId || !clinicsRawData) return null;
    
    const clinic = clinicsRawData.find(c => c.clinic_id === clinicId);
    if (!clinic) return null;
    
    return {
      good: clinic.good_count,
      soso: clinic.soso_count,
      bad: clinic.bad_count,
      critical: clinic.critical_count
    };
  }, [clinicId, clinicsRawData]);

  // Process status distribution
  const statusDistribution = useMemo(() => {
    if (!clinicId || !clinicsRawData) return null;
    
    const clinic = clinicsRawData.find(c => c.clinic_id === clinicId);
    if (!clinic) return null;
    
    return {
      intervene: clinic.intervene_count,
      monitor: clinic.monitor_count,
      onTarget: clinic.on_target_count,
      nearCompletion: clinic.near_completion_count,
      needsExtension: clinic.needs_extension_count
    };
  }, [clinicId, clinicsRawData]);

  // Process monthly quality data for charts
  const processedMonthlyQuality = useMemo(() => {
    if (!monthlyQuality.data || monthlyQuality.data.length === 0) {
      return { name: 'Monthly Quality', data: [] };
    }
    
    // Sort by date
    const sortedData = [...monthlyQuality.data].sort(
      (a, b) => new Date(a.month_start).getTime() - new Date(b.month_start).getTime()
    );
    
    return {
      name: 'Monthly Quality',
      data: sortedData.map(item => ({
        date: item.month_start,
        value: item.average_quality_percent * 100, // Convert to percentage
        label: formatDateString(item.month_start)
      })),
      color: '#10b981' // Emerald color
    };
  }, [monthlyQuality.data]);

  // Process monthly studies data for charts
  const processedMonthlyStudies = useMemo(() => {
    if (!monthlyStudies.data || monthlyStudies.data.length === 0) {
      return { name: 'Monthly Studies', data: [] };
    }
    
    // Sort by date
    const sortedData = [...monthlyStudies.data].sort(
      (a, b) => new Date(a.month_start).getTime() - new Date(b.month_start).getTime()
    );
    
    return {
      name: 'Monthly Studies',
      data: sortedData.map(item => ({
        date: item.month_start,
        value: item.open_studies,
        label: formatDateString(item.month_start)
      })),
      color: '#3b82f6' // Blue color
    };
  }, [monthlyStudies.data]);

  // Process weekly quality data for charts
  const processedWeeklyQuality = useMemo(() => {
    if (!weeklyQuality.data || weeklyQuality.data.length === 0) {
      return { name: 'Weekly Quality', data: [] };
    }
    
    // Sort by date
    const sortedData = [...weeklyQuality.data].sort(
      (a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime()
    );
    
    return {
      name: 'Weekly Quality',
      data: sortedData.map(item => ({
        date: item.week_start,
        value: item.average_quality * 100, // Convert to percentage
        label: formatDateString(item.week_start)
      })),
      color: '#f59e0b' // Amber color
    };
  }, [weeklyQuality.data]);

  // Process weekly studies data for charts
  const processedWeeklyStudies = useMemo(() => {
    if (!weeklyStudies.data || weeklyStudies.data.length === 0) {
      return { name: 'Weekly Studies', data: [] };
    }
    
    // Sort by date
    const sortedData = [...weeklyStudies.data].sort(
      (a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime()
    );
    
    return {
      name: 'Weekly Studies',
      data: sortedData.map(item => ({
        date: item.week_start,
        value: item.open_studies,
        label: formatDateString(item.week_start)
      })),
      color: '#8b5cf6' // Purple color
    };
  }, [weeklyStudies.data]);

  // Determine loading and error states
  const isLoading = isLoadingBasicInfo || 
    monthlyQuality.isLoading || 
    monthlyStudies.isLoading || 
    weeklyQuality.isLoading || 
    weeklyStudies.isLoading;
  
  const error = basicInfoError || 
    monthlyQuality.error || 
    monthlyStudies.error || 
    weeklyQuality.error || 
    weeklyStudies.error;

  // Return the combined result
  return {
    basicInfo,
    charts: {
      monthlyQuality: processedMonthlyQuality,
      monthlyStudies: processedMonthlyStudies,
      weeklyQuality: processedWeeklyQuality,
      weeklyStudies: processedWeeklyStudies
    },
    qualityDistribution,
    statusDistribution,
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null
  };
}
