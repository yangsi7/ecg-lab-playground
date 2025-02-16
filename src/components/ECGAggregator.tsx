import React, { useState, useEffect, useCallback } from 'react';
import useEcgAggregator from '../hooks/useEcgAggregator';
import ECGVisualization from './ECGVisualization';
import { useDebounce } from '../hooks/useDebounce';
import { CSVLink } from 'react-csv';

interface ECGAggregatorProps {
  timeInterval: 'hourly' | 'daily';
  bucketSize: number;
  page: number;
  pageSize: number;
  columns: string[];
  filters: { [key: string]: any };
  initialColumns?: string[]; // Optional initial columns
}

const ECGAggregator: React.FC<ECGAggregatorProps> = ({
  timeInterval,
  bucketSize,
  page,
  pageSize,
  columns,
  filters,
  initialColumns
}) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(initialColumns || columns);

  const { data, isLoading, error } = useEcgAggregator({
    timeInterval,
    bucketSize,
    page,
    pageSize,
    columns: visibleColumns, // Use visibleColumns for fetching
    filters: { ...filters, search: debouncedSearch }, // Include search in filters
  });

    // Function to toggle column visibility
    const toggleColumn = useCallback((column: string) => {
        setVisibleColumns(prevColumns =>
            prevColumns.includes(column)
                ? prevColumns.filter(c => c !== column)
                : [...prevColumns, column]
        );
    }, []);

  if (isLoading) {
    return <div>Loading ECG Data...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">ECG Aggregated Data</h2>

      <!-- Search Input -->
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <!-- Column Selector (Basic Example) -->
      <div className="mb-4">
        {columns.map(column => (
          <label key={column} className="mr-4">
            <input
              type="checkbox"
              checked={visibleColumns.includes(column)}
              onChange={() => toggleColumn(column)}
            />
            {column}
          </label>
        ))}
      </div>

      <!-- CSV Export Button -->
      {data &amp;&amp; data.length > 0 &amp;&amp; (
        <div className="mb-4">
          <CSVLink data={data} filename={`ecg-data-${Date.now()}.csv`}>
            Export to CSV
          </CSVLink>
        </div>
      )}

      <!-- Responsive Design using Tailwind CSS -->
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data &amp;&amp; data.length > 0 ? (
          <ECGVisualization data={data} />
        ) : (
          <div>No ECG data available.</div>
        )}
      </div>
    </div>
  );
};

export default ECGAggregator;
