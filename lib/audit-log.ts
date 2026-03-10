import { prisma } from '@/lib/prisma'

type AuditEntity =
  | 'TUITION_FOLLOW_UP'
  | 'WORDPRESS_ORDER'
  | 'WORDPRESS_PAYMENT_STATUS'
  | 'WORDPRESS_USER'
  | 'WORDPRESS_ENROLLMENT'

interface LogEntityAuditParams {
  adminId: string
  adminEmail: string
  targetEmail: string
  targetName?: string | null
  entity: AuditEntity
  entityId: string
  event: string
  details?: Record<string, unknown>
}

export interface EntityAuditEntry {
  id: string
  event: string
  actorEmail: string
  createdAt: string
  details: Record<string, unknown>
}

export async function getSessionAuditActor(session: any) {
  const sessionUserId =
    session?.user && typeof session.user.id === 'string' && session.user.id.trim().length > 0
      ? session.user.id
      : null
  const sessionUserEmail =
    session?.user && typeof session.user.email === 'string' && session.user.email.trim().length > 0
      ? session.user.email
      : null

  if (sessionUserId && sessionUserEmail) {
    return {
      id: sessionUserId,
      email: sessionUserEmail,
    }
  }

  if (!sessionUserEmail) {
    return null
  }

  const currentUser = await prisma.user.findFirst({
    where: { email: sessionUserEmail, deletedAt: null },
    select: { id: true, email: true },
  })

  if (!currentUser) {
    return null
  }

  return currentUser
}

export async function logEntityAudit(params: LogEntityAuditParams) {
  try {
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE_USER',
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        targetEmail: params.targetEmail,
        targetName: params.targetName || null,
        details: {
          entity: params.entity,
          entityId: params.entityId,
          event: params.event,
          ...(params.details || {}),
        },
      },
    })
  } catch (error) {
    console.error('[AuditLog] Error al registrar evento:', error)
  }
}

export async function getEntityAuditTrailMap(entity: AuditEntity, entityIds: string[]) {
  if (entityIds.length === 0) {
    return new Map<string, EntityAuditEntry[]>()
  }

  const uniqueIds = Array.from(new Set(entityIds))
  const logs = await prisma.adminLog.findMany({
    where: {
      action: 'UPDATE_USER',
      details: {
        path: ['entity'],
        equals: entity,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  const trailMap = new Map<string, EntityAuditEntry[]>()

  for (const log of logs) {
    const details =
      log.details && typeof log.details === 'object' && !Array.isArray(log.details)
        ? (log.details as Record<string, unknown>)
        : {}
    const entityId = typeof details.entityId === 'string' ? details.entityId : ''
    if (!entityId || !uniqueIds.includes(entityId)) {
      continue
    }

    const entry: EntityAuditEntry = {
      id: log.id,
      event: typeof details.event === 'string' ? details.event : 'updated',
      actorEmail: log.adminEmail,
      createdAt: log.createdAt.toISOString(),
      details,
    }

    const current = trailMap.get(entityId) || []
    current.push(entry)
    trailMap.set(entityId, current)
  }

  return trailMap
}

export async function getRecentEntityAuditEntries(entity: AuditEntity, take = 20) {
  const logs = await prisma.adminLog.findMany({
    where: {
      action: 'UPDATE_USER',
      details: {
        path: ['entity'],
        equals: entity,
      },
    },
    orderBy: { createdAt: 'desc' },
    take,
  })

  return logs.map((log) => {
    const details =
      log.details && typeof log.details === 'object' && !Array.isArray(log.details)
        ? (log.details as Record<string, unknown>)
        : {}

    return {
      id: log.id,
      entityId: typeof details.entityId === 'string' ? details.entityId : '',
      event: typeof details.event === 'string' ? details.event : 'updated',
      actorEmail: log.adminEmail,
      createdAt: log.createdAt.toISOString(),
      targetEmail: log.targetEmail,
      targetName: log.targetName,
      details,
    }
  })
}
