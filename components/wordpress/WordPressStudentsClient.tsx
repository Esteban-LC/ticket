'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Users, GraduationCap, Building2, ChevronRight, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WordPressUser {
  id: number
  username: string
  name: string
  email: string
  roles: string[]
  isSuspended?: boolean
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

export default function WordPressStudentsClient({ userRole, userPermissions }: WordPressStudentsClientProps) {
  const router = useRouter()
  const [students, setStudents] = useState<WordPressUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [page, setPage] = useState(1)
  const [roleStats, setRoleStats] = useState<RoleStats>({
    all: 0, administrator: 0, subscriber: 0, tutor_instructor: 0, suspended: 0,
  })
  const perPage = 20

  const canManageUsers = userRole === 'ADMIN' || userPermissions.includes('wordpress:manage_users')

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => { fetchAllStudents() }, [])
  useEffect(() => { fetchStudents() }, [page, roleFilter, searchTerm])
  useEffect(() => { setPage(1) }, [searchTerm, roleFilter, statusFilter])

  const fetchAllStudents = async () => {
    try {
      const res = await fetch('/api/wordpress/users?per_page=100')
      const data = await res.json()
      if (res.ok) calculateStats(data.users || [])
    } catch {}
  }

  const calculateStats = (users: WordPressUser[]) => {
    const s: RoleStats = { all: users.length, administrator: 0, subscriber: 0, tutor_instructor: 0, suspended: 0 }
    users.forEach(u => {
      // Contar en todos los roles que tenga el usuario, no solo el primero
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
      const res = await fetch(`/api/wordpress/users?${params}`)
      const data = await res.json()
      if (res.ok) setStudents(data.users || [])
    } catch {}
    finally { setLoading(false) }
  }

  const filtered = students.filter(s => {
    if (statusFilter === 'active') return !s.isSuspended
    if (statusFilter === 'suspended') return s.isSuspended
    return true
  })

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
    ['bg-blue-500','bg-purple-500','bg-green-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-indigo-500'][id % 7]

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: roleStats.all, Icon: Users, color: 'blue' },
          { label: 'Administradores', value: roleStats.administrator, Icon: Building2, color: 'red' },
          { label: 'Instructores', value: roleStats.tutor_instructor, Icon: GraduationCap, color: 'purple' },
          { label: 'Suspendidos', value: roleStats.suspended, Icon: UserX, color: 'orange' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/30`}>
              <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
        {/* Filtros por rol */}
        <div className="border-b border-gray-200 dark:border-slate-700 px-4 pt-3">
          <div className="flex flex-wrap gap-1 pb-3">
            {[
              { key: 'all', label: `Todos (${roleStats.all})` },
              { key: 'administrator', label: `Admins (${roleStats.administrator})` },
              { key: 'tutor_instructor', label: `Instructores (${roleStats.tutor_instructor})` },
              { key: 'subscriber', label: `Suscriptores (${roleStats.subscriber})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setRoleFilter(key)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  roleFilter === key
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Barra herramientas */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-700 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre o email..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
            className="px-2 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
          </select>
          {canManageUsers && (
            <button onClick={() => alert('Próximamente')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap">
              <Plus className="h-3.5 w-3.5" /> Nuevo
            </button>
          )}
        </div>

        {/* Lista de usuarios - clic navega a su perfil */}
        {loading ? (
          <div className="p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mb-2" />
            <p className="text-sm text-gray-400">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Sin resultados</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-slate-700">
            {filtered.map(user => (
              <li key={user.id}>
                <button onClick={() => router.push(`/dashboard/wordpress/students/${user.id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group ${
                    user.isSuspended ? 'bg-red-50/60 dark:bg-red-900/10' : ''
                  }`}>
                  <div className={`h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${
                    user.isSuspended ? 'bg-gray-400' : getColor(user.id)
                  }`}>
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${user.isSuspended ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {user.name || 'Sin nombre'}
                      </span>
                      <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${getRoleBadge(user.roles)}`}>
                        {getRoleLabel(user.roles)}
                      </span>
                      {user.isSuspended && (
                        <span className="px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-medium">
                          Suspendido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Paginación */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 flex items-center justify-between border-t border-gray-200 dark:border-slate-700">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Anterior
            </button>
            <span className="text-xs text-gray-400">Página {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={students.length < perPage}
              className="px-3 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
