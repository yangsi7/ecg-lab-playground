import React from 'react';
import { DebugSupabaseClient } from '@/components/shared/DebugSupabaseClient';

/**
 * Debug page for troubleshooting Supabase connectivity issues
 */
const DebugPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">API Debug Tools</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <DebugSupabaseClient />
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Known Issues</h2>
        <div className="space-y-2">
          <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500">
            <h3 className="font-medium">Type Mismatch in RPC Function</h3>
            <p className="text-sm mt-1">
              There is a type mismatch in the <code>get_studies_with_pod_times</code> function. 
              The function is returning <code>timestamp with time zone</code> but is declared to return 
              <code>timestamp without time zone</code> in column 15.
            </p>
          </div>
          
          <div className="p-3 bg-green-50 border-l-4 border-green-500">
            <h3 className="font-medium">Workaround Available</h3>
            <p className="text-sm mt-1">
              We've created a workaround that bypasses the Supabase.js client and directly calls the API endpoint
              to avoid the type mismatch error. Use the "Safe RPC Workaround" button to test this method.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage; 