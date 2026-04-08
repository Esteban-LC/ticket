import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wpUserService } from '@/lib/wordpress/users'
import { canManageTuitionStatus, canViewWordPressUsers } from '@/lib/permissions'

/**
 * GET /api/wordpress/users/stats
 * Obtener estadísticas agregadas: total de usuarios, conteo por rol y suspendidos.
 *
 * - Total y roles: vienen del WP REST API (X-WP-Total) — siempre confiable.
 * - Suspendidos: vienen del endpoint PHP /custom/v1/users/stats.
 *   Si el PHP falla, se retorna 0 para no romper el dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userPermissions = (session.user as any).permissions || []
    if (
      !canViewWordPressUsers({ role: session.user.role, permissions: userPermissions }) &&
      !canManageTuitionStatus({ role: session.user.role, permissions: userPermissions })
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    // Intentar el endpoint PHP primero: tiene acceso directo a la BD y devuelve
    // el total real de todos los usuarios (no solo los del sitio actual).
    // X-WP-Total del WP REST API puede devolver solo usuarios del sitio en multisite.
    try {
      const phpStats = await wpUserService.getUsersStats()
      if (typeof phpStats.total === 'number') {
        return NextResponse.json({
          total: phpStats.total,
          roles: {
            administrator: phpStats.roles?.administrator || 0,
            tutor_instructor: phpStats.roles?.tutor_instructor || 0,
            subscriber: phpStats.roles?.subscriber || 0,
          },
          suspended: phpStats.suspended ?? 0,
        })
      }
    } catch (e) {
      console.error('[stats] PHP endpoint falló, usando WP REST API como fallback:', e)
    }

    // Fallback: WP REST API (puede sub-contar usuarios en configuraciones multisite)
    const [total, adminCount, instructorCount, subscriberCount] = await Promise.all([
      wpUserService.getUsersCount(),
      wpUserService.getUsersCount({ roles: ['administrator'] }),
      wpUserService.getUsersCount({ roles: ['tutor_instructor'] }),
      wpUserService.getUsersCount({ roles: ['subscriber'] }),
    ])

    return NextResponse.json({
      total,
      roles: {
        administrator: adminCount,
        tutor_instructor: instructorCount,
        subscriber: subscriberCount,
      },
      suspended: 0,
    })
  } catch (error: any) {
    console.error('Error fetching WordPress users stats:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
