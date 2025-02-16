import { render, screen, fireEvent } from '@testing-library/react';
import { QuickFilters } from '../QuickFilters';
import { AdvancedFilter } from '../AdvancedFilter';
import { applyQuickFilter, applyAdvancedFilter } from '../../../../utils/filterHelpers';
import type { HolterStudy } from '../../../../types/holter';

const mockStudies: HolterStudy[] = [
  {
    study_id: '1',
    clinic_name: 'Test Clinic',
    duration: 14,
    daysRemaining: 7,
    totalQualityHours: 120,
    qualityFraction: 0.85,
    totalHours: 140,
    interruptions: 2,
    qualityVariance: 0.02,
    status: 'good'
  },
  {
    study_id: '2',
    clinic_name: 'Test Clinic',
    duration: 7,
    daysRemaining: 3,
    totalQualityHours: 40,
    qualityFraction: 0.4,
    totalHours: 100,
    interruptions: 5,
    qualityVariance: 0.05,
    status: 'warning'
  }
];

describe('QuickFilters', () => {
  it('renders all quick filter buttons', () => {
    render(<QuickFilters activeFilter={undefined} onFilterChange={() => {}} />);
    
    expect(screen.getByText(/Bad Quality/)).toBeInTheDocument();
    expect(screen.getByText(/Needs Intervention/)).toBeInTheDocument();
    expect(screen.getByText(/Under Target/)).toBeInTheDocument();
  });

  it('highlights active filter', () => {
    render(<QuickFilters activeFilter="bad-quality" onFilterChange={() => {}} />);
    
    const activeButton = screen.getByText(/Bad Quality/);
    expect(activeButton.className).toContain('bg-blue-500/20');
  });

  it('calls onFilterChange when clicked', () => {
    const handleChange = jest.fn();
    render(<QuickFilters activeFilter={undefined} onFilterChange={handleChange} />);
    
    fireEvent.click(screen.getByText(/Bad Quality/));
    expect(handleChange).toHaveBeenCalledWith('bad-quality');
  });
});

describe('AdvancedFilter', () => {
  const defaultProps = {
    value: '',
    error: null,
    showFields: false,
    presets: [],
    onChange: () => {},
    onToggleFields: () => {},
    onSavePreset: () => {},
    onSelectPreset: () => {},
  };

  it('renders input field', () => {
    render(<AdvancedFilter {...defaultProps} />);
    
    expect(screen.getByPlaceholderText(/Enter filter expression/)).toBeInTheDocument();
  });

  it('shows error message when present', () => {
    render(<AdvancedFilter {...defaultProps} error="Invalid expression" />);
    
    expect(screen.getByText('Invalid expression')).toBeInTheDocument();
  });

  it('shows available fields when showFields is true', () => {
    render(<AdvancedFilter {...defaultProps} showFields={true} />);
    
    expect(screen.getByText(/Available fields/)).toBeInTheDocument();
  });

  it('shows presets when available', () => {
    const presets = [
      { id: '1', name: 'Test Preset', expression: 'qualityFraction > 0.8' }
    ];
    
    render(<AdvancedFilter {...defaultProps} showFields={true} presets={presets} />);
    
    expect(screen.getByText('Test Preset')).toBeInTheDocument();
  });
});

describe('Filter Application', () => {
  describe('Quick Filters', () => {
    it('filters bad quality studies', () => {
      const filtered = applyQuickFilter(mockStudies, 'bad-quality');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].study_id).toBe('2');
    });

    it('filters studies needing intervention', () => {
      const filtered = applyQuickFilter(mockStudies, 'needs-intervention');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('Advanced Filters', () => {
    it('filters by quality fraction', () => {
      const filtered = applyAdvancedFilter(mockStudies, 'qualityFraction > 0.8');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].study_id).toBe('1');
    });

    it('filters by multiple conditions', () => {
      const filtered = applyAdvancedFilter(
        mockStudies, 
        'qualityFraction < 0.5 && interruptions > 3'
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].study_id).toBe('2');
    });

    it('returns all studies for empty expression', () => {
      const filtered = applyAdvancedFilter(mockStudies, '');
      expect(filtered).toHaveLength(2);
    });

    it('handles invalid expressions gracefully', () => {
      const filtered = applyAdvancedFilter(mockStudies, 'invalid expression');
      expect(filtered).toHaveLength(0);
    });
  });
}); 