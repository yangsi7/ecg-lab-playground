import React from 'react';
import { useToast } from '../ui/use-toast';

export function ToastExample() {
  const { toast } = useToast();

  const showSuccessToast = () => {
    toast({
      title: 'Success!',
      description: 'Operation completed successfully',
      type: 'success',
      duration: 5000,
    });
  };

  const showErrorToast = () => {
    toast({
      title: 'Error!',
      description: 'Something went wrong',
      type: 'error',
      duration: 5000,
    });
  };

  const showWarningToast = () => {
    toast({
      title: 'Warning!',
      description: 'This action may have consequences',
      type: 'warning',
      duration: 5000,
    });
  };

  const showInfoToast = () => {
    toast({
      title: 'Information',
      description: 'Here is some useful information',
      type: 'info',
      duration: 5000,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Toast Component Example</h1>
      <p className="text-gray-300">Click the buttons below to show different types of toast notifications</p>
      
      <div className="flex flex-wrap gap-4">
        <button
          onClick={showSuccessToast}
          className="px-4 py-2 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30"
        >
          Show Success Toast
        </button>
        
        <button
          onClick={showErrorToast}
          className="px-4 py-2 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30"
        >
          Show Error Toast
        </button>
        
        <button
          onClick={showWarningToast}
          className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/30"
        >
          Show Warning Toast
        </button>
        
        <button
          onClick={showInfoToast}
          className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30"
        >
          Show Info Toast
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <h2 className="text-lg font-medium text-white mb-2">Implementation Details</h2>
        <p className="text-gray-400 mb-4">This example demonstrates the toast notification system created for the application.</p>
        
        <h3 className="text-md font-medium text-gray-300 mt-4">Usage</h3>
        <pre className="bg-gray-900/50 p-4 rounded-lg text-xs text-gray-300 mt-2 overflow-auto">
{`// 1. Import the useToast hook
import { useToast } from '../ui/use-toast';

// 2. Use the hook in your component
const { toast } = useToast();

// 3. Call the toast function when needed
toast({
  title: 'Success!',
  description: 'Operation completed successfully',
  type: 'success',
  duration: 5000,
});`}
        </pre>
      </div>
    </div>
  );
}