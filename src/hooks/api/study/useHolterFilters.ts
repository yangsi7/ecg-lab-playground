import { useCallback, useState } from 'react';
import type { HolterStudy } from '@/types/domain/holter';
import { logger } from '@/lib/logger';
import { parseExpression, evaluateJsepExpression } from '@/lib/utils/ExpressionParser';

type QuickFilterId = 'all' | 'recent' | 'low-quality' | 'high-quality';

export function useHolterFilters() {
    const [quickFilter, setQuickFilter] = useState<QuickFilterId>('all');
    const [advancedFilter, setAdvancedFilter] = useState<string>('');

    const filterStudies = useCallback((studies: HolterStudy[]): HolterStudy[] => {
        try {
            let filtered = [...studies];

            // Apply quick filters
            switch (quickFilter) {
                case 'recent': {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    filtered = filtered.filter(study => 
                        new Date(study.created_at) >= sevenDaysAgo
                    );
                    break;
                }
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
                    // No filtering needed
                    break;
            }

            // Apply advanced filter if present
            if (advancedFilter.trim()) {
                filtered = filtered.filter(study => {
                    try {
                        // Create a safe evaluation context with only the necessary properties
                        const context = {
                            daysRemaining: study.daysRemaining,
                            qualityFraction: study.qualityFraction,
                            totalHours: study.totalHours,
                            interruptions: study.interruptions,
                            qualityVariance: study.qualityVariance
                        };
                        
                        // Parse the expression using the safer ExpressionParser
                        const parsedExpression = parseExpression(advancedFilter);
                        
                        // Evaluate the expression safely with the provided context
                        const result = evaluateJsepExpression(parsedExpression, context);
                        
                        return Boolean(result);
                    } catch (err) {
                        logger.warn('Failed to evaluate advanced filter', { 
                            filter: advancedFilter,
                            error: err instanceof Error ? err.message : String(err)
                        });
                        return true; // Include study if filter evaluation fails
                    }
                });
            }

            return filtered;
        } catch (err) {
            logger.error('Error in filterStudies', { 
                error: err instanceof Error ? err.message : String(err)
            });
            return studies; // Return unfiltered studies on error
        }
    }, [quickFilter, advancedFilter]);

    return {
        quickFilter,
        advancedFilter,
        setQuickFilter,
        setAdvancedFilter,
        filterStudies
    };
} 