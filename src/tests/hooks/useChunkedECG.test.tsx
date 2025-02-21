/// <reference types="vitest" />
/// <reference types="vite/client" />
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useChunkedECG } from '@/hooks/api/useChunkedECG'
import { supabase } from '@/hooks/api/supabase'
import type { ReactNode } from 'react'

// Mock supabase
vi.mock('@/hooks/api/supabase', () => ({
  supabase: {
    rpc: vi.fn()
  }
}))

// Mock data
const mockChunk = {
  chunk_start: '2023-01-01T00:00:00Z',
  chunk_end: '2023-01-01T00:05:00Z',
  samples: [
    {
      time: '2023-01-01T00:00:00Z',
      channels: [1, 2, 3],
      lead_on_p: [true, true, true],
      lead_on_n: [true, true, true],
      quality: [true, true, true]
    }
  ]
}

// Test wrapper setup
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useChunkedECG', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches initial chunk correctly', async () => {
    // Mock successful response
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [mockChunk],
      error: null
    })

    const { result } = renderHook(
      () =>
        useChunkedECG({
          pod_id: 'test-pod',
          time_start: '2023-01-01T00:00:00Z',
          time_end: '2023-01-01T01:00:00Z',
          factor: 4
        }),
      {
        wrapper: createWrapper()
      }
    )

    // Should start loading
    expect(result.current.isLoading).toBe(true)

    // Wait for data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify data
    expect(result.current.samples).toHaveLength(1)
    expect(result.current.samples[0]).toEqual(mockChunk.samples[0])
    expect(result.current.error).toBeNull()
  })

  it('handles errors gracefully', async () => {
    // Mock error response
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Failed to fetch' }
    })

    const { result } = renderHook(
      () =>
        useChunkedECG({
          pod_id: 'test-pod',
          time_start: '2023-01-01T00:00:00Z',
          time_end: '2023-01-01T01:00:00Z',
          factor: 4
        }),
      {
        wrapper: createWrapper()
      }
    )

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.samples).toHaveLength(0)
  })

  it('fetches next page when requested', async () => {
    // Mock successful responses for both initial and next page
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({
        data: [mockChunk],
        error: null
      })
      .mockResolvedValueOnce({
        data: [
          {
            ...mockChunk,
            chunk_start: '2023-01-01T00:05:00Z',
            chunk_end: '2023-01-01T00:10:00Z'
          }
        ],
        error: null
      })

    const { result } = renderHook(
      () =>
        useChunkedECG({
          pod_id: 'test-pod',
          time_start: '2023-01-01T00:00:00Z',
          time_end: '2023-01-01T01:00:00Z',
          factor: 4
        }),
      {
        wrapper: createWrapper()
      }
    )

    // Wait for initial data
    await waitFor(() => {
      expect(result.current.samples).toHaveLength(1)
    })

    // Fetch next page
    await result.current.fetchNextPage()

    // Wait for updated data
    await waitFor(() => {
      expect(result.current.samples).toHaveLength(2)
    })

    expect(result.current.hasNextPage).toBe(false)
  })

  it('respects the factor parameter', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [mockChunk],
      error: null
    })

    renderHook(
      () =>
        useChunkedECG({
          pod_id: 'test-pod',
          time_start: '2023-01-01T00:00:00Z',
          time_end: '2023-01-01T01:00:00Z',
          factor: 8
        }),
      {
        wrapper: createWrapper()
      }
    )

    expect(supabase.rpc).toHaveBeenCalledWith(
      'downsample_ecg_chunked',
      expect.objectContaining({
        p_factor: 8
      })
    )
  })

  it('handles empty response correctly', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [],
      error: null
    })

    const { result } = renderHook(
      () =>
        useChunkedECG({
          pod_id: 'test-pod',
          time_start: '2023-01-01T00:00:00Z',
          time_end: '2023-01-01T01:00:00Z',
          factor: 4
        }),
      {
        wrapper: createWrapper()
      }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.samples).toHaveLength(0)
    expect(result.current.hasNextPage).toBe(false)
  })
}) 