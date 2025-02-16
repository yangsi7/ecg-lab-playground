#!/bin/bash

# test-edge.sh
# Basic script to test the Edge Function
# Adjust your supabase URL/token accordingly

curl -L -X POST 'https://<your-project>.supabase.co/functions/v1/downsample-ecg' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-access-token>" \
  -d '{
    "pod_id": "09753cf8-f1c5-4c80-b310-21d5fcb85401",
    "time_start": "2025-07-26T00:00:00+00:00",
    "time_end": "2025-07-27T00:00:00+00:00",
    "max_pts": 50
  }'
