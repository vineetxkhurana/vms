import { describe, it, expect } from 'vitest'
import { STATUS_CONFIG, PIPELINE, statusColor } from '@/lib/status'

describe('STATUS_CONFIG', () => {
  const requiredStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

  it('defines all expected order statuses', () => {
    for (const status of requiredStatuses) {
      expect(STATUS_CONFIG).toHaveProperty(status)
    }
  })

  it('each status has color, icon and label', () => {
    for (const [, cfg] of Object.entries(STATUS_CONFIG)) {
      expect(cfg.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(cfg.icon).toBeTruthy()
      expect(cfg.label).toBeTruthy()
    }
  })

  it('all colors are valid hex codes', () => {
    const hexRe = /^#[0-9a-fA-F]{6}$/
    for (const [, { color }] of Object.entries(STATUS_CONFIG)) {
      expect(color).toMatch(hexRe)
    }
  })
})

describe('PIPELINE', () => {
  it('starts with pending and ends with delivered', () => {
    expect(PIPELINE[0]).toBe('pending')
    expect(PIPELINE[PIPELINE.length - 1]).toBe('delivered')
  })

  it('contains all non-terminal statuses in correct order', () => {
    expect(PIPELINE).toEqual(['pending', 'paid', 'processing', 'shipped', 'delivered'])
  })

  it('does not include cancelled (it is a terminal state, not a pipeline step)', () => {
    expect(PIPELINE).not.toContain('cancelled')
  })
})

describe('statusColor', () => {
  it('returns color for known status', () => {
    expect(statusColor('pending')).toBe(STATUS_CONFIG.pending.color)
    expect(statusColor('delivered')).toBe(STATUS_CONFIG.delivered.color)
  })

  it('returns fallback grey for unknown status', () => {
    expect(statusColor('unknown_status')).toBe('#8fafc7')
    expect(statusColor('')).toBe('#8fafc7')
  })
})
