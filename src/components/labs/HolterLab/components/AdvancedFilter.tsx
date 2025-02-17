import React, { useState } from 'react';
import { Filter, Save, Star, MoreHorizontal } from 'lucide-react';
import { TOKEN_SUGGESTIONS, type FilterPreset } from '../../../utils/filterHelpers';

interface AdvancedFilterProps {
  value: string;
  error: string | null;
  showFields: boolean;
  presets: FilterPreset[];
  onChange: (value: string) => void;
  onToggleFields: () => void;
  onSavePreset: (name: string) => void;
  onSelectPreset: (expression: string) => void;
}

export function AdvancedFilter({
  value,
  error,
  showFields,
  presets,
  onChange,
  onToggleFields,
  onSavePreset,
  onSelectPreset,
}: AdvancedFilterProps) {
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    onSavePreset(presetName);
    setPresetName('');
    setShowSaveDialog(false);
  };

  return (
    <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-3 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-300" />
          <h2 className="text-sm text-gray-300 font-medium">Advanced Filter</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleFields}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter filter expression (e.g., qualityFraction &gt; 0.8)"
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />

      {error && (
        <div className="text-sm text-red-400 mt-1">
          {error}
        </div>
      )}

      {showFields && (
        <div className="rounded-md bg-white/5 p-3 border border-white/10 space-y-2">
          <div className="text-xs text-gray-200 italic">
            Available fields: {TOKEN_SUGGESTIONS.join(', ')}
          </div>
          {presets.length > 0 && (
            <div className="mt-2 space-x-1">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset.expression)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                >
                  <Star className="h-3 w-3" />
                  {preset.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showSaveDialog && (
        <div className="absolute inset-x-4 top-full mt-2 p-4 bg-gray-800 rounded-lg border border-white/10 shadow-lg">
          <h3 className="text-sm font-medium text-white mb-2">Save Filter Preset</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 