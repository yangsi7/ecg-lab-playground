# Downsample ECG Edge Function

This edge function provides a secure way to downsample ECG data for efficient client-side visualization.

## Features
- Downsamples ECG data based on time range and factor
- Automatically switches to chunked processing for large time ranges (>1 hour)
- Optimizes chunk size based on the requested time range
- Uses PostgreSQL's built-in functions for efficient data reduction
- Handles errors gracefully with proper status codes

## Usage

```typescript
const response = await supabase.functions.invoke('downsample-ecg', {
  body: {
    pod_id: 'uuid',
    time_start: '2025-01-01T00:00:00Z',
    time_end: '2025-01-02T00:00:00Z',
    factor: 4
  }
});
```

## Parameters
- `pod_id`: UUID of the pod/device
- `time_start`: ISO timestamp for range start
- `time_end`: ISO timestamp for range end
- `factor`: Downsampling factor (1-4, default: 4)
  - factor=1: 320Hz (no decimation)
  - factor=2: 160Hz
  - factor=3: ~107Hz
  - factor=4: 80Hz (recommended for visualization)
- `chunk_minutes`: (Optional) Minutes per chunk for explicit chunked processing

## Response
Returns an array of downsampled ECG points or an error message.

## Handling Large Time Ranges

For time ranges exceeding 1 hour, the function automatically switches to chunked processing using the `downsample_ecg_chunked` database function. Chunk size is optimized based on the requested time range:

- Multi-day ranges: 60-minute chunks
- 12+ hours: 30-minute chunks
- 6-12 hours: 15-minute chunks
- 1-6 hours: 10-minute chunks
- <1 hour: 5-minute chunks (if explicitly requested)

You can also manually set the chunk size with the `chunk_minutes` parameter to optimize for specific use cases.

## Error Handling

If you encounter a timeout error, consider:

1. Reducing the time range
2. Explicitly requesting chunked processing with `chunk_minutes`
3. Increasing the downsampling factor for faster processing
