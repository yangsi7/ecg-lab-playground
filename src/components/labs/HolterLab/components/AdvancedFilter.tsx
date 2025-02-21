import React from 'react';
import { Filter } from 'lucide-react';

interface AdvancedFilterProps {
    expression: string;
    onExpressionChange: (expression: string) => void;
    className?: string;
}

export function AdvancedFilter({ expression, onExpressionChange, className = '' }: AdvancedFilterProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <Filter className="h-4 w-4" />
                <span>Advanced Filter</span>
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={expression}
                    onChange={(e) => onExpressionChange(e.target.value)}
                    placeholder="e.g. qualityFraction > 0.8 && daysRemaining < 5"
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500"
                />
            </div>
            <p className="text-xs text-gray-500">
                Available fields: daysRemaining, qualityFraction, totalHours, interruptions, qualityVariance
            </p>
        </div>
    );
} 