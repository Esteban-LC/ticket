import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getWorkspaceUser,
  updateWorkspaceUser,
  deleteWorkspaceUser,
  suspendWorkspaceUser,
} from '@/lib/google-admin'
import { logAdminAction } from '@/lib/admin-log'

export async function GET(
  request: NextRequest,
  { params }: { params: { userKey: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const user = await getWorkspaceUser(params.userKey)
    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error getting workspace user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userKey: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { action, ...updateData } = body

    let user

    if (action === 'suspend') {
      user = await suspendWorkspaceUser(params.userKey, true)
      await logAdminAction({
        action: 'SUSPEND_USER',
        adminId: session.user.id,
        adminEmail: session.user.email!,
        targetEmail: params.userKey,
      })
    } else if (action === 'unsuspend') {
      user = await suspendWorkspaceUser(params.userKey, false)
      await logAdminAction({
        action: 'UNSUSPEND_USER',
        adminId: session.user.id,
        adminEmail: session.user.email!,
        targetEmail: params.userKey,
      })
    } else {
      const updatePayload: any = {}

      if (updateData.givenName || updateData.familyName) {
        updatePayload.name = {}
        if (updateData.givenName) updatePayload.name.givenName = updateData.givenName
        if (updateData.familyName) updatePayload.name.familyName = updateData.familyName
      }
      if (updateData.orgUnitPath) updatePayload.orgUnitPath = updateData.orgUnitPath
      if (updateData.password) {
        updatePayload.password = updateData.password
        updatePayload.changePasswordAtNextLogin = updateData.changePasswordAtNextLogin ?? true
      }
      if (typeof updateData.suspended === 'boolean') {
        updatePayload.suspended = updateData.suspended
      }

      user = await updateWorkspaceUser(params.userKey, updatePayload)

      // Log sin incluir la contraseña en los detalles
      const logDetails: Record<string, any> = { ...updatePayload }
      if (logDetails.password) logDetails.password = '***'
      await logAdminAction({
        action: 'UPDATE_USER',
        adminId: session.user.id,
        adminEmail: session.user.email!,
        targetEmail: params.userKey,
        targetName: updateData.givenName && updateData.familyName
          ? `${updateData.givenName} ${updateData.familyName}`
          : undefined,
        details: logDetails,
      })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error updating workspace user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userKey: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await deleteWorkspaceUser(params.userKey)

    await logAdminAction({
      action: 'DELETE_USER',
      adminId: session.user.id,
      adminEmail: session.user.email!,
      targetEmail: params.userKey,
    })

    return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' })
  } catch (error: any) {
    console.error('Error deleting workspace user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
