# COMPREHENSIVE FILE-BY-FILE REVIEW

Below is a detailed listing of all files in your `./src/` directory (plus the `./supabase/*` folder), providing a short description of each file’s purpose, which hooks or functions it uses, which types it references, and if the file is itself a hook, who calls it and what RPC it triggers (if any). Afterward, you’ll find an **Updated Comprehensive Description Mapping** (the overall “Repository Structure and Organization”), plus a final section recommending which files appear duplicated or unused and should be removed or merged.

---

## 1. ROOT-LEVEL FILES IN `./src/*`

1. **`App.tsx`**  
   - **Purpose**: The main top-level React component that sets up the `RouterProvider` from React Router. Typically does minimal logic—just `<RouterProvider router={router} />`.  
   - **Hooks Used**: None directly (mostly a container).  
   - **Types Imported**: None domain-specific (it’s more about the router).  

2. **`main.tsx`**  
   - **Purpose**: The real entry point that mounts React to the DOM. Uses `createRoot`, configures `<QueryClientProvider>` for React Query, logs environment info, then renders `<App/>`.  
   - **Hooks Used**: None directly in the file.  
   - **Types Imported**: No domain types, but uses React Query’s `QueryClient`.

3. **`index.css`**  
   - **Purpose**: Tailwind & global CSS definitions. Contains custom keyframes (`fadeIn`, `pulse`).  
   - **Hooks or Types**: None; pure CSS.

4. **`index.ts`**  
   - **Purpose**: Potentially a central re-export or leftover. Checking the snippet, it re-exports from `types/`, `stores/`, `lib/`, etc.  
   - **Hooks / Types**: Possibly references domain types. Its usage might be minimal.

5. **`repindex`**  
   - **Purpose**: Not standard. Possibly a leftover or placeholder. Usually not used. Probably removable if not referenced.

6. **`routes/index.tsx`**  
   - **Purpose**: Defines the top-level React Router routes (e.g., `"/"`, `"/clinic"`, `"/datalab"`, etc.). Exports a `createBrowserRouter` or similar.  
   - **Hooks**: React Router.  
   - **Types**: Possibly `RouteObject` or custom route definitions.

7. **`stores/diagnostics.ts`**  
   - **Purpose**: A Zustand store for app-level diagnostic state.  
   - **Hooks**: This file is the store definition, so it doesn’t call other hooks.  
   - **Types**: Possibly a local interface for `metrics`.

8. **`stores/index.ts`**  
   - **Purpose**: Probably re-exports modules from `./diagnostics.ts`.  
   - **Hooks**: None.  
   - **Types**: None or minimal.

9. **`tests/*`**  
   - **Purpose**: Contains your unit and integration test suites.  
     - `__mocks__`: Mocks for external services.  
     - `hooks`: E.g. `useAuth.test.tsx`, `useChunkedECG.test.tsx`.  
     - `integration`: e.g. `ECGIntegration.test.tsx`, `MainECGViewer.test.tsx`.  
     - `unit`: e.g. `DataGrid.test.tsx`, `HolterLab.test.tsx`, `StudyContextLoader.test.tsx`.  
   - **Hooks**: Each test may call the associated hooks.  
   - **Types**: Usually references testing library or domain definitions.

---

## 2. `./src/components/*`

### 2.1 Top-Level Components

1. **`DiagnosticsPanel.tsx`**  
   - **Purpose**: Renders a side/bottom panel showing system/DB stats (edge function stats, DB query logs, etc.).  
   - **Hooks**:  
     - `useDiagnostics` (fetch edge function stats, DB stats).  
     - `useECGQueryTracker` (tracks last few ECG queries).  
     - `useQueryLogger` (detailed query logging).  
     - `useStudyDiagnostics` (optionally fetches a “study diagnostics” if a `studyId` is in the query params).  
   - **Types**: Possibly `EdgeFunctionStats`, `RPCMetrics` from domain types.

2. **`Navigation.tsx`**  
   - **Purpose**: Renders the main side or top navigation (Clinics, Holter, DataLab, etc.).  
   - **Hooks**: `useLocation`, `useNavigate` from React Router.  
   - **Types**: None domain-specific.

3. **`RootLayout.tsx`**  
   - **Purpose**: A layout that includes the `<Navigation>`, `<DiagnosticsPanel>`, and `<Outlet>`. Also checks user’s auth if not on `/login`.  
   - **Hooks**:  
     - `useAuth` from `hooks/api/core/useAuth`.  
   - **Types**: Not domain.  

4. **`auth/LoginPage.tsx`**  
   - **Purpose**: The Supabase Auth login form. Renders `<Auth />` from `@supabase/auth-ui-react`.  
   - **Hooks**:  
     - `useAuth` to see if user is already logged in.  
   - **Types**: Possibly `AuthError`, `User` from `@supabase/supabase-js`.

5. **`auth/index.ts`**  
   - **Purpose**: Re-exports the `LoginPage.tsx`.  

6. **`index.ts`** (inside `components/`)  
   - **Purpose**: Possibly re-exports root-level components from labs, shared, etc.

### 2.2 **`labs/*`** Folder

**(A) `ClinicLab/`**  
1. **`ClinicDetail.tsx`**  
   - **Purpose**: Detailed view for a single clinic (analytics, study management). Possibly uses a “StudyManagementTable.”  
   - **Hooks**: `useClinicDetails`, `useClinicAnalytics`.  
   - **Types**: `ClinicRow`, `ClinicAnalyticsResult`.  

2. **`ClinicList.tsx`**  
   - **Purpose**: Renders a table of clinics with advanced filtering & sorting. Uses `useClinicTableStats`.  
   - **Hooks**: `useClinicTableStats` or `useDataGrid`.  
   - **Types**: `ClinicStatsRow`.

3. **`index.tsx`** (or `ClinicLab/index.tsx`)  
   - **Purpose**: The main “ClinicLab” analytics page. Often references “overview,” “status breakdown,” etc.  
   - **Hooks**: `useClinicAnalytics` or `useClinicOverview`.  
   - **Types**: `ClinicAnalyticsRow`, `ClinicQualityBreakdownRow`.  

4. **`components/SparklineChart.tsx`**  
   - **Purpose**: A sparkline mini-chart for trends.  
   - **Hooks**: Usually none aside from local React.  

**(B) `DataLab/`**  
1. **`index.tsx`**  
   - **Purpose**: The “DataLab” main page. Shows a big DataGrid of studies with times, advanced filter, CSV export.  
   - **Hooks**: `useStudiesWithTimes` for retrieving. Possibly `useDataGrid`.  
   - **Types**: `StudiesWithTimesRow`.

**(C) `HolterLab/`**  
1. **`index.ts`** and **`index.tsx`**  
   - **Purpose**: One is a simple re-export file; the other is the main “HolterLab” page.  
   - **Hooks**: `useHolterStudies`, `useHolterFilters` for advanced filter, `useDataGrid` for table.  
   - **Types**: `HolterStudy`.  

2. **`HolterDetail.tsx`**  
   - **Purpose**: Single Holter study detail page with hourly histogram, minute slider, etc. Might allow opening an ECG viewer.  
   - **Hooks**: Possibly `useQuery` to fetch hourly data, or `useChunkedECG`.  
   - **Types**: Holter domain types.

3. **`components/AdvancedFilter.tsx`**  
   - **Purpose**: Holter-specific advanced filter UI with expression field.  
   - **Hooks**: `useHolterFilters` or custom.  
   - **Types**: Possibly `FilterExpression`.

4. **`components/QuickFilters.tsx`**  
   - **Purpose**: Buttons for “All,” “Recent,” “High Quality,” etc.  
   - **Hooks**: Calls `setQuickFilter` from `useHolterFilters`.  

5. **`components/HolterHeader.tsx`**  
   - **Purpose**: Renders a header for a Holter study with a status pill.  
   - **Hooks**: none.  
   - **Types**: `HolterStatus`.

6. **`components/HourlyHistogram.tsx`**, **`HourlyQualityHistogram.tsx`**  
   - **Purpose**: Renders bar charts for hourly metrics.  
   - **Hooks**: Possibly none aside from local.  
   - **Types**: Hourly metric shapes.

7. **`components/MinuteSlider.tsx`**  
   - **Purpose**: A small UI slider for selecting minute ranges within an hour.  
   - **Hooks**: local state.  

8. **`components/StatusPill.tsx`**  
   - **Purpose**: Renders a pill with color-coded status text.  
   - **Hooks**: None.  
   - **Types**: `StatusType`.

**(D) `PodLab/`**  
1. **`index.tsx`**  
   - **Purpose**: Lists “pods” in a table, uses `usePodData`.  
   - **Hooks**: `usePodData`, `useDataGrid`.  
   - **Types**: `PodRow`.  

**(E) `labs/index.ts`**  
- Re-exports the sub-labs.

---

### 2.3 **`shared/*`** Folder

1. **`AdvancedFilter/index.tsx`**  
   - **Purpose**: A more generic advanced filter component with expression input, potentially different from Holter’s. Could unify them.  
   - **Hooks**: `useAdvancedFilter` from `hooks/api/filters/useAdvancedFilter`.  
   - **Types**: `FilterConfig`, `FilterExpression`.

2. **`AuthGuard.tsx`**  
   - **Purpose**: Protect routes by verifying user is logged in (via `useAuth`).  
   - **Hooks**: `useAuth`.  

3. **`Breadcrumbs.tsx`**  
   - **Purpose**: A small breadcrumb showing path segments.  
   - **Hooks**: `useLocation`, `useMatches` from React Router.  

4. **`CalendarSelector/`** & **`CalendarSelector.tsx`**  
   - **Purpose**: Possibly a duplication. Both implement a monthly calendar to pick a date. One might be older.  
   - **Hooks**: local React.  

5. **`DataGrid.tsx`**  
   - **Purpose**: Reusable table with pagination, sorting, filter expressions.  
   - **Hooks**: uses `useDataGrid`.  
   - **Types**: `Column<T>`, `SortDirection`, `FilterConfig`.

6. **`ErrorBoundary.tsx`, `GenericErrorBoundary.tsx`, `ErrorPage.tsx`**  
   - **Purpose**: Standard React error boundaries or error fallback pages.  

7. **`LoadingSpinner.tsx`**  
   - **Purpose**: A simple spinner.  

8. **`charts/SimpleBarChart.tsx`**  
   - **Purpose**: A small bar chart using `recharts`.  

9. **`Histogram/index.tsx`**  
   - **Purpose**: Another “generic histogram.” Possibly uses `recharts`.  

10. **`ecg/*`**  
    - **`AdvancedECGPlot.tsx`**: A canvas-based, interactive panning/zooming ECG wave.  
    - **`ECGTimelineBar.tsx`**: Renders aggregator timeline bar.  
    - **`ECGViewerPage.tsx`**: A page-level aggregator that uses context for day/time.  
    - **`ECGVisualization.tsx`**: Another simpler canvas. Possibly older.  
    - **`EcgAggregatorView.tsx`**: Additional aggregator logic.  
    - **`MainECGViewer.tsx`**: The main infinite-scrolling viewer with chunked data.  

---

## 3. `./src/context/*`

1. **`StudyContext.tsx`**  
   - **Purpose**: React Context for a single study (studyId, earliestTime, etc.). Uses `useSingleStudy` & `usePodDays`.  
   - **Hooks**: `useSingleStudy`, `usePodDays`.  

2. **`TimeRangeContext.tsx`**  
   - **Purpose**: Another context controlling time range selection (start/end) or a preset.  
   - **Hooks**: local React.  

---

## 4. `./src/hooks/api/clinic/*`

1. **`useClinicAnalytics.ts`**  
   - **Purpose**: A React Query hook calling multiple RPCs (like `get_clinic_table_stats`) to gather analytics.  
   - **RPC**: `get_clinic_table_stats`, `get_clinic_weekly_quality`, etc.  
   - **Types**: `ClinicAnalyticsResult`.  
   - **Called By**: `ClinicLab/index.tsx`, `ClinicDetail.tsx`.

2. **`useClinicData.ts`**  
   - **Purpose**: Another set of hooks for fetching clinics data (like `useClinicTableStats`, `useClinicDetails`).  
   - **RPC**: Possibly `get_clinic_status_breakdown`.  
   - **Types**: `ClinicRow`.  

3. **`useClinicDetails.ts`**  
   - **Purpose**: A simpler hook for a single clinic row or an RPC.  
   - **Called By**: `ClinicDetail.tsx`.

4. **`index.ts`**  
   - **Purpose**: Re-export the above.  

---

## 5. `./src/hooks/api/core/*`

1. **`errors.ts`**  
   - **Purpose**: Custom error classes: `RPCError`, `SupabaseError`, `QueryError`.  

2. **`index.ts`**  
   - **Purpose**: Re-exports from `useSupabase`, `useRPC`, etc.  

3. **`useAuth.ts`**  
   - **Purpose**: Hook checking or listening to Supabase Auth.  
   - **Types**: Possibly `User`.  

4. **`useDatasets.ts`**  
   - **Purpose**: Hook for a “datasets” table. Possibly not widely used now.  

5. **`useRPC.ts`**  
   - **Purpose**: Generic “callRPC” function with logging & retry logic.  

6. **`useSupabase.ts`**  
   - **Purpose**: Another generic approach for table queries & mutations with React Query.  

7. **`utils.ts`**  
   - **Purpose**: Functions like `callRPC()`, `queryTable()`.  

8. **`supabase.ts`**  
   - **Purpose**: The typed Supabase client, reading env vars, or older version.  

9. **`useTableQuery.ts`**  
   - **Purpose**: Possibly specialized pagination logic for a table.  

---

## 6. `./src/hooks/api/diagnostics/*`

1. **`useDiagnostics.ts`**  
   - **Purpose**: Collects edge function stats, DB stats, RPC metrics, system metrics.  
   - **RPC**: Possibly `get_edge_function_stats`, `get_database_stats`.  
   - **Types**: `EdgeFunctionStats`, `DatabaseStatsRPC`.  
   - **Called By**: `DiagnosticsPanel.tsx`.

2. **`useECGQueryTracker.ts`**  
   - **Purpose**: Observes the last few ECG queries for debugging.  
   - **Called By**: e.g. `DiagnosticsPanel` or direct.  

3. **`index.ts`**  
   - **Purpose**: Re-export the above.

---

## 7. `./src/hooks/api/ecg/*`

1. **`useAdvancedECG.ts`**  
   - **Purpose**: Combines chunked data from `useChunkedECG` with an ECG canvas.  
   - **Hooks**: `useChunkedECG`, `useECGCanvas`.  
   - **RPC**: `downsample_ecg_chunked`.  

2. **`useChunkedECG.ts`**  
   - **Purpose**: Infinite query for chunked ECG data from `downsample_ecg_chunked`.  
   - **Called By**: `MainECGViewer.tsx`, `useAdvancedECG.ts`.  

3. **`useECGAggregates.ts`**  
   - **Purpose**: Calls `aggregate_leads` for aggregated lead data.  
   - **Types**: `AggregatedLeadData`.  

4. **`useECGAggregatorView.ts`**  
   - **Purpose**: Another aggregator hooking into `useECGAggregates`.  

5. **`useECGCanvas.ts`**  
   - **Purpose**: Manages an HTML canvas for drawing ECG wave. Pan & zoom logic.  
   - **Called By**: `useAdvancedECG`.  

6. **`useECGData.ts`**  
   - **Purpose**: Single-call approach to edge function “downsample-ecg” (Deno).  
   - **Called By**: Possibly a simpler viewer or old code.  

7. **`useECGTimeline.ts`**  
   - **Purpose**: For timeline bar highlight aggregator stats.  
   - **Called By**: `ECGTimelineBar.tsx`.  

8. **`useLatestECGTimestamp.ts`**  
   - **Purpose**: Queries `get_study_details_with_earliest_latest` to get the last data time.  
   - **Called By**: `ECGViewerPage.tsx`.  

9. **`index.ts`**  
   - **Purpose**: Re-export all these ECG hooks.

---

## 8. `./src/hooks/api/filters/*`

1. **`useAdvancedFilter.ts`**  
   - **Purpose**: Generic expression-based filter logic.  
   - **Types**: `FilterConfig`, `FilterExpression`.  
   - **Called By**: `AdvancedFilter/index.tsx`.  

2. **`useDataGrid.ts`**  
   - **Purpose**: Central hook for client or server pagination, sorting, etc. Used by `DataGrid.tsx`.  

3. **`useDataQueries.ts`**  
   - **Purpose**: Another approach for searching data with optional date filters. Possibly older.  

4. **`useDebounce.ts`**  
   - **Purpose**: Basic debounce.  

5. **`index.ts`**  
   - **Purpose**: Re-export.

---

## 9. `./src/hooks/api/pod/*`

1. **`usePodData.ts`**  
   - **Purpose**: Query the `pod` table for a range/sort. Possibly `.from('pod')`.  
   - **Called By**: `PodLab/index.tsx`.  

2. **`usePodDays.ts`**  
   - **Purpose**: Calls `get_pod_days` for all days that have data for that pod.  
   - **Called By**: `StudyContext.tsx`, etc.  

3. **`usePodEarliestLatest.ts`**  
   - **Purpose**: Another small hook calling `get_pod_earliest_latest`.  

4. **`index.ts`**  
   - **Purpose**: Re-export.  

---

## 10. `./src/hooks/api/store/*`

1. **`tableStore.ts`**  
   - **Purpose**: Zustand store for table pagination, sorting, etc.  
   - **Hooks**: It's a store, so no domain hooks.  

2. **`useHolterFilter.ts`**  
   - **Purpose**: Another zustand store for Holter filter (like “quality threshold,” etc.).  

3. **`index.ts`**  
   - **Purpose**: Re-export.  

---

## 11. `./src/hooks/api/study/*`

1. **`useHolterFilters.ts`**  
   - **Purpose**: A custom filter approach (quickFilter: “all,” “recent,” “low-quality”).  
   - **Called By**: `HolterLab/index.tsx`.  

2. **`useHolterStudies.ts`**  
   - **Purpose**: Queries `get_studies_with_pod_times`.  
   - **Types**: `HolterStudy`.  

3. **`useSingleStudy.ts`**  
   - **Purpose**: Single study from `study` table or RPC.  
   - **Called By**: `StudyContext.tsx`.  

4. **`useStudiesWithTimes.ts`**  
   - **Purpose**: Calls `get_study_list_with_earliest_latest`.  
   - **Used By**: `DataLab/index.tsx`.  

5. **`useStudyAnalytics.ts`**  
   - **Purpose**: Possibly calculates a “qualityScore” from `get_study_diagnostics`. Not always used.  

6. **`useStudyDetails.ts`**  
   - **Purpose**: Another single study detail approach calling `get_study_details_with_earliest_latest`.  

7. **`useStudyDiagnostics.ts`**  
   - **Purpose**: Pulls from `get_study_diagnostics`.  
   - **Called By**: `DiagnosticsPanel.tsx` (optionally).  

8. **`useStudyList.ts`**  
   - **Purpose**: Another listing approach for “study,” with local filtering/pagination.  

9. **`index.ts`**  
   - **Purpose**: Re-export all.  

---

## 12. `./src/hooks/index.ts`
- A top-level aggregator, re-exporting from `api/*`.

---

## 13. `./src/lib/*`

1. **`api/*`**  
   - Possibly older domain “API” calls. May be overshadowed by `hooks/api/*`.  

2. **`index.ts`**  
   - Another aggregator re-export.  

3. **`logger.ts`**  
   - A simple logger using log levels.  

4. **`supabase.ts`**  
   - Another supabase client creation? Possibly duplicates `hooks/api/core/supabase.ts`.  

5. **`utils/ExpressionParser.ts`**  
   - JSEP-based advanced filtering expression parser.  

6. **`utils/index.ts`**  
   - Possibly re-exports the parser or other small utilities.  

7. **`utils.ts`**  
   - Possibly leftover or additional small helpers.

---

## 14. `./src/types/*`

1. **`database.types.ts`**  
   - **Purpose**: The auto-generated Supabase schema type definitions.  

2. **`domain/clinic.ts`, `domain/ecg.ts`, `domain/study.ts`, `domain/pod.ts`, `domain/holter.ts`, etc.**  
   - **Purpose**: Domain-level definitions, transforms (`toClinic()`, etc.), plus type guards (`isECGData`).  

3. **`filter.ts`**  
   - **Purpose**: Types for advanced filtering.  

4. **`supabase.ts`**  
   - **Purpose**: Re-exports or extends the supabase `Database` type.  

5. **`utils.ts`**  
   - **Purpose**: Helpers like `NonNullRequired`, `QueryResponse<T>`.  

6. **`index.ts`**  
   - **Purpose**: Re-export from domain, filter, supabase, etc.  

7. **`vitest.d.ts`**  
   - **Purpose**: Additional type definitions for testing frameworks.

---

## 15. `./supabase/*`

1. **`config.toml`**  
   - **Purpose**: Possibly a config for local dev or supabase CLI.  

2. **`functions/_shared/cors.ts`**  
   - **Purpose**: Shared snippet for enabling CORS in edge functions.  

3. **`functions/downsample-ecg/index.ts`**  
   - **Purpose**: The main Deno Edge Function for `downsample-ecg`. Accepts JSON body with `{ pod_id, time_start, time_end, factor }`. Calls DB function to downsample.  

4. **`functions/downsample-ecg/README.md`, `deno.json`, `deno.lock`, `diag.out`**  
   - **Purpose**: Docs, config, logs for that edge function.  

5. **`migrations/`**  
   - **Purpose**: DB schema migrations.  

6. **`out.out`, `repindex`**  
   - **Purpose**: Possibly leftover logs or not used.  

---

# UPDATED COMPREHENSIVE DESCRIPTION MAPPING (REPOSITORY STRUCTURE & ORGANIZATION)

Below is the recommended high-level organization of your repository, describing how everything ties together:

1. **Entrypoint**  
   - `main.tsx` → Renders `<App />` inside `<QueryClientProvider>`, enabling React Query.  
   - `App.tsx` → Defines `<RouterProvider>` with routes from `routes/index.tsx`.  

2. **RootLayout**  
   - Houses shared `<Navigation>` and `<DiagnosticsPanel>` plus `<Outlet>`.  
   - If user is not on `/login`, it checks `useAuth()` to ensure user is logged in.

3. **Routes**  
   - Defined in `routes/index.tsx`. Key routes:  
     - `/login` → `LoginPage.tsx`  
     - `/clinic` → “ClinicLab” pages  
     - `/holter` → “HolterLab” pages  
     - `/pod` → “PodLab” listing pods  
     - `/datalab` → “DataLab”  
     - `/ecg/:studyId` → An ECG viewer page

4. **Labs/Pages**  
   - **Clinic**:  
     - `ClinicList.tsx`, `ClinicDetail.tsx`, plus `index.tsx` for analytics.  
     - Hooks like `useClinicAnalytics`, `useClinicData`.  
   - **Holter**:  
     - `HolterLab/index.tsx` for listing, `HolterDetail.tsx` for single study. Hooks `useHolterStudies`, `useHolterFilters`.  
   - **Pod**:  
     - `PodLab/index.tsx` listing pods (`usePodData`).  
   - **DataLab**:  
     - `DataLab/index.tsx`, big table of studies with times (`useStudiesWithTimes`).  
   - **ECG**:  
     - `ECGViewerPage.tsx` is an aggregator hooking into chunked ECG data.  

5. **Shared Components** (`components/shared/`)  
   - `DataGrid.tsx`, `AdvancedFilter/index.tsx`, `CalendarSelector`, error boundaries, charts, `AuthGuard.tsx`, etc.  

6. **Context** (`context/`)  
   - `StudyContext.tsx` (handles a single study’s info), `TimeRangeContext.tsx` (handles chosen day/time range).

7. **Hooks** (`hooks/api/`)  
   - Organized by domain: `clinic`, `ecg`, `pod`, `study` each have specialized React Query hooks that call the appropriate RPCs.  
   - `core/` for supabase config & generic `useRPC`, `useAuth`.  
   - `diagnostics/` for advanced logging or system metrics.  
   - `filters/` for advanced filter logic (`useAdvancedFilter`, `useDataGrid`).  
   - `store/` might hold Zustand-based solutions (`tableStore`, `useHolterFilter`).

8. **Domain Types** (`types/domain/*`)  
   - Definitions like `Clinic`, `Study`, `HolterStudy`, `ECGData`, plus any transformations or type guards.

9. **Supabase** (`supabase/`)  
   - Contains the Edge Function (`downsample-ecg`) for custom downsampling logic, plus `migrations/`.

Overall flow:  
- The user visits `/holter` → loads `HolterLab/index.tsx` → calls `useHolterStudies` to fetch from `get_studies_with_pod_times` → draws a table via `DataGrid` + advanced filter from `useHolterFilters`.  
- If user clicks a single study, route -> `/holter/:studyId` → `HolterDetail.tsx`, shows hourly histogram, etc.  
- Meanwhile, `DiagnosticsPanel.tsx` tracks system stats from `useDiagnostics`, logs queries, etc.

---

## FILES THAT APPEAR DUPLICATE OR UNUSED (SHOULD BE REMOVED OR MERGED)

1. **`CalendarSelector.tsx`** vs. **`CalendarSelector/index.tsx`**  
   - You have both a single-file version and a folder version. Likely unify them into one component.

2. **`.DS_Store`** in multiple directories  
   - Mac OS hidden files. Remove them from version control or ignore them.

3. **`repindex`** at root & possibly in `supabase/repindex`  
   - Likely leftover or not used. Remove if not referenced.

4. **`out.out`** in `supabase/`  
   - Possibly logs or leftover. Remove if not used.

5. **Dual supabase client definitions**:  
   - `lib/supabase.ts` vs. `hooks/api/core/supabase.ts` (or `types/supabase.ts` in some setups).  
   - Keep just one canonical supabase client location.

6. **`index.ts`** in root `src/`  
   - Verify if it’s truly needed; if not, remove or unify.

7. **`useDataQueries.ts`**  
   - Possibly overshadowed by `useDataGrid` or domain-specific hooks. Remove if not used.

8. **PodLab/components** folder is empty  
   - If truly unused, remove or fill it with actual sub-components.

9. **`useDatasets.ts`**  
   - Check if used. If not, remove or rename.

After these steps, your codebase should be more streamlined, avoiding duplication and confusion.  

---

# FINAL RECOMMENDATIONS

- **Unify supabase client** to a single file.  
- **Merge** the advanced filter components if they overlap (the `HolterLab/components/AdvancedFilter.tsx` vs. `shared/AdvancedFilter/index.tsx`).  
- **Remove** leftover `.DS_Store`, `repindex`, `out.out`.  
- **Eliminate** or **refactor** any partial or legacy code (e.g., `useDatasets.ts`, `useDataQueries.ts`) not in active use.  
- For the `CalendarSelector`, keep whichever version is current and remove the other.  
- Ensure each Lab has a consistent pattern for “index.ts” vs. “index.tsx” (one for a re-export, one for the actual page).

This completes the comprehensive file review, the updated repository structure notes, and the final cleanup plan. You can now maintain a cleaner, more unified codebase.

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

