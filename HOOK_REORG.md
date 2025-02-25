# Hook Reorganization Plan

## Current Issues
```ts
// Example type errors from hooks
import { SupabaseRow } from '../../types/utils' // Error: Not exported
import { RPCCallInfo } from '../../../types/utils' // Error: Missing type
```

## Proposed Structure
```diff
 hooks/
+├── data/
+│   ├── ecg/              # ECG data fetching
+│   │   ├── useECGData.ts
+│   │   └── useECGTimeline.ts
+│   ├── studies/         # Study management 
+│   └── clinics/         # Clinic analytics
+├── state/
+│   ├── filters/         # Filter management
+│   │   └── useAdvancedFilter.ts
+│   └── preferences/     # User preferences
+└── ui/
+    ├── visualization/   # Chart helpers
+    └── layout/          # Responsive layout
```

## Type Fixes Needed
1. Update `types/utils.ts`:
```typescript
// Add missing types
export type SupabaseRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export interface RPCCallInfo {
  function_name: string
  execution_time: number
  status: 'success' | 'error'
}
```

2. Update hook imports:
```diff
-import { SupabaseRow } from '../../types/utils'
+import type { SupabaseRow } from '../../types/database.types'
```

## Migration Steps
1. Create new directory structure
2. Move existing hooks to appropriate categories
3. Update import paths throughout application
4. Add type extensions to `types/utils.ts`
5. Validate type fixes with `tsc --noEmit`