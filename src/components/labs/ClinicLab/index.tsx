/**
 * src/components/labs/ClinicLab.tsx
 *
 * A modern, glassmorphic dashboard for clinic-level stats.
 * Features:
 * - Apple-inspired minimalistic design with subtle glassmorphism
 * - Interactive data visualization with advanced charts
 * - Comprehensive data tables with sorting and filtering
 * - Quick insights via summary cards
 */

import { useState, useMemo } from 'react';
import { useClinicAnalytics } from '@/hooks/api/clinic/useClinicAnalytics';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart,
  ArrowDownUp,
  ChevronRight,
  Filter,
  Calendar,
  Search,
  Hourglass,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell
} from 'lucide-react';
import { SimpleBarChart } from '../../shared/charts/SimpleBarChart';
import type {
  ClinicStatusBreakdown,
  ClinicQualityBreakdown
} from '@/types/domain/clinic';

interface ChartData {
  [key: string]: string | number | null | undefined;
}

export default function ClinicLab() {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    data: analytics,
    isLoading: loading,
    error
  } = useClinicAnalytics(clinicId);

  // State for sorting the tables
  const [statusSortKey, setStatusSortKey] = useState<keyof ClinicStatusBreakdown | null>(null);
  const [statusSortDir, setStatusSortDir] = useState<'asc' | 'desc'>('asc');
  const [qualitySortKey, setQualitySortKey] = useState<keyof ClinicQualityBreakdown | null>(null);
  const [qualitySortDir, setQualitySortDir] = useState<'asc' | 'desc'>('asc');
  
  // Filter state
  const [filterValue, setFilterValue] = useState('');

  // Memoized sorted and filtered data
  const sortedStatusData = useMemo(() => {
    if (!analytics?.statusBreakdown) return [];
    
    let data = [...analytics.statusBreakdown];
    
    // Apply filter if it exists
    if (filterValue.trim() !== '') {
      const lowercaseFilter = filterValue.toLowerCase();
      data = data.filter(row => 
        row.clinic_name?.toLowerCase().includes(lowercaseFilter)
      );
    }
    
    // Apply sorting
    if (statusSortKey) {
      data.sort((a, b) => {
        const aValue = a[statusSortKey] ?? 0;
        const bValue = b[statusSortKey] ?? 0;
        return statusSortDir === 'asc' 
          ? (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
          : (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
      });
    }
    
    return data;
  }, [analytics?.statusBreakdown, statusSortKey, statusSortDir, filterValue]);

  const sortedQualityData = useMemo(() => {
    if (!analytics?.qualityBreakdown) return [];
    
    let data = [...analytics.qualityBreakdown];
    
    // Apply filter if it exists
    if (filterValue.trim() !== '') {
      const lowercaseFilter = filterValue.toLowerCase();
      data = data.filter(row => 
        row.clinic_name?.toLowerCase().includes(lowercaseFilter)
      );
    }
    
    // Apply sorting
    if (qualitySortKey) {
      data.sort((a, b) => {
        const aValue = a[qualitySortKey] ?? 0;
        const bValue = b[qualitySortKey] ?? 0;
        return qualitySortDir === 'asc'
          ? (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
          : (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
      });
    }
    
    return data;
  }, [analytics?.qualityBreakdown, qualitySortKey, qualitySortDir, filterValue]);

  // Handle sorting for status table
  const handleStatusSort = (key: keyof ClinicStatusBreakdown) => {
    if (statusSortKey === key) {
      setStatusSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setStatusSortKey(key);
      setStatusSortDir('asc');
    }
  };

  // Handle sorting for quality table
  const handleQualitySort = (key: keyof ClinicQualityBreakdown) => {
    if (qualitySortKey === key) {
      setQualitySortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setQualitySortKey(key);
      setQualitySortDir('asc');
    }
  };

  // Navigate to clinic detail view
  function handleRowClick(row: ClinicStatusBreakdown | ClinicQualityBreakdown) {
    if (row.clinic_id) {
      navigate(`/clinic/${row.clinic_id}`);
    }
  }

  // Get the quality class based on the value
  const getQualityClass = (value: number) => {
    if (value >= 0.7) return 'bg-emerald-100/80 text-emerald-800';
    if (value >= 0.5) return 'bg-amber-100/80 text-amber-800';
    if (value >= 0.3) return 'bg-orange-100/80 text-orange-800';
    return 'bg-red-100/80 text-red-800';
  };

  // Status distribution data for pie chart
  const statusDistribution = useMemo(() => {
    if (!analytics?.statusBreakdown?.[0]) return [];
    
    const status = analytics.statusBreakdown[0];
    return [
      { name: 'On Target', value: status.on_target_count, color: '#10b981' },
      { name: 'Monitor', value: status.monitor_count, color: '#f59e0b' },
      { name: 'Intervene', value: status.intervene_count, color: '#ef4444' },
      { name: 'Near Completion', value: status.near_completion_count, color: '#3b82f6' },
      { name: 'Needs Extension', value: status.needs_extension_count, color: '#8b5cf6' }
    ];
  }, [analytics?.statusBreakdown]);

  // Quality distribution data for pie chart
  const qualityDistribution = useMemo(() => {
    if (!analytics?.qualityBreakdown?.[0]) return [];
    
    const quality = analytics.qualityBreakdown[0];
    return [
      { name: 'Good', value: quality.good_count, color: '#10b981' },
      { name: 'Average', value: quality.soso_count, color: '#f59e0b' },
      { name: 'Poor', value: quality.bad_count, color: '#f97316' },
      { name: 'Critical', value: quality.critical_count, color: '#ef4444' }
    ];
  }, [analytics?.qualityBreakdown]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header with search and filter */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clinic Analytics</h1>
          <p className="text-gray-300">Performance metrics and quality insights across all clinics</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clinics..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white w-full
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                       placeholder:text-gray-500 transition-all"
            />
          </div>
          
          <div className="relative">
            <input
              id="clinic_id"
              type="text"
              placeholder="Clinic ID (optional)"
              value={clinicId || ''}
              onChange={(e) => setClinicId(e.target.value || null)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white w-full
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                       placeholder:text-gray-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center p-20">
          <div className="flex flex-col items-center text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-300">Loading clinic analytics...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-white/10 backdrop-blur-xl border border-red-500/30 rounded-xl p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-400 text-lg font-medium mb-2">Error Loading Data</h3>
          <p className="text-red-300/80">{error}</p>
        </div>
      )}

      {!loading && !error && analytics?.overview && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Studies Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:shadow-xl hover:border-white/20 transition-all duration-300 group">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Active Studies</p>
                  <h3 className="text-3xl font-bold text-white">{analytics.overview.active_studies}</h3>
                  <p className="text-blue-400 text-xs mt-2">
                    {Math.round((analytics.overview.active_studies / analytics.overview.total_studies) * 100)}% of total
                  </p>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-2 h-fit group-hover:bg-blue-500/30 transition-colors">
                  <Activity className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Total Studies Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:shadow-xl hover:border-white/20 transition-all duration-300 group">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Studies</p>
                  <h3 className="text-3xl font-bold text-white">{analytics.overview.total_studies}</h3>
                  <p className="text-emerald-400 text-xs mt-2">
                    Lifetime accumulated
                  </p>
                </div>
                <div className="bg-emerald-500/20 rounded-lg p-2 h-fit group-hover:bg-emerald-500/30 transition-colors">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Quality Hours Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:shadow-xl hover:border-white/20 transition-all duration-300 group">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Avg Quality Hours</p>
                  <h3 className="text-3xl font-bold text-white">
                    {analytics.overview.average_quality_hours.toFixed(1)}
                  </h3>
                  <p className="text-indigo-400 text-xs mt-2">
                    Per active study
                  </p>
                </div>
                <div className="bg-indigo-500/20 rounded-lg p-2 h-fit group-hover:bg-indigo-500/30 transition-colors">
                  <Clock className="h-6 w-6 text-indigo-400" />
                </div>
              </div>
            </div>

            {/* Recent Alerts Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:shadow-xl hover:border-white/20 transition-all duration-300 group">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Recent Alerts</p>
                  <h3 className="text-3xl font-bold text-white">
                    {analytics.overview.recent_alerts?.length ?? 0}
                  </h3>
                  <p className="text-amber-400 text-xs mt-2">
                    In the past 7 days
                  </p>
                </div>
                <div className="bg-amber-500/20 rounded-lg p-2 h-fit group-hover:bg-amber-500/30 transition-colors">
                  <Bell className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Status & Quality Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:shadow-xl transition duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Study Status Distribution</h3>
                <div className="flex gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Current Period</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="w-full md:w-2/5">
                  {/* This would be replaced with a proper Pie Chart component */}
                  <div className="aspect-square bg-white/5 rounded-xl flex items-center justify-center">
                    <PieChart className="h-16 w-16 text-blue-400" />
                  </div>
                </div>
                
                <div className="w-full md:w-3/5 space-y-3">
                  {statusDistribution.map((status) => (
                    <div key={status.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                        <span className="text-sm text-gray-300">{status.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-white">{status.value}</span>
                        <span className="text-xs text-gray-400">
                          {analytics.statusBreakdown?.[0]?.open_studies 
                            ? Math.round((status.value / analytics.statusBreakdown[0].open_studies) * 100) 
                            : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality Distribution */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:shadow-xl transition duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Data Quality Distribution</h3>
                <div className="flex gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Current Period</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="w-full md:w-2/5">
                  {/* This would be replaced with a proper Pie Chart component */}
                  <div className="aspect-square bg-white/5 rounded-xl flex items-center justify-center">
                    <PieChart className="h-16 w-16 text-emerald-400" />
                  </div>
                </div>
                
                <div className="w-full md:w-3/5 space-y-3">
                  {qualityDistribution.map((quality) => (
                    <div key={quality.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: quality.color }}></div>
                        <span className="text-sm text-gray-300">{quality.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-white">{quality.value}</span>
                        <span className="text-xs text-gray-400">
                          {analytics.qualityBreakdown?.[0]?.total_studies 
                            ? Math.round((quality.value / analytics.qualityBreakdown[0].total_studies) * 100) 
                            : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown Table */}
          {sortedStatusData && sortedStatusData.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:shadow-xl transition duration-300">
              <div className="p-5 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Status Breakdown</h3>
                <p className="text-sm text-gray-400 mt-1">Study status by clinic with intervention indicators</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead>
                    <tr className="bg-white/5">
                      {[
                        { key: 'clinic_name', label: 'Clinic' },
                        { key: 'total_studies', label: 'Total' },
                        { key: 'open_studies', label: 'Open' },
                        { key: 'intervene_count', label: 'Intervene' },
                        { key: 'monitor_count', label: 'Monitor' },
                        { key: 'on_target_count', label: 'On Target' },
                        { key: 'near_completion_count', label: 'Near Completion' },
                        { key: 'needs_extension_count', label: 'Needs Extension' }
                      ].map(col => (
                        <th
                          key={col.key}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition"
                          onClick={() => handleStatusSort(col.key as keyof ClinicStatusBreakdown)}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {statusSortKey === col.key && (
                              <span className="text-blue-400">
                                {statusSortDir === 'asc' ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedStatusData.map((row, idx) => (
                      <tr
                        key={`${row.clinic_id}-${idx}`}
                        className="hover:bg-white/5 transition cursor-pointer"
                        onClick={() => handleRowClick(row)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-white">{row.clinic_name ?? 'All Clinics'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row.total_studies}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-400 font-medium">{row.open_studies}</td>
                        
                        {/* Intervene */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${row.intervene_count > 0 ? 'bg-red-100/20 text-red-400' : 'bg-gray-100/10 text-gray-400'}`}>
                              {row.intervene_count}
                            </span>
                          </div>
                        </td>
                        
                        {/* Monitor */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${row.monitor_count > 0 ? 'bg-amber-100/20 text-amber-400' : 'bg-gray-100/10 text-gray-400'}`}>
                              {row.monitor_count}
                            </span>
                          </div>
                        </td>
                        
                        {/* On Target */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${row.on_target_count > 0 ? 'bg-emerald-100/20 text-emerald-400' : 'bg-gray-100/10 text-gray-400'}`}>
                              {row.on_target_count}
                            </span>
                          </div>
                        </td>
                        
                        {/* Near Completion */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${row.near_completion_count > 0 ? 'bg-blue-100/20 text-blue-400' : 'bg-gray-100/10 text-gray-400'}`}>
                              {row.near_completion_count}
                            </span>
                          </div>
                        </td>
                        
                        {/* Needs Extension */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${row.needs_extension_count > 0 ? 'bg-purple-100/20 text-purple-400' : 'bg-gray-100/10 text-gray-400'}`}>
                              {row.needs_extension_count}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quality Breakdown Table */}
          {sortedQualityData && sortedQualityData.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:shadow-xl transition duration-300">
              <div className="p-5 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Quality Breakdown</h3>
                <p className="text-sm text-gray-400 mt-1">Data quality metrics by clinic with quality distribution</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead>
                    <tr className="bg-white/5">
                      {[
                        { key: 'clinic_name', label: 'Clinic' },
                        { key: 'total_studies', label: 'Total' },
                        { key: 'open_studies', label: 'Open' },
                        { key: 'average_quality', label: 'Avg Quality' },
                        { key: 'good_count', label: 'Good' },
                        { key: 'soso_count', label: 'Average' },
                        { key: 'bad_count', label: 'Poor' },
                        { key: 'critical_count', label: 'Critical' },
                      ].map(col => (
                        <th
                          key={col.key}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition"
                          onClick={() => handleQualitySort(col.key as keyof ClinicQualityBreakdown)}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {qualitySortKey === col.key && (
                              <span className="text-blue-400">
                                {qualitySortDir === 'asc' ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedQualityData.map((row, idx) => (
                      <tr
                        key={`${row.clinic_id}-${idx}`}
                        className="hover:bg-white/5 transition cursor-pointer"
                        onClick={() => handleRowClick(row)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-white">{row.clinic_name ?? 'All Clinics'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row.total_studies}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-400 font-medium">{row.open_studies}</td>
                        
                        {/* Average Quality */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getQualityClass(row.average_quality)}`}>
                            {(row.average_quality * 100).toFixed(1)}%
                          </span>
                        </td>
                        
                        {/* Good */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                            <span className="text-sm text-emerald-400">{row.good_count}</span>
                          </div>
                        </td>
                        
                        {/* Average */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                            <span className="text-sm text-amber-400">{row.soso_count}</span>
                          </div>
                        </td>
                        
                        {/* Poor */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                            <span className="text-sm text-orange-400">{row.bad_count}</span>
                          </div>
                        </td>
                        
                        {/* Critical */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-red-400"></div>
                            <span className="text-sm text-red-400">{row.critical_count}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Charts - Weekly/Monthly Data */}
          {analytics?.weeklyQuality && analytics.weeklyQuality.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              {/* Weekly Quality Chart */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:shadow-xl transition duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Weekly Quality Trend</h3>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <SimpleBarChart
                  data={analytics.weeklyQuality.map(q => ({
                    name: q.week_start ? new Date(q.week_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Unknown',
                    value: parseFloat((q.average_quality * 100).toFixed(1))
                  }))}
                  xKey="name"
                  yKey="value"
                  label=""
                  color="#10b981"
                  height={220}
                />
              </div>

              {/* Weekly Studies Chart */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:shadow-xl transition duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Weekly Active Studies</h3>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <SimpleBarChart
                  data={analytics.weeklyStudies.map(s => ({
                    name: s.week_start ? new Date(s.week_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Unknown',
                    value: s.open_studies
                  }))}
                  xKey="name"
                  yKey="value"
                  label=""
                  color="#3b82f6"
                  height={220}
                />
              </div>
            </div>
          )}

          {/* Recent Alerts Section */}
          {analytics?.overview?.recent_alerts && analytics.overview.recent_alerts.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:shadow-xl transition duration-300">
              <div className="p-5 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
                <p className="text-sm text-gray-400 mt-1">System alerts from the past 7 days</p>
              </div>

              <div className="divide-y divide-white/5">
                {analytics.overview.recent_alerts.map((alert, index) => (
                  <div key={alert.alert_id || index} className="p-4 hover:bg-white/5 transition">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-500/20 rounded-full p-2 mt-1">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm">{alert.message}</p>
                        <p className="text-gray-400 text-xs mt-1">Alert ID: {alert.alert_id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
