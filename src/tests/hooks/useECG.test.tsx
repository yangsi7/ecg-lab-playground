import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useECG } from '@/hooks/api/ecg'
import type { ReactNode } from 'react'

// Mock fetch
const originalFetch = global.fetch;
global.fetch = vi.fn();

// Mock data
const mockParallelData = {
  timestamps: ['2023-01-01T00:00:00Z'],
  channel_1: [1],
  channel_2: [2],
  channel_3: [3],
  lead_on_p_1: [true],
  lead_on_p_2: [true],
  lead_on_p_3: [true],
  lead_on_n_1: [true],
  lead_on_n_2: [true],
  lead_on_n_3: [true],
  quality_1: [true],
  quality_2: [true],
  quality_3: [true]
};

// Expected transformed sample
const expectedSample = {
  time: '2023-01-01T00:00:00Z',
  channels: [1, 2, 3],
  lead_on_p: [true, true, true],
  lead_on_n: [true, true, true],
  quality: [true, true, true]
};

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

describe('useECG', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('fetches ECG data correctly', async () => {
    // Mock successful response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockParallelData
    } as unknown as Response);

    const { result } = renderHook(
      () =>
        useECG({
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
    expect(result.current.samples[0]).toEqual(expectedSample)
    expect(result.current.error).toBeNull()

    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/downsample-ecg'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          pod_id: 'test-pod',
          time_start: '2023-01-01T00:00:00Z',
          time_end: '2023-01-01T01:00:00Z',
          factor: 4
        })
      })
    )
  })

  it('handles errors gracefully', async () => {
    // Mock error response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Failed to fetch' })
    } as unknown as Response);

    const { result } = renderHook(
      () =>
        useECG({
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

  it('respects the factor parameter', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockParallelData
    } as unknown as Response);

    renderHook(
      () =>
        useECG({
          pod_id: 'test-pod',
          time_start: '2023-01-01T00:00:00Z',
          time_end: '2023-01-01T01:00:00Z',
          factor: 8
        }),
      {
        wrapper: createWrapper()
      }
    )

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"factor":8')
      })
    )
  })

  it('handles empty response correctly', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        timestamps: [],
        channel_1: [],
        channel_2: [],
        channel_3: []
      })
    } as unknown as Response);

    const { result } = renderHook(
      () =>
        useECG({
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
  })
})
