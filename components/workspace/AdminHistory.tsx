'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  History,
  UserPlus,
  UserCog,
  UserX,
  UserMinus,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Clock,
  Info,
} from 'lucide-react'

interface AdminLogEntry {
  id: string
  action: string
  adminEmail: string
  targetEmail: string
  targetName: string | null
  details: Record<string, any> | null
  createdAt: string
}

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  CREATE_USER: {
    label: 'Crear usuario',
    icon: UserPlus,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  UPDATE_USER: {
    label: 'Editar usuario',
    icon: UserCog,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  DELETE_USER: {
    label: 'Eliminar usuario',
    icon: UserX,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  SUSPEND_USER: {
    label: 'Suspender usuario',
    icon: UserMinus,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  UNSUSPEND_USER: {
    label: 'Reactivar usuario',
    icon: UserCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDetails(details: Record<string, any> | null): string {
  if (!details) return ''
  const parts: string[] = []
  for (const [key, value] of Object.entries(details)) {
    if (key === 'password') continue
    if (key === 'name' && typeof value === 'object') {
      if (value.givenName) parts.push(`Nombre: ${value.givenName}`)
      if (value.familyName) parts.push(`Apellido: ${value.familyName}`)
    } else if (key === 'orgUnitPath') {
      parts.push(`OU: ${value}`)
    } else if (key === 'changePasswordAtNextLogin') {
      parts.push(`Cambio contraseña: ${value ? 'Sí' : 'No'}`)
    } else {
      parts.push(`${key}: ${JSON.stringify(value)}`)
    }
  }
  return parts.join(' · ')
}

export default function AdminHistory() {
  const [logs, setLogs] = useState<AdminLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const limit = 20

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (filter) params.set('action', filter)

      const res = await fetch(`/api/workspace/history?${params}`)
      if (!res.ok) throw new Error('Error al cargar historial')
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
      {/* Header con filtro */}
      <div className="p-4 border-b dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Historial de Acciones</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {total} registros
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1) }}
            className="text-sm px-3 py-1.5 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las acciones</option>
            <option value="CREATE_USER">Crear usuario</option>
            <option value="UPDATE_USER">Editar usuario</option>
            <option value="DELETE_USER">Eliminar usuario</option>
            <option value="SUSPEND_USER">Suspender usuario</option>
            <option value="UNSUSPEND_USER">Reactivar usuario</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center">
          <History className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay registros de actividad</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Las acciones de administración aparecerán aquí
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: Tabla */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acción</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario Afectado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {logs.map((log) => {
                  const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE_USER
                  const Icon = config.icon
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {log.adminEmail}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 dark:text-white">{log.targetEmail}</div>
                        {log.targetName && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{log.targetName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {formatDetails(log.details)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: Tarjetas */}
          <div className="lg:hidden divide-y dark:divide-slate-700">
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE_USER
              const Icon = config.icon
              return (
                <div key={log.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.createdAt)}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{log.targetEmail}</p>
                    {log.targetName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{log.targetName}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <span>por</span>
                    <span className="text-gray-600 dark:text-gray-300">{log.adminEmail}</span>
                  </div>

                  {log.details && formatDetails(log.details) && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/30 rounded px-2 py-1.5">
                      <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span>{formatDetails(log.details)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="p-4 border-t dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
