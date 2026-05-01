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

import { useAuth } from '@/hooks/useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('returns null user when nothing stored', async () => {
    const { result } = renderHook(() => useAuth())
    // Wait for effect
    await act(async () => {})
    expect(result.current.user).toBeNull()
    expect(result.current.ready).toBe(true)
  })

  it('returns user from localStorage when set', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@vms.com',
      phone: null,
      role: 'customer',
    }
    localStorageMock.setItem('vms_user', JSON.stringify(mockUser))

    const { result } = renderHook(() => useAuth())
    await act(async () => {})

    expect(result.current.user).toMatchObject(mockUser)
    expect(result.current.ready).toBe(true)
  })

  it('returns null for malformed JSON in localStorage', async () => {
    localStorageMock.setItem('vms_user', '{not valid json')

    const { result } = renderHook(() => useAuth())
    await act(async () => {})

    expect(result.current.user).toBeNull()
    expect(result.current.ready).toBe(true)
  })

  it('signOut clears localStorage and redirects', async () => {
    const mockUser = { id: 1, name: 'Test', email: null, phone: '9876543210', role: 'customer' }
    localStorageMock.setItem('vms_token', 'tok_abc')
    localStorageMock.setItem('vms_user', JSON.stringify(mockUser))

    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.user).not.toBeNull()

    // Mock fetch for logout API call
    globalThis.fetch = vi.fn().mockResolvedValue(new Response('{}'))

    await act(async () => {
      await result.current.signOut()
    })

    expect(localStorageMock.getItem('vms_token')).toBeNull()
    expect(localStorageMock.getItem('vms_user')).toBeNull()
    expect(result.current.user).toBeNull()
    expect(window.location.href).toBe('/')
  })
})
