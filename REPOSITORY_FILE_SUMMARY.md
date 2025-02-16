## 3.1 **Repository File Summaries**

Below is a concise summary of each relevant file/folder, grouped by directory:

### Root &amp; Scripts
- **`deploy-edge.sh`**: Bash script that deploys the `downsample-ecg` Edge Function to Supabase.
- **`test-edge.sh`**: Quick cURL test script for the same Edge Function.
- **`vite.config.ts`**: Vite config enabling React and excluding certain dependencies from auto-optimization.

### `supabase/functions`
- **`_shared/cors.ts`**: Shared CORS headers for Edge Functions.
- **`downsample-ecg/index.ts`**: Deno-based Edge Function. Calls `downsample_ecg` RPC with “p_factor” logic.

### `src/App.tsx` and `src/main.tsx`
- **`App.tsx`**: Main root component, sets up React Router, top-level layout, and dynamic tab-based navigation.
- **`main.tsx`**: React entry point (creates root, imports global CSS).

### `src/index.css`
- Tailwind base import + custom animations.

### `src/types.ts`, `src/types/index.ts`, `src/types/supabase.ts`
- Shared interface definitions for studies, aggregator data, ECG data, and typed Supabase schema (Database).

### `src/lib`
- **`logger.ts`**: Simple logger class with an in-memory buffer, used throughout.
- **`supabase.ts`**: A typed Supabase client for RPC calls.

### `src/context`
- **`StudyContext.tsx`**: Provides a single study’s details (via `get_study_details_with_earliest_latest`) plus `podDays` in a React Context. Used by `ECGViewerPage`.

### `src/hooks`
- **`useHolterData.ts`**:  Fetches multiple or single Holter studies using React Query, merges raw DB fields with computed metrics.
- **`useStudiesWithTimes.ts`**: Uses React Query and `get_study_list_with_earliest_latest` for table usage (DataLab).
- **`useDownsampleECG.ts`**: Calls the Edge Function `downsample-ecg` to get factor-based wave data.
- **`useECGData.ts`**: Another approach, also calls the same Edge function but via `fetch` rather than `supabase.functions.invoke`.
- **`useECGAggregates.ts`**: Calls `aggregate_leads` for aggregator bucket data.
- **`usePodData.ts`**: For PodLab inventory listing, includes sorting/pagination using React Query.
- **`usePodDays.ts`**: Queries `get_pod_days` to get available date list.
- **`usePodEarliestLatest.ts`**: Queries `get_pod_earliest_latest`.
- **`useClinicAnalytics.ts`**: Central hook for multiple `get_clinic_*` calls.  Combines and replaces `useClinicData.ts` and `useClinicLabStats.ts`.
- **`useDataQueries.ts`**: A more generic approach to queries with search, date filters, etc.
- **`useSingleStudy.ts`**: Another specialized hook for a single study’s earliest/latest times.
- **`useDebounce.ts`**: Generic debouncing utility.
- **`useEcgAggregator.ts`**: Unified hook for fetching aggregated ECG data with pagination, filtering, and sorting using React Query.

### `src/components/Navigation.tsx`, `DiagnosticsPanel.tsx`
- **`Navigation.tsx`**: Renders the sidebar nav with clickable tabs.
- **`DiagnosticsPanel.tsx`**: Shows the last logs from `logger` with color-coded levels.

### `src/components`
- **`ECGAggregator.tsx`**: Main component for displaying aggregated ECG data visualization, handles data fetching and rendering.
- **`ECGVisualization.tsx`**: Canvas-based component for rendering ECG waveforms.
- `/labs/*`
    - **`ClinicLab.tsx`**: Aggregates clinic-level stats (status breakdown, quality breakdown, etc.).
    - **`HolterLab.tsx`**: A large ~600-line file with advanced filter using eval-like code, pagination, sorting, “quick filters.”
    - **`PodLab.tsx`**: Inventory page with table sorting/pagination similar to HolterLab.
    - **`DataLab.tsx`**: Another table listing, uses `useStudiesWithTimes`.
    - **`ECGViewerPage.tsx`**: Full aggregator-based approach to selecting date/hour, culminating in a final viewer.
    - **`ECGViewerModal.tsx`, `MainECGViewer.tsx`, `ECGViewer.tsx`**: Different approaches to opening an ECG wave viewer.
    - **`DailyECGAggregator.tsx`, `HourlyECGAggregator.tsx`, `MobileFriendlyAggregator.tsx`**: Repetitive aggregator logic with different visuals.
    - **`ECGErrorBoundary.tsx`**: A boundary that captures exceptions in ECG subcomponents.
    - **`HolterDetail.tsx`, `HolterDetailedDashboard.tsx`, `HolterHeader.tsx`**: Holter sub-pages or UI sections.
- `/table`
    - **`DataGrid.tsx`**: Reusable data grid component.
- `/shared`
    - **`GenericErrorBoundary.tsx`**: Generic error boundary component.

### `src/utils`
- **`ecgDataTransforms.ts`**: Utility functions for transforming ECG data.

### `src/tests/*`
- Minimal tests for HolterLab, ECGIntegration, and `StudyContextLoader`.

### `src/store`
- **`tableStore.ts`**: Zustand store for managing table state (pagination, filters, sorting).

---

## 3.2 **Consolidated Gaps & Code Smells**

Below are **new** or **reinforced** items from reviewing the code:

1. **Advanced Filter Security**
   - `HolterLab.tsx` uses `evaluateExpression` with a naive string replace + `new Function()`. This is a potential injection risk.

2. **Table Logic Duplication**
   - `HolterLab`, `PodLab`, `DataLab` have nearly identical patterns (sorting, pagination, searching). Needs a unified `&lt;DataGrid&gt;` or `&lt;TableManager&gt;`.

3. **Aggregator Overlap**
   - `DailyECGAggregator`, `HourlyECGAggregator`, `MobileFriendlyAggregator` repeat logic. A single aggregator approach with “bucketSize” props is desired.

4. **Multiple ECG Downsample Hooks**
   - `useDownsampleECG` and `useECGData` do nearly the same thing, one uses `supabase.functions.invoke` and the other uses direct `fetch`. Could unify or clearly define which we want.

5. **State & Data Overload**
   - Many hooks replicate pagination or filter states. We need a centralized approach (e.g., Zustand or React Query) plus a consistent query-key naming scheme.

6. **Inconsistent naming**
    - `useClinicData.ts` and `useClinicLabStats.ts` are removed.

7. **Large Components**
   - `HolterLab.tsx` ~600 lines. Could be split into smaller files for advanced filter, table view, etc.

8. **Performance**
   - Canvas-based ECG components re-render on every parent update. Some memoization or a stable approach is needed.

9. **UI & Theming**
   - No consistent design tokens or theming approach.

10. **Tests**
    - Minimal coverage. We only see HolterLab and ECG tests.
