import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listOrgUnits, listUsersByOrgUnit } from '@/lib/google-admin'
import { prisma } from '@/lib/prisma'
import { canAccessWorkspaceOrgUnits } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, permissions: true },
    })

    if (!canAccessWorkspaceOrgUnits(currentUser)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const orgUnitPath = searchParams.get('path')

    if (orgUnitPath) {
      const users = await listUsersByOrgUnit(orgUnitPath)
      return NextResponse.json({ users })
    }

    const orgUnits = await listOrgUnits()
    return NextResponse.json({ orgUnits })
  } catch (error: any) {
    console.error('Error listing org units:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener unidades organizativas' },
      { status: 500 }
    )
  }
}
