import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HolterLab from '../components/labs/HolterLab'
import '@testing-library/jest-dom'

describe('HolterLab Advanced Filter', () => {
  beforeEach(() => {
    // Mock supabase or provide a test mock
  })

  it('renders without crashing', () => {
    render(<HolterLab />)
    expect(screen.getByText(/Holter Studies/i)).toBeInTheDocument()
  })

  it('applies advanced filter expression', () => {
    render(<HolterLab />)
    const input = screen.getByPlaceholderText(/e\.g\. daysRemaining < 2/i)
    fireEvent.change(input, { target: { value: 'daysRemaining < 1' } })
    expect(input).toHaveValue('daysRemaining < 1')
  })
})
