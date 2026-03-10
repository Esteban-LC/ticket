import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRecentEntityAuditEntries } from '@/lib/audit-log'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userPermissions = (session.user as any).permissions || []
    if (
      !userPermissions.includes('wordpress:manage_enrollments') &&
      !userPermissions.includes('wordpress:manage_users') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const take = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('take') || '20')))
    const entries = await getRecentEntityAuditEntries('WORDPRESS_ENROLLMENT', take)

    return NextResponse.json({ entries })
  } catch (error: any) {
    console.error('Error fetching enrollment history:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener historial de enrolamiento' },
      { status: 500 }
    )
  }
}
