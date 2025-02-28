import React, { useState, useEffect } from 'react';
import { supabase } from '@/types/supabase';
import { testRpcCall, getAuthState } from '@/lib/supabase-debug';

/**
 * Debug component for testing Supabase API calls and authentication status
 */
export const DebugSupabaseClient: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);

  // Direct test of the get_studies_with_pod_times RPC
  const testSafeRpc = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Make direct API call to avoid type mismatch
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_studies_with_pod_times`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        setError(`API error: ${response.status} - ${errorText}`);
        console.error('Response details:', response);
        return;
      }

      const data = await response.json();
      
      setResult({
        data: Array.isArray(data) ? `Success! Found ${data.length} studies.` : 'No data returned',
        firstRecord: Array.isArray(data) && data.length > 0 ? data[0] : null,
        status: response.status,
        ok: response.ok
      });
    } catch (err) {
      console.error('Error in testSafeRpc:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Test the original Supabase client RPC call to see the error
  const testDirectRpc = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await testRpcCall('get_studies_with_pod_times' as any);
      
      if (!response.success) {
        const errorMessage = response.error && typeof response.error === 'object' && 'message' in response.error 
          ? response.error.message 
          : 'Unknown error';
        setError(`RPC Error: ${errorMessage}`);
        console.error('Response details:', response);
        return;
      }
      
      setResult({
        data: Array.isArray(response.data) ? `Found ${response.data.length} studies` : 'No data',
        authenticated: response.authenticated,
        status: response.status,
        duration: response.duration
      });
    } catch (err) {
      console.error('Error in testDirectRpc:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status
  const checkAuth = async () => {
    try {
      const authStateResult = await getAuthState();
      setAuthStatus(authStateResult);
    } catch (err) {
      console.error('Error checking auth:', err);
      setAuthStatus({ error: err instanceof Error ? err.message : String(err) });
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Supabase Client Debug</h1>
      
      <div className="flex flex-col space-y-2 mb-6">
        <button 
          onClick={testDirectRpc}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
        >
          Test Original RPC Call (Shows Error)
        </button>
        
        <button 
          onClick={testSafeRpc}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
        >
          Test Direct API Call (Fixed Method)
        </button>
        
        <button 
          onClick={checkAuth}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
        >
          Refresh Auth Info
        </button>
      </div>
      
      {loading && <p className="text-gray-500">Loading...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Result:</h3>
          <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      {authStatus && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <h3 className="font-bold">Auth Status:</h3>
          <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(authStatus, null, 2)}</pre>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Direct API Call Example:</h3>
        <code className="block whitespace-pre-wrap bg-gray-200 p-2 rounded text-sm">
{`curl -X POST "${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_studies_with_pod_times" \\
  -H "apikey: ${import.meta.env.VITE_SUPABASE_ANON_KEY}" \\
  -H "Authorization: Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}" \\
  -H "Content-Type: application/json"`}
        </code>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500">
        <h3 className="font-bold mb-2">Issue Summary</h3>
        <p>The PostgreSQL function <code>get_studies_with_pod_times</code> has a type mismatch:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Column 15 (earliest_time) is returning <code>timestamp with time zone</code></li>
          <li>But the function definition expects <code>timestamp without time zone</code></li>
        </ul>
        <p className="mt-2">This issue is bypassed by making a direct API call instead of using the Supabase client. The proper fix would be to update the PostgreSQL function definition to match the returned data type.</p>
      </div>
    </div>
  );
}; 