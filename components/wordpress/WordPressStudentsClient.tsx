'use client'

import { useState, useEffect } from 'react'
import { Search, Users, GraduationCap, Building2, ChevronRight, UserX, CheckCircle2, AlertTriangle } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import EntityHistoryPanel, { EntityHistoryRow } from '@/components/shared/EntityHistoryPanel'

interface WordPressUser {
  id: number
  username: string
  name: string
  email: string
  roles: string[]
  isSuspended?: boolean
  createdByName?: string | null
  suspendedByName?: string | null
}

interface WordPressUserAction {
  id: string
  entityId: string
  event: string
  actorEmail: string
  createdAt: string
  targetEmail: string
  targetName: string | null
}

interface WordPressStudentsClientProps {
  userRole: string
  userPermissions: string[]
}

interface RoleStats {
  all: number
  administrator: number
  subscriber: number
  tutor_instructor: number
  suspended: number
}

type SummaryCardFilter =
  | { role: 'all' | 'administrator' | 'subscriber' | 'tutor_instructor'; status: 'all' | 'active' | 'suspended' }

type UserMode = 'normal' | 'bulk'
type CreateBulkMode = 'actions' | 'create'
type StudentsTab = 'users' | 'history'

interface PendingCreateUser {
  username: string
  email: string
  role: string
  first_name: string
  last_name: string
  password?: string
}

const FILTER_STORAGE_KEY = 'wordpress-students-filters'

const parseRoleFilter = (value: string | null) =>
  value === 'administrator' || value === 'subscriber' || value === 'tutor_instructor' ? value : 'all'

const parseStatusFilter = (value: string | null): 'all' | 'active' | 'suspended' =>
  value === 'active' || value === 'suspended' ? value : 'all'

const parseTab = (value: string | null): StudentsTab =>
  value === 'history' ? 'history' : 'users'

const parseMode = (value: string | null): UserMode =>
  value === 'bulk' ? 'bulk' : 'normal'

const parsePage = (value: string | null) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

const readInitialFilters = () => {
  if (typeof window === 'undefined') {
    return {
      search: '',
      roleFilter: 'all',
      statusFilter: 'all' as const,
      page: 1,
      activeTab: 'users' as StudentsTab,
      mode: 'normal' as UserMode,
    }
  }

  const params = new URLSearchParams(window.location.search)
  const storedRaw = window.sessionStorage.getItem(FILTER_STORAGE_KEY)
  let stored: Partial<{
    search: string
    roleFilter: string
    statusFilter: string
    page: number
    activeTab: string
    mode: string
  }> = {}

  if (storedRaw) {
    try {
      stored = JSON.parse(storedRaw) as typeof stored
    } catch {
      window.sessionStorage.removeItem(FILTER_STORAGE_KEY)
    }
  }

  const search = (params.get('search') ?? stored.search ?? '').trim()

  return {
    search,
    roleFilter: parseRoleFilter(params.get('role') ?? stored.roleFilter ?? null),
    statusFilter: parseStatusFilter(params.get('status') ?? stored.statusFilter ?? null),
    page: parsePage(params.get('page') ?? String(stored.page ?? 1)),
    activeTab: parseTab(params.get('tab') ?? stored.activeTab ?? null),
    mode: parseMode(params.get('mode') ?? stored.mode ?? null),
  }
}

export default function WordPressStudentsClient({ userRole, userPermissions }: WordPressStudentsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [students, setStudents] = useState<WordPressUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersReady, setFiltersReady] = useState(false)
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [page, setPage] = useState(1)
  const [roleStats, setRoleStats] = useState<RoleStats>({
    all: 0, administrator: 0, subscriber: 0, tutor_instructor: 0, suspended: 0,
  })
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [bulkReason, setBulkReason] = useState('')
  const [bulkReassign, setBulkReassign] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkMessage, setBulkMessage] = useState<string | null>(null)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [mode, setMode] = useState<UserMode>('normal')
  const [bulkTab, setBulkTab] = useState<CreateBulkMode>('actions')
  const [pendingUsers, setPendingUsers] = useState<PendingCreateUser[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('subscriber')
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [singleUsername, setSingleUsername] = useState('')
  const [singleEmail, setSingleEmail] = useState('')
  const [singleRole, setSingleRole] = useState('subscriber')
  const [singleFirstName, setSingleFirstName] = useState('')
  const [singleLastName, setSingleLastName] = useState('')
  const [singlePassword, setSinglePassword] = useState('')
  const [singleLoading, setSingleLoading] = useState(false)
  const [singleMessage, setSingleMessage] = useState<string | null>(null)
  const [singleError, setSingleError] = useState<string | null>(null)
  const [recentActions, setRecentActions] = useState<WordPressUserAction[]>([])
  const [activeTab, setActiveTab] = useState<StudentsTab>('users')
  const perPage = 20

  const canManageUsers = userRole === 'ADMIN' || userPermissions.includes('wordpress:manage_users')

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const initialFilters = readInitialFilters()

    setSearch(initialFilters.search)
    setSearchTerm(initialFilters.search)
    setRoleFilter(initialFilters.roleFilter)
    setStatusFilter(initialFilters.statusFilter)
    setPage(initialFilters.page)
    setActiveTab(initialFilters.activeTab)
    setMode(initialFilters.mode)
    setFiltersReady(true)
  }, [])

  useEffect(() => { fetchAllStudents() }, [])
  useEffect(() => {
    if (!filtersReady) return
    fetchStudents()
  }, [filtersReady, page, roleFilter, searchTerm, statusFilter])
  useEffect(() => {
    if (!filtersReady) return
    setPage(1)
  }, [filtersReady, searchTerm, roleFilter, statusFilter])
  useEffect(() => {
    if (!filtersReady || typeof window === 'undefined') return

    const params = new URLSearchParams(searchParams.toString())

    if (search.trim()) params.set('search', search.trim())
    else params.delete('search')

    if (roleFilter !== 'all') params.set('role', roleFilter)
    else params.delete('role')

    if (statusFilter !== 'all') params.set('status', statusFilter)
    else params.delete('status')

    if (page > 1) params.set('page', String(page))
    else params.delete('page')

    if (activeTab !== 'users') params.set('tab', activeTab)
    else params.delete('tab')

    if (mode !== 'normal') params.set('mode', mode)
    else params.delete('mode')

    const nextQuery = params.toString()
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname
    const currentUrl = `${pathname}${window.location.search}`

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false })
    }

    window.sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
      search: search.trim(),
      roleFilter,
      statusFilter,
      page,
      activeTab,
      mode,
    }))
  }, [activeTab, filtersReady, mode, page, pathname, roleFilter, router, search, searchParams, statusFilter])
  useEffect(() => {
    setSelectedUserIds([])
    setBulkMessage(null)
    setBulkError(null)
  }, [mode])
  useEffect(() => {
    if (students.length > 0 && roleStats.all === 0) {
      calculateStats(students)
    }
  }, [students, roleStats.all])

  const fetchAllStudents = async () => {
    try {
      const res = await fetch('/api/wordpress/users/stats')
      const data = await res.json()
      if (res.ok && typeof data.total === 'number') {
        setRoleStats({
          all: data.total,
          administrator: data.roles?.administrator || 0,
          subscriber: data.roles?.subscriber || 0,
          tutor_instructor: data.roles?.tutor_instructor || 0,
          suspended: data.suspended || 0,
        })
      }
    } catch {}
  }

  const calculateStats = (users: WordPressUser[]) => {
    const s: RoleStats = { all: users.length, administrator: 0, subscriber: 0, tutor_instructor: 0, suspended: 0 }
    users.forEach(u => {
      if (u.roles?.includes('administrator')) s.administrator++
      if (u.roles?.includes('subscriber')) s.subscriber++
      if (u.roles?.includes('tutor_instructor')) s.tutor_instructor++
      if (u.isSuspended) s.suspended++
    })
    setRoleStats(s)
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() })
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (statusFilter === 'suspended') params.append('status', 'suspended')
      const res = await fetch(`/api/wordpress/users?${params}`)
      const data = await res.json()
      if (res.ok) {
        setStudents(data.users || [])
        setRecentActions(data.recentActions || [])
      }
    } catch {}
    finally { setLoading(false) }
  }

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  const getActionLabel = (event: string, actorEmail: string) => {
    switch (event) {
      case 'created':
        return `Creado por ${actorEmail}`
      case 'suspended':
        return `Inhabilitado por ${actorEmail}`
      case 'unsuspended':
        return `Habilitado por ${actorEmail}`
      case 'deleted':
        return `Eliminado por ${actorEmail}`
      default:
        return `${event} por ${actorEmail}`
    }
  }

  const historyRows: EntityHistoryRow[] = recentActions.slice(0, 20).map((action) => ({
    id: action.id,
    createdAt: action.createdAt,
    actorLabel: action.actorEmail,
    actionLabel: getActionLabel(action.event, action.actorEmail),
    targetLabel: action.targetName || action.targetEmail,
    targetSubLabel: action.targetEmail,
    details:
      action.event === 'created'
        ? 'Usuario creado en WordPress.'
        : action.event === 'suspended'
          ? 'Usuario inhabilitado desde el panel.'
          : action.event === 'unsuspended'
            ? 'Usuario habilitado nuevamente.'
            : action.event === 'deleted'
              ? 'Usuario eliminado de WordPress.'
              : null,
  }))

  const filtered = students.filter(s => {
    if (statusFilter === 'active') return !s.isSuspended
    // 'suspended' is filtered server-side; no need to filter again
    return true
  })

  const applySummaryFilter = (filter: SummaryCardFilter) => {
    setActiveTab('users')
    setRoleFilter(filter.role)
    setStatusFilter(filter.status)
    setPage(1)
  }

  const visibleIds = filtered.map((u) => u.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedUserIds.includes(id))

  const getRoleLabel = (roles: string[]) => ({
    administrator: 'Administrador', tutor_instructor: 'Instructor',
    subscriber: 'Suscriptor', student: 'Estudiante',
  }[roles?.[0]] || roles?.[0] || 'Sin rol')

  const getRoleBadge = (roles: string[]) => {
    const r = roles?.[0]
    if (r === 'administrator') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    if (r === 'tutor_instructor') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    if (r === 'subscriber') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const getColor = (id: number) =>
    ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500'][id % 7]

  const toggleUserSelection = (id: number) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectVisible = () => {
    if (allVisibleSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
      return
    }
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
  }

  const runBatchAction = async (action: 'suspend' | 'unsuspend' | 'delete') => {
    if (!selectedUserIds.length) {
      setBulkError('Selecciona al menos un usuario')
      return
    }

    try {
      setBulkLoading(true)
      setBulkError(null)
      setBulkMessage(null)

      const payload: Record<string, any> = {
        action,
        userIds: selectedUserIds,
      }

      if (action === 'suspend' && bulkReason.trim()) {
        payload.reason = bulkReason.trim()
      }
      if (action === 'delete' && Number(bulkReassign) > 0) {
        payload.reassign = Number(bulkReassign)
      }

      const res = await fetch('/api/wordpress/users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error en accion masiva')

      setBulkMessage(`Completado: ${data.summary?.successful || 0} correctos, ${data.summary?.failed || 0} fallidos`)
      setSelectedUserIds([])
      await fetchAllStudents()
      await fetchStudents()
    } catch (e: any) {
      setBulkError(e.message || 'Error en accion masiva')
    } finally {
      setBulkLoading(false)
    }
  }

  const addPendingUser = () => {
    const username = newUsername.trim()
    const email = newEmail.trim()
    if (!username || !email) {
      setBulkError('Username y email son obligatorios para agregar al lote')
      return
    }

    setBulkError(null)
    setBulkMessage(null)
    setPendingUsers((prev) => [
      ...prev,
      {
        username,
        email,
        role: newRole,
        first_name: newFirstName.trim(),
        last_name: newLastName.trim(),
        ...(newPassword.trim() ? { password: newPassword.trim() } : {}),
      },
    ])

    setNewUsername('')
    setNewEmail('')
    setNewRole('subscriber')
    setNewFirstName('')
    setNewLastName('')
    setNewPassword('')
  }

  const removePendingUser = (index: number) => {
    setPendingUsers((prev) => prev.filter((_, i) => i !== index))
  }

  const runBulkCreate = async () => {
    if (!pendingUsers.length) {
      setBulkError('Agrega al menos un usuario al lote')
      return
    }

    try {
      setBulkLoading(true)
      setBulkError(null)
      setBulkMessage(null)

      const res = await fetch('/api/wordpress/users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', users: pendingUsers }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear usuarios en lote')

      setBulkMessage(`Creacion completada: ${data.summary?.successful || 0} creados, ${data.summary?.failed || 0} fallidos`)
      setPendingUsers([])
      await fetchAllStudents()
      await fetchStudents()
    } catch (e: any) {
      setBulkError(e.message || 'Error al crear usuarios en lote')
    } finally {
      setBulkLoading(false)
    }
  }

  const runSingleCreate = async () => {
    const username = singleUsername.trim()
    const email = singleEmail.trim()

    if (!username || !email) {
      setSingleError('Username y email son obligatorios')
      return
    }

    try {
      setSingleLoading(true)
      setSingleError(null)
      setSingleMessage(null)

      const userPayload: Record<string, string> = {
        username,
        email,
        role: singleRole,
        first_name: singleFirstName.trim(),
        last_name: singleLastName.trim(),
      }
      if (singlePassword.trim()) {
        userPayload.password = singlePassword.trim()
      }

      const res = await fetch('/api/wordpress/users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          users: [userPayload],
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear usuario')

      const firstResult = data.results?.[0]
      if (!firstResult?.success) {
        throw new Error(firstResult?.message || 'No se pudo crear el usuario')
      }

      setSingleMessage('Usuario creado correctamente')
      setSingleUsername('')
      setSingleEmail('')
      setSingleRole('subscriber')
      setSingleFirstName('')
      setSingleLastName('')
      setSinglePassword('')
      await fetchAllStudents()
      await fetchStudents()
    } catch (e: any) {
      setSingleError(e.message || 'Error al crear usuario')
    } finally {
      setSingleLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {canManageUsers && (
        <div className="rounded-lg border border-gray-200 bg-white p-2 shadow dark:border-slate-700 dark:bg-slate-800">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode('normal')}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                mode === 'normal'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
              }`}
            >
              Usuario normal
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                mode === 'bulk'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
              }`}
            >
              Varios usuarios
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          { label: 'Total', value: roleStats.all, Icon: Users, iconClass: 'text-blue-600 dark:text-blue-400', wrapperClass: 'bg-blue-100 dark:bg-blue-900/30', filter: { role: 'all', status: 'all' as const } },
          { label: 'Administradores', value: roleStats.administrator, Icon: Building2, iconClass: 'text-red-600 dark:text-red-400', wrapperClass: 'bg-red-100 dark:bg-red-900/30', filter: { role: 'administrator', status: 'all' as const } },
          { label: 'Instructores', value: roleStats.tutor_instructor, Icon: GraduationCap, iconClass: 'text-purple-600 dark:text-purple-400', wrapperClass: 'bg-purple-100 dark:bg-purple-900/30', filter: { role: 'tutor_instructor', status: 'all' as const } },
          { label: 'Suspendidos', value: roleStats.suspended, Icon: UserX, iconClass: 'text-orange-600 dark:text-orange-400', wrapperClass: 'bg-orange-100 dark:bg-orange-900/30', filter: { role: 'all', status: 'suspended' as const } },
        ] satisfies Array<{
          label: string
          value: number
          Icon: typeof Users
          iconClass: string
          wrapperClass: string
          filter: SummaryCardFilter
        }>).map(({ label, value, Icon, iconClass, wrapperClass, filter }) => {
          const isActive =
            activeTab === 'users' &&
            roleFilter === filter.role &&
            statusFilter === filter.status

          return (
          <button
            type="button"
            key={label}
            onClick={() => applySummaryFilter(filter)}
            className={`rounded-lg bg-white p-4 text-left shadow transition-colors dark:bg-slate-800 ${
              isActive
                ? 'ring-2 ring-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${wrapperClass}`}>
                <Icon className={`h-5 w-5 ${iconClass}`} />
              </div>
            </div>
          </button>
        )})}
      </div>

      <div className="rounded-lg bg-white shadow dark:bg-slate-800">
        <div className="border-b border-gray-200 p-2 dark:border-slate-700">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
              }`}
            >
              Usuarios
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
              }`}
            >
              Historial
            </button>
          </div>
        </div>

        {activeTab === 'history' ? (
          <EntityHistoryPanel
            title="Historial de Usuarios WordPress"
            description="Consulta quien creo, inhabilito, habilito o elimino usuarios y sobre que cuenta se aplico."
            countLabel={`${historyRows.length} registros`}
            rows={historyRows}
            emptyMessage="Aun no hay movimientos registrados de usuarios WP."
          />
        ) : (
        <>
        <div className="border-b border-gray-200 px-4 pt-3 dark:border-slate-700">
          <div className="flex flex-wrap gap-1 pb-3">
            {[
              { key: 'all', label: `Todos (${roleStats.all})` },
              { key: 'administrator', label: `Admins (${roleStats.administrator})` },
              { key: 'tutor_instructor', label: `Instructores (${roleStats.tutor_instructor})` },
              { key: 'subscriber', label: `Suscriptores (${roleStats.subscriber})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setRoleFilter(key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  roleFilter === key
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200 p-3 dark:border-slate-700">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre o email..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
          </select>
          {canManageUsers && mode === 'bulk' && (
            <span className="rounded border border-blue-200 px-2 py-1 text-xs text-blue-700 dark:border-blue-700 dark:text-blue-300">
              Seleccionados: {selectedUserIds.length}
            </span>
          )}
        </div>

        {canManageUsers && mode === 'normal' && (
          <div className="space-y-3 border-b border-gray-200 p-3 dark:border-slate-700">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Crear usuario normal
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              <input type="text" value={singleUsername} onChange={(e) => setSingleUsername(e.target.value)} placeholder="Username" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
              <input type="email" value={singleEmail} onChange={(e) => setSingleEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
              <select value={singleRole} onChange={(e) => setSingleRole(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="subscriber">Suscriptor</option>
                <option value="student">Estudiante</option>
                <option value="tutor_instructor">Instructor</option>
                <option value="editor">Editor</option>
                <option value="author">Autor</option>
                <option value="contributor">Colaborador</option>
                <option value="customer">Cliente</option>
                <option value="administrator">Administrador</option>
              </select>
              <input type="text" value={singleFirstName} onChange={(e) => setSingleFirstName(e.target.value)} placeholder="Nombre" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
              <input type="text" value={singleLastName} onChange={(e) => setSingleLastName(e.target.value)} placeholder="Apellido" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
              <input type="text" value={singlePassword} onChange={(e) => setSinglePassword(e.target.value)} placeholder="Password (opcional)" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <button onClick={runSingleCreate} disabled={singleLoading} className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                {singleLoading ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>

            {singleError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="h-4 w-4" />
                {singleError}
              </div>
            )}
            {singleMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                {singleMessage}
              </div>
            )}
          </div>
        )}

        {canManageUsers && mode === 'bulk' && (
          <div className="space-y-3 border-b border-gray-200 p-3 dark:border-slate-700">
            <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setBulkTab('actions')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    bulkTab === 'actions'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                  }`}
                >
                  Acciones a varios
                </button>
                <button
                  type="button"
                  onClick={() => setBulkTab('create')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    bulkTab === 'create'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                  }`}
                >
                  Crear varios
                </button>
              </div>
            </div>

            {bulkTab === 'actions' && (
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectVisible} />
                  Seleccionar visibles ({filtered.length})
                </label>
                <input
                  type="text"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Razon para suspension (opcional)"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
                <input
                  type="number"
                  min="1"
                  value={bulkReassign}
                  onChange={(e) => setBulkReassign(e.target.value)}
                  placeholder="ID reasignar (delete)"
                  className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
                <button onClick={() => runBatchAction('suspend')} disabled={bulkLoading || selectedUserIds.length === 0} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50">
                  Suspender lote
                </button>
                <button onClick={() => runBatchAction('unsuspend')} disabled={bulkLoading || selectedUserIds.length === 0} className="rounded-lg border border-green-300 px-3 py-1.5 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50">
                  Habilitar lote
                </button>
                <button onClick={() => runBatchAction('delete')} disabled={bulkLoading || selectedUserIds.length === 0} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50">
                  Eliminar lote
                </button>
              </div>
            )}

            {bulkTab === 'create' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                  <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Username" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    <option value="subscriber">Suscriptor</option>
                    <option value="student">Estudiante</option>
                    <option value="tutor_instructor">Instructor</option>
                    <option value="editor">Editor</option>
                    <option value="author">Autor</option>
                    <option value="contributor">Colaborador</option>
                    <option value="customer">Cliente</option>
                    <option value="administrator">Administrador</option>
                  </select>
                  <input type="text" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="Nombre" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  <input type="text" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Apellido" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password (opcional)" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addPendingUser} disabled={bulkLoading} className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                    Agregar al lote
                  </button>
                  <button onClick={runBulkCreate} disabled={bulkLoading || pendingUsers.length === 0} className="rounded-lg border border-green-300 px-3 py-1.5 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50">
                    Crear lote ({pendingUsers.length})
                  </button>
                </div>

                {pendingUsers.length > 0 && (
                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-slate-700 dark:text-gray-200">
                      Usuarios en lote
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                      {pendingUsers.map((u, idx) => (
                        <li key={`${u.username}-${idx}`} className="flex items-center justify-between px-3 py-2 text-xs">
                          <span className="text-gray-700 dark:text-gray-200">
                            {u.username} - {u.email} - {u.role}
                          </span>
                          <button onClick={() => removePendingUser(idx)} className="text-red-600 hover:text-red-700">
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {bulkError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="h-4 w-4" />
                {bulkError}
              </div>
            )}
            {bulkMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                {bulkMessage}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center">
            <div className="mb-2 inline-block h-7 w-7 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-sm text-gray-400">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-400">Sin resultados</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-slate-700">
            {filtered.map(user => (
              <li key={user.id}>
                <div
                  className={`px-4 py-3 transition-colors ${
                    user.isSuspended ? 'bg-red-50/60 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div
                    onClick={() => router.push(`/dashboard/wordpress/students/${user.id}`)}
                    className="group flex w-full cursor-pointer items-center gap-3 text-left"
                  >
                    {canManageUsers && mode === 'bulk' && (
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                      />
                    )}
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      user.isSuspended ? 'bg-gray-400' : getColor(user.id)
                    }`}>
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-medium ${user.isSuspended ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {user.name || 'Sin nombre'}
                        </span>
                        <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${getRoleBadge(user.roles)}`}>
                          {getRoleLabel(user.roles)}
                        </span>
                        {user.isSuspended && (
                          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            Suspendido
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-400">{user.email}</p>
                      {(user.createdByName || user.suspendedByName) && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                          {user.createdByName && <span>Creado por: {user.createdByName}</span>}
                          {user.suspendedByName && <span>Inhabilitado por: {user.suspendedByName}</span>}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2.5 dark:border-slate-700">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-gray-400">
              Anterior
            </button>
            <span className="text-xs text-gray-400">Pagina {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={students.length < perPage}
              className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-gray-400">
              Siguiente
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  )
}
