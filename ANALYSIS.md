# ECG Lab Code Review & 5-Phase Refactor Plan

## 1. Code Review Findings

### ClinicLab.tsx
✅ **Strengths**
- Clean card-based dashboard layout
- Effective use of custom hooks (useClinicAnalytics)
- Responsive chart implementation

❗ **Issues**
- Table sorting logic duplicated from HolterLab
- No search functionality
- Mixed inline canvas drawing with React lifecycle
- TypeScript `any` in SimpleBarChart props
- No error boundaries around charts

### HolterLab.tsx
✅ **Strengths**
- Advanced filter presets system
- Pagination implementation
- Loading states handling

❗ **Issues**
- Security risk in `evaluateExpression` (eval-like Function constructor)
- Filter logic not debounced
- Duplicated table sorting from ClinicLab
- No column resizing/reordering
- Complex component (643 lines)

### useHolterData.ts
✅ **Strengths**
- Pagination support
- Type definitions for HolterStudy
- Supabase query construction

❗ **Issues**
- No query caching (react-query missing)
- Advanced metrics computation incomplete
- Missing RLS policy checks
- No error recovery logic

### StudyContext.tsx
✅ **Strengths**
- Clean context provider pattern
- Pod days fetching logic

❗ **Issues**
- No cache invalidation strategy
- Missing loading states for nested data
- Limited error handling granularity

---

## 2. Architectural Concerns

1. **State Management**
   - Mixed useState/context without strategy
   - No global store for filters/pagination
   - Cache keys not standardized

2. **Data Fetching**
   - Duplicated query patterns
   - No request deduplication
   - Missing refresh intervals

3. **Security**
   - eval() pattern in Holter filter
   - No RLS policy verification
   - Missing input sanitization

4. **Performance**
   - Canvas re-draws on every render
   - Large table re-renders
   - No memoization of sorted/filtered data

5. **UI Consistency**
   - Inconsistent table styles
   - Mixed animation approaches
   - Varied loading skeletons

---

## 3. 5-Phase Refactor Plan

### Phase 1: Critical Foundations (1-2 Days)
```markdown
1. Security Hotfixes
   - Replace Function constructor with safe parser (jsep)
   - Add RLS policy verification layer
   - Implement input sanitization

2. Table System Unification
   - Create <DataGrid> component with:
     - Sortable headers
     - Column resizing
     - Virtualized rows

3. Error Handling Baseline
   - Add error boundaries
   - Implement unified loading skeletons
   - Create error recovery system
```

### Phase 2: State & Data Overhaul (3-5 Days)
```markdown
1. State Management
   - Introduce Zustand stores:
     - useFilterStore
     - usePaginationStore
     - useColumnConfigStore

2. Data Fetching
   - Migrate to TanStack Query
   - Standardize query keys
   - Add request deduplication

3. Type Safety
   - Generate Supabase types
   - Strict null checks
   - Add Zod validation
```

### Phase 3: Advanced Features (5-7 Days)
```markdown
1. Filter System
   - Unified filter builder component
   - Saved presets sync to Supabase
   - Visual query builder

2. Table Enhancements
   - Server-side pagination
   - CSV export
   - Column grouping

3. Performance
   - Canvas memoization
   - Virtualized charts
   - Debounced resizing
```

### Phase 4: UI/UX Polish (3-4 Days)
```markdown
1. Design System
   - Extract <DataCard> component
   - Create theme tokens
   - Animation system (Framer Motion)

2. Accessibility
   - ARIA labels for tables
   - Keyboard nav
   - Contrast checks

3. Documentation
   - Storybook implementation
   - ADR documentation
   - TypeDoc integration
```

### Phase 5: Testing & Observability (2-3 Days)
```markdown
1. Testing
   - Cypress table tests
   - Filter logic unit tests
   - Error boundary tests

2. Monitoring
   - Sentry integration
   - Performance metrics
   - Query health dashboards

3. Audit
   - Lighthouse CI
   - Bundle analysis
   - Security scan
```

---

## 4. Immediate Action Items

🛠 **Short-Term (Next 48h)**
1. Security: Replace eval filter with jsep
2. Create shared <DataGrid> component
3. Add error boundaries to all labs

🔧 **Mid-Term (1 Week)**
1. Zustand store implementation
2. TanStack Query migration
3. Supabase type generation

⏳ **Long-Term**
1. Full design system adoption
2. End-to-end testing suite
3. Performance optimization
