import React from 'react';

type StatusType = 'active' | 'interrupted' | 'error' | 'completed';

interface StatusPillProps {
  status: StatusType;
}

export function StatusPill({ status }: StatusPillProps) {
  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'interrupted':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'error':
        return 'bg-red-500/20 text-red-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
} 