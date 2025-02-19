import { useState } from 'react';

interface AdvancedFilterProps {
    expression: string;
    onExpressionChange: (expr: string) => void;
    className?: string;
}

export function AdvancedFilter({
    expression,
    onExpressionChange,
    className = ''
}: AdvancedFilterProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm text-gray-300">
                Advanced Filter Expression
            </label>
            <input
                type="text"
                value={expression}
                onChange={(e) => onExpressionChange(e.target.value)}
                placeholder="e.g. qualityFraction < 0.5 && totalHours > 10"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white 
                          placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-400">
                Use JavaScript-like expressions with study properties: qualityFraction, totalHours, etc.
            </p>
        </div>
    );
} 