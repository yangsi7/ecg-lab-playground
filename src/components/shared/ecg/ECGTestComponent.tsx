import React, { useState } from 'react';
import { supabase } from '@/types/supabase';

export const ECGTestComponent: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEdgeFunction = async () => {
    setLoading(true);
    setError(null);
    setResult('');

    try {
      // Test sample data
      const testData = {
        pod_id: "5c53a1b7-9c65-4bd5-b8c0-2e8d8df6fa4b", // Replace with a valid pod ID from your database
        time_start: "2022-06-01T00:00:00Z",
        time_end: "2022-06-01T00:05:00Z",
        factor: 4
      };

      console.log('Calling edge function with data:', testData);

      const response = await supabase.functions.invoke('downsample-ecg', {
        body: testData
      });

      if (response.error) {
        setError(`Edge function error: ${response.error.message || JSON.stringify(response.error)}`);
        return;
      }

      // Check if the response data is valid
      if (!response.data) {
        setError('No data returned from edge function');
        return;
      }

      setResult(JSON.stringify(response, null, 2));
    } catch (err) {
      console.error('Error testing edge function:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-xl">
      <h2 className="text-lg font-medium mb-4">ECG Edge Function Test</h2>
      
      <button
        onClick={testEdgeFunction}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          loading ? 'bg-blue-500/50 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {loading ? 'Testing...' : 'Test Edge Function'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Response:</h3>
          <pre className="p-3 bg-gray-800 rounded-lg text-xs overflow-auto max-h-80">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ECGTestComponent; 