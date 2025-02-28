import React, { useState } from 'react';
import { Activity, Calendar, Clock } from 'lucide-react';
import { ECGVisualization } from './ECGVisualization';

/**
 * Sample ECG Viewer Component
 * Demonstrates how to use the ECGVisualization component with
 * time range selection and channel switching
 */
export const ECGSampleViewer: React.FC<{
  podId: string;
  initialStartTime?: string;
  initialEndTime?: string;
}> = ({ 
  podId, 
  initialStartTime = new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
  initialEndTime = new Date().toISOString() // now
}) => {
  // State for time range and channel selection
  const [timeStart, setTimeStart] = useState(initialStartTime);
  const [timeEnd, setTimeEnd] = useState(initialEndTime);
  const [selectedChannel, setSelectedChannel] = useState<1 | 2 | 3>(1);
  const [colorBlindMode, setColorBlindMode] = useState(false);

  // Preset time ranges
  const timePresets = [
    { label: '5 min', minutes: 5 },
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
    { label: '1 hour', minutes: 60 }
  ];

  // Apply a time preset
  const applyTimePreset = (minutes: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60000);
    setTimeStart(start.toISOString());
    setTimeEnd(end.toISOString());
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Header */}
        <div>
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            ECG Visualization for Pod: {podId}
          </h2>
          <p className="text-sm text-gray-400">
            Visualizing data from the Supabase Edge Function
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex flex-wrap gap-2">
          {timePresets.map(preset => (
            <button
              key={preset.minutes}
              onClick={() => applyTimePreset(preset.minutes)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Range Display */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
          <Clock className="h-4 w-4 text-blue-400" />
          Selected Time Range:
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-400">Start:</span>
            <span className="ml-2 text-sm">{new Date(timeStart).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400">End:</span>
            <span className="ml-2 text-sm">{new Date(timeEnd).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Channel Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedChannel(1)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            selectedChannel === 1 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Lead I
        </button>
        <button
          onClick={() => setSelectedChannel(2)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            selectedChannel === 2
              ? 'bg-blue-500 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Lead II
        </button>
        <button
          onClick={() => setSelectedChannel(3)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            selectedChannel === 3
              ? 'bg-blue-500 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Lead III
        </button>
        <button
          onClick={() => setColorBlindMode(!colorBlindMode)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ml-auto ${
            colorBlindMode
              ? 'bg-orange-500/20 text-orange-300'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Color Blind Mode
        </button>
      </div>

      {/* ECG Visualization */}
      <div className="bg-white/5 p-4 rounded-lg">
        <ECGVisualization
          podId={podId}
          timeStart={timeStart}
          timeEnd={timeEnd}
          channel={selectedChannel}
          width={800}
          height={300}
          colorBlindMode={colorBlindMode}
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
        <p>
          <span className="font-medium">Instructions:</span> Use your mouse wheel to zoom horizontally. 
          Click and drag to pan the view. Toggle between leads using the buttons above. 
          Adjust time range using the preset buttons.
        </p>
      </div>
    </div>
  );
};

export default ECGSampleViewer; 