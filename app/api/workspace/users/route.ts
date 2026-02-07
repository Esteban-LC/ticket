import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listWorkspaceUsers, createWorkspaceUser } from '@/lib/google-admin'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || undefined
    const orgUnitPath = searchParams.get('orgUnitPath') || undefined
    const pageToken = searchParams.get('pageToken') || undefined
    const maxResults = parseInt(searchParams.get('maxResults') || '100')

    const result = await listWorkspaceUsers({
      query,
      orgUnitPath,
      maxResults,
      pageToken,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error listing workspace users:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener usuarios de Workspace' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { primaryEmail, givenName, familyName, password, orgUnitPath, changePasswordAtNextLogin } = body

    if (!primaryEmail || !givenName || !familyName || !password) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: primaryEmail, givenName, familyName, password' },
        { status: 400 }
      )
    }

    const user = await createWorkspaceUser({
      primaryEmail,
      name: { givenName, familyName },
      password,
      orgUnitPath,
      changePasswordAtNextLogin,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('Error creating workspace user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
