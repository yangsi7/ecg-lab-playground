/**
 * src/components/clinics/StudyManagementTable.tsx
 * 
 * Component for managing studies associated with a clinic
 * Displays study data with filtering and action buttons
 */

import { useState } from 'react';
import { DataGrid } from '@/components/shared/DataGrid';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

interface Study {
  id: string;
  patientId: string;
  startDate: string;
  endDate?: string;
  duration: number;
  status: 'active' | 'completed' | 'pending';
  qualityScore: number;
}

interface StudyManagementTableProps {
  clinicId: string;
}

export default function StudyManagementTable({ clinicId }: StudyManagementTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // This would normally come from an API
  const mockStudies: Study[] = [
    {
      id: 'study-1',
      patientId: 'patient-101',
      startDate: '2023-01-05',
      endDate: '2023-01-12',
      duration: 7,
      status: 'completed',
      qualityScore: 92
    },
    {
      id: 'study-2',
      patientId: 'patient-102',
      startDate: '2023-02-10',
      duration: 14,
      status: 'active',
      qualityScore: 85
    }
  ];

  const columns = [
    {
      key: 'patientId',
      header: 'Patient ID',
      render: (study: Study) => study.patientId
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (study: Study) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
          {study.startDate}
        </div>
      )
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (study: Study) => (
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1 text-gray-500" />
          {study.duration} days
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (study: Study) => {
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          completed: 'bg-blue-100 text-blue-800',
          pending: 'bg-yellow-100 text-yellow-800'
        };
        
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[study.status]}`}>
            {study.status}
          </span>
        );
      }
    },
    {
      key: 'qualityScore',
      header: 'Quality',
      render: (study: Study) => {
        const getQualityColor = (score: number) => {
          if (score >= 90) return 'text-green-600';
          if (score >= 70) return 'text-yellow-600';
          return 'text-red-600';
        };
        
        return (
          <div className="flex items-center">
            {study.qualityScore < 70 && (
              <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
            )}
            <span className={getQualityColor(study.qualityScore)}>
              {study.qualityScore}%
            </span>
          </div>
        );
      }
    }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-medium mb-4">Study Management</h2>
      <DataGrid
        data={mockStudies}
        columns={columns}
        keyExtractor={(study) => study.id}
        pagination={{
          currentPage: page,
          pageSize: pageSize,
          totalPages: Math.ceil(mockStudies.length / pageSize),
          onPageChange: setPage
        }}
        onRowClick={(study) => alert(`Viewing study ${study.id}`)}
        emptyMessage="No studies found for this clinic"
      />
    </div>
  );
} 