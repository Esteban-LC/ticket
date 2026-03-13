'use client'

import { useState, useEffect, useRef } from 'react'
import { TicketStatus, TicketPriority } from '@prisma/client'
import { ArrowLeft, User, MoreVertical, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TicketHeaderProps {
  ticket: {
    id: string
    number: number
    subject: string
    status: TicketStatus
    priority: TicketPriority
    assignee: {
      id: string
      name: string | null
      email: string
    } | null
  }
  isRequester?: boolean
  canDelete?: boolean
}

const statusLabels = {
  OPEN: 'Abierto',
  PENDING: 'Pendiente',
  SOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
}

const priorityLabels = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export default function TicketHeader({ ticket, isRequester, canDelete }: TicketHeaderProps) {
  const router = useRouter()
  const [agents, setAgents] = useState<Array<{ id: string; name: string | null; email: string }>>([])
  const [updating, setUpdating] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  useEffect(() => {
    if (isRequester) return
    // Fetch agents for assignment
    fetch('/api/users?role=COORDINATOR,ADMIN')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAgents(data)
        } else {
          console.error('Expected array of agents, got:', data)
          setAgents([])
        }
      })
      .catch(err => {
        console.error('Error fetching agents:', err)
        setAgents([])
      })
  }, [])

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleAssigneeChange = async (assigneeId: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: assigneeId || null })
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating assignee:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteTicket = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, { method: 'DELETE' })
      if (response.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error deleting ticket:', error)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
    <div className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Ticket #{ticket.number}
              </h1>

              {isRequester ? (
                <span className="px-3 py-1 text-sm font-medium rounded-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100">
                  {statusLabels[ticket.status]}
                </span>
              ) : (
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  disabled={updating}
                  className="px-3 py-1 text-sm font-medium rounded-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <option value="OPEN">{statusLabels.OPEN}</option>
                  <option value="PENDING">{statusLabels.PENDING}</option>
                  <option value="SOLVED">{statusLabels.SOLVED}</option>
                  <option value="CLOSED">{statusLabels.CLOSED}</option>
                </select>
              )}

              <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100">
                Prioridad: {priorityLabels[ticket.priority]}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{ticket.subject}</p>
          </div>
        </div>

        {/* Assignee / Close button + 3-dot menu */}
        <div className="flex items-center space-x-3">
          {isRequester ? (
            ticket.status === 'OPEN' || ticket.status === 'PENDING' ? (
              <button
                onClick={() => handleStatusChange('CLOSED' as TicketStatus)}
                disabled={updating}
                className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                Cerrar ticket
              </button>
            ) : null
          ) : (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <select
                value={ticket.assignee?.id || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                disabled={updating}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <option value="">Sin asignar</option>
                {Array.isArray(agents) && agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name || agent.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canDelete && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => { setShowMenu(false); setShowDeleteConfirm(true) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar ticket
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Delete confirmation modal */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Eliminar ticket
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            ¿Estás seguro de que deseas eliminar el <span className="font-medium">Ticket #{ticket.number}</span>? Esta acción no se puede deshacer y se eliminarán todos los mensajes asociados.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteTicket}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
