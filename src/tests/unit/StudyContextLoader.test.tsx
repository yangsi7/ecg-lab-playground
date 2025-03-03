/* ================================================
   Example Test File addressing 'msw' Type Issues
   and jest-dom matchers
   ================================================ */

import type {} from 'vitest'
import type {} from 'vite/client'
import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import ECGViewerPage from '@/components/shared/ecg/ECGViewerPage'
import { setupServer, rest } from 'msw/node'
import { HttpRequest, HttpResponse, Context } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StudyProvider } from '@/context/StudyContext'
import { supabase } from '@/hooks/api/study/supabase'

const server = setupServer(
  rest.post<any, any>('*/rest/v1/study', async (req: HttpRequest, res: HttpResponse<any>, ctx: Context) => {
    const body = await req.json()
    if (body.eq === 'valid-study-id') {
      return res(
        ctx.status(200),
        ctx.json([
          {
            pod_id: 'test-pod',
            start_timestamp: '2025-01-01T00:00:00Z',
            end_timestamp: '2025-01-10T00:00:00Z'
          }
        ])
      )
    }
    return res(ctx.status(404), ctx.json([]))
  })
)

describe('ECGViewerPage aggregator tests', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  it('loads study and displays aggregator sections', async () => {
    const routes = [
      { path: '/ecg/:studyId', element: <ECGViewerPage /> }
    ]
    const router = createMemoryRouter(routes, {
      initialEntries: ['/ecg/valid-study-id']
    })
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText(/Pod ID:/i)).toBeInTheDocument()
    })
  })

  it('shows error if study not found', async () => {
    const routes = [
      { path: '/ecg/:studyId', element: <ECGViewerPage /> }
    ]
    const router = createMemoryRouter(routes, {
      initialEntries: ['/ecg/missing-study-id']
    })
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument()
    })
  })
})
