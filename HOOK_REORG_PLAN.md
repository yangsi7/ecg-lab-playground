# Hook Reorganization Plan

## Current Issues
1. Duplicate utility functions across different files
2. RPC and data query hooks spread across multiple locations
3. Multiple utility files with overlapping functionality
4. Need to consolidate Supabase-related code

## Proposed Structure

### 1. Core Utilities (/src/hooks/api/core/)
- `supabase.ts` - Main Supabase client configuration
- `utils.ts` - Core database utilities
- `errors.ts` - Error handling utilities

### 2. Data Query Layer (/src/hooks/api/filters/)
- `useDataGrid.ts` - Grid-specific data handling
- `useDataQueries.ts` - Generic data query hooks
- `useAdvancedFilter.ts` - Advanced filtering functionality

### 3. Type Organization (/src/types/)
- Keep current structure
- Ensure all types are properly exported through index.ts
- Maintain database.types.ts as source of truth

### 4. Implementation Steps

1. **Consolidate Utilities**
   - Move common utility functions to core/utils.ts
   - Remove duplicate code
   - Update imports across codebase

2. **Standardize RPC Handling**
   - Use core/utils.ts queryTable and callRPC functions
   - Update all RPC calls to use standardized error handling
   - Ensure proper typing through database.types.ts

3. **Organize Data Grid Related Code**
   - Keep DataGrid component in shared components
   - Move all grid-related hooks to filters/
   - Standardize filter interfaces

4. **Update Index Files**
   - Ensure proper exports in all index.ts files
   - Remove unnecessary re-exports
   - Maintain clean import paths

5. **Documentation Updates**
   - Update ARCHITECTURE.md with new structure
   - Add inline documentation for key functions
   - Document any breaking changes

### 5. Breaking Changes
- None expected as this is primarily organizational
- All existing functionality will be maintained
- Import paths may need updating

### 6. Benefits
1. Better code organization
2. Reduced duplication
3. Clearer responsibility separation
4. Easier maintenance
5. Better type safety

### 7. Testing Strategy
1. Ensure all existing functionality works
2. Verify proper type inference
3. Check all import paths
4. Test error handling
5. Validate filter operations

## Next Steps
1. Review and approve plan
2. Switch to code mode for implementation
3. Test changes
4. Update documentation