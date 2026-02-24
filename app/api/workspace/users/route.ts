import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listWorkspaceUsers, createWorkspaceUser } from '@/lib/google-admin'
import { logAdminAction } from '@/lib/admin-log'
import { wpUserService } from '@/lib/wordpress/users'
import { prisma } from '@/lib/prisma'

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

    const shouldAggregateAllPages = !pageToken
    let workspaceUsers: any[] = []
    let nextPageToken: string | undefined = pageToken || undefined
    let pagesFetched = 0
    const maxPagesToFetch = 50

    if (shouldAggregateAllPages) {
      do {
        const pageResult = await listWorkspaceUsers({
          query,
          orgUnitPath,
          maxResults,
          pageToken: nextPageToken,
        })

        workspaceUsers.push(...(pageResult.users || []))
        nextPageToken = pageResult.nextPageToken || undefined
        pagesFetched++
      } while (nextPageToken && pagesFetched < maxPagesToFetch)
    } else {
      const pageResult = await listWorkspaceUsers({
        query,
        orgUnitPath,
        maxResults,
        pageToken: nextPageToken,
      })
      workspaceUsers = pageResult.users || []
      nextPageToken = pageResult.nextPageToken || undefined
    }
    const emails = workspaceUsers
      .map((user: any) => String(user?.primaryEmail || '').trim())
      .filter(Boolean)

    let wpUsers: Array<{
      id: number
      email: string
      isSuspended: boolean
      suspendedAt: Date | null
      suspensionReason: string | null
    }> = []

    if (emails.length > 0) {
      wpUsers = await prisma.wordPressUser.findMany({
        where: {
          deletedAt: null,
          OR: emails.map((email) => ({
            email: {
              equals: email,
              mode: 'insensitive',
            },
          })),
        },
        select: {
          id: true,
          email: true,
          isSuspended: true,
          suspendedAt: true,
          suspensionReason: true,
        },
      })
    }

    const wpUsersByEmail = new Map(
      wpUsers.map((wpUser) => [wpUser.email.toLowerCase(), wpUser])
    )

    const usersWithWordPressStatus = workspaceUsers.map((user: any) => {
      const wpUser = wpUsersByEmail.get(String(user.primaryEmail || '').toLowerCase())
      return {
        ...user,
        wordPressUserId: wpUser?.id || null,
        hasWordPressUser: Boolean(wpUser),
        wordPressSuspended: wpUser?.isSuspended || false,
        wordPressSuspendedAt: wpUser?.suspendedAt || null,
        wordPressSuspensionReason: wpUser?.suspensionReason || null,
      }
    })

    return NextResponse.json({
      users: usersWithWordPressStatus,
      nextPageToken,
      totalUsers: usersWithWordPressStatus.length,
      aggregated: shouldAggregateAllPages,
    })
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
    const {
      primaryEmail,
      givenName,
      familyName,
      password,
      orgUnitPath,
      createWordPressUser,
      wordPressRole,
      wordPressUsername,
    } = body
    const changePasswordAtNextLogin = false

    if (!primaryEmail || !givenName || !familyName || !password) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: primaryEmail, givenName, familyName, password' },
        { status: 400 }
      )
    }

    const normalizedWordPressUsername =
      typeof wordPressUsername === 'string'
        ? wordPressUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
        : ''

    if (createWordPressUser && !normalizedWordPressUsername) {
      return NextResponse.json(
        { error: 'El usuario de WordPress es obligatorio cuando activas "Crear en Usuarios WP"' },
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

    const wordPressUserResult: {
      attempted: boolean
      created: boolean
      message: string
      user_id?: number
      username?: string
      role?: string
      code?: string | null
      status?: number
    } = {
      attempted: Boolean(createWordPressUser),
      created: false,
      message: '',
    }

    if (createWordPressUser) {
      const role = typeof wordPressRole === 'string' && wordPressRole ? wordPressRole : 'subscriber'
      const username = normalizedWordPressUsername

      try {
        const batchResult = await wpUserService.createUsersBatch([
          {
            username,
            email: primaryEmail,
            password,
            first_name: givenName,
            last_name: familyName,
            role,
          },
        ])

        const item = batchResult?.results?.[0]
        if (item?.success) {
          wordPressUserResult.created = true
          wordPressUserResult.message = item.message || 'Usuario de WordPress creado'
          wordPressUserResult.user_id = item.user_id
          wordPressUserResult.username = item.username || username
          wordPressUserResult.role = item.role || role
          wordPressUserResult.status = item.status
        } else {
          wordPressUserResult.created = false
          wordPressUserResult.message = item?.message || 'No se pudo crear usuario en WordPress'
          wordPressUserResult.code = item?.code || null
          wordPressUserResult.status = item?.status
          wordPressUserResult.username = username
          wordPressUserResult.role = role
        }
      } catch (wpError: any) {
        console.error('Error creating WordPress user from workspace flow:', wpError)
        wordPressUserResult.created = false
        wordPressUserResult.message = wpError?.message || 'Error al crear usuario en WordPress'
        wordPressUserResult.username = username
        wordPressUserResult.role = role
      }
    }

    await logAdminAction({
      action: 'CREATE_USER',
      adminId: session.user.id,
      adminEmail: session.user.email!,
      targetEmail: primaryEmail,
      targetName: `${givenName} ${familyName}`,
      details: {
        orgUnitPath,
        changePasswordAtNextLogin,
        createWordPressUser: Boolean(createWordPressUser),
        wordPressRole: createWordPressUser
          ? (typeof wordPressRole === 'string' && wordPressRole ? wordPressRole : 'subscriber')
          : undefined,
        wordPressUsername: createWordPressUser ? normalizedWordPressUsername : undefined,
      },
    })

    return NextResponse.json(
      {
        user,
        wordPressUser: wordPressUserResult,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating workspace user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
