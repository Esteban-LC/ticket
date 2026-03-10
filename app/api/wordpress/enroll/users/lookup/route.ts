import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wpUserService } from '@/lib/wordpress/users'
import { prisma } from '@/lib/prisma'
import { getEffectiveSuspensionState, syncWordPressSuspensionState } from '@/lib/wordpress/suspension-sync'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const userPermissions = (session.user as any).permissions || []
    if (
      !userPermissions.includes('wordpress:manage_enrollments') &&
      !userPermissions.includes('wordpress:manage_users') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const body = await request.json()
    if (!Array.isArray(body.emails) || body.emails.length === 0) {
      return NextResponse.json({ error: 'emails debe ser un array no vacío' }, { status: 400 })
    }

    const emails: string[] = [
      ...new Set(
        body.emails
          .map((e: unknown) => String(e).trim().toLowerCase())
          .filter((e: string) => e.includes('@'))
      ),
    ].slice(0, 200)

    // Parallel lookup in batches of 10
    const BATCH = 10
    const rawResults: { email: string; found: boolean; user?: { id: number; name: string; email: string; username: string; is_suspended?: boolean; suspension_reason?: string | null; suspended_at?: string | null } }[] = []

    for (let i = 0; i < emails.length; i += BATCH) {
      const batch = emails.slice(i, i + BATCH)
      const batchResults = await Promise.all(
        batch.map(async (email) => {
          try {
            const users = await wpUserService.getUsers({ search: email, per_page: 5 })
            const match = users.find((u) => u.email.toLowerCase() === email)
            if (match) {
              const suspensionStatus = await wpUserService.getSuspensionStatus(match.id).catch(() => null)
              return {
                email,
                found: true,
                user: {
                  id: match.id,
                  name: match.name || match.username,
                  email: match.email,
                  username: match.username,
                  is_suspended: suspensionStatus?.suspended ?? match.is_suspended,
                  suspension_reason: suspensionStatus?.reason ?? match.suspension_reason,
                  suspended_at: suspensionStatus?.suspended_at ?? match.suspended_at,
                },
              }
            }
            return { email, found: false }
          } catch {
            return { email, found: false }
          }
        })
      )
      rawResults.push(...batchResults)
    }

    // Enrich with suspension status from local DB
    const foundUsers = rawResults.filter((r) => r.found && r.user).map((r) => r.user!)
    await syncWordPressSuspensionState(foundUsers)
    const foundIds = foundUsers.map((user) => user.id)
    const suspendedMap = new Map<number, { isSuspended: boolean; suspendedAt: Date | null; suspensionReason: string | null }>()
    if (foundIds.length > 0) {
      const dbUsers = await prisma.wordPressUser.findMany({
        where: { id: { in: foundIds }, deletedAt: null },
        select: { id: true, isSuspended: true, suspendedAt: true, suspensionReason: true },
      })
      dbUsers.forEach((u) =>
        suspendedMap.set(u.id, {
          isSuspended: u.isSuspended,
          suspendedAt: u.suspendedAt,
          suspensionReason: u.suspensionReason,
        })
      )
    }

    const results = rawResults.map((r) => ({
      ...r,
      user: r.user
        ? {
            ...r.user,
            ...getEffectiveSuspensionState(r.user, suspendedMap.get(r.user.id)),
          }
        : undefined,
    }))

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('Error in user lookup:', error)
    return NextResponse.json({ error: error.message || 'Error en búsqueda' }, { status: 500 })
  }
}
