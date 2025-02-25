/**
 * src/components/labs/ClinicLab/ClinicList.tsx
 * 
 * Unified component for displaying clinics with sorting, filtering, pagination,
 * and quality metrics. Combines functionality from ClinicList and ClinicTable.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Download, Activity, Info } from 'lucide-react';
import { DataGrid } from '../../shared/DataGrid';
import { useDataGrid } from '@/hooks/api/filters/useDataGrid';
import { useClinicAnalytics } from '@/hooks/api/clinic';
import { useClinicData } from '@/hooks/api/clinic/useClinicData';
import { Button } from '@/components/shared/Button';
import type { Clinic, ClinicQualityBreakdown } from '@/types/domain/clinic';
import { logger } from '@/lib/logger';
import { supabase } from '@/hooks/api/core/supabase';

// Define the response type to match what useClinicData returns
interface ClinicDataResponse {
  data: ClinicQualityBreakdown[];
  count: number;
}

export default function ClinicList() {
  const navigate = useNavigate();
  
  // Get analytics data for summary statistics
  const { data: analytics, isLoading: isLoadingAnalytics } = useClinicAnalytics(null);

  // Setup data grid with filtering, sorting, and pagination
  const {
    page,
    pageSize,
    sortConfig,
    filterConfig,
    onPageChange,
    onSortChange,
    onFilterChange
  } = useDataGrid<ClinicQualityBreakdown>({
    defaultSort: { key: 'clinic_name', direction: 'asc' },
    defaultPageSize: 10
  });

  // Fetch clinic data using the configured filters/sorting
  const { 
    data,
    isLoading, 
    error
  } = useClinicData<ClinicDataResponse>({
    page,
    pageSize,
    sortConfig,
    filterConfig
  });

  // Handle data export
  const handleExport = async () => {
    try {
      const { data: exportData, error: exportError } = await supabase
        .rpc('get_clinic_quality_breakdown', {
        });

      if (exportError) throw exportError;
      if (!exportData) return;

      // Convert to CSV
      const headers = columns.map(col => col.header).join(',');
      const rows = exportData.map(row => 
        columns.map(col => {
          const value = row[col.key as keyof ClinicQualityBreakdown];
          return value ? String(value).replace(/,/g, '') : '';
        }).join(',')
      ).join('\n');

      const csv = `${headers}\n${rows}`;
      
      // Download file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinics-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Export failed', { error: err });
    }
  };

  const columns = useMemo(() => [
    {
      key: 'clinic_id',
      header: 'ID',
      sortable: true,
      render: (row: ClinicQualityBreakdown) => (
        <button
          onClick={() => navigate(`/clinic/${row.clinic_id}`)}
          className="text-blue-400 hover:text-blue-300 font-medium"
          title="Click to view clinic details"
        >
          {row.clinic_id}
        </button>
      )
    },
    {
      key: 'clinic_name',
      header: 'Name',
      sortable: true,
      render: (row: ClinicQualityBreakdown) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span>{row.clinic_name || 'Unnamed Clinic'}</span>
        </div>
      )
    },
    {
      key: 'total_studies',
      header: 'Total Studies',
      sortable: true,
      render: (row: ClinicQualityBreakdown) => row.total_studies
    },
    {
      key: 'open_studies',
      header: 'Active Studies',
      sortable: true,
      render: (row: ClinicQualityBreakdown) => row.open_studies
    },
    {
      key: 'average_quality',
      header: 'Avg Quality',
      sortable: true,
      render: (row: ClinicQualityBreakdown) => {
        const quality = Number(row.average_quality) || 0;
        const color = quality >= 0.7 ? 'text-green-400' :
                     quality >= 0.5 ? 'text-yellow-400' :
                     quality >= 0.3 ? 'text-orange-400' :
                     'text-red-400';
        return (
          <span className={color}>
            {(quality * 100).toFixed(1)}%
          </span>
        );
      }
    },
    {
      key: 'good_count',
      header: 'Good',
      sortable: true,
      render: (row: ClinicQualityBreakdown) => (
        <span className="text-green-400">{String(row.good_count)}</span>
      )
    },
    {
      key: 'soso_count',
      header: 'Average',
      sortable: true,
      render: (row: ClinicQualityBreakdown) => (
        <span className="text-yellow-400">{String(row.soso_count)}</span>
      )
    },
    {
      key: 'bad_count',
      header: 'Poor',
      sortable: true,
      render: (row: ClinicQualityBreakdown) => (
        <span className="text-orange-400">{String(row.bad_count)}</span>
      )
    },
    {
      key: 'critical_count',
      header: 'Critical',
      sortable: true,
      render: (row: ClinicQualityBreakdown) => (
        <span className="text-red-400">{String(row.critical_count)}</span>
      )
    }
  ], [navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-400" />
          <h1 className="text-2xl font-semibold text-white">Clinics</h1>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/clinics/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Clinic
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {analytics && analytics.overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Total Clinics</h3>
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-3xl text-white">{analytics.overview.active_studies || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Active Studies</h3>
              <Activity className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-3xl text-white">{analytics.overview.active_studies || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Average Quality Hours</h3>
              <Building2 className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-3xl text-white">
              {(analytics.overview.average_quality_hours || 0).toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="flex items-center mb-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search clinics..."
            value={filterConfig.quickFilter || ''}
            onChange={(e) => onFilterChange({ ...filterConfig, quickFilter: e.target.value })}
            className="w-full pl-4 pr-10 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <DataGrid
        data={(data?.data || []) as ClinicQualityBreakdown[]}
        columns={columns}
        keyExtractor={(row: ClinicQualityBreakdown) => row.clinic_id}
        loading={isLoading}
        error={error?.message}
        pagination={{
          currentPage: page + 1, // Convert 0-based to 1-based for display
          pageSize: pageSize,
          totalPages: Math.ceil((data?.count || 0) / pageSize),
          onPageChange: (page) => onPageChange(page - 1) // Convert 1-based to 0-based
        }}
        sortKey={sortConfig.key as string}
        sortDirection={sortConfig.direction}
        onSort={onSortChange}
        className="mt-4"
      />
    </div>
  );
} 