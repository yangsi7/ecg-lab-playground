import type { Database } from '../../../types/database.types';
import type { 
  TableRow, TableInsert, TableUpdate,
  QueryParams, QueryResponse, RPCCallInfo
} from '../../../types/utils';

// Re-export common types
export type {
  TableRow,
  TableInsert,
  TableUpdate,
  QueryParams,
  QueryResponse,
  RPCCallInfo
};

// Hook-specific types
export type UseQueryResult<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
};

export type UseMutationResult<T, TVariables> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  mutate: (variables: TVariables) => Promise<T>;
};

// Domain-specific types
export type StudyWithTimes = {
  study: TableRow<'study'>;
  earliestTime: Date | null;
  latestTime: Date | null;
};

export type ClinicAnalytics = {
  activeStudies: number;
  totalStudies: number;
  averageQualityHours: number;
  recentAlerts: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>;
};

export type ECGDataPoint = {
  timestamp: Date;
  values: [number, number, number];
  quality: [boolean, boolean, boolean];
  leadOn: [boolean, boolean, boolean];
}; 