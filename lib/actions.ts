import { cookies } from 'next/headers'
import type { SessionUser } from '@/lib/types'

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('stock-session')
  if (!session) return null
  try {
    return JSON.parse(session.value) as SessionUser
  } catch {
    return null
  }
}