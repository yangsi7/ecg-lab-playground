import { create } from 'zustand'

interface TableState {
  filters: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  sortBy: string | null;
  sortDirection: 'asc' | 'desc';
  setFilter: (field: string, value: string | undefined) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSort: (sortBy: string | null, sortDirection: 'asc' | 'desc') => void;
  resetFilters: () => void;
}

const useTableStore = create<TableState>((set) => ({
  filters: {},
  page: 0,
  pageSize: 25,
  sortBy: null,
  sortDirection: 'asc',
  setFilter: (field, value) => set((state) => ({
    filters: { ...state.filters, [field]: value },
    page: 0, // Reset to first page when filters change
  })),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 0 }), // Reset to first page when page size changes
  setSort: (sortBy, sortDirection) => set({ sortBy, sortDirection }),
  resetFilters: () => set({ filters: {}, page: 0 }),
}))

export default useTableStore;
