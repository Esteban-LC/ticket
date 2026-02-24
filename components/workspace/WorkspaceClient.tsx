'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  Users,
  FolderTree,
  RefreshCw,
  Search,
  UserPlus,
  AlertCircle,
  History,
  ArrowLeft,
  UserCircle2,
  PauseCircle,
  PlayCircle,
  Globe,
} from 'lucide-react'
import OrgUnitTree from './OrgUnitTree'
import WorkspaceUserList from './WorkspaceUserList'
import CreateUserModal from './CreateUserModal'
import EditUserModal from './EditUserModal'
import ConfirmModal from './ConfirmModal'
import AdminHistory from './AdminHistory'

interface WorkspaceUser {
  id: string
  primaryEmail: string
  name: { givenName: string; familyName: string; fullName: string }
  orgUnitPath: string
  suspended: boolean
  isAdmin: boolean
  creationTime: string
  lastLoginTime: string
  thumbnailPhotoUrl?: string
  wordPressUserId?: number | null
  hasWordPressUser?: boolean
  wordPressSuspended?: boolean
  wordPressSuspendedAt?: string | null
  wordPressSuspensionReason?: string | null
}

interface OrgUnit {
  orgUnitId: string
  name: string
  orgUnitPath: string
  parentOrgUnitPath: string
  description?: string
}

export default function WorkspaceClient() {
  const [users, setUsers] = useState<WorkspaceUser[]>([])
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'orgunits' | 'history' | 'profile'>('users')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [recencyFilter, setRecencyFilter] = useState<'all' | 'created_7d' | 'created_30d' | 'login_7d' | 'login_30d'>('all')
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<WorkspaceUser | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'unsuspend' | 'delete'
    user: WorkspaceUser
  } | null>(null)
  const [syncWithWordPress, setSyncWithWordPress] = useState(true)
  const [suspendWordPressReason, setSuspendWordPressReason] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (searchQuery) params.set('query', searchQuery)
      if (selectedOrgUnit) params.set('orgUnitPath', selectedOrgUnit)

      const res = await fetch(`/api/workspace/users?${params}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar usuarios')
      }
      const data = await res.json()
      const nextUsers: WorkspaceUser[] = data.users || []
      setUsers(nextUsers)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedOrgUnit])

  const fetchOrgUnits = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace/orgunits')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar unidades organizativas')
      }
      const data = await res.json()
      setOrgUnits(data.orgUnits || [])
    } catch (err: any) {
      console.error('Error fetching org units:', err)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchOrgUnits()
  }, [fetchUsers, fetchOrgUnits])

  useEffect(() => {
    if (selectedUserEmail && !users.some((u) => u.primaryEmail === selectedUserEmail)) {
      setSelectedUserEmail(null)
      if (activeTab === 'profile') {
        setActiveTab('users')
      }
    }
  }, [users, selectedUserEmail, activeTab])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleSuspendUser = async (user: WorkspaceUser) => {
    setSyncWithWordPress(true)
    setSuspendWordPressReason('')
    setConfirmAction({
      type: user.suspended ? 'unsuspend' : 'suspend',
      user,
    })
  }

  const handleDeleteUser = async (user: WorkspaceUser) => {
    setConfirmAction({ type: 'delete', user })
  }

  const executeConfirmAction = async () => {
    if (!confirmAction) return

    try {
      const { type, user } = confirmAction
      let wordPressSyncMessage: string | null = null

      if (type === 'delete') {
        const res = await fetch(`/api/workspace/users/${encodeURIComponent(user.primaryEmail)}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error)
        }
      } else {
        const res = await fetch(`/api/workspace/users/${encodeURIComponent(user.primaryEmail)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: type }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error)
        }
      }

      if ((type === 'suspend' || type === 'unsuspend') && syncWithWordPress) {
        const searchParams = new URLSearchParams({
          search: user.primaryEmail,
          per_page: '100',
        })

        const wpUsersRes = await fetch(`/api/wordpress/users?${searchParams.toString()}`)
        const wpUsersData = await wpUsersRes.json()

        if (!wpUsersRes.ok) {
          throw new Error(
            `Usuario suspendido en Workspace, pero fallo la busqueda en WordPress: ${wpUsersData.error || 'Error desconocido'}`
          )
        }

        const targetWpUser = (wpUsersData.users || []).find(
          (wpUser: any) => String(wpUser.email || '').toLowerCase() === user.primaryEmail.toLowerCase()
        )

        if (!targetWpUser) {
          wordPressSyncMessage =
            type === 'suspend'
              ? `Usuario suspendido en Workspace. No se encontro un usuario en WordPress con email ${user.primaryEmail}.`
              : `Usuario reactivado en Workspace. No se encontro un usuario en WordPress con email ${user.primaryEmail}.`
        } else {
          if (type === 'suspend') {
            const wpSuspendRes = await fetch(`/api/wordpress/users/${targetWpUser.id}/suspend`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reason: suspendWordPressReason.trim() || `Suspendido desde Workspace (${user.primaryEmail})`,
              }),
            })
            const wpSuspendData = await wpSuspendRes.json()

            if (!wpSuspendRes.ok) {
              throw new Error(
                `Usuario suspendido en Workspace, pero fallo la suspension en WordPress: ${wpSuspendData.error || 'Error desconocido'}`
              )
            }
          } else {
            const wpUnsuspendRes = await fetch(`/api/wordpress/users/${targetWpUser.id}/suspend`, {
              method: 'DELETE',
            })
            const wpUnsuspendData = await wpUnsuspendRes.json()

            if (!wpUnsuspendRes.ok) {
              throw new Error(
                `Usuario reactivado en Workspace, pero fallo la habilitacion en WordPress: ${wpUnsuspendData.error || 'Error desconocido'}`
              )
            }
          }
        }
      }

      setConfirmAction(null)
      setSuspendWordPressReason('')
      fetchUsers()

      if (wordPressSyncMessage) {
        alert(wordPressSyncMessage)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleUserCreated = () => {
    setShowCreateModal(false)
    fetchUsers()
  }

  const handleUserUpdated = () => {
    setEditingUser(null)
    fetchUsers()
  }

  const handleSelectOrgUnit = (path: string | null) => {
    // "/" = raíz = mostrar todos (sin filtro)
    setSelectedOrgUnit(path === '/' ? null : path)
    setActiveTab('users')
  }

  const handleSelectUserProfile = (user: WorkspaceUser) => {
    setSelectedUserEmail(user.primaryEmail)
    setActiveTab('profile')
  }

  // Stats
  const totalUsers = users.length
  const activeUsers = users.filter(u => !u.suspended).length
  const suspendedUsers = users.filter(u => u.suspended).length

  // Filtered users based on status
  const isWithinDays = (dateStr: string, days: number) => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return false
    const limit = new Date()
    limit.setDate(limit.getDate() - days)
    return date >= limit
  }

  const filteredUsers = users.filter((user) => {
    if (statusFilter === 'active' && user.suspended) return false
    if (statusFilter === 'suspended' && !user.suspended) return false

    if (recencyFilter === 'created_7d') return isWithinDays(user.creationTime, 7)
    if (recencyFilter === 'created_30d') return isWithinDays(user.creationTime, 30)
    if (recencyFilter === 'login_7d') return isWithinDays(user.lastLoginTime, 7)
    if (recencyFilter === 'login_30d') return isWithinDays(user.lastLoginTime, 30)

    return true
  })
  const selectedUser = selectedUserEmail
    ? users.find((user) => user.primaryEmail === selectedUserEmail) || null
    : null

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 lg:mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            Google Workspace
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra usuarios y unidades organizativas de tu dominio
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { fetchUsers(); fetchOrgUnits() }}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 dark:text-red-300 font-medium">Error de conexión</p>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
            <p className="text-red-500 dark:text-red-500 text-xs mt-2">
              Verifica que el archivo google-credentials.json existe y que GOOGLE_ADMIN_EMAIL esté configurado en tu .env
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        <button
          onClick={() => {
            setStatusFilter('all')
            setActiveTab('users')
          }}
          className={`bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6 transition-all hover:shadow-lg hover:scale-105 text-left ${
            statusFilter === 'all' ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usuarios</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalUsers}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('active')
            setActiveTab('users')
          }}
          className={`bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6 transition-all hover:shadow-lg hover:scale-105 text-left ${
            statusFilter === 'active' ? 'ring-2 ring-green-500 dark:ring-green-400' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activos</p>
              <p className="text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{activeUsers}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('suspended')
            setActiveTab('users')
          }}
          className={`bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6 transition-all hover:shadow-lg hover:scale-105 text-left ${
            statusFilter === 'suspended' ? 'ring-2 ring-red-500 dark:ring-red-400' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suspendidos</p>
              <p className="text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{suspendedUsers}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
              <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('orgunits')}
          className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6 transition-all hover:shadow-lg hover:scale-105 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unidades Org.</p>
              <p className="text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{orgUnits.length}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <FolderTree className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-slate-800 rounded-lg p-1 w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab('orgunits')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'orgunits'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FolderTree className="h-4 w-4" />
          <span className="hidden sm:inline">Unidades Organizativas</span>
          <span className="sm:hidden">UOs</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <History className="h-4 w-4" />
          Historial
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <UserCircle2 className="h-4 w-4" />
          Perfil
        </button>
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <div>
          {/* Botón regresar a OUs */}
          {selectedOrgUnit && (
            <button
              onClick={() => setActiveTab('orgunits')}
              className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Volver a Unidades Organizativas</span>
              <span className="sm:hidden">Volver a UOs</span>
            </button>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition"
              >
                Buscar
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {selectedOrgUnit && (
                <button
                  onClick={() => { setSelectedOrgUnit(null); }}
                  className="px-3 py-2 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition flex items-center gap-1 max-w-full"
                >
                  <FolderTree className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{selectedOrgUnit}</span>
                  <span className="ml-1 flex-shrink-0">&times;</span>
                </button>
              )}
              <select
                value={recencyFilter}
                onChange={(e) => setRecencyFilter(e.target.value as typeof recencyFilter)}
                className="px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                <option value="all">Todas las fechas</option>
                <option value="created_7d">Creados en 7 dias</option>
                <option value="created_30d">Creados en 30 dias</option>
                <option value="login_7d">Acceso en 7 dias</option>
                <option value="login_30d">Acceso en 30 dias</option>
              </select>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg transition flex items-center gap-1 ${
                    statusFilter === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                  }`}
                >
                  <Users className="h-3 w-3 flex-shrink-0" />
                  <span>{statusFilter === 'active' ? 'Solo Activos' : 'Solo Suspendidos'}</span>
                  <span className="ml-1 flex-shrink-0">&times;</span>
                </button>
              )}
              {recencyFilter !== 'all' && (
                <button
                  onClick={() => setRecencyFilter('all')}
                  className="px-3 py-2 text-xs sm:text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition flex items-center gap-1"
                >
                  <span>Filtro reciente</span>
                  <span className="ml-1">&times;</span>
                </button>
              )}
            </div>
          </div>

          <WorkspaceUserList
            users={filteredUsers}
            loading={loading}
            onEdit={setEditingUser}
            onSuspend={handleSuspendUser}
            onDelete={handleDeleteUser}
            onSelect={handleSelectUserProfile}
            selectedUserEmail={selectedUserEmail}
          />
        </div>
      )}

      {activeTab === 'orgunits' && (
        <OrgUnitTree
          orgUnits={orgUnits}
          onSelectOrgUnit={handleSelectOrgUnit}
        />
      )}

      {activeTab === 'history' && <AdminHistory />}

      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          {!selectedUser ? (
            <div className="text-center py-10">
              <UserCircle2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Selecciona un usuario en la tabla para ver su perfil.
              </p>
              <button
                onClick={() => setActiveTab('users')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Ir a Usuarios
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedUser.name.fullName}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.primaryEmail}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="px-3 py-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                  >
                    Volver a tabla
                  </button>
                  <button
                    onClick={() => handleSuspendUser(selectedUser)}
                    className={`px-3 py-2 text-sm rounded-lg transition ${
                      selectedUser.suspended
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {selectedUser.suspended ? 'Reactivar' : 'Suspender'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border dark:border-slate-700 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Estado Google Workspace</p>
                  <div className="flex items-center gap-2">
                    {selectedUser.suspended ? (
                      <>
                        <PauseCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600 dark:text-red-400 font-medium">Suspendido</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">Activo</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Unidad: {selectedUser.orgUnitPath || '/'}</p>
                </div>

                <div className="border dark:border-slate-700 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Estado Usuarios WP</p>
                  {!selectedUser.hasWordPressUser ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300 font-medium">Sin usuario vinculado en WordPress</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        No existe registro local en la tabla `WordPressUser` para este email.
                      </p>
                    </div>
                  ) : selectedUser.wordPressSuspended ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <PauseCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600 dark:text-red-400 font-medium">Inhabilitado en WordPress</span>
                      </div>
                      {selectedUser.wordPressSuspensionReason && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Razon: {selectedUser.wordPressSuspensionReason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400 font-medium">Habilitado en WordPress</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          orgUnits={orgUnits}
          defaultOrgUnitPath={selectedOrgUnit}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleUserCreated}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          orgUnits={orgUnits}
          onClose={() => setEditingUser(null)}
          onUpdated={handleUserUpdated}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction.type === 'delete'
              ? 'Eliminar Usuario'
              : confirmAction.type === 'suspend'
                ? 'Suspender Usuario'
                : 'Reactivar Usuario'
          }
          message={
            confirmAction.type === 'delete'
              ? `¿Estás seguro de eliminar a ${confirmAction.user.name.fullName} (${confirmAction.user.primaryEmail})? Esta acción no se puede deshacer.`
              : confirmAction.type === 'suspend'
                ? `¿Suspender a ${confirmAction.user.name.fullName}? El usuario no podrá acceder a los servicios de Google.`
                : `¿Reactivar a ${confirmAction.user.name.fullName}? El usuario podrá acceder nuevamente a los servicios de Google.`
          }
          confirmLabel={
            confirmAction.type === 'delete' ? 'Eliminar' : confirmAction.type === 'suspend' ? 'Suspender' : 'Reactivar'
          }
          variant={confirmAction.type === 'delete' ? 'danger' : confirmAction.type === 'suspend' ? 'warning' : 'success'}
          extraContent={confirmAction.type === 'suspend' || confirmAction.type === 'unsuspend' ? (
            <div className="space-y-3">
              <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  checked={syncWithWordPress}
                  onChange={(e) => setSyncWithWordPress(e.target.checked)}
                />
                <span>
                  {confirmAction.type === 'suspend'
                    ? 'Suspender tambien en Usuarios WP (2 en 1)'
                    : 'Habilitar tambien en Usuarios WP (2 en 1)'}
                </span>
              </label>
              {confirmAction.type === 'suspend' && syncWithWordPress && (
                <textarea
                  value={suspendWordPressReason}
                  onChange={(e) => setSuspendWordPressReason(e.target.value)}
                  rows={2}
                  placeholder="Razon de suspension en WordPress (opcional)"
                  className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {confirmAction.type === 'suspend'
                  ? 'Si no marcas esta opcion, solo se suspende en Google Workspace.'
                  : 'Si no marcas esta opcion, solo se reactiva en Google Workspace.'}
              </p>
            </div>
          ) : undefined}
          onConfirm={executeConfirmAction}
          onCancel={() => {
            setConfirmAction(null)
            setSuspendWordPressReason('')
          }}
        />
      )}
    </div>
  )
}
