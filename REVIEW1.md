# Code Review and Improvement Plan

This document outlines identified issues, proposed solutions, and implementation steps for improving the ECG-LAB repository codebase. It prioritizes critical issues and provides a phased approach for addressing them.

## Phase 2.5: High-Priority Fixes and Enhancements (Continuation of Accelerated Phase 2/3)

This phase focuses on addressing the most critical issues identified during the code review, building upon the work done in the accelerated Phase 2.

### **Issue 1: `DataGrid` Pagination (CRITICAL)**

*   **Files:** `src/components/table/DataGrid.tsx`, `src/components/labs/HolterLab.tsx`, `src/components/labs/PodLab.tsx`, `src/components/labs/DataLab.tsx`, `src/store/tableStore.ts`
*   **Problem:** The `DataGrid` component does not handle pagination internally. Pagination state (currentPage, pageSize) and logic are managed in the parent components (HolterLab, PodLab, DataLab), leading to code duplication and making `DataGrid` less reusable.
*   **Solution:** Refactor `DataGrid` to manage pagination internally.
*   **Implementation Steps:**
    1.  **`DataGrid.tsx`:**
        *   Add `totalCount: number` to the `DataGridProps` interface.
        *   Remove the `data` prop, and replace with `paginatedData`.
        *   Add `onPageChange: (newPage: number) => void` and `onPageSizeChange: (newPageSize: number) => void` to `DataGridProps`.
        *   Internally, manage `currentPage` and `pageSize` using `useState`. Initialize them with default values (e.g., page 0, size 25).
        *   Calculate `startIndex` and `endIndex` based on `currentPage` and `pageSize`.
        *   Slice the `paginatedData` array using `startIndex` and `endIndex` to get the data for the current page.
        *   Add UI elements for pagination controls (e.g., "Previous", "Next", page number input, page size selector).
        *   Call `onPageChange` and `onPageSizeChange` when the user interacts with the pagination controls.
        *  Modify `useMemo` hook to only use `paginatedData`.
    2.  **`HolterLab.tsx`, `PodLab.tsx`, `DataLab.tsx`:**
        *   Remove `currentPage`, `pageSize`, `startIndex`, `endIndex`, and `pageRows` state variables and calculations.
        *   Pass `totalCount` from `useHolterData` (or equivalent hooks) to `DataGrid`.
        *   Implement `onPageChange` and `onPageSizeChange` handlers that call `useTableStore`'s `setPage` and `setPageSize` actions, respectively.
        *   Pass the `data` or `studies` directly to `DataGrid` renamed as `paginatedData`.
    3.  **`src/store/tableStore.ts`:**
        *   No changes are strictly required here, as the actions are already defined. However, consider adding a comment to clarify that `page` and `pageSize` are intended to be updated via `DataGrid`'s events.
    4. **Add Unit tests** to the DataGrid to reflect all changes.

*   **Justification:** This refactoring makes `DataGrid` a truly reusable and self-contained component. It eliminates code duplication and centralizes pagination logic, making the code easier to maintain and understand.  It aligns with best practices for component design.
*   **Dependencies:** This change requires coordinated modifications to `DataGrid` and all components that use it.
*   **Things to Watch Out For:**
    *   Ensure that the pagination logic is correct, especially for edge cases (e.g., empty data, last page, changing page size).
    *   Thoroughly test the interaction between `DataGrid` and `useTableStore` to ensure that the global state is updated correctly.

### **Issue 2: `DataGrid` Filtering (CRITICAL)**

*   **Files:** `src/components/table/DataGrid.tsx`, `src/components/labs/HolterLab.tsx` (and potentially other labs if they use custom filtering).
*   **Problem:** The `DataGrid` component does not handle filtering internally. Filtering is done externally in parent components, leading to code duplication and making `DataGrid` less reusable.
*   **Solution:** Refactor `DataGrid` to accept and apply filters internally.
*   **Implementation Steps:**
    1.  **`DataGrid.tsx`:**
        *   Add a `filters` prop to `DataGridProps`. Initially, this can be `Record<string, string | number | boolean | null>`. In a future iteration, we might use a more structured filter object.
        *   Modify the `useMemo` hook that currently handles sorting to *also* apply filtering *before* sorting.  Use a helper function (e.g., `applyFilters`) to iterate through the `filters` object and filter the `data` array. The filtering logic inside `applyFilters` should support basic comparison operators (e.g., `=`, `!=`, `<`, `>`, `<=`, `>=`) and potentially string matching (e.g., `includes` or `startsWith`).
        *   Since we're using `jsep` for advanced filtering in `HolterLab`, consider how to integrate that here.  One option is to have `DataGrid` accept a *parsed* filter expression (e.g., a `jsep.Expression`) rather than a raw string.  This would require parsing the expression in the parent component (e.g., `HolterLab`) and passing the parsed AST to `DataGrid`.
    2.  **`HolterLab.tsx`:**
        *   Pass the `advancedFilter` string (or, preferably, the parsed `jsep` expression) to `DataGrid` via the `filters` prop.  Remove the `filteredStudies` calculation.
        * The `parseAdvancedFilter` stays in HolterLab.

*   **Justification:** This refactoring makes `DataGrid` more powerful and reusable. It centralizes filtering logic and eliminates code duplication.  Using `jsep` in `DataGrid` (if the parsed expression is passed as a prop) ensures consistent and safe filtering.
*   **Dependencies:**  Requires a clear understanding of how the advanced filter expressions should be parsed and applied.
*   **Things to Watch Out For:**
    *   Ensure that the filtering logic handles different data types correctly (strings, numbers, booleans, null/undefined).
    *   Thoroughly test the filtering logic with various filter expressions and edge cases.
    *   Consider the performance implications of filtering large datasets within `DataGrid`. If performance becomes an issue, explore options like server-side filtering or more optimized filtering algorithms.

### **Issue 3: `useEcgAggregator` Inconsistency (CRITICAL)**

*   **Files:** `src/hooks/useEcgAggregator.ts`, `src/components/aggregators/EcgAggregatorView.tsx`, (and potentially the Supabase RPC function `aggregate_ecg_data`)
*   **Problem:** The `useEcgAggregator` hook's interface declares parameters for pagination, filtering, and column selection, but the implementation does not use these parameters in the Supabase RPC call.  The `aggregate_ecg_data` function is not provided, so its behavior is unknown.
*   **Solution:** Implement pagination, filtering, and column selection within `useEcgAggregator` and the corresponding Supabase RPC function.
*   **Implementation Steps:**
    1.  **`src/hooks/useEcgAggregator.ts`:**
        *   Modify the `queryFn` to include `page`, `pageSize`, `columns`, and `filters` in the `supabase.rpc` call to `aggregate_ecg_data`. Pass these values as parameters to the RPC function.
        *   Update the `queryKey` to include these parameters, ensuring that React Query correctly caches and invalidates data based on pagination and filtering changes.
        *   The return from `supabase.rpc` will also need a `count` included, add a new interface that includes this type information and use that.
    2.  **`src/components/aggregators/EcgAggregatorView.tsx`:**
        * Pass `page`, `pageSize`, `columns`, and `filters` down to the `useEcgAggregator`. 

    3.  **Supabase RPC function `aggregate_ecg_data` (NOT PROVIDED - NEEDS IMPLEMENTATION):**
        *   This function (likely in `supabase/migrations`) needs to be created or significantly modified to handle the new parameters.
        *   It should use dynamic SQL generation to construct the query based on the provided parameters, ensuring proper sanitization and parameterization to prevent SQL injection.
        *   It should handle pagination using `OFFSET` and `LIMIT`.
        *   It should handle filtering using `WHERE` clauses.
        *   It should handle column selection dynamically.
        *   It should return a count of total rows, *in addition to* the requested data.

*   **Justification:** This change makes `useEcgAggregator` a complete and functional hook for fetching aggregated ECG data, supporting essential features like pagination and filtering. It aligns the hook's interface with its actual behavior.
*   **Dependencies:** Requires significant changes to both the hook and the Supabase RPC function.  Requires a good understanding of SQL and dynamic query generation.
*   **Things to Watch Out For:**
    *   **SQL Injection:**  Carefully sanitize and parameterize all user-provided inputs in the RPC function to prevent SQL injection vulnerabilities. *Never* directly concatenate user input into the SQL query string.
    *   **Performance:***   **Performance:**  Dynamic SQL can be complex and potentially inefficient. Ensure that the generated queries are optimized and use appropriate indexes. Test with large datasets to identify potential performance bottlenecks.
    *   **Error Handling:** Implement robust error handling in both the hook and the RPC function.

### **Issue 4: `useECGData`, `useDownsampleECG`, and `useEcgAggregator` Overlap (HIGH)**

*   **Files:** `src/hooks/useECGData.ts`, `src/hooks/useDownsampleECG.ts`, `src/hooks/useEcgAggregator.ts`
*   **Problem:** Three different hooks exist for fetching ECG data, with unclear relationships and potential redundancy.  This makes the codebase harder to understand and maintain.
*   **Solution:**  Clearly define the purpose of each hook and document it.  Consider deprecating `useECGData` in favor of `useDownsampleECG` and `useEcgAggregator`, or refactor all to use React Query.
*   **Implementation Steps:**

    1.  **Analysis:** Carefully examine the usage of each hook throughout the codebase.  Determine where each hook is used and why.
    2.  **Decision:** Decide whether to:
        *   **Consolidate:**  Merge the functionality of `useECGData` into `useDownsampleECG` (if `useECGData` is truly redundant).
        *   **Deprecate:**  If `useECGData` is no longer needed, deprecate it and remove its usage from the codebase.
        *   **Keep Separate (with clear documentation):** If each hook serves a distinct and valuable purpose, keep them separate but *clearly* document their intended use cases and differences.
    3.  **Refactor (if consolidating):**
        *   Migrate the functionality of `useECGData` into `useDownsampleECG` (or vice versa). This might involve adding options to `useDownsampleECG` to support different fetching strategies.
        *   Replace all usages of the deprecated hook with the consolidated hook.
        *  Consider using React Query for the remaining hook(s)
    4.  **Documentation (if keeping separate):**
        *   Add clear JSDoc comments to each hook, explaining its purpose, parameters, return values, and how it differs from the other hooks.
        *   Add a section to the `README.md` or a separate documentation file explaining the different ECG data fetching hooks and when to use each one.

*   **Justification:**  Clear and consistent data fetching logic is essential for maintainability and scalability. Reducing redundancy and ambiguity improves the overall quality of the codebase.
*   **Dependencies:**  This change might require modifying components that use these hooks.
*   **Things to Watch Out For:**
    *   Ensure that any consolidation or deprecation does not break existing functionality.
    *   Thoroughly test the changes to ensure that ECG data is still fetched correctly in all scenarios.

**General Notes and Justifications (applicable to all changes):**

*   **Testing:**  Thorough testing is *crucial* for all of these changes.  Add unit tests and integration tests to cover all new and modified functionality.  Pay particular attention to edge cases and error handling.
*   **Code Style:** Maintain consistent code style throughout the project. Use a linter (like ESLint) and a formatter (like Prettier) to enforce consistent style.
*   **Comments:** Add clear and concise comments to explain the purpose of code blocks, especially for complex logic.
*   **Commit Messages:**  Write clear and informative commit messages that describe the changes made in each commit.
*   **Code Review:** All changes should be reviewed by at least one other developer before being merged.

This detailed plan provides a roadmap for addressing the most critical issues in the codebase. By prioritizing these issues and following the recommended implementation steps, the developer can significantly improve the quality, maintainability, and scalability of the ECG-LAB application. The ranking and justification provide a clear rationale for the order of operations, focusing on the highest impact changes first. Remember that the implementation of the Supabase RPC function `aggregate_ecg_data` is fundamental to resolving issue 3, and that function's implementation is not available for review.
