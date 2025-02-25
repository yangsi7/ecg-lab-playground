/// <reference types="vitest" />
/// <reference types="vite/client" />
import '@testing-library/jest-dom'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MainECGViewer from '@/components/shared/ecg/MainECGViewer'
import { supabase } from '@/hooks/api/core/supabase'
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

describe('MainECGViewer Integration', () => {
  const defaultProps = {
    podId: 'test-pod',
    timeStart: '2023-01-01T00:00:00Z',
    timeEnd: '2023-01-01T01:00:00Z',
    onClose: vi.fn(),
    factor: 4
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [mockChunk],
      error: null
    })

    render(<MainECGViewer {...defaultProps} />, {
      wrapper: createWrapper()
    })

    expect(screen.getByTestId('ecg-loading')).toBeInTheDocument()
  })

  it('displays ECG data after loading', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [mockChunk],
      error: null
    })

    render(<MainECGViewer {...defaultProps} />, {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(screen.queryByTestId('ecg-loading')).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('ecg-plot')).toBeInTheDocument()
    expect(screen.getByTestId('ecg-timeline')).toBeInTheDocument()
  })

  it('handles errors gracefully', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Failed to fetch ECG data' }
    })

    render(<MainECGViewer {...defaultProps} />, {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(screen.getByTestId('ecg-error')).toBeInTheDocument()
    })

    expect(screen.getByText(/Failed to fetch ECG data/i)).toBeInTheDocument()
  })

  it('handles large datasets efficiently', async () => {
    // Create a large dataset with 10,000 samples
    const largeChunk = {
      chunk_start: '2023-01-01T00:00:00Z',
      chunk_end: '2023-01-01T00:05:00Z',
      samples: Array(10000).fill(null).map((_, i) => ({
        time: new Date(Date.parse('2023-01-01T00:00:00Z') + i * 1000).toISOString(),
        channels: [Math.sin(i * 0.1), Math.cos(i * 0.1), Math.sin(i * 0.2)],
        lead_on_p: [true, true, true],
        lead_on_n: [true, true, true],
        quality: [true, true, true]
      }))
    }

    // Mock initial load with large dataset
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [largeChunk],
      error: null
    })

    // Mock next chunk for infinite scroll
    const nextLargeChunk = {
      ...largeChunk,
      chunk_start: '2023-01-01T00:05:00Z',
      chunk_end: '2023-01-01T00:10:00Z',
      samples: largeChunk.samples.map(sample => ({
        ...sample,
        time: new Date(Date.parse(sample.time) + 5 * 60 * 1000).toISOString()
      }))
    }

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [nextLargeChunk],
      error: null
    })

    const { container } = render(<MainECGViewer {...defaultProps} />, {
      wrapper: createWrapper()
    })

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('ecg-plot')).toBeInTheDocument()
    })

    // Verify rendering performance
    const startTime = performance.now()
    const plotContainer = screen.getByTestId('ecg-plot-container')

    // Simulate rapid scroll events
    for (let i = 0; i < 10; i++) {
      fireEvent.scroll(plotContainer, {
        target: {
          scrollTop: plotContainer.scrollHeight * (i + 1) / 10,
          scrollHeight: plotContainer.scrollHeight,
          clientHeight: plotContainer.clientHeight
        }
      })
    }

    // Wait for throttled scroll handler
    await new Promise(resolve => setTimeout(resolve, 300))

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Verify that rendering large dataset doesn't freeze the UI
    expect(renderTime).toBeLessThan(1000) // Should render within 1 second

    // Verify throttling worked - should only make one additional request despite multiple scrolls
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledTimes(2)

    // Check memory usage
    const memoryUsage = process.memoryUsage()
    expect(memoryUsage.heapUsed).toBeLessThan(200 * 1024 * 1024) // Less than 200MB
  })

  it('loads more data on scroll', async () => {
    // Mock initial chunk
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [mockChunk],
      error: null
    })

    // Mock next chunk
    const nextChunk = {
      ...mockChunk,
      chunk_start: '2023-01-01T00:05:00Z',
      chunk_end: '2023-01-01T00:10:00Z'
    }

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [nextChunk],
      error: null
    })

    render(<MainECGViewer {...defaultProps} />, {
      wrapper: createWrapper()
    })

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('ecg-plot')).toBeInTheDocument()
    })

    // Simulate scroll to bottom
    const plotContainer = screen.getByTestId('ecg-plot-container')
    fireEvent.scroll(plotContainer, {
      target: {
        scrollTop: plotContainer.scrollHeight,
        scrollHeight: plotContainer.scrollHeight,
        clientHeight: plotContainer.clientHeight
      }
    })

    // Wait for next chunk to load
    await waitFor(() => {
      expect(vi.mocked(supabase.rpc)).toHaveBeenCalledTimes(2)
    })

    // Verify both chunks are displayed
    expect(screen.getAllByTestId('ecg-sample')).toHaveLength(2)
  })

  it('throttles scroll events for performance', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [mockChunk],
      error: null
    })

    render(<MainECGViewer {...defaultProps} />, {
      wrapper: createWrapper()
    })

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('ecg-plot')).toBeInTheDocument()
    })

    const plotContainer = screen.getByTestId('ecg-plot-container')

    // Simulate multiple rapid scroll events
    for (let i = 0; i < 5; i++) {
      fireEvent.scroll(plotContainer, {
        target: {
          scrollTop: plotContainer.scrollHeight * (i + 1),
          scrollHeight: plotContainer.scrollHeight,
          clientHeight: plotContainer.clientHeight
        }
      })
    }

    // Wait a bit to let throttling take effect
    await new Promise(resolve => setTimeout(resolve, 300))

    // Should only make one additional request due to throttling
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledTimes(2)
  })

  it('updates view on time range change', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [mockChunk],
      error: null
    })

    const { rerender } = render(<MainECGViewer {...defaultProps} />, {
      wrapper: createWrapper()
    })

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('ecg-plot')).toBeInTheDocument()
    })

    // Update time range
    const newProps = {
      ...defaultProps,
      timeStart: '2023-01-01T01:00:00Z',
      timeEnd: '2023-01-01T02:00:00Z'
    }

    rerender(<MainECGViewer {...newProps} />)

    // Should trigger a new request with updated time range
    await waitFor(() => {
      expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith(
        'downsample_ecg_chunked',
        expect.objectContaining({
          p_time_start: '2023-01-01T01:00:00Z',
          p_time_end: '2023-01-01T02:00:00Z'
        })
      )
    })
  })

  it('closes viewer when close button is clicked', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [mockChunk],
      error: null
    })

    render(<MainECGViewer {...defaultProps} />, {
      wrapper: createWrapper()
    })

    // Wait for render
    await waitFor(() => {
      expect(screen.getByTestId('ecg-plot')).toBeInTheDocument()
    })

    // Click close button
    fireEvent.click(screen.getByTestId('ecg-close-button'))

    expect(defaultProps.onClose).toHaveBeenCalled()
  })
}) 