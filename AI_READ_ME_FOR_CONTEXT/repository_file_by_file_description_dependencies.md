# COMPREHENSIVE FILE-BY-FILE REVIEW
# --------------------------------------------------------

Below is a detailed listing of all files in your `./src/` directory (plus the `./supabase/*` folder), a short description of each file’s purpose, which hooks or functions it uses, and which types it references. If the file itself is a hook, we note which components or files call it (if known) and which RPC calls it triggers.  

Afterward, you’ll see an **Updated Comprehensive Description Mapping** of the app and then a **recommendation** of which files appear duplicated, unused, or could be reorganized.

---

## 1. ROOT-LEVEL FILES IN `./src/*`

1. **`App.tsx`**  
   **Purpose**: The main top-level React component that sets up the `RouterProvider` from React Router. Typically does minimal logic, basically includes `<RouterProvider router={router} />`.  
   **Hooks Used**: None directly (it’s mostly top-level).  
   **Types Imported**: None domain-specific (usually no direct domain types needed).  

2. **`main.tsx`**  
   **Purpose**: The true entry point that mounts React to the DOM. Uses `createRoot`, configures `QueryClientProvider` (for React Query), `React.StrictMode`, etc.  
   **Hooks Used**: None directly here.  
   **Types Imported**: No domain types.  

3. **`index.css`**  
   **Purpose**: The Tailwind CSS & global style definitions.  
   **Hooks Used** / **Types**: N/A. It’s just CSS.  

4. **`index.ts`**  
   **Purpose**: Could be a central re-export or type definition file (the name implies it might re-export). Checking the snippet, it re-exports from `types/`, `stores/`, `lib/`, etc.  
   **Hooks** / **Types**: Possibly references types from `./types`.  

5. **`repindex`**  
   **Purpose**: Not standard. Possibly a leftover or placeholder. Usually not used by React apps.  

6. **`routes/index.tsx`**  
   **Purpose**: Defines the top-level React Router routes (e.g., `"/"`, `"/clinic"`, `"/datalab"`, etc.), and sets up lazy-loaded components.  
   **Hooks Used**: None directly (it references React Router’s `createBrowserRouter` but not domain hooks).  
   **Types Imported**: Possibly some route types (`RouteObject`).  

7. **`stores/diagnostics.ts`**  
   **Purpose**: Likely a Zustand store holding application-level diagnostic state.  
   **Hooks Used**: This file is itself creating a store, so it’s not a consumer of hooks, but a provider.  
   **Types Imported**: Possibly just local types or `useDiagnosticsStore` style.  

8. **`stores/index.ts`**  
   **Purpose**: Probably re-exports store modules (`diagnostics.ts`, etc.).  
   **Hooks Used**: None.  
   **Types Imported**: None or minimal.  

9. **`tests/*`**  
   **Purpose**: Contains your test suites. Each subfolder organizes unit, integration, or hooks-based tests.  
   - **`__mocks__`**: Mocks for external services (like `msw` mocks).  
   - **`hooks/useAuth.test.tsx`**: Tests your `useAuth` logic.  
   - **`hooks/useChunkedECG.test.tsx`**: Tests `useChunkedECG`.  
   - **`integration/ECGIntegration.test.tsx`** + **`integration/MainECGViewer.test.tsx`**: End-to-end style tests for ECG flows.  
   - **`unit/DataGrid.test.tsx`**, **`unit/HolterLab.test.tsx`**, **`unit/StudyContextLoader.test.tsx`**: Specific unit tests for those components.  

---

## 2. `./src/components/*`

### 2.1 Top-Level Components (not in labs or shared)

1. **`DiagnosticsPanel.tsx`**  
   **Purpose**: Renders a side or bottom panel showing system/DB stats, edge function stats, etc.  
   **Hooks**:  
     - `useDiagnostics` from `hooks/api/diagnostics/useDiagnostics` (fetches diagnostic info from DB & edge functions).  
   **Types**:  
     - Imports domain or typed objects from `@/types/supabase` or from `EdgeFunctionStats`, `RPCMetrics`, etc.  

2. **`Navigation.tsx`**  
   **Purpose**: Renders the main vertical or horizontal navigation tabs (Clinics, Holter, etc.).  
   **Hooks**: Possibly `useLocation`, `useNavigate` from React Router, no domain hooks.  
   **Types**: No special domain types.  

3. **`RootLayout.tsx`**  
   **Purpose**: A layout that includes `<Navigation>` + `<DiagnosticsPanel>`, plus `<Outlet>`.  
   **Hooks**: 
     - `useAuth` from `hooks/api/core/useAuth` to check if user is logged in.  
   **Types**: Minimal.  

4. **`auth/LoginPage.tsx`**  
   **Purpose**: The Supabase Auth login form.  
   **Hooks**: 
     - `useAuth` to see if user is already logged in.  
     - Possibly calls `supabase.auth.*` as well.  
   **Types**: Might import `AuthError` from `@supabase/supabase-js`.  

5. **`auth/index.ts`**  
   **Purpose**: Typically re-exports the `LoginPage.tsx`.  

6. **`index.ts`**  
   **Purpose**: Re-export root-level components from subfolders (like labs, shared, etc.).  

### 2.2 **`labs/*`** Folder

This folder organizes domain-based “lab” pages: `ClinicLab`, `HolterLab`, `PodLab`, `DataLab`.

**(A) `ClinicLab/`**  
- **`index.tsx`**  
  **Purpose**: The main “ClinicLab” page. Renders analytics (cards, charts).  
  **Hooks**: `useClinicAnalytics` or `useClinicTableStats` from `hooks/api/clinic`.  
  **Types**: `ClinicAnalyticsResult`, `ClinicTableStat`, etc. from `types/domain/clinic`.

- **`ClinicList.tsx`**  
  **Purpose**: Renders a table of clinics, uses advanced filtering + sorting.  
  **Hooks**: 
    - `useClinicTableStats` (fetch clinic data).  
    - Possibly `useDataGrid` from `hooks/api/filters`.  
  **Types**: `ClinicStatsRow`, `FilterConfig` from `types/domain/clinic` or from `types/filter`.  

- **`ClinicDetail.tsx`**  
  **Purpose**: Detailed view for a single clinic (studies, performance).  
  **Hooks**: 
    - `useClinicDetails` from `hooks/api/clinic` to fetch single clinic.  
    - `useClinicAnalytics` for extended charts.  
  **Types**: `ClinicRow`, `ClinicAnalyticsResult`, etc.  

- **`components/SparklineChart.tsx`**  
  **Purpose**: A small sparkline chart for trends, likely using raw `<svg>` or a minimal library.  
  **Hooks**: None domain-specific. Possibly React local state.  
  **Types**: Minimal or local (no big domain usage).  

**(B) `DataLab/`**  
- **`index.tsx`**  
  **Purpose**: The “DataLab” top-level listing, with advanced study data.  
  **Hooks**: 
    - `useStudiesWithTimes` from `hooks/api/study`.  
    - Possibly `useDataGrid` for table operations.  
  **Types**: `StudiesWithTimesRow` from `types/domain/study`.  
- **`components/`** (empty or partial; might be placeholders).

**(C) `HolterLab/`**  
- **`index.ts`** & **`index.tsx`**  
  **Purpose**: Could be re-exports plus the main page. Possibly `index.ts` re-exports sub-components, while `index.tsx` is the lab page.  
  **Hooks**: 
    - `useHolterStudies`, `useHolterFilters` from `hooks/api/study`.  
  **Types**: `HolterStudy`, etc.  

- **`HolterDetail.tsx`**  
  **Purpose**: A deeper view of a single holter study: hour-based histogram, advanced filtering, etc.  
  **Hooks**: 
    - `useQuery` to fetch hourly data or `useChunkedECG`.  
    - Possibly uses `useECGData` or `useTimeRange` from context.  
  **Types**: Holter domain types.  

- **`components/AdvancedFilter.tsx`**  
  **Purpose**: Holter-specific advanced filter UI (subset of the shared approach).  
  **Hooks**: 
    - `useHolterFilters` or custom.  
  **Types**: Filter expression.  

- **`components/HolterHeader.tsx`**  
  **Purpose**: Header area showing status pill, patient/clinic info.  
  **Hooks**: None major.  
  **Types**: Holter-based.  

- **`components/HourlyHistogram.tsx`, `HourlyQualityHistogram.tsx`**  
  **Purpose**: Renders bar charts of hourly/quality data for a Holter study.  
  **Hooks**: Possibly none aside from local state.  
  **Types**: Possibly `StudyHourlyMetric`.  

- **`components/MinuteSlider.tsx`**  
  **Purpose**: A small UI slider for minute ranges.  
  **Hooks**: No domain.  
  **Types**: None major.  

- **`components/QuickFilters.tsx`**  
  **Purpose**: Buttons for “All, Recent, High Quality,” etc.  
  **Hooks**: `useHolterFilters`.  

- **`components/StatusPill.tsx`**  
  **Purpose**: A pill component showing status color-coded (active, interrupted, error).  
  **Hooks**: None domain.  
  **Types**: Possibly `HolterStatus`.  

**(D) `PodLab/`**  
- **`index.tsx`**  
  **Purpose**: A single page listing pods, with search, filter, or detail link.  
  **Hooks**: 
    - `usePodData`, `useDataGrid`.  
  **Types**: `PodRow` from `types/domain/pod`.  

**(E) `labs/index.ts`**  
- Typically re-exports sub-labs.

---

### 2.3 **`shared/*`** Folder

This is a big folder of reusable UI & logic.

1. **`AdvancedFilter/index.tsx`**  
   **Purpose**: A more generic advanced filter component with an expression text input.  
   **Hooks**: 
     - `useAdvancedFilter` from `hooks/api/filters/useAdvancedFilter`.  
   **Types**: `FilterConfig`, `FilterExpression` from `types/filter`.  

2. **`AuthGuard.tsx`**  
   **Purpose**: Protects routes by checking if user is authed.  
   **Hooks**: 
     - `useAuth` from `hooks/api/core/useAuth`.  

3. **`CalendarSelector/`**  
   - `index.tsx` → A component that shows a monthly grid, highlights available days, calls a callback on day select.  
   **Hooks**: None domain, just local state.  
   **Types**: Possibly none domain.  

4. **`CalendarSelector.tsx`**  
   **Purpose**: Possibly a second or older version of the above? Potential duplication.  

5. **`DataGrid.tsx`**  
   **Purpose**: Reusable table supporting pagination, sorting, filter expressions.  
   **Hooks**: 
     - `useDataGrid` from `hooks/api/filters/useDataGrid`.  
   **Types**: Possibly `Column<T>`, `SortConfig<T>` from local definitions.  

6. **`ErrorBoundary.tsx`, `GenericErrorBoundary.tsx`**  
   **Purpose**: Standard React error boundaries.  
   **Hooks**: None domain.  
   **Types**: None domain.  

7. **`Histogram/index.tsx`**  
   **Purpose**: Possibly a unified histogram component for a small bar chart with `recharts`.  
   **Hooks**: None domain.  

8. **`LoadingSpinner.tsx`**  
   **Purpose**: A simple spinner.  
   **Hooks**: None.  

9. **`charts/SimpleBarChart.tsx`**  
   **Purpose**: A minimal bar chart (usually uses `recharts`).  
   **Hooks**: Possibly none.  

10. **`ecg/`** subfolder  
    - **`AdvancedECGPlot.tsx`**: An advanced interactive ECG wave (zoom/pan).  
    - **`ECGTimelineBar.tsx`**: A timeline bar for aggregated lead data.  
    - **`ECGViewerPage.tsx`**: A page-level aggregator hooking into `StudyContext` or `TimeRangeContext` for ECG.  
    - **`ECGVisualization.tsx`**: Possibly simpler canvas-based ECG chart.  
    - **`EcgAggregatorView.tsx`**: Another aggregator showing leads or chunked data.  
    - **`MainECGViewer.tsx`**: The main infinite-scrolling viewer using `useChunkedECG`.  

**Hooks**:  
  - Typically `useChunkedECG`, `useECGCanvas`, etc. from `hooks/api/ecg`.  
**Types**:  
  - `ECGData`, `ECGSampleRow` from `types/domain/ecg`.  

---

## 3. `./src/context/*`

1. **`StudyContext.tsx`**  
   **Purpose**: React Context for a single “study,” storing `studyId`, `earliestTime`, etc.  
   **Hooks**: 
     - `useSingleStudy`, `usePodDays` from `hooks/api/study` / `hooks/api/pod`.  
   **Types**: `StudyRow` or domain types for “study.”  

2. **`TimeRangeContext.tsx`**  
   **Purpose**: Another context controlling time range selection (start/end), day, or a preset.  
   **Hooks**: Just local React.  
   **Types**: None domain, mostly date/time.  

---

## 4. `./src/hooks/api/clinic/*`

1. **`useClinicAnalytics.ts`**  
   **Purpose**: A React Query hook that calls multiple RPCs (`get_clinic_table_stats`, `get_clinic_weekly_quality`, etc.) to build a comprehensive analytics object.  
   **RPC**: `get_clinic_table_stats`, `get_clinic_weekly_quality`, `get_clinic_monthly_quality`, `get_clinic_weekly_studies`, `get_clinic_monthly_studies`.  
   **Types**: `ClinicAnalyticsResult`, `ClinicTableStat` from `types/domain/clinic`.  
   **Called By**: `ClinicLab/index.tsx`, `ClinicDetail.tsx`.  

2. **`useClinicData.ts`**  
   **Purpose**: Another set of hooks for clinic data: `useClinicTableStats`, `useClinicDetails`.  
   **RPC**: Typically `get_clinic_table_stats`, `get_clinic_status_breakdown`.  
   **Types**: `ClinicRow`, etc.  
   **Called By**: `ClinicList.tsx`, etc.  

3. **`useClinicDetails.ts`**  
   **Purpose**: A simpler React Query hook to fetch a single clinic row from `clinics` table or an RPC.  
   **Types**: `ClinicRow`.  
   **RPC**: Possibly just `.from('clinics')`.  
   **Called By**: `ClinicDetail.tsx`.  

4. **`index.ts`**  
   **Purpose**: Re-exports the above.  

---

## 5. `./src/hooks/api/core/*`

1. **`errors.ts`**  
   **Purpose**: Custom error classes (`RPCError`, `QueryError`, etc.).  
   **Hooks**: None, but used by other hooks to throw typed errors.  
   **Types**: Exports `SupabaseError`, `RPCError`.  

2. **`index.ts`**  
   **Purpose**: Re-export the core modules (like `useSupabase`, `useRPC`, etc.).  

3. **`supabase.ts`**  
   **Purpose**: The actual Supabase client instance creation with environment variables, and a helper function `handleSupabaseError()`.  
   **Hooks**: None, but used throughout.  

4. **`useAuth.ts`**  
   **Purpose**: Hook that checks or listens to Supabase auth session changes.  
   **Types**: Possibly `User` from `@supabase/supabase-js`.  
   **RPC**: N/A.  
   **Called By**: `AuthGuard.tsx`, `LoginPage.tsx`, etc.  

5. **`useDatasets.ts`**  
   **Purpose**: A specialized hook for `datasets` table, possibly not widely used.  
   **RPC**: `.from('datasets')` calls.  
   **Types**: domain/dataset.  

6. **`useRPC.ts`**  
   **Purpose**: A generic hook to call a Supabase RPC with logging, rate-limiting, etc.  
   **Called By**: Possibly used within `useECGAggregates`, `useECGData`, or custom.  

7. **`useSupabase.ts`**  
   **Purpose**: Another set of generic React Query-based hooks for table queries (`useSupabaseQuery`, `useSupabaseInsert`, etc.).  
   **Types**: references `TableRow<T>` from `types/utils`.  

8. **`useTableQuery.ts`**  
   **Purpose**: A specialized helper to query tables with pagination/filters.  

9. **`utils.ts`**  
   **Purpose**: Possibly has `callRPC()`, `queryTable()`, or shared logic for the core hooks.  

---

## 6. `./src/hooks/api/diagnostics/*`

1. **`useDiagnostics.ts`**  
   **Purpose**: Fetches & aggregates edge function stats, DB stats, RPC metrics, etc.  
   **RPC**: `get_edge_function_stats`, `get_database_stats`, or direct `.from('rpc_call_info')`.  
   **Types**: `EdgeFunctionStats`, `RPCMetrics`, etc.  
   **Called By**: `DiagnosticsPanel.tsx`.  

2. **`useECGQueryTracker.ts`**  
   **Purpose**: Tracks the last few ECG queries for debugging.  
   **Hooks**: Just local.  
   **Types**: An internal `ECGQueryInfo`.  
   **Called By**: e.g. `useECGData`.  

3. **`index.ts`**  
   **Purpose**: Re-export.  

---

## 7. `./src/hooks/api/ecg/*`

1. **`useAdvancedECG.ts`**  
   **Purpose**: A hook combining `useChunkedECG` data with an ECG canvas for panning/zoom.  
   **Hooks**: 
     - `useChunkedECG`, `useECGCanvas`.  
   **Types**: `ECGData`, etc.  
   **RPC**: Indirectly calls `downsample_ecg_chunked` through `useChunkedECG`.  

2. **`useChunkedECG.ts`**  
   **Purpose**: The main infinite query for chunked ECG data.  
   **RPC**: `downsample_ecg_chunked` (Supabase DB function).  
   **Called By**: `MainECGViewer.tsx`, `useAdvancedECG.ts`, etc.  

3. **`useECGAggregates.ts`**  
   **Purpose**: Calls `aggregate_leads` RPC to get lead-on/off aggregates in time buckets.  
   **Types**: `AggregatedLeadData`.  
   **Called By**: Possibly `useECGAggregatorView`.  

4. **`useECGAggregatorView.ts`**  
   **Purpose**: A higher-level aggregator hooking into `useECGAggregates`.  

5. **`useECGCanvas.ts`**  
   **Purpose**: Manages a raw HTML canvas for ECG wave drawing (zoom, pan).  
   **Types**: `ECGData`.  
   **Called By**: `useAdvancedECG`.  

6. **`useECGData.ts`**  
   **Purpose**: A single-call approach to get downsampled ECG from the Edge Function `downsample-ecg`.  
   **RPC**: The edge function, not strictly an SQL RPC.  
   **Called By**: `ECGViewerPage.tsx` or others.  

7. **`useECGTimeline.ts`**  
   **Purpose**: For the timeline bar highlighting aggregator stats.  
   **Called By**: `ECGTimelineBar.tsx`.  

8. **`useLatestECGTimestamp.ts`**  
   **Purpose**: Pull the latest time from `get_study_details_with_earliest_latest`.  
   **Types**: `StudyDetailsWithTimes`.  
   **Called By**: `ECGViewerPage.tsx`.  

9. **`index.ts`**  
   **Purpose**: Re-export all.  

---

## 8. `./src/hooks/api/filters/*`

1. **`useAdvancedFilter.ts`**  
   **Purpose**: Generic hook for expression-based filtering.  
   **Types**: `FilterConfig`, `FilterExpression`.  
   **Called By**: `AdvancedFilter/index.tsx`, etc.  

2. **`useDataGrid.ts`**  
   **Purpose**: A central hook for client/server pagination + sorting, used in `DataGrid.tsx`.  

3. **`useDataQueries.ts`**  
   **Purpose**: Another approach for searching data with optional date filters, might be older.  

4. **`useDebounce.ts`**  
   **Purpose**: A small utility hook for debouncing.  

5. **`index.ts`**  
   **Purpose**: Re-export.  

---

## 9. `./src/hooks/api/pod/*`

1. **`usePodData.ts`**  
   **Purpose**: Query the `pod` table with range/sort.  
   **RPC**: `.from('pod')` or no direct RPC.  
   **Types**: `PodRow`.  
   **Called By**: `PodLab/index.tsx`.  

2. **`usePodDays.ts`**  
   **Purpose**: Calls `get_pod_days` RPC to get all days that have data for a given pod.  
   **Called By**: `StudyContext.tsx`, etc.  

3. **`usePodEarliestLatest.ts`**  
   **Purpose**: Another small hook calling `get_pod_earliest_latest`.  
   **Called By**: Possibly not widely used.  

4. **`index.ts`**  
   **Purpose**: Re-export.  

---

## 10. `./src/hooks/api/store/*`

1. **`tableStore.ts`**  
   **Purpose**: A Zustand store to track page, pageSize, sort field, quick filter, etc.  
   **Called By**: Some labs for local state if not using `useDataGrid`.  

2. **`useHolterFilter.ts`**  
   **Purpose**: Another zustand store specifically for Holter filtering (quality threshold, leadOn, etc.).  

3. **`index.ts`**  
   **Purpose**: Re-export.  

---

## 11. `./src/hooks/api/study/*`

1. **`useHolterFilters.ts`**  
   **Purpose**: A custom filter approach (quickFilter: 'all', 'recent', etc.).  
   **Called By**: `HolterLab/index.tsx`.  

2. **`useHolterStudies.ts`**  
   **Purpose**: Query `get_studies_with_pod_times` for listing all Holter studies.  
   **Types**: `HolterStudy`.  

3. **`useSingleStudy.ts`**  
   **Purpose**: Query one study from the `study` table or RPC.  
   **Called By**: `StudyContext.tsx`.  

4. **`useStudiesWithTimes.ts`**  
   **Purpose**: Calls `get_study_list_with_earliest_latest`.  
   **Called By**: `DataLab/index.tsx`.  

5. **`useStudyAnalytics.ts`**  
   **Purpose**: Possibly calculates a “qualityScore” from `get_study_diagnostics`.  
   **Called By**: Not sure, maybe detail pages.  

6. **`useStudyDetails.ts`**  
   **Purpose**: Another single study detail approach calling `get_study_details_with_earliest_latest`.  
   **Called By**: Possibly `ECGViewerPage.tsx`.  

7. **`useStudyDiagnostics.ts`**  
   **Purpose**: Pulls from `get_study_diagnostics`.  
   **Called By**: advanced holter detail or aggregator.  

8. **`useStudyList.ts`**  
   **Purpose**: Another listing approach for studies, applying client filters.  

9. **`index.ts`**  
   **Purpose**: Re-export.  

---

## 12. `./src/hooks/index.ts`  

A top-level aggregator re-exporting everything from `api/*`.

---

## 13. `./src/lib/*`

1. **`api/clinic.ts`**  
   **Purpose**: Possibly domain-specific helpers for “clinic” actions (CRUD?). Not a React hook, but utility.  

2. **`api/ecg.ts`**  
   **Purpose**: Domain-specific wrappers for ECG (like transformECGSamples).  

3. **`api/index.ts`**  
   **Purpose**: Re-export for `study.ts`, `ecg.ts`, `clinic.ts`.  

4. **`api/study.ts`**  
   **Purpose**: Possibly domain wrappers for study queries, e.g. `useStudyInsert`?  

5. **`index.ts`**  
   **Purpose**: Another aggregator re-export.  

6. **`logger.ts`**  
   **Purpose**: A loglevel-based logger with pre-set log level.  

7. **`supabase.ts`**  
   **Purpose**: A simpler supabase client. Possibly old or replaced by `hooks/api/core/supabase.ts`.  

8. **`utils/index.ts`, `utils/ExpressionParser.ts`**  
   **Purpose**: The expression parser for advanced filtering plus utility re-exports.  

9. **`utils.ts`**  
   **Purpose**: Possibly older or additional utilities.  

---

## 14. `./src/types/*`

1. **`database.types.ts`**  
   **Purpose**: The auto-generated Supabase schema type definitions.  

2. **`domain/clinic.ts`, `domain/ecg.ts`, `domain/study.ts`, `domain/pod.ts`, `domain/holter.ts`, etc.**  
   **Purpose**: Each file holds domain-level interfaces, type guards, and transformations. Example: `toClinic()`, `isECGData()`.  

3. **`filter.ts`**  
   **Purpose**: Types for advanced filtering (`FilterExpression`, `FilterOperator`).  

4. **`supabase.ts`**  
   **Purpose**: Re-exports or extends the supabase’s `Database` type.  

5. **`utils.ts`**  
   **Purpose**: Common type utilities (`NonNullRequired`, `TableRow<T>`, etc.).  

6. **`index.ts`**  
   **Purpose**: Re-export from domain, filter, supabase, etc.  

7. **`vitest.d.ts`**  
   **Purpose**: Type definitions for testing library.  

---

## 15. `./supabase/*`

1. **`config.toml`**  
   **Purpose**: Possibly a config for local dev or supabase CLI.  

2. **`functions/_shared/cors.ts`**  
   **Purpose**: Shared snippet for enabling CORS in edge functions.  

3. **`functions/downsample-ecg/index.ts`**  
   **Purpose**: The main Deno Edge Function to handle POST requests with `pod_id`, calls `downsample_ecg` or `downsample_ecg_chunked`.  

4. **`functions/downsample-ecg/README.md`, `deno.json`, `deno.lock`, `diag.out`**  
   **Purpose**: Docs, config, logs for that edge function.  

5. **`migrations/`**  
   **Purpose**: Database schema migrations.  

6. **`out.out`, `repindex`**  
   **Purpose**: Possibly leftover artifacts or logs.  

---

# UPDATED COMPREHENSIVE APP MAPPING

Putting it all together:

1. **Root**: `main.tsx` + `App.tsx` => sets up React, QueryClient, Router.  
2. **Routes**: In `routes/index.tsx`, we see lazy imports for `LoginPage`, `ClinicLab`, `HolterLab`, `PodLab`, `DataLab`, and `ECGViewerPage`.  
3. **Layout**: `RootLayout.tsx` → includes `Navigation` and `DiagnosticsPanel`, protected by `useAuth`.  
4. **Pages**:
   - **Clinic**:  
     - `ClinicList.tsx` for listing all clinics with `useClinicTableStats`.  
     - `ClinicDetail.tsx` for a single clinic.  
     - `index.tsx` for “ClinicLab” with advanced breakdown.  
   - **Holter**:  
     - `index.tsx` for the main Holter page, using `useHolterStudies` + `useHolterFilters`.  
     - `HolterDetail.tsx` for single study detail (histograms, minute slider, etc.).  
   - **Pod**:  
     - `index.tsx` for listing pods via `usePodData`.  
   - **DataLab**:  
     - `index.tsx` for showing studies with times + advanced table.  
   - **ECG**:  
     - `ECGViewerPage.tsx` with chunked data, provided by `useChunkedECG`.  

5. **Shared Components**: `DataGrid`, `CalendarSelector`, `AdvancedFilter`, error boundaries, etc.  
6. **Contexts**: `StudyContext` and `TimeRangeContext` for passing study/pod/time range info down.  
7. **Hooks**:
   - `api/clinic`, `api/ecg`, `api/pod`, `api/study` for domain data.  
   - `api/core` for Supabase config, `useRPC`, `useAuth`.  
   - `api/diagnostics` for system-level or edge function stats.  
   - `api/filters` for advanced filtering & data grid states.  
8. **Types**: Domain definitions, supabase schema types, filter expressions, etc.  
9. **Supabase Edge Function**: `downsample-ecg` in `./supabase/functions/downsample-ecg/index.ts`.

This app is fully modular: each Lab references domain hooks, the shared components handle display & filtering, while contexts store cross-lab data (like time range or study ID).

---

# FILES THAT APPEAR DUPLICATE OR UNUSED

1. **`CalendarSelector.tsx`** vs. **`CalendarSelector/index.tsx`**:  
   - You have both a `CalendarSelector.tsx` and also a `CalendarSelector/` folder with `index.tsx`. They might duplicate the same functionality. Consider merging them into a single file or removing one if it’s out of date.

2. **`index.ts`** vs. **`index.tsx`** in HolterLab (and similarly in other labs)**:  
   - Some labs have both a plain `index.ts` (export file) and an `index.tsx` (the actual React page). That’s okay if you intentionally use `index.ts` as a re-export layer, but it can be confusing. Confirm if both are needed or if you can unify them.

3. **`repindex`** (at root) and **`supabase/repindex`**:  
   - Possibly leftover or not used. If you never reference them in your code, remove them.

4. **`out.out`** in `supabase/`**:  
   - Looks like a leftover file, presumably no code references it.

5. **`.DS_Store`** in multiple directories**:  
   - Typical Mac OS hidden files. They’re not needed in version control. They can be removed or added to `.gitignore`.

6. **`CalendarSelector` duplication**  
   - As mentioned, confirm which version is actual usage. Possibly remove one.

7. **`PodLab/components`** folder is empty**:  
   - If truly empty, remove or use it for future sub-components.

8. **`lib/supabase.ts`** vs. **`hooks/api/core/supabase.ts`**  
   - You have two places creating a Supabase client. Possibly unify them to one single file.

9. **`index.ts`** in `src/` root**  
   - If it is not actually used or just partial, verify if it’s required.  

10. **`useDatasets.ts`**  
   - Check if you’re actively using it. If not, remove or rename.  

In summary, the main duplication suspects are the repeated `CalendarSelector` files, multiple leftover `.DS_Store`, `repindex`, `out.out`, and the dual supabase client definitions.

---

**Recommendation**:  
- **Remove** leftover or non-referenced files (like `.DS_Store`, `out.out`, `repindex`).  
- **Combine** `CalendarSelector.tsx` with `CalendarSelector/index.tsx` into one component.  
- **Unify** the supabase client to a single file if you’re using multiple.  
- **Prune** any old code from `useDatasets.ts` if it’s not used.  
- For each Lab, consider carefully if you need both `index.ts` (re-export) and `index.tsx` (React page). Possibly keep the pattern consistent but check for confusion.  

All other files appear logically placed.  

---  

That concludes the **comprehensive file-by-file listing** with notes on usage, hooks, types, and final suggestions for clean-up or merges. 
