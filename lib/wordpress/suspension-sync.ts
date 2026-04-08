import { prisma } from '@/lib/prisma'

export interface WordPressSuspensionSnapshot {
  id: number
  email?: string
  username?: string
  name?: string
  is_suspended?: boolean
  suspension_reason?: string | null
  suspended_at?: string | null
}

function parseSuspendedAt(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function syncWordPressSuspensionState(users: WordPressSuspensionSnapshot[]) {
  const candidates = users.filter((user) => Number.isInteger(user.id) && user.id > 0 && typeof user.is_suspended === 'boolean')

  if (candidates.length === 0) {
    return
  }

  await Promise.all(
    candidates.map((user) =>
      prisma.wordPressUser.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: user.email || `wp_user_${user.id}@temp.local`,
          username: user.username || null,
          name: user.name || null,
          isSuspended: Boolean(user.is_suspended),
          suspensionReason: user.is_suspended ? user.suspension_reason || null : null,
          suspendedAt: user.is_suspended ? parseSuspendedAt(user.suspended_at) : null,
          suspendedBy: null,
          deletedAt: null,
        },
        update: {
          email: user.email || undefined,
          username: user.username || undefined,
          name: user.name || undefined,
          isSuspended: Boolean(user.is_suspended),
          suspensionReason: user.is_suspended ? user.suspension_reason || null : null,
          suspendedAt: user.is_suspended ? parseSuspendedAt(user.suspended_at) : null,
          suspendedBy: user.is_suspended ? undefined : null,
          deletedAt: null,
        },
      })
    )
  )
}

export function getEffectiveSuspensionState(
  user: WordPressSuspensionSnapshot,
  localUser?: {
    isSuspended?: boolean | null
    suspendedBy?: string | null
    suspendedAt?: Date | null
    suspensionReason?: string | null
  } | null
) {
  const fromWordPress = typeof user.is_suspended === 'boolean' ? user.is_suspended : null
  const effectiveSuspended = fromWordPress ?? Boolean(localUser?.isSuspended)

  return {
    isSuspended: effectiveSuspended,
    suspendedBy: effectiveSuspended ? localUser?.suspendedBy || null : null,
    suspendedAt:
      effectiveSuspended
        ? (fromWordPress ? parseSuspendedAt(user.suspended_at) || localUser?.suspendedAt || null : localUser?.suspendedAt || null)
        : null,
    suspensionReason:
      effectiveSuspended
        ? (fromWordPress ? user.suspension_reason || localUser?.suspensionReason || null : localUser?.suspensionReason || null)
        : null,
  }
}
