import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageTuitionStatus } from '@/lib/permissions'
import { getWorkspaceUser, listWorkspaceUsers } from '@/lib/google-admin'
import { wpUserService } from '@/lib/wordpress/users'

type SourceItem = {
  sourceType: 'WORKSPACE' | 'WORDPRESS'
  sourceExternalId: string
  wordPressUserId: number | null
  email: string
  name: string
  username: string
  roles: string[]
  inWorkspace: boolean
  inWordPress: boolean
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${label} tardó demasiado`)), ms)
    promise
      .then((result) => {
        clearTimeout(timeout)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeout)
        reject(error)
      })
  })
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
    const search = (searchParams.get('search') || '').trim()
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const perPage = Math.max(10, Math.min(100, Number(searchParams.get('per_page') || '10')))
    const fetchLimit = Math.max(page * perPage, search ? 50 : 30)
    const normalizedSearch = search.toLowerCase()

    const [workspaceResult, wordpressUsers] = await Promise.allSettled([
      withTimeout(listWorkspaceUsers({ maxResults: search ? Math.max(100, fetchLimit) : fetchLimit }), 8000, 'Workspace'),
      withTimeout(
        wpUserService.getUsers({ page: 1, per_page: fetchLimit, search: search || undefined }),
        8000,
        'Usuarios WP'
      ),
    ])

    const warnings: string[] = []
    const workspaceUsers =
      workspaceResult.status === 'fulfilled'
        ? workspaceResult.value.users || []
        : []
    const wpUsers =
      wordpressUsers.status === 'fulfilled'
        ? wordpressUsers.value || []
        : []

    if (workspaceResult.status === 'rejected') {
      console.error('Error fetching workspace users for tuition sources:', workspaceResult.reason)
      warnings.push('No se pudieron cargar usuarios de Workspace')
    }

    if (wordpressUsers.status === 'rejected') {
      console.error('Error fetching wordpress users for tuition sources:', wordpressUsers.reason)
      warnings.push('No se pudieron cargar usuarios de Usuarios WP')
    }

    const merged = new Map<string, SourceItem>()

    for (const workspaceUser of workspaceUsers) {
      const email = String(workspaceUser?.primaryEmail || '').trim().toLowerCase()
      if (!email) continue

      const fullName = String(workspaceUser?.name?.fullName || workspaceUser?.primaryEmail || '').trim()
      const username = String(workspaceUser?.primaryEmail || '').split('@')[0] || ''
      const workspaceMatch =
        !normalizedSearch ||
        fullName.toLowerCase().includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        username.toLowerCase().includes(normalizedSearch)

      if (!workspaceMatch) continue

      merged.set(email, {
        sourceType: 'WORKSPACE',
        sourceExternalId: email,
        wordPressUserId: null,
        email,
        name: fullName,
        username,
        roles: ['workspace'],
        inWorkspace: true,
        inWordPress: false,
      })
    }

    for (const wpUser of wpUsers) {
      const email = String(wpUser?.email || '').trim().toLowerCase()
      if (!email) continue

      const existing = merged.get(email)
      if (existing) {
        merged.set(email, {
          ...existing,
          wordPressUserId: wpUser.id,
          roles: Array.isArray(wpUser.roles) ? wpUser.roles : existing.roles,
          inWordPress: true,
        })
        continue
      }

      merged.set(email, {
        sourceType: 'WORDPRESS',
        sourceExternalId: String(wpUser.id),
        wordPressUserId: wpUser.id,
        email,
        name: String(wpUser?.name || wpUser?.username || email).trim(),
        username: String(wpUser?.username || '').trim(),
        roles: Array.isArray(wpUser.roles) ? wpUser.roles : [],
        inWorkspace: false,
        inWordPress: true,
      })
    }

    // Verificar por correo directo contra Google para usuarios WP visibles.
    // Esto corrige casos donde el listado parcial de Workspace no incluia al usuario
    // aunque si existiera en Google Workspace.
    const wordpressOnlyItems = Array.from(merged.values()).filter((item) => item.inWordPress && !item.inWorkspace)
    const workspaceChecks = await Promise.allSettled(
      wordpressOnlyItems.map(async (item) => {
        const workspaceUser = await withTimeout(getWorkspaceUser(item.email), 5000, `Workspace ${item.email}`)
        return { item, workspaceUser }
      })
    )

    for (const result of workspaceChecks) {
      if (result.status !== 'fulfilled') {
        continue
      }

      const email = result.value.item.email
      const workspaceUser = result.value.workspaceUser
      const existing = merged.get(email)

      if (!existing) {
        continue
      }

      merged.set(email, {
        ...existing,
        sourceType: 'WORKSPACE',
        sourceExternalId: email,
        name: String(workspaceUser?.name?.fullName || existing.name || email).trim(),
        username: String(workspaceUser?.primaryEmail || email).split('@')[0] || existing.username,
        inWorkspace: true,
      })
    }

    const sortedUsers = Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
    const start = (page - 1) * perPage
    const users = sortedUsers.slice(start, start + perPage)

    return NextResponse.json({
      users,
      total: merged.size,
      page,
      perPage,
      hasMore: start + perPage < merged.size,
      warnings,
    })
  } catch (error: any) {
    console.error('Error fetching tuition sources:', error)
    return NextResponse.json({ error: error.message || 'Error al obtener usuarios para cobranza' }, { status: 500 })
  }
}
