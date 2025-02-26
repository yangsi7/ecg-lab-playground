import { useState } from 'react';
import { useStudiesWithTimes } from '@/hooks/api/study/useStudyHooks';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Search, Filter } from 'lucide-react';
import type { StudiesWithTimesRow } from '@/types/domain/study';

interface StudyManagementTableProps {
  clinicId: string;
}

export default function StudyManagementTable({ clinicId }: StudyManagementTableProps): JSX.Element {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 3; // Keep small to prevent timeouts
  
  // Only fetch when we have at least 3 characters for search or a valid clinicId
  const shouldFetch = search.length >= 3 || !!clinicId;
  
  const {
    data: studies,
    totalCount,
    loading,
    error,
    hasMore
  } = useStudiesWithTimes({
    search,
    page,
    pageSize,
    clinicId
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setPage(0);
  };
  
  const handleNextPage = () => {
    if (hasMore) setPage(page + 1);
  };
  
  const handlePrevPage = () => {
    if (page > 0) setPage(page - 1);
  };
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700">
        Error loading studies: {error.message}
        <div className="mt-2">
          <p className="text-sm">Try adding a more specific search term to reduce query size.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Studies</h2>
        
        <form onSubmit={handleSearch} className="flex">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search studies..."
              className="pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <button
            type="submit"
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Study ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pod ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : studies.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  {shouldFetch ? 'No studies found' : 'Enter search term to find studies'}
                </td>
              </tr>
            ) : (
              studies.map((study) => (
                <tr key={study.study_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{study.study_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{study.user_id || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{study.pod_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {study.start_timestamp ? new Date(study.start_timestamp).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      study.pod_status === 'active' ? 'bg-green-100 text-green-800' :
                      study.pod_status === 'error' ? 'bg-red-100 text-red-800' :
                      study.pod_status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {study.pod_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {study.duration ? `${study.duration.toFixed(1)} hrs` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {study.aggregated_quality_minutes && study.aggregated_total_minutes ? 
                      `${((study.aggregated_quality_minutes / study.aggregated_total_minutes) * 100).toFixed(1)}%` : 
                      'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        {totalCount > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={handlePrevPage}
                disabled={page === 0}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === 0 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={!hasMore}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  !hasMore ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{studies.length ? page * pageSize + 1 : 0}</span> to{' '}
                  <span className="font-medium">{page * pageSize + studies.length}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={handlePrevPage}
                    disabled={page === 0}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                      page === 0 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    &larr;
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={!hasMore}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                      !hasMore ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    &rarr;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 