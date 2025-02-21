/// <reference types="vitest" />
/// <reference types="vite/client" />
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/hooks/api/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'
import type { User, Session, AuthChangeEvent, Subscription } from '@supabase/supabase-js'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

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

describe('useAuth', () => {
  const mockUser: User = {
    id: 'test-user',
    email: 'test@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  }

  const mockSession: Session = {
    user: mockUser,
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with loading state', () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('loads user from session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('handles session expiry', async () => {
    // Initial session with short expiry
    const shortSession: Session = {
      ...mockSession,
      expires_at: Date.now() + 1000, // 1 second from now
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: shortSession },
      error: null,
    })

    let authChangeCallback: (event: AuthChangeEvent, session: Session | null) => void = () => {}
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authChangeCallback = callback
      return {
        data: {
          subscription: {
            id: 'test-sub',
            unsubscribe: vi.fn(),
            callback,
          } as Subscription,
        },
        error: null,
      }
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    // Simulate session expiry
    act(() => {
      vi.advanceTimersByTime(2000) // Advance past expiry
      authChangeCallback('SIGNED_OUT', null)
    })

    // Verify user is signed out
    await waitFor(() => {
      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('handles auth state changes', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    })

    let authChangeCallback: (event: AuthChangeEvent, session: Session | null) => void = () => {}
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authChangeCallback = callback
      return {
        data: {
          subscription: {
            id: 'test-sub',
            unsubscribe: vi.fn(),
            callback,
          } as Subscription,
        },
        error: null,
      }
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    // Simulate token refresh
    const newSession: Session = {
      ...mockSession,
      access_token: 'new-token',
    }

    act(() => {
      authChangeCallback('TOKEN_REFRESHED', newSession)
    })

    // Verify session is updated
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })
  })

  it('handles failed session fetch', async () => {
    vi.mocked(supabase.auth.getSession).mockRejectedValueOnce(
      new Error('Auth error')
    )

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
  })
}) 