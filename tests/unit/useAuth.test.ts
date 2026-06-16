import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock localStorage before importing the hook
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock window.location.href (jsdom doesn't support navigation)
const locationMock = { href: '' }
Object.defineProperty(window, 'location', { value: locationMock, writable: true })

// Mock fetch globally — useAuth now calls /api/auth/me
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

import { useAuth } from '@/hooks/useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    localStorageMock.clear()
    mockFetch.mockReset()
    // Default: /api/auth/me returns no user (not logged in)
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ user: null })))
  })

  it('returns null user when not authenticated', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.user).toBeNull()
    expect(result.current.ready).toBe(true)
  })

  it('returns user from /api/auth/me when authenticated', async () => {
    const mockUser = { id: 1, name: 'Test User', role: 'customer' }
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ user: mockUser })))

    const { result } = renderHook(() => useAuth())
    await act(async () => {})

    expect(result.current.user).toMatchObject(mockUser)
    expect(result.current.ready).toBe(true)
    // Should also cache in localStorage
    expect(localStorageMock.getItem('vms_user')).toBe(JSON.stringify(mockUser))
  })

  it('uses cached localStorage user while /api/auth/me resolves', async () => {
    const cachedUser = { id: 1, name: 'Cached', role: 'customer' }
    localStorageMock.setItem('vms_user', JSON.stringify(cachedUser))

    const { result } = renderHook(() => useAuth())
    // Before fetch resolves, should have cached user
    expect(result.current.user).toMatchObject(cachedUser)
    await act(async () => {})
  })

  it('signOut clears localStorage and redirects', async () => {
    const mockUser = { id: 1, name: 'Test', role: 'customer' }
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ user: mockUser })))
    localStorageMock.setItem('vms_user', JSON.stringify(mockUser))

    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.user).not.toBeNull()

    // Mock the logout fetch
    mockFetch.mockResolvedValue(new Response('{}'))

    await act(async () => {
      await result.current.signOut()
    })

    expect(localStorageMock.getItem('vms_user')).toBeNull()
    expect(result.current.user).toBeNull()
    expect(window.location.href).toBe('/')
  })
})
