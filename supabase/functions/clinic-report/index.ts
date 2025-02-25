/**
 * supabase/functions/clinic-report/index.ts
 * 
 * An Edge Function that generates detailed reports for clinics
 * Processes and formats data for CSV/Excel export
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Type definitions
interface ReportRequest {
  clinic_id: string;
  time_range?: 'week' | 'month' | 'quarter' | 'year';
  include_studies?: boolean;
  include_quality_metrics?: boolean;
  format?: 'json' | 'csv';
}

interface ReportResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Create a Supabase client with the Auth role
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    auth: { persistSession: false }
  }
);

// Handle incoming requests
serve(async (req: Request) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract request body
    const { clinic_id, time_range = 'month', include_studies = true, include_quality_metrics = true, format = 'json' } = 
      await req.json() as ReportRequest;

    // Validate clinic_id
    if (!clinic_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing clinic_id parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get clinic details
    const { data: clinic, error: clinicError } = await supabaseClient
      .from('clinics')
      .select('*')
      .eq('id', clinic_id)
      .single();

    if (clinicError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch clinic data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch clinic analytics
    const { data: overviewData, error: overviewError } = await supabaseClient
      .rpc('get_clinic_overview', { _clinic_id: clinic_id });
    
    if (overviewError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch clinic analytics' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch studies if requested
    let studies = null;
    if (include_studies) {
      const { data: studiesData, error: studiesError } = await supabaseClient
        .from('study')
        .select('*')
        .eq('clinic_id', clinic_id);

      if (!studiesError) {
        studies = studiesData;
      }
    }

    // Fetch quality metrics if requested
    let qualityMetrics = null;
    if (include_quality_metrics) {
      const { data: qualityData, error: qualityError } = await supabaseClient
        .rpc('get_clinic_quality_breakdown', { _clinic_id: clinic_id });

      if (!qualityError) {
        qualityMetrics = qualityData;
      }
    }

    // Assemble the report data
    const reportData = {
      clinic,
      overview: overviewData[0],
      studies,
      qualityMetrics
    };

    // Format the response based on the requested format
    if (format === 'csv') {
      // Convert to CSV
      const csvContent = convertToCSV(reportData);
      return new Response(csvContent, { 
        status: 200, 
        headers: { 
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="clinic_report_${clinic_id}.csv"` 
        } 
      });
    }

    // Default JSON response
    return new Response(
      JSON.stringify({ success: true, data: reportData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Handle any unexpected errors
    console.error('Error in clinic-report function:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Helper function to convert JSON data to CSV format
 */
function convertToCSV(data: any): string {
  const clinic = data.clinic;
  const overview = data.overview;
  
  // Start with clinic info header
  let csv = `Clinic Report\nID,Name,Active Studies,Total Studies,Avg Quality Hours\n`;
  
  // Add clinic overview data
  csv += `${clinic.id},${clinic.name},${overview.active_studies},${overview.total_studies},${overview.average_quality_hours}\n\n`;
  
  // Add studies if available
  if (data.studies?.length) {
    csv += 'Studies\nStudy ID,Type,Start Date,End Date,Quality Minutes,Total Minutes\n';
    
    data.studies.forEach((study: any) => {
      csv += `${study.study_id},${study.study_type || 'N/A'},${study.start_timestamp || 'N/A'},${study.end_timestamp || 'N/A'},${study.aggregated_quality_minutes || 0},${study.aggregated_total_minutes || 0}\n`;
    });
    
    csv += '\n';
  }
  
  // Add quality metrics if available
  if (data.qualityMetrics?.length) {
    const metrics = data.qualityMetrics[0];
    
    csv += 'Quality Metrics\nAverage Quality,Good Count,SoSo Count,Bad Count,Critical Count\n';
    csv += `${metrics.average_quality},${metrics.good_count},${metrics.soso_count},${metrics.bad_count},${metrics.critical_count}\n`;
  }
  
  return csv;
} 