import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Download } from 'lucide-react';
import { useHolterData } from '../../../hooks/useHolterData';
import { useHolterFilter } from '../../../hooks/useHolterFilter';
import { DataGrid, type Column } from '../../shared/DataGrid';
import { QuickFilters } from './QuickFilters';
import { AdvancedFilter } from './AdvancedFilter';
import type { HolterStudy } from '../../../types/holter';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function HolterLab() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(25);

  const {
    quickFilter,
    advancedFilter,
    filterError,
    showFields,
    presets,
    setQuickFilter,
    setAdvancedFilter,
    toggleFields,
    savePreset,
    applyFilters,
  } = useHolterFilter();

  const { studies = [], loading, error, totalCount = 0, isRefreshing } = useHolterData();

  const columns = useMemo<Column<HolterStudy>[]>(() => [
    { 
      field: 'study_id',
      header: 'Study ID',
      sortable: true 
    },
    { 
      field: 'clinic_name',
      header: 'Clinic',
      sortable: true 
    },
    { 
      field: 'duration',
      header: 'Duration',
      sortable: true,
      render: (value) => `${value} days`
    },
    { 
      field: 'daysRemaining',
      header: 'Days Rem',
      sortable: true 
    },
    { 
      field: 'totalQualityHours',
      header: 'Q Hours',
      sortable: true,
      render: (value: string | number) => typeof value === 'number' ? value.toFixed(1) : value
    },
    { 
      field: 'qualityFraction',
      header: 'Q %',
      sortable: true,
      render: (value: string | number) => 
        typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value
    },
    { 
      field: 'totalHours',
      header: 'Total Hrs',
      sortable: true,
      render: (value: string | number) => typeof value === 'number' ? value.toFixed(1) : value
    },
    { 
      field: 'interruptions',
      header: 'Interrupts',
      sortable: true 
    },
    { 
      field: 'qualityVariance',
      header: 'Variance',
      sortable: true,
      render: (value: string | number) => typeof value === 'number' ? value.toFixed(3) : value
    },
    { 
      field: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium
          ${value === 'critical' ? 'bg-red-500/20 text-red-400' :
            value === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
            value === 'good' ? 'bg-green-500/20 text-green-400' :
            'bg-gray-500/20 text-gray-400'}`}
        >
          {value}
        </span>
      )
    }
  ], []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 text-blue-400">
          <svg className="h-full w-full" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-4">
        <h3 className="text-sm font-medium text-red-400">Error loading Holter data</h3>
        <p className="mt-1 text-sm text-red-300">{error.message}</p>
      </div>
    );
  }

  const filteredStudies = applyFilters(studies);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-blue-400" />
          <h1 className="text-2xl font-semibold text-white">Holter Studies</h1>
        </div>
        <button
          onClick={() => {/* TODO: Implement export */}}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      {/* Quick Filters */}
      <QuickFilters
        activeFilter={quickFilter}
        onFilterChange={setQuickFilter}
      />

      {/* Advanced Filter */}
      <AdvancedFilter
        value={advancedFilter}
        error={filterError}
        showFields={showFields}
        presets={presets}
        onChange={setAdvancedFilter}
        onToggleFields={toggleFields}
        onSavePreset={savePreset}
        onSelectPreset={setAdvancedFilter}
      />

      {/* DataGrid */}
      <DataGrid
        data={filteredStudies}
        columns={columns}
        pageSize={pageSize}
        className="bg-white/5 rounded-xl border border-white/10"
      />

      {/* Page Size Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Show</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-white/10 border border-white/10 rounded-lg text-white text-sm px-2 py-1"
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-sm text-gray-400">entries</span>
        </div>
      </div>
    </div>
  );
} 