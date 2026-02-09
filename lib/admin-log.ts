import { prisma } from '@/lib/prisma'

type AdminActionType = 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'SUSPEND_USER' | 'UNSUSPEND_USER'

interface LogParams {
  action: AdminActionType
  adminId: string
  adminEmail: string
  targetEmail: string
  targetName?: string
  details?: Record<string, any>
}

export async function logAdminAction(params: LogParams) {
  try {
    await prisma.adminLog.create({
      data: {
        action: params.action,
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        targetEmail: params.targetEmail,
        targetName: params.targetName || null,
        details: params.details || undefined,
      },
    })
  } catch (error) {
    // Log pero no lanzar error — un fallo de audit no debe bloquear la acción del admin
    console.error('[AdminLog] Error al registrar acción:', error)
  }
}
