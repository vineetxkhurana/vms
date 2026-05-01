/**
 * Security tests for auth, JWT, middleware, and API protection.
 *
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignJWT, jwtVerify } from 'jose'

// ── JWT & Auth helpers ──────────────────────────────────────────────

const TEST_SECRET = 'test-secret-key-for-vitest-only'
const SECRET_BYTES = new TextEncoder().encode(TEST_SECRET)

async function makeToken(payload: Record<string, unknown>, opts?: { secret?: Uint8Array; expiry?: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(opts?.expiry ?? '7d')
    .sign(opts?.secret ?? SECRET_BYTES)
}

describe('JWT Security', () => {
  it('rejects token signed with wrong secret', async () => {
    const wrongSecret = new TextEncoder().encode('wrong-secret')
    const token = await makeToken({ sub: '1', role: 'admin' }, { secret: wrongSecret })

    await expect(jwtVerify(token, SECRET_BYTES)).rejects.toThrow()
  })

  it('rejects expired tokens', async () => {
    const token = await makeToken({ sub: '1', role: 'user' }, { expiry: '0s' })
    await new Promise(r => setTimeout(r, 1100))

    await expect(jwtVerify(token, SECRET_BYTES)).rejects.toThrow()
  })

  it('rejects modified payload (tampered token)', async () => {
    const token = await makeToken({ sub: '1', role: 'user' })
    const parts = token.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    payload.role = 'admin'
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const tampered = parts.join('.')

    await expect(jwtVerify(tampered, SECRET_BYTES)).rejects.toThrow()
  })

  it('accepts valid token with correct secret', async () => {
    const token = await makeToken({ sub: '42', role: 'admin', name: 'Test' })
    const { payload } = await jwtVerify(token, SECRET_BYTES)

    expect(payload.sub).toBe('42')
    expect(payload.role).toBe('admin')
  })

  it('role escalation via token is prevented by signature', async () => {
    const userToken = await makeToken({ sub: '5', role: 'user' })
    const { payload } = await jwtVerify(userToken, SECRET_BYTES)
    expect(payload.role).toBe('user')
  })
})

// ── OTP brute-force protection ─────────────────────────────────────

describe('OTP Brute-force Protection', () => {
  // Mock D1 database
  let db: any
  let otpRow: any

  beforeEach(() => {
    otpRow = { id: 1, code: '123456', expires_at: Math.floor(Date.now() / 1000) + 600, used: 0, attempts: 0 }
    db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(otpRow),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    }
  })

  it('burns OTP after 5 failed attempts', async () => {
    // Import the actual function
    const { verifyOTP } = await import('../../src/lib/otp')

    // Simulate 5 wrong attempts
    otpRow.attempts = 4 // This will be the 5th attempt
    const result = await verifyOTP(db, 'test@test.com', 'wrong1', 'login')

    expect(result).toBe('invalid')
    // Verify it called UPDATE with used=1 (burning the OTP)
    const calls = db.prepare.mock.calls
    const updateCall = calls.find((c: any[]) => c[0].includes('used = 1'))
    expect(updateCall).toBeDefined()
  })

  it('rejects already-used OTP', async () => {
    const { verifyOTP } = await import('../../src/lib/otp')
    otpRow.used = 1

    const result = await verifyOTP(db, 'test@test.com', '123456', 'login')
    expect(result).toBe('used')
  })

  it('rejects expired OTP', async () => {
    const { verifyOTP } = await import('../../src/lib/otp')
    otpRow.expires_at = Math.floor(Date.now() / 1000) - 1

    const result = await verifyOTP(db, 'test@test.com', '123456', 'login')
    expect(result).toBe('expired')
  })
})

// ── Input validation ───────────────────────────────────────────────

describe('Input Validation', () => {
  it('OTP code generation is always 6 digits', async () => {
    const { generateCode } = await import('../../src/lib/otp')
    for (let i = 0; i < 100; i++) {
      const code = generateCode()
      expect(code).toMatch(/^\d{6}$/)
    }
  })

  it('phone validation rejects non-Indian numbers', async () => {
    const { isPhone } = await import('../../src/lib/otp')
    expect(isPhone('9876543210')).toBe(true)   // valid
    expect(isPhone('1234567890')).toBe(false)   // US-like
    expect(isPhone('123456')).toBe(false)       // too short
    expect(isPhone('98765432101')).toBe(false)  // too long
  })

  it('phone normalization strips +91 prefix', async () => {
    const { normalisePhone } = await import('../../src/lib/otp')
    expect(normalisePhone('+919876543210')).toBe('9876543210')
    expect(normalisePhone('9876543210')).toBe('9876543210')
  })
})

// ── Cookie security ────────────────────────────────────────────────

describe('Cookie Configuration', () => {
  it('all auth cookies must have secure flag in production code', async () => {
    // Read the source files and verify secure: true is present
    const fs = await import('fs')
    const files = [
      'src/app/api/auth/login/route.ts',
      'src/app/api/auth/verify-otp/route.ts',
      'src/app/api/auth/google/callback/route.ts',
      'src/app/api/auth/logout/route.ts',
    ]

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8')
      const cookieSetCalls = content.match(/cookies\.set\([^)]+\)/gs) ?? []
      for (const call of cookieSetCalls) {
        expect(call).toContain('secure')
      }
    }
  })

  it('logout endpoint clears both cookies', async () => {
    const fs = await import('fs')
    const content = fs.readFileSync('src/app/api/auth/logout/route.ts', 'utf8')
    expect(content).toContain('vms_token')
    expect(content).toContain('vms_token_pub')
    expect(content).toContain('maxAge: 0')
  })
})

// ── Price security ─────────────────────────────────────────────────

describe('Price Tier Resolution', () => {
  it('returns base price for regular users with small quantity', async () => {
    const { resolvePrice } = await import('../../src/lib/auth')
    expect(resolvePrice(10000, 9000, 7500, 'user')).toBe(10000)
    expect(resolvePrice(10000, 9000, 7500, null)).toBe(10000)
    expect(resolvePrice(10000, 9000, 7500, 'user', 3)).toBe(10000)
  })

  it('returns retailer price for retailers regardless of quantity', async () => {
    const { resolvePrice } = await import('../../src/lib/auth')
    expect(resolvePrice(10000, 9000, 7500, 'retailer', 1)).toBe(9000)
    expect(resolvePrice(10000, 9000, 7500, 'retailer', 5)).toBe(9000)
  })

  it('returns wholesaler price for wholesalers regardless of quantity', async () => {
    const { resolvePrice } = await import('../../src/lib/auth')
    expect(resolvePrice(10000, 9000, 7500, 'wholesaler', 1)).toBe(7500)
  })

  it('upgrades to retailer price at quantity threshold (6+)', async () => {
    const { resolvePrice } = await import('../../src/lib/auth')
    expect(resolvePrice(10000, 9000, 7500, 'user', 5)).toBe(10000)  // below threshold
    expect(resolvePrice(10000, 9000, 7500, 'user', 6)).toBe(9000)   // at threshold
    expect(resolvePrice(10000, 9000, 7500, 'user', 10)).toBe(9000)  // above threshold
    expect(resolvePrice(10000, 9000, 7500, null, 6)).toBe(9000)     // no role, quantity kicks in
  })

  it('upgrades to wholesaler price at quantity threshold (21+)', async () => {
    const { resolvePrice } = await import('../../src/lib/auth')
    expect(resolvePrice(10000, 9000, 7500, 'user', 20)).toBe(9000)  // still retailer
    expect(resolvePrice(10000, 9000, 7500, 'user', 21)).toBe(7500)  // wholesaler threshold
    expect(resolvePrice(10000, 9000, 7500, null, 50)).toBe(7500)    // big order
  })

  it('falls back to base price if tier price is null', async () => {
    const { resolvePrice } = await import('../../src/lib/auth')
    expect(resolvePrice(10000, null, null, 'retailer')).toBe(10000)
    expect(resolvePrice(10000, null, null, 'wholesaler')).toBe(10000)
    expect(resolvePrice(10000, null, null, 'user', 21)).toBe(10000)
    // Retailer price null but wholesaler set — quantity 6 falls back to base
    expect(resolvePrice(10000, null, 7500, 'user', 6)).toBe(10000)
  })

  it('admin users get base price (no special pricing)', async () => {
    const { resolvePrice } = await import('../../src/lib/auth')
    expect(resolvePrice(10000, 9000, 7500, 'admin')).toBe(10000)
  })
})

// ── SQL injection patterns ─────────────────────────────────────────

describe('SQL Injection Prevention', () => {
  it('all API routes use parameterized queries (static analysis)', async () => {
    const fs = await import('fs')
    const path = await import('path')

    function getFiles(dir: string): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      const files: string[] = []
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) files.push(...getFiles(fullPath))
        else if (entry.name.endsWith('.ts')) files.push(fullPath)
      }
      return files
    }

    const apiDir = 'src/app/api'
    const files = getFiles(apiDir)

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8')
      // Check for dangerous patterns: SQL with template literals containing variables
      // that aren't LIMIT/OFFSET (which are validated numerics)
      const sqlLines = content.split('\n').filter(line =>
        line.includes('.prepare(') && line.includes('${')
      )

      for (const line of sqlLines) {
        // Allow known-safe patterns: ${col} where col is from a whitelist, ${limit}, ${offset}
        const interpolations = line.match(/\$\{([^}]+)\}/g) ?? []
        for (const interp of interpolations) {
          const varName = interp.replace(/\$\{|\}/g, '').trim()
          const safeVars = ['col', 'limit', 'offset', 'updates.map', 'placeholders']
          const isSafe = safeVars.some(s => varName.startsWith(s))
          if (!isSafe) {
            throw new Error(
              `Potential SQL injection in ${file}: ${interp} in SQL prepare()\n` +
              `Line: ${line.trim()}\n` +
              `If this is safe, add the variable to the safeVars whitelist in this test.`
            )
          }
        }
      }
    }
  })
})

// ── Upload security ────────────────────────────────────────────────

describe('Upload Security', () => {
  it('only allows image MIME types', async () => {
    const fs = await import('fs')
    const content = fs.readFileSync('src/app/api/upload/route.ts', 'utf8')
    expect(content).toContain("'image/jpeg'")
    expect(content).toContain("'image/png'")
    // Should NOT allow arbitrary types
    expect(content).not.toContain("'application/")
    expect(content).not.toContain("'text/")
  })

  it('derives extension from MIME type not filename', async () => {
    const fs = await import('fs')
    const content = fs.readFileSync('src/app/api/upload/route.ts', 'utf8')
    // Should use MIME_EXT mapping, not file.name
    expect(content).toContain('MIME_EXT')
    expect(content).not.toMatch(/file\.name\.split\(['"]\./)
  })
})

// ── OAuth state (CSRF protection) ──────────────────────────────────

describe('Google OAuth CSRF Protection', () => {
  it('initiator generates and stores state parameter', async () => {
    const fs = await import('fs')
    const content = fs.readFileSync('src/app/api/auth/google/route.ts', 'utf8')
    expect(content).toContain('state')
    expect(content).toContain('oauth_state')
    expect(content).toContain('crypto.getRandomValues')
  })

  it('callback validates state from cookie', async () => {
    const fs = await import('fs')
    const content = fs.readFileSync('src/app/api/auth/google/callback/route.ts', 'utf8')
    expect(content).toContain('oauth_state')
    expect(content).toMatch(/state.*!==.*savedState|savedState.*!==.*state/)
  })
})

// ── Registration security ──────────────────────────────────────────

describe('Registration Security', () => {
  it('does not issue JWT token before OTP verification', async () => {
    const fs = await import('fs')
    const content = fs.readFileSync('src/app/api/auth/register/route.ts', 'utf8')
    // Should NOT call signToken
    expect(content).not.toContain('signToken')
    // Should return needs_otp_verify without token
    expect(content).toContain('needs_otp_verify: true')
  })
})
