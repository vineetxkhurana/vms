import { ok } from '@/lib/api'
import { getUser } from '@/lib/auth'

export const runtime = 'edge'

export async function GET(req: Request) {
  const user = await getUser(req)
  if (!user) return ok({ user: null })

  return ok({
    user: {
      id: Number(user.sub),
      name: user.name,
      role: user.role,
    },
  })
}
