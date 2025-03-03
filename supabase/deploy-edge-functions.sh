#!/bin/bash

# Script to deploy all edge functions

echo "Deploying edge functions..."

# Deploy the downsample-ecg function
echo "Deploying downsample-ecg..."
cd functions/downsample-ecg
supabase functions deploy downsample-ecg
cd ../..

# Deploy the get-ecg-diagnostics function
echo "Deploying get-ecg-diagnostics..."
cd functions/get-ecg-diagnostics
supabase functions deploy get-ecg-diagnostics
cd ../..

echo "All edge functions deployed successfully!"
