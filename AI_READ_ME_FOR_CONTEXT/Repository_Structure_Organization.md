## REPOSITORY STRUCTURE AND ORGANISATION
### 1. **High-Level Project Flow**

1. **Entrypoint**  
   - `main.tsx` → Renders `<App />` inside `<QueryClientProvider>`, enabling React Query.  
   - `App.tsx` → Defines `<RouterProvider>` with routes from `routes/index.tsx`.  
2. **RootLayout**  
   - Houses shared `<Navigation>` + `<DiagnosticsPanel>` + main `<Outlet>`.  
   - If you’re not on `/login`, it requires a user from `useAuth()`.  
3. **Labs/Pages**  
   - Based on the route (e.g., `/holter`, `/pod`, `/datalab`), loads the corresponding Lab component.  
4. **Data Fetching**  
   - Usually via the `hooks/api` folder. Most data is from Supabase RPC calls.  
   - Domain transformations in `types/domain`.

---

### 2. **Routes Overview**  

Here are the major routes from `routes/index.tsx`:

1. `/login`  
   - Shows `LoginPage.tsx` with Supabase Auth UI.  

2. **Clinic**  
   - `/` and `/clinic` → `ClinicList.tsx` (the default listing of clinics).  
   - `/clinic/analytics` → `ClinicLab/index.tsx` showing advanced analytics.  
   - `/clinic/:clinicId` → `ClinicDetail.tsx` for a single clinic’s deeper view.  

3. **Holter**  
   - `/holter` → `HolterLab/index.tsx`. Listing/filtering all Holter studies.  
   - `/holter/:studyId` → `HolterDetail.tsx`. Shows hourly histograms, advanced usage, detail.  

4. **Pod**  
   - `/pod` → `PodLab/index.tsx`. Lists all pods, filterable table.  

5. **Data**  
   - `/datalab` → `DataLab/index.tsx`. Large DataGrid for studies, advanced exporting.  

6. **ECG**  
   - `/ecg/:studyId` → `ECGViewerPage.tsx`. A dedicated viewer for ECG data, with chunked loading.  

All these are wrapped by `RootLayout`, except `/login` which bypasses the nav & diag panel.

---

### 3. **Lab-by-Lab Description**

#### 3.1 **Clinic Lab**

- **Components**  
  - `index.tsx` → Main “analytic” page with “overview cards,” “status breakdown table,” “quality breakdown,” etc.  
  - `ClinicList.tsx` → Full listing of clinics, sorting, searching, advanced filters.  
  - `ClinicDetail.tsx` → Deeper detail for a single clinic, referencing study tables.  
  - Sub-components:  
    - `StudyManagementTable` (within `ClinicDetail.tsx`), `SparklineChart.tsx`  
- **Hooks/Data**  
  - `useClinicAnalytics` => calls `get_clinic_table_stats`, `get_clinic_weekly_quality`, etc.  
  - `useClinicTableStats`, `useClinicDetails` => general clinic info.  
- **Shared**  
  - Uses `DataGrid.tsx` or React Table in `ClinicList.tsx`.  
  - May use chart components in “analytics.”  
- **Types**  
  - `types/domain/clinic.ts` → `Clinic`, `ClinicStatsRow`, etc.

#### 3.2 **Holter Lab**

- **Main**:  
  - `HolterLab/index.tsx` → Renders the Holter “dashboard” with quick filters, advanced filter expression, and big DataGrid for studies.  
  - `HolterDetail.tsx` → Single study detail with:  
    - `HourlyHistogram.tsx`, `MinuteSlider.tsx`, `HolterHeader.tsx` etc.  
- **Data**  
  - `useHolterStudies` → queries `get_studies_with_pod_times`.  
  - Possibly `useChunkedECG` for deeper ECG if triggered.  
  - `useHolterFilters` for advanced filter logic.  
- **Shared**  
  - Also uses `QuickFilters` and `AdvancedFilter` from `HolterLab/components`.  
- **Types**  
  - `types/domain/holter.ts` → `HolterStudy`, `isHolterStudy()`, etc.

#### 3.3 **Pod Lab**

- **Main**:  
  - `PodLab/index.tsx` → A single page for listing pods.  
  - Future expansions might add a detail route.  
- **Data**  
  - `usePodData.ts`, `usePodDays.ts`.  
  - For each row we show battery, usage, assigned study, etc.  
- **Shared**  
  - Uses `DataGrid` for listing, advanced filtering is partial.  

#### 3.4 **Data Lab**

- **Main**:  
  - `DataLab/index.tsx` → A broad table listing studies, with advanced filtering & export CSV.  
- **Data**  
  - `useStudiesWithTimes` => calls `get_study_list_with_earliest_latest`.  
  - Provides advanced columns (Pod ID, earliest_time, etc.).  
- **Shared**  
  - A big `DataGrid`.  

#### 3.5 **ECG Viewer**

- **Main**:  
  - `ECGViewerPage.tsx` route `/ecg/:studyId` → Provides a day/time-based approach with `CalendarSelector`, `TimeRangeContext`, a `MainECGViewer` modal.  
- **Sub-components** in `shared/ecg`  
  - **`MainECGViewer.tsx`**: The actual infinite-scroll downsample viewer.  
  - **`AdvancedECGPlot.tsx`**: For interactive panning/zooming wave display.  
  - **`ECGTimelineBar.tsx`** & `EcgAggregatorView` for aggregator summaries.  
- **Data**  
  - `useChunkedECG`, `useChunkedECGDiagnostics`.  
  - Edge function calls: `downsample-ecg` or `downsample_ecg_chunked`.  
- **Types**  
  - `types/domain/ecg.ts`.

---

### 4. **Shared Components & Hooks**  

1. **`shared/DataGrid.tsx`**  
   - Reusable table with pagination, sorting, optional advanced filter expression.  
   - Tied to `useDataGrid` (client or server mode).  

2. **`shared/AdvancedFilter/`**  
   - Renders a text-based expression input with optional presets.  
   - Integrates with `useAdvancedFilter`.  

3. **`shared/charts/`**  
   - `SimpleBarChart.tsx`, etc. For quick bar chart usage (Material-like).  

4. **`shared/CalendarSelector/`**  
   - Generic date picking with highlight for availableDays.  

5. **Auth**  
   - `AuthGuard.tsx` ensures user is logged in, or redirects to `/login`.  
   - `LoginPage.tsx` uses Supabase Auth UI.

6. **`hooks/api/`**  
   - Subfolders for each domain: `clinic`, `ecg`, `pod`, `study`.  
   - `core/` for generic supabase stuff.  

---

### 5. **Data Flow & Type Declarations**

- **Data Flow**  
  - The front-end calls `useQuery` or `useInfiniteQuery` → hits RPC → returns data.  
  - Transform if needed in `types/domain/*`.  
- **Type Declarations**  
  - `types/database.types.ts` → auto-generated for Supabase schema.  
  - `types/domain/` → Domain-level definitions (`Clinic`, `Study`, `ECGData`, etc.).  
  - Additional utilities in `types/utils.ts`.

---

### 6. **Supabase Edge Functions**  

**`downsample-ecg`**  
- Deno function in `supabase/functions/downsample-ecg/index.ts`.  
- Expects JSON body with `{ pod_id, time_start, time_end, factor }`.  
- Calls DB function `downsample_ecg` or `downsample_ecg_chunked`.  
- Returns array of simplified ECG samples.  
- Logged in `edge_function_stats` table.
