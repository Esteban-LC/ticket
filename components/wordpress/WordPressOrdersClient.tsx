'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, ShoppingCart, XCircle } from 'lucide-react'

interface LineItem {
  id: number
  name: string
  product_id: number
  quantity: number
  total: string
}

interface Order {
  id: number
  number: string
  status: string
  date_created: string
  total: string
  currency_symbol: string
  customer_id: number
  line_items: LineItem[]
}

interface Props {
  userRole: string
  userPermissions: string[]
}

type BulkAction = '' | 'processing' | 'on-hold' | 'completed' | 'cancelled'

const STATUS_FILTERS = [
  { key: '', label: 'Todos' },
  { key: 'completed', label: 'Completado' },
  { key: 'cancelled', label: 'Cancelado' },
  { key: 'pending', label: 'Pendiente' },
  { key: 'processing', label: 'Procesando' },
  { key: 'on-hold', label: 'En espera' },
] as const

export default function WordPressOrdersClient({ userRole, userPermissions }: Props) {
  const canManageOrders =
    userRole === 'ADMIN' ||
    userPermissions.includes('wordpress:manage_orders') ||
    userPermissions.includes('wordpress:manage_users')

  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction>('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    c[''] = orders.length
    for (const filter of STATUS_FILTERS) c[filter.key] = 0
    for (const order of orders) {
      c[order.status] = (c[order.status] || 0) + 1
    }
    return c
  }, [orders])

  const getStatusLabel = (s: string) =>
    ({ pending: 'Pendiente', processing: 'Procesando', 'on-hold': 'En espera', completed: 'Completado', cancelled: 'Cancelado' }[s] || s)

  const getStatusBadge = (s: string) =>
    ({
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      'on-hold': 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    }[s] || 'bg-gray-100 text-gray-600')

  const formatDate = (value: string) => {
    const d = new Date(value)
    return isNaN(d.getTime()) ? value : d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ per_page: '100' })
      const res = await fetch(`/api/wordpress/orders?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar pedidos')
      setOrders(data.orders || [])
      setSelectedOrderIds([])
    } catch (e: any) {
      setError(e.message || 'Error al cargar pedidos')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  const visibleOrderIds = useMemo(() => filteredOrders.map((o) => o.id), [filteredOrders])
  const allVisibleSelected =
    visibleOrderIds.length > 0 && visibleOrderIds.every((id) => selectedOrderIds.includes(id))

  const toggleOrder = (orderId: number) => {
    setSelectedOrderIds((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  const toggleSelectVisible = () => {
    if (allVisibleSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !visibleOrderIds.includes(id)))
      return
    }
    setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...visibleOrderIds])))
  }

  const updateStatus = async (orderId: number, status: 'completed' | 'cancelled') => {
    try {
      setActionLoading(orderId)
      setError(null)
      setSuccess(null)
      const res = await fetch(`/api/wordpress/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la orden')

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: data.order?.status || status } : o)))
      setSuccess(status === 'completed' ? `Orden #${orderId} acreditada` : `Orden #${orderId} cancelada`)
    } catch (e: any) {
      setError(e.message || 'Error al actualizar orden')
    } finally {
      setActionLoading(null)
    }
  }

  const applyBulkAction = async () => {
    if (!bulkAction || selectedOrderIds.length === 0) return
    try {
      setBulkLoading(true)
      setError(null)
      setSuccess(null)

      const results = await Promise.all(
        selectedOrderIds.map(async (id) => {
          const res = await fetch(`/api/wordpress/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: bulkAction }),
          })
          const data = await res.json().catch(() => ({}))
          return { id, ok: res.ok, status: data.order?.status || bulkAction, error: data.error }
        })
      )

      const okIds = results.filter((r) => r.ok).map((r) => r.id)
      const failed = results.filter((r) => !r.ok)

      if (okIds.length > 0) {
        setOrders((prev) =>
          prev.map((o) => (okIds.includes(o.id) ? { ...o, status: bulkAction } : o))
        )
      }

      setSelectedOrderIds([])
      setBulkAction('')
      if (failed.length > 0) {
        setError(`Se actualizaron ${okIds.length} y fallaron ${failed.length}`)
      } else {
        setSuccess(`Se actualizaron ${okIds.length} pedidos`)
      }
    } catch (e: any) {
      setError(e.message || 'Error en acción en lote')
    } finally {
      setBulkLoading(false)
    }
  }

  if (!canManageOrders) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        No tienes permisos para gestionar pedidos.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key || 'all'}
              onClick={() => setStatusFilter(filter.key)}
              className={`text-sm ${
                statusFilter === filter.key
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {filter.label} ({counts[filter.key] || 0})
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as BulkAction)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="">Acciones en lote</option>
            <option value="processing">Cambiar estado a procesando</option>
            <option value="on-hold">Cambiar estado a en espera</option>
            <option value="completed">Cambiar estado a completado</option>
            <option value="cancelled">Cambiar estado a cancelado</option>
          </select>
          <button
            onClick={applyBulkAction}
            disabled={!bulkAction || selectedOrderIds.length === 0 || bulkLoading}
            className="rounded-lg border border-blue-300 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
          >
            {bulkLoading ? 'Aplicando...' : 'Aplicar'}
          </button>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
          {success}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="p-10 text-center">
            <div className="mb-2 inline-block h-7 w-7 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-sm text-gray-400">Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No hay pedidos para mostrar</p>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-200 p-3 dark:border-slate-700">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectVisible} />
                Seleccionar visibles ({filteredOrders.length})
              </label>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredOrders.map((order) => (
                <li key={order.id} className="px-4 py-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => toggleOrder(order.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">#{order.number}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusBadge(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Cliente #{order.customer_id} · {formatDate(order.date_created)}
                        </p>
                        {order.line_items?.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {order.line_items.map((i) => i.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {order.currency_symbol}{order.total}
                      </span>
                      {(order.status === 'pending' || order.status === 'on-hold' || order.status === 'processing') && (
                        <button
                          onClick={() => updateStatus(order.id, 'completed')}
                          disabled={actionLoading === order.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-green-300 px-2.5 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Acreditar
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <button
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          disabled={actionLoading === order.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

