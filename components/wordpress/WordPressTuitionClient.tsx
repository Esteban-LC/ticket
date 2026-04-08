'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Search, Trash2, UserPlus, UserRoundX, Wallet } from 'lucide-react'
import EntityHistoryPanel, { EntityHistoryRow } from '@/components/shared/EntityHistoryPanel'

type PaymentStatus = 'CURRENT' | 'OVERDUE' | 'DROPPED'
type TuitionSourceType = 'WORKSPACE' | 'WORDPRESS'
type TuitionView = 'pending' | 'completed' | 'register' | 'bulk'
type TuitionTab = 'operate' | 'history'

interface TuitionSourceUser {
  sourceType: TuitionSourceType
  sourceExternalId: string
  wordPressUserId: number | null
  email: string
  name: string
  username: string
  roles: string[]
  inWorkspace: boolean
  inWordPress: boolean
}

interface TuitionFollowUp {
  id: string
  sourceType: TuitionSourceType
  sourceExternalId: string
  wordPressUserId: number | null
  studentEmail: string
  studentName: string | null
  studentUsername: string | null
  status: PaymentStatus
  notes: string | null
  createdByEmail: string | null
  completedAt: string | null
  completedByEmail: string | null
  createdAt: string
  history?: Array<{
    id: string
    event: string
    actorEmail: string
    createdAt: string
    details?: Record<string, unknown>
  }>
}

interface FollowUpCounts {
  pending: number
  completed: number
  CURRENT: number
  OVERDUE: number
  DROPPED: number
}

interface WordPressTuitionClientProps {
  userRole: string
}

const STATUS_META: Record<PaymentStatus, { label: string; button: string; badge: string; Icon: typeof CheckCircle2 }> = {
  CURRENT: {
    label: 'Pagado / No adeudor',
    button:
      'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    Icon: CheckCircle2,
  },
  OVERDUE: {
    label: 'Adeudor',
    button:
      'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    Icon: Wallet,
  },
  DROPPED: {
    label: 'Baja por pagos',
    button:
      'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    Icon: UserRoundX,
  },
}

const EMPTY_COUNTS: FollowUpCounts = {
  pending: 0,
  completed: 0,
  CURRENT: 0,
  OVERDUE: 0,
  DROPPED: 0,
}

export default function WordPressTuitionClient({ userRole }: WordPressTuitionClientProps) {
  const canCreateRecords = userRole !== 'ADMIN'
  const [activeView, setActiveView] = useState<TuitionView>(canCreateRecords ? 'register' : 'pending')
  const [activeTab, setActiveTab] = useState<TuitionTab>('operate')

  const [pendingRecords, setPendingRecords] = useState<TuitionFollowUp[]>([])
  const [completedRecords, setCompletedRecords] = useState<TuitionFollowUp[]>([])
  const [recordsCounts, setRecordsCounts] = useState<FollowUpCounts>(EMPTY_COUNTS)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)
  const [recordsStatus, setRecordsStatus] = useState<'all' | PaymentStatus>('all')
  const [recordsSearch, setRecordsSearch] = useState('')
  const [recordsSearchTerm, setRecordsSearchTerm] = useState('')
  const [recordWorkingId, setRecordWorkingId] = useState<string | null>(null)

  const [sourceUsers, setSourceUsers] = useState<TuitionSourceUser[]>([])
  const [sourceTotal, setSourceTotal] = useState(0)
  const [sourcePage, setSourcePage] = useState(1)
  const [sourceHasMore, setSourceHasMore] = useState(false)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [sourceError, setSourceError] = useState<string | null>(null)
  const [sourceWarnings, setSourceWarnings] = useState<string[]>([])
  const [sourceSearch, setSourceSearch] = useState('')
  const [sourceSearchTerm, setSourceSearchTerm] = useState('')
  const [selectedNotes, setSelectedNotes] = useState<Record<string, string>>({})
  const [selectedUsers, setSelectedUsers] = useState<Record<string, boolean>>({})
  const [bulkNote, setBulkNote] = useState('')
  const [workingId, setWorkingId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setRecordsSearchTerm(recordsSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [recordsSearch])

  useEffect(() => {
    const timer = setTimeout(() => setSourceSearchTerm(sourceSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [sourceSearch])

  useEffect(() => {
    setSourcePage(1)
  }, [sourceSearchTerm])

  useEffect(() => {
    fetchRecords()
  }, [recordsStatus, recordsSearchTerm])

  useEffect(() => {
    if (canCreateRecords) {
      fetchSourceUsers()
    }
  }, [canCreateRecords, sourceSearchTerm, sourcePage])

  const fetchRecords = async () => {
    try {
      setRecordsLoading(true)
      setRecordsError(null)

      const buildParams = (section: 'pending' | 'completed') => {
        const params = new URLSearchParams({
          section,
          status: recordsStatus,
        })

        if (recordsSearchTerm) {
          params.append('search', recordsSearchTerm)
        }

        return params.toString()
      }

      const [pendingResponse, completedResponse] = await Promise.all([
        fetch(`/api/tuition/follow-ups?${buildParams('pending')}`),
        fetch(`/api/tuition/follow-ups?${buildParams('completed')}`),
      ])

      const [pendingData, completedData] = await Promise.all([pendingResponse.json(), completedResponse.json()])

      if (!pendingResponse.ok) {
        throw new Error(pendingData.error || 'No se pudo cargar el seguimiento pendiente')
      }

      if (!completedResponse.ok) {
        throw new Error(completedData.error || 'No se pudo cargar el seguimiento completado')
      }

      setPendingRecords(Array.isArray(pendingData.items) ? pendingData.items : [])
      setCompletedRecords(Array.isArray(completedData.items) ? completedData.items : [])
      setRecordsCounts(pendingData.counts || EMPTY_COUNTS)
    } catch (error: any) {
      setRecordsError(error.message || 'No se pudo cargar el seguimiento')
      setPendingRecords([])
      setCompletedRecords([])
      setRecordsCounts(EMPTY_COUNTS)
    } finally {
      setRecordsLoading(false)
    }
  }

  const fetchSourceUsers = async () => {
    try {
      setSourceLoading(true)
      setSourceError(null)

      const params = new URLSearchParams({ per_page: '10', page: String(sourcePage) })
      if (sourceSearchTerm) {
        params.append('search', sourceSearchTerm)
      }

      const response = await fetch(`/api/tuition/sources?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron cargar usuarios para cobranza')
      }

      setSourceUsers(Array.isArray(data.users) ? data.users : [])
      setSourceTotal(typeof data.total === 'number' ? data.total : Array.isArray(data.users) ? data.users.length : 0)
      setSourceHasMore(Boolean(data.hasMore))
      setSourceWarnings(Array.isArray(data.warnings) ? data.warnings : [])
    } catch (error: any) {
      setSourceError(error.message || 'No se pudieron cargar usuarios para cobranza')
      setSourceUsers([])
      setSourceTotal(0)
      setSourceHasMore(false)
      setSourceWarnings([])
    } finally {
      setSourceLoading(false)
    }
  }

  const createFollowUp = async (user: TuitionSourceUser, status: PaymentStatus) => {
    try {
      const rowKey = user.sourceType + ':' + user.sourceExternalId
      setWorkingId(rowKey)
      setSourceError(null)

      const response = await fetch('/api/tuition/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: user.sourceType,
          sourceExternalId: user.sourceExternalId,
          wordPressUserId: user.wordPressUserId,
          studentEmail: user.email,
          studentName: user.name,
          studentUsername: user.username,
          status,
          notes: selectedNotes[rowKey]?.trim() || null,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear el aviso')
      }

      setSelectedNotes((current) => ({ ...current, [rowKey]: '' }))
      await fetchRecords()
    } catch (error: any) {
      setSourceError(error.message || 'No se pudo crear el aviso')
    } finally {
      setWorkingId(null)
    }
  }

  const toggleSelectedUser = (rowKey: string) => {
    setSelectedUsers((current) => ({
      ...current,
      [rowKey]: !current[rowKey],
    }))
  }

  const toggleSelectAllVisibleUsers = () => {
    const allSelected = sourceUsers.length > 0 && sourceUsers.every((user) => selectedUsers[user.sourceType + ':' + user.sourceExternalId])
    setSelectedUsers((current) => {
      const next = { ...current }
      sourceUsers.forEach((user) => {
        const rowKey = user.sourceType + ':' + user.sourceExternalId
        next[rowKey] = !allSelected
      })
      return next
    })
  }

  const createBulkFollowUp = async (status: PaymentStatus) => {
    const selectedRows = sourceUsers.filter((user) => selectedUsers[user.sourceType + ':' + user.sourceExternalId])
    if (selectedRows.length === 0) {
      setSourceError('Selecciona al menos un usuario')
      return
    }

    try {
      setWorkingId('bulk')
      setSourceError(null)

      const response = await fetch('/api/tuition/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedRows.map((user) => ({
            sourceType: user.sourceType,
            sourceExternalId: user.sourceExternalId,
            wordPressUserId: user.wordPressUserId,
            studentEmail: user.email,
            studentName: user.name,
            studentUsername: user.username,
            status,
            notes: bulkNote.trim() || null,
          })),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron crear los avisos')
      }

      setSelectedUsers({})
      setBulkNote('')
      await fetchRecords()
    } catch (error: any) {
      setSourceError(error.message || 'No se pudieron crear los avisos')
    } finally {
      setWorkingId(null)
    }
  }

  const updateRecord = async (id: string, action: 'complete' | 'reopen') => {
    try {
      setRecordWorkingId(id)
      setRecordsError(null)

      const response = await fetch(`/api/tuition/follow-ups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el aviso')
      }

      await fetchRecords()
    } catch (error: any) {
      setRecordsError(error.message || 'No se pudo actualizar el aviso')
    } finally {
      setRecordWorkingId(null)
    }
  }

  const deleteRecord = async (id: string) => {
    try {
      setRecordWorkingId(id)
      setRecordsError(null)

      const response = await fetch(`/api/tuition/follow-ups/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo eliminar el aviso')
      }

      await fetchRecords()
    } catch (error: any) {
      setRecordsError(error.message || 'No se pudo eliminar el aviso')
    } finally {
      setRecordWorkingId(null)
    }
  }

  const getSourceLabel = (item: { sourceType: TuitionSourceType; inWorkspace?: boolean; inWordPress?: boolean }) => {
    if (item.inWorkspace && item.inWordPress) return 'Workspace + WP'
    if (item.sourceType === 'WORKSPACE' || item.inWorkspace) return 'Workspace'
    return 'Usuarios WP'
  }

  const formatDate = (value: string | null) => {
    if (!value) return '-'

    return new Date(value).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getHistoryEventLabel = (event: string) => {
    switch (event) {
      case 'created':
        return 'Registro creado'
      case 'completed':
        return 'Marcado como atendido'
      case 'reopened':
        return 'Reabierto'
      case 'deleted':
        return 'Eliminado'
      default:
        return event
    }
  }

  const historyRows: EntityHistoryRow[] = [...pendingRecords, ...completedRecords]
    .flatMap((item) =>
      (item.history || []).map((entry) => ({
        id: entry.id,
        createdAt: entry.createdAt,
        actorLabel: entry.actorEmail,
        actionLabel:
          entry.event === 'created'
            ? `Tomado por ${entry.actorEmail}`
            : entry.event === 'completed'
              ? `Completado por ${entry.actorEmail}`
              : entry.event === 'reopened'
                ? `Reabierto por ${entry.actorEmail}`
                : entry.event === 'deleted'
                  ? `Eliminado por ${entry.actorEmail}`
                  : `${getHistoryEventLabel(entry.event)} por ${entry.actorEmail}`,
        targetLabel: item.studentName || item.studentUsername || item.studentEmail,
        targetSubLabel: item.studentEmail,
        details: item.notes || `Estado: ${STATUS_META[item.status].label}`,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const selectedCount = sourceUsers.filter((user) => selectedUsers[user.sourceType + ':' + user.sourceExternalId]).length
  const allVisibleSelected = sourceUsers.length > 0 && selectedCount === sourceUsers.length
  const sourceStart = sourceTotal === 0 ? 0 : (sourcePage - 1) * 10 + 1
  const sourceEnd = sourceTotal === 0 ? 0 : Math.min(sourcePage * 10, sourceTotal)

  const renderSourcePagination = () => (
    <div className="flex flex-col gap-3 border-t border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {sourceTotal > 0 ? `Mostrando ${sourceStart}-${sourceEnd} de ${sourceTotal}` : 'Sin resultados'}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={sourceLoading || sourcePage <= 1}
          onClick={() => setSourcePage((current) => Math.max(1, current - 1))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={sourceLoading || !sourceHasMore}
          onClick={() => setSourcePage((current) => current + 1)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
        >
          Siguiente
        </button>
      </div>
    </div>
  )

  const renderRecordsTable = (items: TuitionFollowUp[], section: 'pending' | 'completed') => {
    if (recordsLoading) {
      return <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando seguimiento...</div>
    }

    if (items.length === 0) {
      return (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {section === 'completed' ? 'Sin datos completados' : 'Sin usuarios en seguimiento'}
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Origen</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notas</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Registro y bitacora</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {items.map((item) => {
              const Icon = STATUS_META[item.status].Icon
              return (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.studentName || item.studentUsername || item.studentEmail}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">@{item.studentUsername || 'sin-usuario'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.studentEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{getSourceLabel(item)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_META[item.status].badge}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {STATUS_META[item.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.notes || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    <div>Alta: {formatDate(item.createdAt)}</div>
                    <div>Por: {item.createdByEmail || '-'}</div>
                    {item.completedAt && <div>Cierre: {formatDate(item.completedAt)}</div>}
                    {item.completedByEmail && <div>Cerro: {item.completedByEmail}</div>}
                    {item.history && item.history.length > 0 && (
                      <div className="mt-2 space-y-1 rounded-lg bg-gray-50 p-2 dark:bg-slate-900/50">
                        {item.history.slice(0, 4).map((entry) => (
                          <div key={entry.id}>
                            <div className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
                              {getHistoryEventLabel(entry.event)}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              {entry.actorEmail} · {formatDate(entry.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {section === 'pending' ? (
                        <button
                          type="button"
                          disabled={recordWorkingId === item.id}
                          onClick={() => updateRecord(item.id, 'complete')}
                          className="inline-flex items-center justify-center rounded-lg border border-emerald-300 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        >
                          Completar
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={recordWorkingId === item.id}
                          onClick={() => updateRecord(item.id, 'reopen')}
                          className="inline-flex items-center justify-center rounded-lg border border-blue-300 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                        >
                          Reabrir
                        </button>
                      )}
                        <button
                          type="button"
                          disabled={recordWorkingId === item.id}
                          onClick={() => deleteRecord(item.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-red-300 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <span className="inline-flex items-center gap-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow dark:border-slate-700 dark:bg-slate-800">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab('operate')}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              activeTab === 'operate'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
            }`}
          >
            Operacion
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
          title="Historial de Cobranza"
          description="Consulta quien tomo, completo, reabrio o elimino un seguimiento de cobranza y la fecha del movimiento."
          countLabel={`${historyRows.length} registros`}
          rows={historyRows}
          emptyMessage="Aun no hay movimientos registrados en cobranza."
        />
      ) : (
      <>
      <div className="rounded-lg bg-white shadow dark:bg-slate-800">
        <div className="border-b border-gray-200 p-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Seguimiento de avisos</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Usa las tarjetas para cambiar entre pendientes, completados y filtrar por estado.
          </p>
        </div>

        <div className={`grid gap-3 border-b border-gray-200 p-4 md:grid-cols-2 ${canCreateRecords ? 'xl:grid-cols-7' : 'xl:grid-cols-5'} dark:border-slate-700`}>
          {canCreateRecords && (
            <button
              type="button"
              onClick={() => setActiveView('register')}
              className={`rounded-lg border p-4 text-left ${
                activeView === 'register'
                  ? 'border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20'
                  : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/40'
              }`}
            >
              <div className="text-sm text-gray-600 dark:text-gray-300">Usuarios</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{sourceTotal}</div>
            </button>
          )}
          {canCreateRecords && (
            <button
              type="button"
              onClick={() => setActiveView('bulk')}
              className={`rounded-lg border p-4 text-left ${
                activeView === 'bulk'
                  ? 'border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20'
                  : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/40'
              }`}
            >
              <div className="text-sm text-gray-600 dark:text-gray-300">Seleccion multiple</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{selectedCount}</div>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveView('pending')}
            className={`rounded-lg border p-4 text-left ${
              activeView === 'pending'
                ? 'border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20'
                : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/40'
            }`}
          >
            <div className="text-sm text-gray-600 dark:text-gray-300">Pendientes</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{recordsCounts.pending}</div>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('completed')}
            className={`rounded-lg border p-4 text-left ${
              activeView === 'completed'
                ? 'border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20'
                : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/40'
            }`}
          >
            <div className="text-sm text-gray-600 dark:text-gray-300">Completados</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{recordsCounts.completed}</div>
          </button>
          {(['CURRENT', 'OVERDUE', 'DROPPED'] as PaymentStatus[]).map((status) => {
            const Icon = STATUS_META[status].Icon
            return (
              <button
                key={status}
                type="button"
                onClick={() => setRecordsStatus((current) => (current === status ? 'all' : status))}
                className={`rounded-lg border p-4 text-left ${
                  recordsStatus === status
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20'
                    : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-300">{STATUS_META[status].label}</div>
                  <span className={`inline-flex rounded-lg p-2 ${STATUS_META[status].badge}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{recordsCounts[status]}</div>
              </button>
            )
          })}
        </div>

        {activeView !== 'register' && activeView !== 'bulk' && (
          <div className="border-b border-gray-200 dark:border-slate-700">
            <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={recordsSearch}
                  onChange={(event) => setRecordsSearch(event.target.value)}
                  placeholder="Buscar en seguimiento..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => setRecordsStatus('all')}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  recordsStatus === 'all'
                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                Todos
              </button>
            </div>
          </div>
        )}

        {recordsError && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
            {recordsError}
          </div>
        )}
        {activeView === 'pending' && (
          <div>
            <div className="border-b border-gray-200 px-4 py-3 dark:border-slate-700">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pendientes</h3>
            </div>
            {renderRecordsTable(pendingRecords, 'pending')}
          </div>
        )}

        {activeView === 'completed' && (
          <div>
            <div className="border-b border-gray-200 px-4 py-3 dark:border-slate-700">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Completados</h3>
            </div>
            {renderRecordsTable(completedRecords, 'completed')}
          </div>
        )}

        {canCreateRecords && activeView === 'register' && (
          <div>
            <div className="border-b border-gray-200 p-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Usuarios</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Aqui aparecen usuarios para generar seguimiento desde cobranza.
              </p>
            </div>

            <div className="border-b border-gray-200 p-4 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={sourceSearch}
                  onChange={(event) => setSourceSearch(event.target.value)}
                  placeholder="Buscar usuarios..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            {sourceError && (
              <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
                {sourceError}
              </div>
            )}

            {!sourceError && sourceWarnings.length > 0 && (
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
                {sourceWarnings.join('. ')}
              </div>
            )}

            {sourceLoading ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando usuarios...</div>
            ) : sourceUsers.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Sin usuarios disponibles.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/60">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Usuario</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Origen</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Correo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notas</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Avisar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {sourceUsers.map((user) => {
                        const rowKey = user.sourceType + ':' + user.sourceExternalId
                        return (
                          <tr key={rowKey} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900 dark:text-white">{user.name || user.username || 'Sin nombre'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">@{user.username || 'sin-usuario'}</div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{getSourceLabel(user)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={selectedNotes[rowKey] || ''}
                                onChange={(event) => setSelectedNotes((current) => ({ ...current, [rowKey]: event.target.value }))}
                                placeholder="Nota opcional"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                {(['CURRENT', 'OVERDUE', 'DROPPED'] as PaymentStatus[]).map((status) => {
                                  const Icon = STATUS_META[status].Icon
                                  return (
                                    <button
                                      key={status}
                                      type="button"
                                      disabled={workingId === rowKey}
                                      onClick={() => createFollowUp(user, status)}
                                      className={`rounded-lg border px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${STATUS_META[status].button}`}
                                    >
                                      <span className="inline-flex items-center gap-1">
                                        <Icon className="h-3.5 w-3.5" />
                                        {STATUS_META[status].label}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {renderSourcePagination()}
              </>
            )}
          </div>
        )}

        {canCreateRecords && activeView === 'bulk' && (
          <div>
            <div className="border-b border-gray-200 p-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seleccion multiple</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Selecciona varios usuarios y registra el mismo estado en un solo paso.
              </p>
            </div>

            <div className="border-b border-gray-200 p-4 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={sourceSearch}
                  onChange={(event) => setSourceSearch(event.target.value)}
                  placeholder="Buscar usuarios..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            {sourceError && (
              <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
                {sourceError}
              </div>
            )}

            {!sourceError && sourceWarnings.length > 0 && (
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
                {sourceWarnings.join('. ')}
              </div>
            )}

            <div className="border-b border-gray-200 p-4 dark:border-slate-700">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Seleccionados: <span className="font-semibold text-gray-900 dark:text-white">{selectedCount}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllVisibleUsers}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
                  >
                    {allVisibleSelected ? 'Quitar visibles' : 'Seleccionar visibles'}
                  </button>
                  <input
                    type="text"
                    value={bulkNote}
                    onChange={(event) => setBulkNote(event.target.value)}
                    placeholder="Nota opcional para seleccion multiple"
                    className="min-w-[260px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                  {(['CURRENT', 'OVERDUE', 'DROPPED'] as PaymentStatus[]).map((status) => {
                    const Icon = STATUS_META[status].Icon
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={workingId === 'bulk' || selectedCount === 0}
                        onClick={() => createBulkFollowUp(status)}
                        className={`rounded-lg border px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${STATUS_META[status].button}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Icon className="h-3.5 w-3.5" />
                          {STATUS_META[status].label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {sourceLoading ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando usuarios...</div>
            ) : sourceUsers.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Sin usuarios disponibles.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/60">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sel.</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Usuario</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Origen</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Correo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {sourceUsers.map((user) => {
                        const rowKey = user.sourceType + ':' + user.sourceExternalId
                        const checked = Boolean(selectedUsers[rowKey])
                        return (
                          <tr key={rowKey} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSelectedUser(rowKey)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900 dark:text-white">{user.name || user.username || 'Sin nombre'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">@{user.username || 'sin-usuario'}</div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{getSourceLabel(user)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {renderSourcePagination()}
              </>
            )}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  )
}
