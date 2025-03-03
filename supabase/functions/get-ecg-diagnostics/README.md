# get-ecg-diagnostics Edge Function

This edge function provides ECG diagnostic metrics by calling the `get_ecg_diagnostics_chunked` RPC function in the database.

## Purpose

The function retrieves diagnostic metrics for ECG data, such as signal quality, noise levels, and connection statistics, for a specified pod and time range.

## Parameters

The function accepts a JSON body with the following parameters:

- `pod_id` (required): The ID of the pod to retrieve diagnostics for
- `time_start` (required): The start time of the time range (ISO 8601 format)
- `time_end` (required): The end time of the time range (ISO 8601 format)
- `chunk_minutes` (optional): The size of time chunks to use for processing (defaults to an optimal size based on the time range)

## Response

The function returns a JSON object containing diagnostic metrics for the specified time range. The metrics include:

- Signal quality metrics (noise levels, quality scores)
- Connection statistics (total samples, missing samples, connection drops, sampling frequency)

## Usage

```typescript
// Example usage in a React component
const { diagnostics, isLoading, error } = useECGDiagnostics({
  pod_id: "your-pod-id",
  time_start: "2023-01-01T00:00:00Z",
  time_end: "2023-01-01T01:00:00Z"
});
```

## Implementation Notes

- The function automatically determines the optimal chunk size based on the time range
- It uses the shared CORS headers from the `@shared/cors.ts` module
- Authentication is handled via the Authorization header
- Function execution statistics are logged to the `edge_function_stats` table
