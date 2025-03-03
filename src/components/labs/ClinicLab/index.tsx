/**
 * src/components/labs/ClinicLab.tsx
 *
 * A dashboard for clinic-level stats.
 */

import { useState, useMemo, useEffect } from 'react';
import { useClinicAnalytics } from '@/hooks/api/clinic/useClinicAnalytics';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';
import {
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Search,
  AlertCircle,
  Bell
} from 'lucide-react';
import { SimpleBarChart } from '../../shared/charts/SimpleBarChart';
import SparklineChart from './components/SparklineChart';
import type {
  ClinicStatusBreakdown,
  ClinicQualityBreakdown
} from '@/types/domain/clinic';

export default function ClinicLab() {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    data: analytics,
    isLoading: loading,
    error
  } = useClinicAnalytics(clinicId);

  // Debug logging
  useEffect(() => {
    logger.debug('ClinicLab: Component state', {
      clinicId,
      loading,
      hasError: !!error,
      hasAnalytics: !!analytics,
      hasOverview: !!analytics?.overview,
      hasStatusBreakdown: !!analytics?.statusBreakdown,
      hasQualityBreakdown: !!analytics?.qualityBreakdown,
      statusBreakdownLength: analytics?.statusBreakdown?.length || 0,
      qualityBreakdownLength: analytics?.qualityBreakdown?.length || 0,
      statusBreakdownData: analytics?.statusBreakdown || [],
      qualityBreakdownData: analytics?.qualityBreakdown || []
    });
  }, [clinicId, loading, error, analytics]);

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
      setStatusSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setStatusSortKey(key);
      setStatusSortDir('asc');
    }
  };

  // Handle sorting for quality table
  const handleQualitySort = (key: keyof ClinicQualityBreakdown) => {
    if (qualitySortKey === key) {
      setQualitySortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
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

  // Debug render conditions
  const shouldRenderContent = !loading && !error && !!analytics;
  const hasOverviewData = !!analytics?.overview;
  const hasStatusData = !!analytics?.statusBreakdown && analytics.statusBreakdown.length > 0;
  const hasQualityData = !!analytics?.qualityBreakdown && analytics.qualityBreakdown.length > 0;

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
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder:text-gray-500 transition-all"
            />
          </div>
          
          <div className="relative">
            <input
              id="clinic_id"
              type="text"
              placeholder="Clinic ID (optional)"
              value={clinicId || ''}
              onChange={(e) => setClinicId(e.target.value || null)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder:text-gray-500 transition-all"
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

      {/* No data state */}
      {shouldRenderContent && !hasOverviewData && !hasStatusData && !hasQualityData && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-blue-500/20 rounded-full p-4 mb-4">
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-white text-lg font-medium mb-2">No Clinic Data Available</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              There are no clinics or studies in the system yet. Once data is available, it will appear here.
            </p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      {shouldRenderContent && hasOverviewData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Studies Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:shadow-xl hover:border-white/20 transition-all duration-300 group">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Active Studies</p>
                <h3 className="text-3xl font-bold text-white">
                  {analytics?.overview?.active_studies}
                </h3>
                <p className="text-blue-400 text-xs mt-2">
                  {analytics?.overview
                    ? Math.round(
                        (analytics.overview.active_studies /
                          analytics.overview.total_studies) *
                          100
                      )
                    : 0}
                  % of total
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
                <h3 className="text-3xl font-bold text-white">
                  {analytics?.overview?.total_studies}
                </h3>
                <p className="text-emerald-400 text-xs mt-2">Lifetime accumulated</p>
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
                  {analytics?.overview?.average_quality_hours.toFixed(1) || '0.0'}
                </h3>
                <p className="text-indigo-400 text-xs mt-2">Per active study</p>
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
                  {analytics?.overview?.recent_alerts?.length ?? 0}
                </h3>
                <p className="text-amber-400 text-xs mt-2">In the past 7 days</p>
              </div>
              <div className="bg-amber-500/20 rounded-lg p-2 h-fit group-hover:bg-amber-500/30 transition-colors">
                <Bell className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXAMPLE Sparkline Implementation */}
      {shouldRenderContent && analytics?.weeklyActiveStudies && analytics.weeklyActiveStudies.length > 0 && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:shadow-xl hover:border-white/20 transition duration-300">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Active Studies Sparkline</h3>
          <SparklineChart
            data={analytics.weeklyActiveStudies}
            xKey="week_start"
            yKey="value"
            color="#f59e0b"
            width={400}
            height={80}
            strokeWidth={2}
            showPoints={false}
            fillOpacity={0.1}
          />
        </div>
      )}

      {/* Status Breakdown Table */}
      {shouldRenderContent && hasStatusData && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:shadow-xl transition duration-300">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Status Breakdown</h3>
            <p className="text-sm text-gray-400 mt-1">
              Study status by clinic with intervention indicators
            </p>
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
                  ].map((col) => (
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
                        <div className="text-sm font-medium text-white">
                          {row.clinic_name ?? 'All Clinics'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {row.total_studies}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-400 font-medium">
                      {row.open_studies}
                    </td>

                    {/* Intervene */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                            row.intervene_count > 0
                              ? 'bg-red-100/20 text-red-400'
                              : 'bg-gray-100/10 text-gray-400'
                          }`}
                        >
                          {row.intervene_count}
                        </span>
                      </div>
                    </td>

                    {/* Monitor */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                            row.monitor_count > 0
                              ? 'bg-amber-100/20 text-amber-400'
                              : 'bg-gray-100/10 text-gray-400'
                          }`}
                        >
                          {row.monitor_count}
                        </span>
                      </div>
                    </td>

                    {/* On Target */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                            row.on_target_count > 0
                              ? 'bg-emerald-100/20 text-emerald-400'
                              : 'bg-gray-100/10 text-gray-400'
                          }`}
                        >
                          {row.on_target_count}
                        </span>
                      </div>
                    </td>

                    {/* Near Completion */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                            row.near_completion_count > 0
                              ? 'bg-blue-100/20 text-blue-400'
                              : 'bg-gray-100/10 text-gray-400'
                          }`}
                        >
                          {row.near_completion_count}
                        </span>
                      </div>
                    </td>

                    {/* Needs Extension */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                            row.needs_extension_count > 0
                              ? 'bg-purple-100/20 text-purple-400'
                              : 'bg-gray-100/10 text-gray-400'
                          }`}
                        >
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
      {shouldRenderContent && hasQualityData && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:shadow-xl transition duration-300">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Quality Breakdown</h3>
            <p className="text-sm text-gray-400 mt-1">
              Data quality metrics by clinic with quality distribution
            </p>
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
                    { key: 'critical_count', label: 'Critical' }
                  ].map((col) => (
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
                        <div className="text-sm font-medium text-white">
                          {row.clinic_name ?? 'All Clinics'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {row.total_studies}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-400 font-medium">
                      {row.open_studies}
                    </td>

                    {/* Average Quality */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getQualityClass(
                          row.average_quality
                        )}`}
                      >
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
    </div>
  );
}
