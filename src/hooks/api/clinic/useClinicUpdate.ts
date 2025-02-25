import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/hooks/api/core/supabase';
import type { Clinic } from '@/types/domain/clinic';
import { toClinic } from '@/types/domain/clinic';
import { logger } from '@/lib/logger';

/**
 * Hook for updating clinic data
 */
export function useClinicUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Clinic> }) => {
      try {
        // Runtime validation
        if (data.name === '') {
          throw new Error('Clinic name cannot be empty');
        }

        // Transform to database format
        const dbClinic: Partial<Clinic> = {
          name: data.name,
          vip_status: data.vip_status
        };

        const { data: result, error } = await supabase
          .from('clinics')
          .update(dbClinic)
          .eq('id', id)
          .select('*')
          .single();

        if (error) throw error;

        // Transform result back to domain type
        return toClinic(result);
      } catch (error) {
        logger.error('Failed to update clinic', { error, id, data });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
    }
  });
} 