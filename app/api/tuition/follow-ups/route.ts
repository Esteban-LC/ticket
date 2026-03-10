import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageTuitionStatus } from '@/lib/permissions'
import { getEntityAuditTrailMap, logEntityAudit } from '@/lib/audit-log'

const VALID_STATUSES = new Set(['CURRENT', 'OVERDUE', 'DROPPED'])
const VALID_SOURCE_TYPES = new Set(['WORKSPACE', 'WORDPRESS'])

type ParsedFollowUpInput = {
  sourceType: 'WORKSPACE' | 'WORDPRESS'
  sourceExternalId: string
  wordPressUserId: number | null
  studentEmail: string
  studentName: string | null
  studentUsername: string | null
  status: 'CURRENT' | 'OVERDUE' | 'DROPPED'
  notes: string | null
}

function parseFollowUpInput(body: any): { item?: ParsedFollowUpInput; error?: string } {
  const rawWordPressUserId = body?.wordPressUserId
  const wordPressUserId =
    rawWordPressUserId === null || rawWordPressUserId === undefined || rawWordPressUserId === ''
      ? null
      : Number(rawWordPressUserId)
  const sourceType = String(body?.sourceType || '').toUpperCase()
  const sourceExternalId = typeof body?.sourceExternalId === 'string' ? body.sourceExternalId.trim() : ''
  const status = String(body?.status || '').toUpperCase()
  const studentEmail = typeof body?.studentEmail === 'string' ? body.studentEmail.trim().toLowerCase() : ''
  const studentName = typeof body?.studentName === 'string' ? body.studentName.trim() : ''
  const studentUsername = typeof body?.studentUsername === 'string' ? body.studentUsername.trim() : ''
  const notes = typeof body?.notes === 'string' ? body.notes.trim() : null

  if (!VALID_SOURCE_TYPES.has(sourceType)) {
    return { error: 'Fuente invalida' }
  }

  if (!sourceExternalId) {
    return { error: 'Identificador de fuente requerido' }
  }

  if (sourceType === 'WORDPRESS' && (!Number.isInteger(wordPressUserId) || Number(wordPressUserId) <= 0)) {
    return { error: 'Usuario de WordPress invalido' }
  }

  if (!VALID_STATUSES.has(status)) {
    return { error: 'Estado invalido' }
  }

  if (!studentEmail) {
    return { error: 'Correo requerido' }
  }

  return {
    item: {
      sourceType: sourceType as 'WORKSPACE' | 'WORDPRESS',
      sourceExternalId,
      wordPressUserId,
      studentEmail,
      studentName: studentName || null,
      studentUsername: studentUsername || null,
      status: status as 'CURRENT' | 'OVERDUE' | 'DROPPED',
      notes,
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const currentUser = await prisma.user.findFirst({
      where: { email: session.user.email, deletedAt: null },
      select: { id: true, email: true, role: true, permissions: true },
    })

    if (!canManageTuitionStatus(currentUser)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') === 'completed' ? 'completed' : 'pending'
    const status = searchParams.get('status') || 'all'
    const search = (searchParams.get('search') || '').trim()

    const items = await prisma.tuitionFollowUp.findMany({
      where: {
        deletedAt: null,
        completedAt: section === 'completed' ? { not: null } : null,
        ...(status !== 'all' && VALID_STATUSES.has(status)
          ? { status: status as 'CURRENT' | 'OVERDUE' | 'DROPPED' }
          : {}),
        ...(search
          ? {
              OR: [
                { studentEmail: { contains: search, mode: 'insensitive' } },
                { studentName: { contains: search, mode: 'insensitive' } },
                { studentUsername: { contains: search, mode: 'insensitive' } },
                { createdByEmail: { contains: search, mode: 'insensitive' } },
                { completedByEmail: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [
        { completedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    const auditTrailMap = await getEntityAuditTrailMap(
      'TUITION_FOLLOW_UP',
      items.map((item) => item.id)
    )

    const summary = await prisma.tuitionFollowUp.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
        completedAt: null,
      },
      _count: { _all: true },
    })

    const completedCount = await prisma.tuitionFollowUp.count({
      where: {
        deletedAt: null,
        completedAt: { not: null },
      },
    })

    const counts = {
      pending: 0,
      completed: completedCount,
      CURRENT: 0,
      OVERDUE: 0,
      DROPPED: 0,
    }

    summary.forEach((entry) => {
      counts.pending += entry._count._all
      counts[entry.status] = entry._count._all
    })

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        history: auditTrailMap.get(item.id) || [],
      })),
      counts,
    })
  } catch (error: any) {
    console.error('Error fetching tuition follow-ups:', error)
    return NextResponse.json({ error: error.message || 'Error al obtener seguimiento' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const currentUser = await prisma.user.findFirst({
      where: { email: session.user.email, deletedAt: null },
      select: { id: true, email: true, role: true, permissions: true },
    })

    if (!canManageTuitionStatus(currentUser)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const body = await request.json()
    const items = Array.isArray(body?.items) ? body.items : null
    const createdById = currentUser?.id || null
    const createdByEmail = currentUser?.email || session.user.email || null

    if (items) {
      if (items.length === 0) {
        return NextResponse.json({ error: 'Debes enviar al menos un usuario' }, { status: 400 })
      }

      const parsedItems: ParsedFollowUpInput[] = []
      for (const rawItem of items) {
        const parsed = parseFollowUpInput(rawItem)
        if (parsed.error || !parsed.item) {
          return NextResponse.json({ error: parsed.error || 'Datos invalidos en lote' }, { status: 400 })
        }
        parsedItems.push(parsed.item)
      }

      const createdAt = new Date()
      await prisma.tuitionFollowUp.createMany({
        data: parsedItems.map((item) => ({
          sourceType: item.sourceType,
          sourceExternalId: item.sourceExternalId,
          wordPressUserId: item.wordPressUserId,
          studentEmail: item.studentEmail,
          studentName: item.studentName,
          studentUsername: item.studentUsername,
          status: item.status,
          notes: item.notes,
          createdById,
          createdByEmail,
          createdAt,
        })),
      })

      const createdRecords = await prisma.tuitionFollowUp.findMany({
        where: {
          deletedAt: null,
          createdAt,
          createdById,
          studentEmail: { in: parsedItems.map((item) => item.studentEmail) },
        },
        select: {
          id: true,
          studentEmail: true,
          studentName: true,
          status: true,
          sourceType: true,
          sourceExternalId: true,
        },
      })

      if (createdById && createdByEmail) {
        await Promise.all(
          createdRecords.map((record) =>
            logEntityAudit({
              adminId: createdById,
              adminEmail: createdByEmail,
              targetEmail: record.studentEmail,
              targetName: record.studentName,
              entity: 'TUITION_FOLLOW_UP',
              entityId: record.id,
              event: 'created',
              details: {
                status: record.status,
                sourceType: record.sourceType,
                sourceExternalId: record.sourceExternalId,
                mode: 'bulk',
              },
            })
          )
        )
      }

      return NextResponse.json({ success: true, created: parsedItems.length }, { status: 201 })
    }

    const parsed = parseFollowUpInput(body)
    if (parsed.error || !parsed.item) {
      return NextResponse.json({ error: parsed.error || 'Datos invalidos' }, { status: 400 })
    }

    const itemInput = parsed.item
    const item = await prisma.tuitionFollowUp.create({
      data: {
        sourceType: itemInput.sourceType,
        sourceExternalId: itemInput.sourceExternalId,
        ...(itemInput.wordPressUserId !== null ? { wordPressUserId: itemInput.wordPressUserId } : {}),
        studentEmail: itemInput.studentEmail,
        studentName: itemInput.studentName,
        studentUsername: itemInput.studentUsername,
        status: itemInput.status,
        notes: itemInput.notes,
        createdById,
        createdByEmail,
      },
    })

    if (createdById && createdByEmail) {
      await logEntityAudit({
        adminId: createdById,
        adminEmail: createdByEmail,
        targetEmail: item.studentEmail,
        targetName: item.studentName,
        entity: 'TUITION_FOLLOW_UP',
        entityId: item.id,
        event: 'created',
        details: {
          status: item.status,
          sourceType: item.sourceType,
          sourceExternalId: item.sourceExternalId,
          mode: 'single',
        },
      })
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating tuition follow-up:', error)
    return NextResponse.json({ error: error.message || 'Error al crear seguimiento' }, { status: 500 })
  }
}
