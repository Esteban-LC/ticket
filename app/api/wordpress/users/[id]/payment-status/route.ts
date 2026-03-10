import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageTuitionStatus } from '@/lib/permissions'
import { logEntityAudit } from '@/lib/audit-log'

const VALID_STATUSES = new Set(['CURRENT', 'OVERDUE', 'DROPPED'])

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = Number(params.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    const body = await request.json()
    const paymentStatus = String(body?.paymentStatus || '').toUpperCase()
    const paymentNotes = typeof body?.paymentNotes === 'string' ? body.paymentNotes.trim() : null
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const username = typeof body?.username === 'string' ? body.username.trim() : ''

    if (!VALID_STATUSES.has(paymentStatus)) {
      return NextResponse.json({ error: 'Estado de pago invalido' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email requerido para registrar estado de pago' }, { status: 400 })
    }

    const previous = await prisma.wordPressUser.findUnique({
      where: { id: userId },
      select: {
        paymentStatus: true,
        paymentNotes: true,
      },
    })

    const updated = await prisma.wordPressUser.upsert({
      where: { id: userId },
      update: {
        email,
        name: name || null,
        username: username || null,
        paymentStatus: paymentStatus as 'CURRENT' | 'OVERDUE' | 'DROPPED',
        paymentNotes,
        paymentUpdatedAt: new Date(),
        paymentUpdatedBy: currentUser?.email || session.user.email || null,
        deletedAt: null,
      },
      create: {
        id: userId,
        email,
        name: name || null,
        username: username || null,
        paymentStatus: paymentStatus as 'CURRENT' | 'OVERDUE' | 'DROPPED',
        paymentNotes,
        paymentUpdatedAt: new Date(),
        paymentUpdatedBy: currentUser?.email || session.user.email || null,
      },
      select: {
        id: true,
        email: true,
        paymentStatus: true,
        paymentNotes: true,
        paymentUpdatedAt: true,
        paymentUpdatedBy: true,
      },
    })

    if (currentUser?.id && currentUser.email) {
      await logEntityAudit({
        adminId: currentUser.id,
        adminEmail: currentUser.email,
        targetEmail: email,
        targetName: name || username || null,
        entity: 'WORDPRESS_PAYMENT_STATUS',
        entityId: String(userId),
        event: 'payment_status_updated',
        details: {
          previousStatus: previous?.paymentStatus || null,
          newStatus: updated.paymentStatus,
          previousNotes: previous?.paymentNotes || null,
          newNotes: updated.paymentNotes,
        },
      })
    }

    return NextResponse.json({ user: updated })
  } catch (error: any) {
    console.error('Error updating payment status:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar estado de pago' },
      { status: 500 }
    )
  }
}
