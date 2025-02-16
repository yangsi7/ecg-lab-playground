```markdown

**Visual Plan Outline**
```
Repo Review & Streamlined Plan
├─ Summaries of Files
│  ├─ Summaries by directory (components, hooks, etc.)
│  └─ Noting usage and known duplication
├─ New & Existing Code Smells
│  ├─ Security (eval-like filter)
│  ├─ Performance (canvas redraw, no memoization)
│  ├─ Duplication (tables, aggregator flows, 500-line labs)
│  ├─ State mgmt scattered
│  ├─ Inconsistent styling
└─ Revised 5-Phase Plan
   ├─ Phase 1: Secure table unification
   ├─ Phase 2: State mgmt & data queries
   ├─ Phase 3: Aggregator & advanced features
   ├─ Phase 4: UI polish & testing
   └─ Phase 5: Final cleanup, docs, observability
```

**Refinement**  
We will:  
1. Provide a concise summary of each file’s primary purpose.  
2. Merge new code smells with the previously identified issues.  
3. Extend the 5-phase plan, calling out exactly which files to modify, rename, or create during each phase.

---

# 2. **Problem-Solving**

## A. **Brainstorming**

1. **Option A: Minimal reorganization**  
   - Keep existing directory structure.  
   - Add a “table” subfolder or “data-grid” in `components`, and a “common aggregator” in `hooks`.  
   - Patch known code smells while leaving the rest mostly intact.

2. **Option B: Major top-level restructure**  
   - Create domain-based directories: `modules/clinic`, `modules/study`, `modules/ecg`.  
   - Move hooks, components, tests, etc. for each domain into subfolders (like a “feature slice” approach).  
   - Possibly rename or combine large “labs” to reduce confusion (HolterLab -> `modules/holter`, DataLab -> `modules/data`, etc.).

3. **Option C: A partial domain + partial shared approach**  
   - Keep a top-level `components/` and `hooks/` for truly shared things (like `<DataGrid>` or aggregator hooks).  
   - For large features (Holter, ECG Viewer, Clinic), move them into subfolders under `features/` (or `modules/`), each with internal components + hooks.  
   - This is more balanced: we get domain separation but also a shared library folder for common code.

4. **Option D: Full monorepo separation**  
   - Potentially split the Edge Functions code into a separate package.  
   - Keep the React front end in another, aligning them with minimal cross-dependencies.  
   - Possibly overkill for now.

## B. **Evaluation**

- **Option A**  
  - **Pros:** Simpler to implement quickly. Minimal disruption.  
  - **Cons:** Might still feel cluttered. We might keep “labs” scattering.  

- **Option B**  
  - **Pros:** Very organized domain structure. Clear boundaries.  
  - **Cons:** Large refactor overhead. We risk confusing merges if done too drastically.  

- **Option C**  
  - **Pros:** Balanced approach, often recommended for mid-sized React codebases. Shared libs remain in `hooks/` or `components/`, while large features go into subfolders.  
  - **Cons:** We still might need to rename or carefully handle references across the app.  

- **Option D**  
  - **Pros:** Good for large teams with separate back end vs. front end code ownership.  
  - **Cons:** Possibly too big a leap if we’re still stabilizing the code.

## C. **Expansion**

**Detailing Option C** (Partial domain approach + shared library):  

1. Create a `features/` folder in `src/`. Inside it, have `clinic/`, `holter/`, `pod/`, `ecg/` or similar, each holding domain-specific components (`HolterLab`, `HolterDetail`, aggregator variants) plus domain hooks if they’re unique.  
2. Keep `src/hooks/` for cross-cutting queries like `useDebounce`, `useTableManager`, or general aggregator logic that’s not specific to “holter vs. clinic.”  
3. Move the big aggregator code that’s repeated (Daily, Hourly, Mobile) into a single shared aggregator or advanced hooking system.  
4. Keep a `components/commons/` or `components/ui/` folder for `<DataGrid>`, `<TableManager>`, `<ErrorBoundary>`, etc.  

## D. **Decision**

1. **Chosen**: **Option C** because it’s moderate, giving each domain a place while keeping truly shared code at the root level.  
2. We will unify repeated aggregator logic, advanced table code, and “safe parser” for advanced filters in shared, while large domain “labs” become `features/clinic`, `features/holter`, etc.  

---

# 3. **Execution**

Below is the **3-part** result for the request.

## 3.1 **Repository File Summaries**

Below is a concise summary of each relevant file/folder, grouped by directory:

### Root & Scripts
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
- **`useHolterData.ts`**: Large specialized hook for fetching multiple or single Holter studies, merges raw DB fields with computed metrics (quality fraction, etc.).  
- **`useStudiesWithTimes.ts`**: Another specialized hook calling `get_study_list_with_earliest_latest` for simpler table usage (DataLab).  
- **`useDownsampleECG.ts`**: Calls the Edge Function `downsample-ecg` to get factor-based wave data.  
- **`useECGData.ts`**: Another approach, also calls the same Edge function but via `fetch` rather than `supabase.functions.invoke`.  
- **`useECGAggregates.ts`**: Calls `aggregate_leads` for aggregator bucket data.  
- **`usePodData.ts`**: For PodLab inventory listing, includes sorting/pagination.  
- **`usePodDays.ts`**: Queries `get_pod_days` to get available date list.  
- **`usePodEarliestLatest.ts`**: Queries `get_pod_earliest_latest`.  
- **`useClinicAnalytics.ts`**: Central hook for multiple `get_clinic_*` calls.  
- **`useClinicData.ts`, `useClinicLabStats.ts`**: Legacy hooks, partially replaced by `useClinicAnalytics`.  
- **`useDataQueries.ts`**: A more generic approach to queries with search, date filters, etc.  
- **`useSingleStudy.ts`**: Another specialized hook for a single study’s earliest/latest times.  
- **`useDebounce.ts`**: Generic debouncing utility.  

### `src/components/Navigation.tsx`, `DiagnosticsPanel.tsx`  
- **`Navigation.tsx`**: Renders the sidebar nav with clickable tabs.  
- **`DiagnosticsPanel.tsx`**: Shows the last logs from `logger` with color-coded levels.  

### `src/components/labs/*`  
A large collection of “lab” pages and sub-components. Each lab typically has:  
- Local table logic for sorting/pagination.  
- Possibly advanced filters with `evaluateExpression` or an “inline new Function()” approach.  
- Aggregator sub-components that show daily/hourly slices (DailyECGAggregator, HourlyECGAggregator).  
- Various specialized aggregator/ECG viewer workflows.  

Notable “lab” components:
- **`ClinicLab.tsx`**: Aggregates clinic-level stats (status breakdown, quality breakdown, etc.).  
- **`HolterLab.tsx`**: A large ~600-line file with advanced filter using eval-like code, pagination, sorting, “quick filters.”  
- **`PodLab.tsx`**: Inventory page with table sorting/pagination similar to HolterLab.  
- **`DataLab.tsx`**: Another table listing, uses `useStudiesWithTimes`.  
- **`ECGViewerPage.tsx`**: Full aggregator-based approach to selecting date/hour, culminating in a final viewer.  
- **`ECGViewerModal.tsx`, `MainECGViewer.tsx`, `ECGViewer.tsx`**: Different approaches to opening an ECG wave viewer.  
- **`DailyECGAggregator.tsx`, `HourlyECGAggregator.tsx`, `MobileFriendlyAggregator.tsx`**: Repetitive aggregator logic with different visuals.  
- **`ECGErrorBoundary.tsx`**: A boundary that captures exceptions in ECG subcomponents.  
- **`HolterDetail.tsx`, `HolterDetailedDashboard.tsx`, `HolterHeader.tsx`**: Holter sub-pages or UI sections.  

### `src/tests/*`  
- Minimal tests for HolterLab, ECGIntegration, and `StudyContextLoader`.  

---

## 3.2 **Consolidated Gaps & Code Smells**

Below are **new** or **reinforced** items from reviewing the code:

1. **Advanced Filter Security**  
   - `HolterLab.tsx` uses `evaluateExpression` with a naive string replace + `new Function()`. This is a potential injection risk.  

2. **Table Logic Duplication**  
   - `HolterLab`, `PodLab`, `DataLab` have nearly identical patterns (sorting, pagination, searching). Needs a unified `<DataGrid>` or `<TableManager>`.  

3. **Aggregator Overlap**  
   - `DailyECGAggregator`, `HourlyECGAggregator`, `MobileFriendlyAggregator` repeat logic. A single aggregator approach with “bucketSize” props is desired.  

4. **Multiple ECG Downsample Hooks**  
   - `useDownsampleECG` and `useECGData` do nearly the same thing, one uses `supabase.functions.invoke` and the other uses direct `fetch`. Could unify or clearly define which we want.  

5. **State & Data Overload**  
   - Many hooks replicate pagination or filter states. We need a centralized approach (e.g., Zustand or React Query) plus a consistent query-key naming scheme.  

6. **Inconsistent naming**  
   - e.g., `useClinicData.ts` does nothing but throw an error, overshadowed by `useClinicAnalytics.ts`.  
   - Redundant or leftover hooks (`useClinicLabStats.ts`) need deprecation or merging.  

7. **Large Components**  
   - `HolterLab.tsx` ~600 lines. Could be split into smaller files for advanced filter, table view, etc.  

8. **Performance**  
   - Canvas-based ECG components re-render on every parent update. Some memoization or a stable approach is needed.  

9. **UI & Theming**  
   - No consistent design tokens or theming approach.  

10. **Tests**  
   - Minimal coverage. We only see HolterLab and ECG tests.  

---

## 3.3 **Revised 5-Phase Implementation Plan**

We’ll expand the original plan to specify exactly which files to change or create. Each phase references tasks, new files, and dependencies.

---

### **Phase 1: Security & Table Foundations (Days 1–3)**

1. **Replace `evaluateExpression`**  
   - **Files**: `src/components/labs/HolterLab.tsx`, possibly `HolterDetail*` if using advanced filters.  
   - Use a safe parse library (e.g., `jsep`) or a small custom DSL.  
   - Provide a function, e.g. `parseAdvancedFilter(expression: string, study: HolterStudy) => boolean`, that strictly checks known tokens.  

2. **RLS & Sanitization**  
   - Confirm RLS policies in Supabase for queries in `useHolterData.ts`, `usePodData.ts`, etc.  
   - Add minimal input sanitization in advanced filters.  
   - Evaluate any “raw SQL” or “Function constructor” usage.  

3. **Unify Table Logic**  
   - **New File**: `src/components/table/DataGrid.tsx` or `src/components/shared/TableManager.tsx`.  
   - Migrate repeated sorting + pagination from `HolterLab.tsx`, `PodLab.tsx`, `DataLab.tsx` into the new component or logic.  
   - **Action**: Each lab’s table is replaced by `<DataGrid dataHook={useHolterData} ... />`.  

4. **Global Error Boundaries**  
   - Reuse or rename `ECGErrorBoundary.tsx` to something like `GenericErrorBoundary.tsx`.  
   - Wrap major routes or top-level lab components.  

**Deliverables & Key Changes**  
- `HolterLab.tsx`: remove `new Function` usage. Possibly split out `AdvancedFilterBox.tsx`.  
- Create `DataGrid.tsx` (and a hooking approach if we want).  
- Confirm error boundary usage in `App.tsx` or each lab route.  

---

### **Phase 2: State & Data Overhaul (Days 3–7)**

1. **Central Store (Zustand or Redux)**  
   - **New**: `src/store/tableStore.ts` or `store/filterStore.ts` for advanced filters, pagination, column settings.  
   - Helps unify state so “HolterLab pagination” or “PodLab pagination” is consistent.  

2. **React Query (TanStack)**  
   - Replace custom loading & caching in hooks like `useHolterData`, `usePodData` with `useQuery`.  
   - Standardize query keys (e.g. `['holterData', { page, pageSize, filter }]`).  
   - Remove repeated “manual loading” states in each hook.  

3. **Supabase Types & Zod**  
   - **Action**: Import or generate a typed client for RPC calls (some are present in `src/types/supabase.ts`).  
   - Use Zod to validate advanced filter input or edge function parameters if needed.  

4. **Rename/Deprecate Redundant Hooks**  
   - e.g. remove `useClinicData.ts` which just throws.  
   - Merge logic from `useClinicLabStats.ts` into `useClinicAnalytics.ts`.  

**Deliverables & Key Changes**  
- **Hooks**: Migrate `useHolterData`, `usePodData`, etc. to use React Query.  
- **Directory**: Possibly create `src/store/`.  
- Clean up hooking around RLS, ensuring we pass supabase clients consistently.  

---

### **Phase 3: DRY Aggregators & Advanced Table Features (Days 7–10)**

1. **Aggregator Unification**  
   - Create a single aggregator hook or component for daily/hourly usage: `src/hooks/useEcgAggregator.ts` or `src/components/aggregators/UniversalAggregator.tsx`.  
   - Merge logic from `DailyECGAggregator.tsx`, `HourlyECGAggregator.tsx`, `MobileFriendlyAggregator.tsx`.  
   - Provide props like `bucketSeconds` (3600 vs. 60).  

2. **Server-Side Pagination**  
   - For large data sets, ensure that `DataGrid` can do “page & pageSize” passing to the relevant RPC or Edge function.  
   - Possibly unify the approach in `useHolterData` and `useStudiesWithTimes`.  

3. **CSV Export & Column Grouping** (if needed)  
   - `HolterLab.tsx` already hints at “Export Data.” Move that into the shared table manager or as an optional prop.  

4. **Performance**  
   - Memoize canvas components in `AdvancedECGPlot.tsx`, using stable props or `React.memo`.  
   - Debounce filter input changes (some exist, but unify them).  

**Deliverables & Key Changes**  
- **Components**: Possibly a new aggregator directory `src/components/aggregators/`.  
- **Refactors**: `DailyECGAggregator.tsx`, `HourlyECGAggregator.tsx`, etc.  

---

### **Phase 4: UI/UX Polish & Testing (Days ~10–14)**

1. **Design System & Theming**  
   - Introduce consistent color tokens, shared button styles, consistent table border styles.  
   - Possibly a “tailwind.config.js” expansion or design tokens approach.  

2. **Accessibility**  
   - Add ARIA labels for table columns, aggregator timelines, etc.  
   - Ensure keyboard nav works in advanced filter or aggregator subwindow selections.  

3. **Test Coverage**  
   - Expand test coverage for new table manager, aggregator unification, error boundaries.  
   - Possibly add Cypress tests for E2E (HolterLab flow, PodLab flow).  

**Deliverables & Key Changes**  
- Possibly new folder `src/styles` or `src/theme`.  
- Additional test specs in `src/tests`.  

---

### **Phase 5: Final Cleanup, Observability & Documentation (Days ~14–17)**

1. **Styling & Performance Review**  
   - Double-check we have consistent styles across labs.  
   - Profile large data sets and ensure `DataGrid` virtualization is working if needed.  

2. **Monitoring**  
   - Integrate Sentry or similar. Possibly add a `src/lib/monitoring.ts` with some wrappers.  
   - Evaluate network request logs in Supabase to confirm no redundant calls.  

3. **Documentation & New File Structure**  
   - Publish a short “Contributor Guide” explaining the new approach: domain-driven or partial domain approach + shared.  
   - Create an ADR or markdown doc describing the aggregator unification and advanced filter parser decisions.  
   - Ensure a new dev can spin up easily.  

**Deliverables & Key Changes**  
- Possibly `docs/` folder or ADR folder.  
- Final pass to remove leftover old references.  

---

### File-Specific Actions Summary

**Below is a short list of the major refactoring tasks by file or group**:

- **`HolterLab.tsx`**  
  - Remove `evaluateExpression` → use safe parser.  
  - Extract “AdvancedFilterBox.tsx.”  
  - Replace table logic with `<DataGrid>`.  

- **`PodLab.tsx`, `DataLab.tsx`, `ClinicLab.tsx`**  
  - Replace local table logic with `<DataGrid>` or new unified table manager.  
  - Possibly combine similar hooking for pagination, search, etc.  

- **`DailyECGAggregator.tsx`, `HourlyECGAggregator.tsx`, `MobileFriendlyAggregator.tsx`**  
  - Merge into `UniversalAggregator.tsx` or allow a single aggregator with different “view modes.”  

- **Hooks**  
  - `useECGData` + `useDownsampleECG`: unify or clarify difference.  
  - `useHolterData`, `useStudiesWithTimes`: adopt React Query with standard keys.  
  - `useClinicData.ts`: remove or merge.  
  - `useClinicLabStats.ts` vs. `useClinicAnalytics.ts`: unify.  

- **Edge Function**  
  - `downsample-ecg/index.ts`: Keep or rename if we unify approaches. Possibly add a second function for peak-preserving.  

---

## **Final Output**  
This refined plan addresses the original 5-phase approach while adding **file-by-file instructions**. The restructured repository will center around:

1. A new, shared `<DataGrid>` for table usage.  
2. A single aggregator approach.  
3. Centralized filter state.  
4. A safe parser for advanced filter.  
5. React Query with typed Supabase calls.  
6. A domain-based or partially domain-based folder structure (`features/clinic`, `features/holter`, `features/ecg`, `components/shared/`, etc.) to reduce clutter.  

By following each phase’s tasks and focusing on modular unification, we can reduce duplication, mitigate security risks, and streamline the entire codebase.
```
