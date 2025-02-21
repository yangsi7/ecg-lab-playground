/**
 * Hook for managing Holter study filters
 * Provides both quick filters and advanced filtering capabilities
 */
import { useState, useCallback } from 'react';
import type { HolterStudy } from '@/types/domain/holter';
import { logger } from '@/lib/logger';

export type QuickFilterId = 'all' | 'recent' | 'low-quality' | 'high-quality';

interface UseHolterFilterResult {
    quickFilter: QuickFilterId | undefined;
    advancedFilter: string;
    setQuickFilter: (id: QuickFilterId | undefined) => void;
    setAdvancedFilter: (filter: string) => void;
    applyFilters: (studies: HolterStudy[]) => HolterStudy[];
}

export function useHolterFilter(): UseHolterFilterResult {
    const [quickFilter, setQuickFilter] = useState<QuickFilterId>();
    const [advancedFilter, setAdvancedFilter] = useState('');

    const applyFilters = useCallback((studies: HolterStudy[]): HolterStudy[] => {
        let filtered = [...studies];

        try {
            // Apply quick filters
            if (quickFilter) {
                switch (quickFilter) {
                    case 'recent':
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        filtered = filtered.filter(study => 
                            new Date(study.start_timestamp) >= sevenDaysAgo
                        );
                        break;
                    case 'low-quality':
                        filtered = filtered.filter(study => 
                            study.qualityFraction < 0.8
                        );
                        break;
                    case 'high-quality':
                        filtered = filtered.filter(study => 
                            study.qualityFraction >= 0.8
                        );
                        break;
                    case 'all':
                    default:
                        break;
                }
            }

            // Apply advanced filter if present
            if (advancedFilter.trim()) {
                // Here you would parse and apply the advanced filter expression
                // For now, we'll just log that it's not implemented
                logger.warn('Advanced filtering not yet implemented');
            }

            return filtered;
        } catch (error) {
            logger.error('Error applying filters:', error);
            return studies;
        }
    }, [quickFilter, advancedFilter]);

    return {
        quickFilter,
        advancedFilter,
        setQuickFilter,
        setAdvancedFilter,
        applyFilters
    };
} 