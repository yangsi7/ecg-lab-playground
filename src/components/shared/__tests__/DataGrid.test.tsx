import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataGrid, type Column } from '../DataGrid';
import '@testing-library/jest-dom';

interface TestData {
  id: string;
  name: string;
  value: number;
}

const testData: TestData[] = [
  { id: '1', name: 'Test 1', value: 100 },
  { id: '2', name: 'Test 2', value: 200 },
  { id: '3', name: 'Test 3', value: 300 },
];

const columns: Column<TestData>[] = [
  { field: 'id', header: 'ID', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'value', header: 'Value', sortable: true },
];

describe('DataGrid', () => {
  it('renders the grid with data', () => {
    render(<DataGrid data={testData} columns={columns} />);
    
    // Check headers
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    
    // Check data
    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
    expect(screen.getByText('Test 3')).toBeInTheDocument();
  });

  it('handles sorting', () => {
    render(<DataGrid data={testData} columns={columns} />);
    
    // Click on Name header to sort
    fireEvent.click(screen.getByText('Name'));
    
    // Check if data is sorted alphabetically
    const cells = screen.getAllByRole('cell');
    expect(cells[1]).toHaveTextContent('Test 1');
    expect(cells[4]).toHaveTextContent('Test 2');
    expect(cells[7]).toHaveTextContent('Test 3');
    
    // Click again to reverse sort
    fireEvent.click(screen.getByText('Name'));
    
    const cellsReversed = screen.getAllByRole('cell');
    expect(cellsReversed[1]).toHaveTextContent('Test 3');
    expect(cellsReversed[4]).toHaveTextContent('Test 2');
    expect(cellsReversed[7]).toHaveTextContent('Test 1');
  });

  it('handles filtering', () => {
    const onFilterError = jest.fn();
    
    render(
      <DataGrid
        data={testData}
        columns={columns}
        filterExpression="value > 150"
        onFilterError={onFilterError}
      />
    );
    
    // Should only show items with value > 150
    expect(screen.queryByText('Test 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
    expect(screen.getByText('Test 3')).toBeInTheDocument();
    
    // Test invalid filter
    render(
      <DataGrid
        data={testData}
        columns={columns}
        filterExpression="invalid expression"
        onFilterError={onFilterError}
      />
    );
    
    expect(onFilterError).toHaveBeenCalled();
  });

  it('handles pagination', () => {
    render(<DataGrid data={testData} columns={columns} pageSize={2} />);
    
    // Should show first two items
    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
    expect(screen.queryByText('Test 3')).not.toBeInTheDocument();
    
    // Go to next page
    fireEvent.click(screen.getByText('Next'));
    
    // Should show third item
    expect(screen.queryByText('Test 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test 2')).not.toBeInTheDocument();
    expect(screen.getByText('Test 3')).toBeInTheDocument();
  });

  it('renders custom cell content', () => {
    const columnsWithRender: Column<TestData>[] = [
      ...columns,
      {
        field: 'value',
        header: 'Custom Value',
        render: (value: string | number, row: TestData) => 
          typeof value === 'number' ? `$${value.toFixed(2)}` : value
      }
    ];
    
    render(<DataGrid data={testData} columns={columnsWithRender} />);
    
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('$300.00')).toBeInTheDocument();
  });
}); 