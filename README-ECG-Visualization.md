# ECG Visualization Components

This document provides an overview of the ECG visualization components and how they integrate with the Supabase edge function for retrieving ECG data.

## Overview

The ECG visualization system consists of several components:

1. **ECGVisualization**: A core component that renders ECG data using AdvancedECGPlot
2. **ECGSampleViewer**: A complete UI for viewing ECG data with time selection and channel switching
3. **AdvancedECGPlot**: A feature-rich ECG plot with pan, zoom, and tooltip capabilities
4. **MainECGViewer**: A comprehensive viewer with multiple channels and diagnostics

## Data Flow

The data flows through the system as follows:

1. The component requests ECG data by calling the `useECGData` hook
2. The hook invokes the Supabase edge function `downsample-ecg`
3. The edge function fetches and processes data from the `ecg_chunks` table
4. The processed data is returned to the component for visualization

## Component Usage

### Basic Usage with ECGVisualization

```tsx
import { ECGVisualization } from '@/components/shared/ecg/ECGVisualization';

// In your component
<ECGVisualization
  podId="pod-123"
  timeStart="2023-01-01T12:00:00Z"
  timeEnd="2023-01-01T12:15:00Z"
  channel={1}
  width={800}
  height={300}
  colorBlindMode={false}
/>
```

### Complete UI with ECGSampleViewer

```tsx
import { ECGSampleViewer } from '@/components/shared/ecg/ECGSampleViewer';

// In your component
<ECGSampleViewer 
  podId="pod-123" 
  initialStartTime="2023-01-01T12:00:00Z"
  initialEndTime="2023-01-01T12:15:00Z"
/>
```

## Key Features

### ECGVisualization

- Fetches data from the `downsample-ecg` edge function
- Provides loading and error states
- Renders ECG data with proper scaling
- Supports multiple channels
- Includes color-blind mode

### AdvancedECGPlot

- Horizontal pan & zoom capabilities
- Y-axis scaling controls
- Tooltips for data point information
- High-performance canvas rendering
- Support for color-blind mode

### ECGSampleViewer

- Complete UI for ECG visualization
- Time range selection with presets
- Channel switching between leads
- User instructions
- Responsive design

## Hook: useECGData

The `useECGData` hook is responsible for fetching ECG data from the Supabase edge function:

```tsx
const { data, loading, error } = useECGData({
  podId: 'pod-123',
  timeStart: '2023-01-01T12:00:00Z',
  timeEnd: '2023-01-01T12:15:00Z',
  maxPoints: 2000
});
```

## Edge Function: downsample-ecg

The `downsample-ecg` edge function is a Supabase function that:

1. Accepts parameters: pod_id, time_start, time_end, and factor
2. Queries the database for ECG data in the specified time range
3. Downsamples the data to reduce the number of points
4. Returns the processed data for visualization

## Performance Considerations

- The edge function limits the number of points returned to prevent performance issues
- The canvas rendering is optimized for smooth interaction
- Chunked loading is used for large datasets to improve initial load time
- Caching is implemented for frequently accessed data

## Accessibility Features

- Color-blind mode for better visibility
- Keyboard navigation support
- ARIA labels and roles
- Clear loading and error states

## Extending the Components

To add new features to the ECG visualization:

1. Enhance the existing components or create new ones
2. Update the hooks to fetch additional data
3. Modify the edge function if necessary for new data requirements

## Troubleshooting

### Common Issues and Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| No data displayed | Invalid time range | Ensure start time is before end time and both are valid ISO strings |
| | Missing pod ID | Verify the pod ID exists and is correctly formatted |
| | No data in range | Try a different time range where data is known to exist |
| Edge function timeout | Time range too large | Reduce the time range or increase downsampling factor |
| | Server load | Retry the request or check Supabase logs |
| Rendering performance issues | Too many data points | Use the `downsamplingFactor` prop to reduce data points |
| | Browser limitations | Consider using WebWorkers for data processing |
| Incorrect channel data | Wrong channel selected | ECG has channels 1-3; verify you're using the correct one |

### Debugging with Query Tracker

The ECG Query Tracker provides detailed information about all ECG data requests:

1. Enable debug mode on the `ECGVisualization` component
2. Click the debug icon (bug) in the top-right corner
3. View the Queries tab to see request history
4. Check the Performance tab for optimization suggestions
5. View the Errors tab for detailed error logs

### Performance Optimization Tips

- Limit time ranges to less than 1 hour for best performance
- Use the auto-downsampling feature for longer time ranges
- Take advantage of the caching system for frequently accessed data
- Implement virtualized rendering for very long ECG segments
- Consider using Web Workers for heavy data processing operations

### Reporting Issues

When reporting issues with the ECG visualization:

1. Enable debug mode and capture diagnostics information
2. Note the specific time range and pod ID that's causing the issue
3. Include any error messages from the diagnostics panel
4. Describe the expected behavior vs. the actual behavior
5. Include browser and device information if relevant

## Related Components

- ECGTimelineBar: For visualizing ECG quality over time
- EcgAggregatorView: For viewing aggregated ECG statistics

## Diagnostics and Quality Assurance

The ECG visualization system includes robust diagnostics and quality assurance features to help developers identify and resolve issues.

### Diagnostics Panel

A floating diagnostics panel is available when debug mode is enabled:

```tsx
<ECGVisualization
  podId="POD123"
  timeStart="2023-01-01T12:00:00Z"
  timeEnd="2023-01-01T12:10:00Z"
  debug={true}
/>
```

The diagnostics panel provides:

- **Query Monitoring**: Track all ECG queries, their duration, and point counts
- **Performance Metrics**: View memory usage and rendering performance
- **Error Logging**: Capture and display errors for troubleshooting
- **Common Issues**: Reference guide for resolving typical problems

### Enhanced Error Handling

The system now includes comprehensive error handling:

- **Input Validation**: All time ranges and parameters are validated before making requests
- **User-Friendly Messages**: Error messages are translated into human-readable form
- **Retry Mechanism**: One-click retry for failed queries
- **Error Classification**: Different error types (network, timeout, server) receive appropriate handling

### Query Performance Tracking

The `useECGData` hook now includes performance tracking:

```tsx
const { data, loading, error, refetch, metrics } = useECGData(
  podId,
  timeStart,
  timeEnd
);

// metrics includes:
// - pointCount: Number of data points returned
// - queryDuration: Time taken to fetch data in milliseconds
// - downsamplingFactor: Factor used for downsampling
// - lastQueryTimestamp: When the last query was made
```

### Caching and Optimization

Performance optimizations include:

- **Data Caching**: Frequently accessed data is cached to reduce redundant API calls
- **Auto-Downsampling**: Time ranges are automatically downsampled based on length
- **Request Debouncing**: Prevents excessive API calls during rapid parameter changes

### Data Loading States

Visual feedback for all query states:

- **Loading State**: Shows a spinner with information about what's being loaded
- **Empty State**: Clear messaging when no data is found
- **Error State**: Displays the error with a retry option
- **Success State**: Displays the data with optional debug information

These diagnostic and QA features ensure that developers have the tools they need to build reliable ECG visualization applications. 