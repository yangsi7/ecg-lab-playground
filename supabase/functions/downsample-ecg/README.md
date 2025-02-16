# Downsample ECG Edge Function

This edge function provides a secure way to downsample ECG data for efficient client-side visualization.

## Features
- Downsamples ECG data based on time range and maximum points
- Uses PostgreSQL's built-in window functions for efficient data reduction
- Handles errors gracefully with proper status codes

## Usage

```typescript
const response = await supabase.functions.invoke('downsample-ecg', {
  body: {
    patientId: 'uuid',
    start: '2025-01-01T00:00:00Z',
    end: '2025-01-02T00:00:00Z',
    maxPoints: 1000
  }
});
```

## Parameters
- `patientId`: UUID of the patient
- `start`: ISO timestamp for range start
- `end`: ISO timestamp for range end
- `maxPoints`: Maximum number of points to return

## Response
Returns an array of downsampled ECG points or an error message.
