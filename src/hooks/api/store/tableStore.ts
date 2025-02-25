import { create } from 'zustand'

export type SortDirection = 'asc' | 'desc'
export type LabType = 'holter' | 'pod' | 'data' | 'clinic'

interface TableState {
  currentPage: number
  pageSize: number
  sortField?: string
  sortDirection?: SortDirection
  quickFilter?: string
  advancedFilter?: string
  labType?: LabType
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSort: (field: string, direction: SortDirection) => void
  setQuickFilter: (filter?: string) => void
  setAdvancedFilter: (filter?: string) => void
  setLabType: (type: LabType) => void
  reset: () => void
}

const initialState = {
  currentPage: 1,
  pageSize: 25,
  sortField: undefined,
  sortDirection: undefined,
  quickFilter: undefined,
  advancedFilter: undefined,
  labType: undefined,
}

export const useTableStore = create<TableState>((set) => ({
  ...initialState,

  setPage: (page) => set({ currentPage: page }),
  
  setPageSize: (size) => set({ pageSize: size }),
  
  setSort: (field, direction) => set({ 
    sortField: field, 
    sortDirection: direction 
  }),
  
  setQuickFilter: (filter) => set({ 
    quickFilter: filter,
    currentPage: 1 // Reset to first page when filter changes
  }),
  
  setAdvancedFilter: (filter) => set({ 
    advancedFilter: filter,
    currentPage: 1 // Reset to first page when filter changes
  }),
  
  setLabType: (type) => set(() => ({ 
    ...initialState,
    labType: type // Set new lab type while resetting other state
  })),
  
  reset: () => set(initialState)
}))
