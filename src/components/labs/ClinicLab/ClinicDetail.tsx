/**
 * src/components/labs/ClinicLab/ClinicDetail.tsx
 *
 * This is a new page to show a single clinic's stats in more depth,
 * accessible via route "/clinic/:clinicId".
 *
 * We'll reuse the "useClinicAnalytics" hook with the given clinicId,
 * then display the same or expanded charts/time-series specifically for that clinic.
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClinicDetails } from '@/hooks/api/clinic/useClinicDetails';
import { useClinicAnalytics } from '@/hooks/api';
import { ChevronLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { Database } from '@/types/database.types';

type ClinicOverviewRow = Database['public']['Functions']['get_clinic_overview']['Returns'][0];
type ClinicQualityBreakdownRow = Database['public']['Functions']['get_clinic_quality_breakdown']['Returns'][0];
type ClinicStatusBreakdownRow = Database['public']['Functions']['get_clinic_status_breakdown']['Returns'][0];

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
                    {typeof clinicError === 'string' ? clinicError : 'An error occurred'}
                    {typeof analyticsError === 'string' ? analyticsError : 'An error occurred'}
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
                <h1 className="text-2xl font-bold">
                    {clinic.name || 'Unnamed Clinic'}
                </h1>
            </div>

            {/* Overview Section */}
            {analytics.overview && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-2">Total Studies</h3>
                        <p className="text-2xl">{analytics.overview.total_studies}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-2">Active Studies</h3>
                        <p className="text-2xl">{analytics.overview.active_studies}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-2">Average Quality Hours</h3>
                        <p className="text-2xl">{analytics.overview.average_quality_hours.toFixed(1)}</p>
                    </div>
                </div>
            )}

            {/* Quality Breakdown Table */}
            {analytics.qualityBreakdown && analytics.qualityBreakdown.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Quality Breakdown</h2>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quality
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Count
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Average Quality
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {analytics.qualityBreakdown.map((row, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {row.clinic_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {row.total_studies}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(row.average_quality * 100).toFixed(1)}%
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
                    <h2 className="text-xl font-semibold mb-4">Status Breakdown</h2>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Studies
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Open Studies
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Intervene
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Monitor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        On Target
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {analytics.statusBreakdown.map((row, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {row.total_studies}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {row.open_studies}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {row.intervene_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {row.monitor_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {row.on_target_count}
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
