import { useQuery } from '@tanstack/react-query';
import type { HolterStudy } from '../types/holter';
import { useTableStore } from '../store/tableStore';

interface UseHolterDataResult {
  studies: HolterStudy[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  isRefreshing: boolean;
}

export const useHolterData = (): UseHolterDataResult => {
  const { 
    currentPage, 
    pageSize, 
    sortField, 
    sortDirection, 
    quickFilter, 
    advancedFilter 
  } = useTableStore();

  const { data, isLoading, isRefetching, error } = useQuery({
    queryKey: ['holterData', { 
      page: currentPage, 
      pageSize, 
      sortField, 
      sortDirection, 
      quickFilter, 
      advancedFilter 
    }],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      const mockData: HolterStudy[] = [
        {
          study_id: 'STUDY-001',
          clinic_name: 'Test Clinic',
          duration: 14,
          daysRemaining: 7,
          totalQualityHours: 120,
          qualityFraction: 0.85,
          totalHours: 140,
          interruptions: 2,
          qualityVariance: 0.02,
          status: 'good'
        },
        {
          study_id: 'STUDY-002',
          clinic_name: 'Test Clinic',
          duration: 7,
          daysRemaining: 3,
          totalQualityHours: 80,
          qualityFraction: 0.75,
          totalHours: 100,
          interruptions: 1,
          qualityVariance: 0.03,
          status: 'warning'
        },
        // Add more mock data as needed
      ];

      // Simulate server-side filtering
      let filteredData = [...mockData];
      
      if (quickFilter) {
        switch (quickFilter) {
          case 'bad-quality':
            filteredData = filteredData.filter(study => study.qualityFraction < 0.5);
            break;
          case 'needs-intervention':
            filteredData = filteredData.filter(study => study.totalHours < 20);
            break;
          case 'under-target':
            filteredData = filteredData.filter(study => study.totalHours < 10);
            break;
        }
      }

      // Simulate server-side sorting
      if (sortField && sortDirection) {
        filteredData.sort((a, b) => {
          const aValue = a[sortField as keyof HolterStudy];
          const bValue = b[sortField as keyof HolterStudy];
          const modifier = sortDirection === 'asc' ? 1 : -1;
          
          if (aValue < bValue) return -1 * modifier;
          if (aValue > bValue) return 1 * modifier;
          return 0;
        });
      }

      // Simulate pagination
      const start = (currentPage - 1) * pageSize;
      const paginatedData = filteredData.slice(start, start + pageSize);

      return {
        data: paginatedData,
        count: filteredData.length
      };
    }
  });

  return {
    studies: data?.data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error : null,
    totalCount: data?.count ?? 0,
    isRefreshing: isRefetching
  };
};
