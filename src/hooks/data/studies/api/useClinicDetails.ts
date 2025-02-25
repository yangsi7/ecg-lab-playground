import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { Database } from '@/types/database.types';
import { logger } from '@/lib/logger';

type ClinicRow = Database['public']['Tables']['clinics']['Row'];

export function useClinicDetails(clinicId: string | null) {
    return useQuery({
        queryKey: ['clinic', clinicId],
        queryFn: async () => {
            if (!clinicId) {
                return null;
            }

            try {
                const { data, error } = await supabase
                    .from('clinics')
                    .select('*')
                    .eq('id', clinicId)
                    .single();

                if (error) throw error;
                return data as ClinicRow;
            } catch (err) {
                logger.error('Failed to fetch clinic details', { error: err, clinicId });
                throw err;
            }
        },
        enabled: true, // Always enabled, handle null clinicId in the query function
        staleTime: 30000, // Consider data fresh for 30 seconds
    });
} 