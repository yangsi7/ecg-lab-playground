/**
 * src/components/labs/ClinicLab/ClinicDetail.tsx
 *
 * This is a new page to show a single clinic's stats in more depth,
 * accessible via route "/clinic/:clinicId".
 *
 * We'll reuse the "useClinicAnalytics" hook with the given clinicId,
 * then display the same or expanded charts/time-series specifically for that clinic.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useClinicDetails } from '@/hooks/api/clinic/useClinicDetails';
import { useClinicAnalytics } from '@/hooks/api';
import { ChevronLeft, Building2, Activity, BarChart2, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { ClinicOverview, ClinicQualityBreakdown, ClinicStatusBreakdown } from '@/types/domain/clinic';

export default function ClinicDetail() {
    const { clinicId } = useParams<{ clinicId: string }>();
    const navigate = useNavigate();

    const {
        data: clinic,
        isLoading: isLoadingClinic,
        error: clinicError
    } = useClinicDetails(clinicId ?? null);

    const {
        data: analytics,
        isLoading: isLoadingAnalytics,
        error: analyticsError
    } = useClinicAnalytics(clinicId ?? null);

    if (isLoadingClinic || isLoadingAnalytics) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (clinicError || analyticsError) {
        return (
            <div className="p-4">
                <button 
                    onClick={() => navigate('/clinic')} 
                    className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Clinics
                </button>
                <div className="text-red-500">
                    {clinicError ? (typeof clinicError === 'string' ? clinicError : 'Error loading clinic details') : ''}
                    {analyticsError ? (typeof analyticsError === 'string' ? analyticsError : 'Error loading analytics') : ''}
                </div>
            </div>
        );
    }

    if (!clinic || !analytics) {
        return (
            <div className="p-4">
                <button 
                    onClick={() => navigate('/clinic')} 
                    className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Clinics
                </button>
                <div>Clinic not found</div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center mb-6">
                <button 
                    onClick={() => navigate('/clinic')} 
                    className="mr-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Clinics
                </button>
                <div className="flex items-center gap-2">
                    <Building2 className="h-8 w-8 text-blue-400" />
                    <h1 className="text-2xl font-bold text-white">
                        {clinic.name || 'Unnamed Clinic'}
                    </h1>
                </div>
            </div>

            {/* Overview Section */}
            {analytics.overview && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">Total Studies</h3>
                            <Users className="h-5 w-5 text-blue-400" />
                        </div>
                        <p className="text-3xl text-white">{analytics.overview.total_studies}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">Active Studies</h3>
                            <Activity className="h-5 w-5 text-green-400" />
                        </div>
                        <p className="text-3xl text-white">{analytics.overview.active_studies}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">Average Quality Hours</h3>
                            <BarChart2 className="h-5 w-5 text-yellow-400" />
                        </div>
                        <p className="text-3xl text-white">{analytics.overview.average_quality_hours.toFixed(1)}</p>
                    </div>
                </div>
            )}

            {/* Quality Breakdown Table */}
            {analytics.qualityBreakdown && analytics.qualityBreakdown.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-white">Quality Breakdown</h2>
                    <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Quality
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Count
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Average Quality
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {analytics.qualityBreakdown.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                            {row.clinic_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                            {row.total_studies}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                row.average_quality > 0.7 ? 'bg-green-100 text-green-800' : 
                                                row.average_quality > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {(row.average_quality * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Status Breakdown Table */}
            {analytics.statusBreakdown && analytics.statusBreakdown.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-white">Status Breakdown</h2>
                    <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Total Studies
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Open Studies
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Intervene
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Monitor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        On Target
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {analytics.statusBreakdown.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                            {row.total_studies}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                            {row.open_studies}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                {row.intervene_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                {row.monitor_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {row.on_target_count}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TODO: Add charts for weekly/monthly trends using analytics.weeklyQuality, 
                      analytics.monthlyQuality, analytics.weeklyStudies, and analytics.monthlyStudies */}
        </div>
    );
}
