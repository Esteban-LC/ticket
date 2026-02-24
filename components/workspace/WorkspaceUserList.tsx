'use client'

import {
  Mail,
  Edit3,
  Trash2,
  PauseCircle,
  PlayCircle,
  Shield,
  Clock,
  FolderTree,
  Loader2,
} from 'lucide-react'

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
  hasWordPressUser?: boolean
  wordPressSuspended?: boolean
}

interface WorkspaceUserListProps {
  users: WorkspaceUser[]
  loading: boolean
  onEdit: (user: WorkspaceUser) => void
  onSuspend: (user: WorkspaceUser) => void
  onDelete: (user: WorkspaceUser) => void
  onSelect: (user: WorkspaceUser) => void
  selectedUserEmail?: string | null
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'Nunca'
  try {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function UserAvatar({ user }: { user: WorkspaceUser }) {
  const initials = `${user.name.givenName?.[0] || ''}${user.name.familyName?.[0] || ''}`.toUpperCase()

  if (user.thumbnailPhotoUrl) {
    return (
      <img
        src={user.thumbnailPhotoUrl}
        alt={user.name.fullName}
        className="h-10 w-10 rounded-full object-cover"
      />
    )
  }

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
    'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  ]
  const colorIndex = user.primaryEmail.charCodeAt(0) % colors.length

  return (
    <div className={`h-10 w-10 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-semibold text-sm`}>
      {initials}
    </div>
  )
}

export default function WorkspaceUserList({
  users,
  loading,
  onEdit,
  onSuspend,
  onDelete,
  onSelect,
  selectedUserEmail,
}: WorkspaceUserListProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Cargando usuarios de Workspace...</p>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
        <Mail className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron usuarios</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          Intenta con otra búsqueda o verifica la conexión con Google
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Unidad Org.
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Último acceso
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Creación
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {users.map((user) => (
              <tr
                key={user.id || user.primaryEmail}
                onClick={() => onSelect(user)}
                className={`transition cursor-pointer ${
                  selectedUserEmail === user.primaryEmail
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name.fullName}
                        </p>
                        {user.isAdmin && (
                          <span title="Administrador"><Shield className="h-4 w-4 text-amber-500" /></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.primaryEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                    <FolderTree className="h-3 w-3" />
                    {user.orgUnitPath || '/'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.suspended ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                      <PauseCircle className="h-3 w-3" />
                      Suspendido
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      <PlayCircle className="h-3 w-3" />
                      Activo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    {formatDate(user.lastLoginTime)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(user.creationTime)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(user)
                      }}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSuspend(user)
                      }}
                      className={`p-2 rounded-lg transition ${
                        user.suspended
                          ? 'text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                      }`}
                      title={user.suspended ? 'Reactivar' : 'Suspender'}
                    >
                      {user.suspended ? (
                        <PlayCircle className="h-4 w-4" />
                      ) : (
                        <PauseCircle className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(user)
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y dark:divide-slate-700">
        {users.map((user) => (
          <div
            key={user.id || user.primaryEmail}
            className={`p-4 cursor-pointer transition ${
              selectedUserEmail === user.primaryEmail ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onClick={() => onSelect(user)}
          >
            <div className="flex items-center gap-3">
              <UserAvatar user={user} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {user.name.fullName}
                    </p>
                    {user.isAdmin && <Shield className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                  </div>
                  {user.suspended ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex-shrink-0">
                      Suspendido
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex-shrink-0">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user.primaryEmail}</p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              <span className="flex items-center gap-1 truncate">
                <FolderTree className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{user.orgUnitPath || '/'}</span>
              </span>
              <span className="flex items-center gap-1 flex-shrink-0">
                <Clock className="h-3 w-3" />
                {formatDate(user.lastLoginTime)}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 border-t dark:border-slate-700 pt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(user)
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
              >
                <Edit3 className="h-3 w-3" /> Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSuspend(user)
                }}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  user.suspended
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                    : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                }`}
              >
                {user.suspended ? <><PlayCircle className="h-3 w-3" /> Activar</> : <><PauseCircle className="h-3 w-3" /> Suspender</>}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(user)
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
              >
                <Trash2 className="h-3 w-3" /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
