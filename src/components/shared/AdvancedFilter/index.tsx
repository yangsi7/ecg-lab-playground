import React, { useState, useCallback, useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import { FILTERABLE_FIELDS } from '../../../lib/utils/ExpressionParser';
import type { FilterExpression, FilterConfig } from '../../../types/filter';

export interface FilterPreset {
  id: string;
  name: string;
  expression: string;
}

export interface AdvancedFilterProps<T> {
  config: FilterConfig<T>;
  onFilterChange: (expression: FilterExpression | null) => void;
  onFilterError?: (error: string | null) => void;
  className?: string;
}

export function AdvancedFilter<T>({
  config,
  onFilterChange,
  onFilterError,
  className = ''
}: AdvancedFilterProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [expression, setExpression] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleExpressionChange = useCallback((newExpression: string) => {
    setExpression(newExpression);
    try {
      // Parse and validate expression based on config
      const parsedExpression = config.parseExpression(newExpression);
      setError(null);
      onFilterChange(parsedExpression);
      onFilterError?.(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid filter expression';
      setError(errorMessage);
      onFilterChange(null);
      onFilterError?.(errorMessage);
    }
  }, [config, onFilterChange, onFilterError]);

  const handlePresetSelect = useCallback((preset: FilterPreset) => {
    setExpression(preset.expression);
    try {
      onFilterChange(config.parseExpression(preset.expression));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid preset expression');
      onFilterError?.(err instanceof Error ? err.message : null);
    }
  }, [config, onFilterChange, onFilterError]);

  const handleClear = useCallback(() => {
    setExpression('');
    onFilterChange(null);
    setError(null);
  }, [onFilterChange]);

  const availableFieldsDisplay = useMemo(() => 
    config.fields.map(field => `${field.key}: ${field.description}`).join('\n'),
    [config.fields]
  );

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        <Filter className="h-4 w-4" />
        Advanced Filter
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-96 bg-gray-800 rounded-lg shadow-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Advanced Filter</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-400">
              Filter Expression
            </label>
            <textarea
              value={expression}
              onChange={(e) => handleExpressionChange(e.target.value)}
              className="w-full h-24 px-3 py-2 text-sm bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder={config.placeholder}
            />
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>

          {config.presets.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400">
                Presets
              </label>
              <div className="space-y-1">
                {config.presets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-400">
              Available Fields
            </label>
            <pre className="text-xs text-gray-400 bg-gray-700 p-2 rounded-md overflow-x-auto">
              {availableFieldsDisplay}
            </pre>
          </div>

          <div className="text-sm text-gray-400">
            <h4 className="font-medium mb-1">Example:</h4>
            <pre className="bg-white/5 p-2 rounded">
              {config.example}
            </pre>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 