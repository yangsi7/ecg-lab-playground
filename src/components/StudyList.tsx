import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHolterStudies } from '@/hooks/api/study/useHolterStudies';
import { DataGrid } from '@/components/shared/DataGrid';
import { Eye, AlertCircle, Search, Filter } from 'lucide-react';

/**
 * StudyList Component
 * 
 * Displays a table of studies with View ECG button
 * The button is enabled only for studies with available ECG data
 */
export default function StudyList() {
  const navigate = useNavigate();
  const { studies, isLoading, error } = useHolterStudies();
  const [searchTerm, setSearchTerm] = useState('');

  // Handle View ECG button click
  const handleViewECG = (podId: string) => {
    navigate(`/ecg-viewer/${podId}`);
  };

  // Filter studies based on search term
  const filteredStudies = studies.filter(study => 
    study.study_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.pod_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.patient_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if study has ECG data available
  const hasECGData = (study: any) => {
    return study.pod_id && study.earliest_time && study.latest_time;
  };

  // Custom renderer for the action column
  const actionRenderer = (study: any) => {
    const hasData = hasECGData(study);
    return (
      <button
        onClick={() => hasData && handleViewECG(study.pod_id)}
        disabled={!hasData}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium 
          ${hasData 
            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
        title={hasData ? 'View ECG data' : 'No ECG data available'}
      >
        <Eye size={16} />
        View ECG
      </button>
    );
  };

  // Column definitions
  const columns = [
    {
      header: 'Study ID',
      accessorKey: 'study_id',
    },
    {
      header: 'Patient ID',
      accessorKey: 'patient_id',
    },
    {
      header: 'Clinic',
      accessorKey: 'clinic_name',
    },
    {
      header: 'Pod ID',
      accessorKey: 'pod_id',
    },
    {
      header: 'Start Date',
      accessorKey: 'start_timestamp',
      cell: ({ value }: { value: string }) => value ? new Date(value).toLocaleString() : 'N/A',
    },
    {
      header: 'Earliest ECG',
      accessorKey: 'earliest_time',
      cell: ({ value }: { value: string }) => value ? new Date(value).toLocaleString() : 'No data',
    },
    {
      header: 'Latest ECG',
      accessorKey: 'latest_time',
      cell: ({ value }: { value: string }) => value ? new Date(value).toLocaleString() : 'No data',
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }: any) => actionRenderer(row.original),
    },
  ];

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-red-700">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={20} />
          <h2 className="text-lg font-semibold">Error loading studies</h2>
        </div>
        <p className="text-sm">{error.message || 'An unknown error occurred'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ECG Studies</h1>
        
        {/* Search box */}
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search studies..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataGrid
          data={filteredStudies}
          columns={columns}
          isLoading={isLoading}
          pagination={{
            pageSize: 10,
            showNavigation: true
          }}
        />
      </div>
    </div>
  );
} 