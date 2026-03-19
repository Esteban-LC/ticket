'use client'

import { useState, useEffect, useRef } from 'react'
import { TicketStatus, TicketPriority } from '@prisma/client'
import { ArrowLeft, User, MoreVertical, Trash2, AlertTriangle, Info, CheckCircle2, CircleDot, PauseCircle, Lock, Menu } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/contexts/SidebarContext'

interface TicketHeaderProps {
  ticket: {
    id: string
    number: number
    ticketCode: string | null
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
  isCoordinator?: boolean
  isAdminDept?: boolean
  canManagePriority?: boolean
  currentUserId?: string
  onOpenDetails?: () => void
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

export default function TicketHeader({ ticket, isRequester, canDelete, isCoordinator, isAdminDept, canManagePriority, currentUserId, onOpenDetails }: TicketHeaderProps) {
  const router = useRouter()
  const { toggle } = useSidebar()
  const ticketIdentifier = ticket.ticketCode || `#${ticket.number}`
  const [agents, setAgents] = useState<Array<{ id: string; name: string | null; email: string }>>([])
  const [updating, setUpdating] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const desktopMenuRef = useRef<HTMLDivElement>(null)
  const canManageStatus = !isRequester
  const showActionsMenu = Boolean(onOpenDetails) || canManageStatus || Boolean(canDelete)
  const menuPanelClass = isDarkTheme
    ? 'absolute right-0 top-full z-20 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl'
    : 'absolute right-0 top-full z-20 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl'
  const menuButtonClass = isDarkTheme
    ? 'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-100 transition-colors hover:bg-white/5'
    : 'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'
  const menuHeaderClass = isDarkTheme
    ? 'px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-400'
    : 'px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-gray-500'
  const menuDividerClass = isDarkTheme
    ? 'mx-4 border-t border-white/10'
    : 'mx-4 border-t border-gray-200'
  const inlineSelectWrapClass = isDarkTheme
    ? 'flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2'
    : 'flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2'
  const inlineSelectClass = isDarkTheme
    ? 'min-w-0 w-full bg-transparent text-sm text-slate-100 outline-none disabled:opacity-50'
    : 'min-w-0 w-full bg-transparent text-sm text-gray-900 outline-none disabled:opacity-50'
  const menuIconClass = isDarkTheme ? 'h-4 w-4 text-slate-300' : 'h-4 w-4 text-gray-400'
  const dangerButtonClass = isDarkTheme
    ? 'w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-red-300 transition-colors hover:bg-red-500/10'
    : 'w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-red-500 transition-colors hover:bg-red-50'

  useEffect(() => {
    if (typeof document === 'undefined') return

    const syncTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'))
    }

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const clickedInsideMobile = mobileMenuRef.current?.contains(target)
      const clickedInsideDesktop = desktopMenuRef.current?.contains(target)
      if (!clickedInsideMobile && !clickedInsideDesktop) {
        setShowMenu(false)
      }
    }

    const handleTouchOutside = (e: TouchEvent) => {
      const target = e.target as Node
      const touchedInsideMobile = mobileMenuRef.current?.contains(target)
      const touchedInsideDesktop = desktopMenuRef.current?.contains(target)
      if (!touchedInsideMobile && !touchedInsideDesktop) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleTouchOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleTouchOutside)
    }
  }, [showMenu])

  useEffect(() => {
    if (isRequester) return
    // Fetch agents for assignment
    fetch('/api/agents')
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

  const handlePriorityChange = async (priority: TicketPriority) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating priority:', error)
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

  const handleToggleMenu = () => {
    setShowMenu((prev) => !prev)
  }

  const handleOpenDetails = () => {
    setShowMenu(false)
    requestAnimationFrame(() => {
      onOpenDetails?.()
    })
  }

  return (
    <>
    <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 sm:px-4 lg:px-6 lg:py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:hidden">
          <div className="grid grid-cols-[auto,1fr,auto] items-center gap-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggle}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-slate-700 dark:hover:text-gray-300"
                aria-label="Abrir menu del dashboard"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <h1 className="min-w-0 truncate px-1 text-center text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {ticketIdentifier}
            </h1>

            {showActionsMenu ? (
              <div className="relative justify-self-end" ref={mobileMenuRef}>
                <button
                  type="button"
                  onClick={handleToggleMenu}
                  aria-label="Abrir acciones del ticket"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {showMenu && (
                  <div
                    className={menuPanelClass}
                    onClick={(event) => event.stopPropagation()}
                    onTouchStart={(event) => event.stopPropagation()}
                  >
                    {onOpenDetails && (
                      <button
                        type="button"
                        onClick={handleOpenDetails}
                        className={isDarkTheme ? 'w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-100 transition-colors hover:bg-white/5' : 'w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'}
                      >
                        <Info className={menuIconClass} />
                        Info. del ticket
                      </button>
                    )}

                    {onOpenDetails && (canManageStatus || canDelete) && (
                      <div className={menuDividerClass} />
                    )}

                    {isCoordinator && (
                      <>
                        <div className={`${menuHeaderClass} lg:hidden`}>
                          Asignacion
                        </div>

                        <div className="px-4 pb-3 lg:hidden">
                          <div className={inlineSelectWrapClass}>
                            <User className={`${menuIconClass} flex-shrink-0`} />
                            <select
                              value={ticket.assignee?.id || ''}
                              onChange={(e) => {
                                setShowMenu(false)
                                handleAssigneeChange(e.target.value)
                              }}
                              disabled={updating}
                              className={inlineSelectClass}
                            >
                              <option value="" className={isDarkTheme ? 'bg-slate-800 text-slate-100' : 'bg-white text-gray-900'}>Sin asignar</option>
                              {Array.isArray(agents) && agents.map(agent => (
                                <option key={agent.id} value={agent.id} className={isDarkTheme ? 'bg-slate-800 text-slate-100' : 'bg-white text-gray-900'}>
                                  {agent.name || agent.email}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className={`${menuDividerClass} lg:hidden`} />
                      </>
                    )}

                    {canManagePriority && (
                      <>
                        <div className={menuHeaderClass}>
                          Prioridad
                        </div>

                        {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as TicketPriority[]).map((priority) => (
                              <button
                                type="button"
                                key={priority}
                                onClick={() => { setShowMenu(false); handlePriorityChange(priority) }}
                                className={menuButtonClass}
                          >
                            {priorityLabels[priority]}
                          </button>
                        ))}

                        <div className={menuDividerClass} />
                      </>
                    )}

                    {canManageStatus && (
                      <>
                        <div className={menuHeaderClass}>
                          Estado
                        </div>

                        <button
                          type="button"
                          onClick={() => { setShowMenu(false); handleStatusChange('OPEN') }}
                          className={menuButtonClass}
                        >
                          <CircleDot className={menuIconClass} />
                          Marcar como abierto
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowMenu(false); handleStatusChange('PENDING') }}
                          className={menuButtonClass}
                        >
                          <PauseCircle className={menuIconClass} />
                          Marcar como pendiente
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowMenu(false); handleStatusChange('SOLVED') }}
                          className={menuButtonClass}
                        >
                          <CheckCircle2 className={menuIconClass} />
                          Marcar como resuelto
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowMenu(false); handleStatusChange('CLOSED') }}
                          className={menuButtonClass}
                        >
                          <Lock className={menuIconClass} />
                          Marcar como cerrado
                        </button>
                      </>
                    )}

                    {canDelete && (onOpenDetails || canManageStatus) && (
                      <div className={`${menuDividerClass} mt-1`} />
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => { setShowMenu(false); setShowDeleteConfirm(true) }}
                        className={dangerButtonClass}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar ticket
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div />
            )}
          </div>

          <div className="mt-2 flex flex-col items-center">
            <Link
              href="/dashboard"
              className="absolute left-1 top-[3.5rem] inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600 dark:hover:text-white"
              aria-label="Regresar al dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
              <span className="inline-flex w-fit rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100">
                {statusLabels[ticket.status]}
              </span>

              <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-900 dark:bg-slate-700 dark:text-gray-100">
                {priorityLabels[ticket.priority]}
              </span>
            </div>
          </div>

          <p className="mx-auto mt-2 max-w-[220px] break-words text-center text-sm text-gray-600 dark:text-gray-400">
            {ticket.subject}
          </p>
        </div>

        <div className="hidden min-w-0 flex-1 items-start gap-2.5 lg:flex lg:gap-4">
          <Link
            href="/dashboard"
            className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="pr-2 text-lg font-bold leading-tight text-gray-900 break-words dark:text-gray-100 lg:text-2xl">
              Ticket {ticketIdentifier}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex w-fit rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100">
                {statusLabels[ticket.status]}
              </span>

              <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-900 dark:bg-slate-700 dark:text-gray-100">
                Prioridad: {priorityLabels[ticket.priority]}
              </span>
            </div>

            <p className="mt-1 break-words text-sm text-gray-600 dark:text-gray-400 lg:text-base">{ticket.subject}</p>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2 lg:w-auto lg:gap-3">
          {isRequester ? (
            ticket.status === 'OPEN' || ticket.status === 'PENDING' ? (
              <button
                onClick={() => handleStatusChange('CLOSED' as TicketStatus)}
                disabled={updating}
                className="px-3 lg:px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                Cerrar ticket
              </button>
            ) : null
          ) : isCoordinator ? (
            <div className="hidden min-w-0 flex-1 items-center gap-2 lg:flex lg:flex-none">
              {canManagePriority && (
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                  disabled={updating}
                  className="min-w-0 w-full lg:w-auto lg:min-w-[150px] px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <option value="LOW">Baja</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              )}

              <User className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
              <select
                value={ticket.assignee?.id || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                disabled={updating}
                className="min-w-0 w-full lg:w-auto lg:min-w-[190px] px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <option value="">Sin asignar</option>
                {Array.isArray(agents) && agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name || agent.email}
                  </option>
                ))}
              </select>
            </div>
          ) : isAdminDept ? (
            ticket.assignee?.id !== currentUserId ? (
              <button
                onClick={() => handleAssigneeChange(currentUserId || '')}
                disabled={updating || !currentUserId}
                className="ml-auto px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                Tomar ticket
              </button>
            ) : null
          ) : null}

          {showActionsMenu && (
            <div className="relative hidden lg:block" ref={desktopMenuRef}>
              <button
                type="button"
                onClick={handleToggleMenu}
                aria-label="Abrir acciones del ticket"
                className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {showMenu && (
                  <div
                    className={menuPanelClass}
                    onClick={(event) => event.stopPropagation()}
                    onTouchStart={(event) => event.stopPropagation()}
                  >
                  {onOpenDetails && (
                    <button
                      type="button"
                      onClick={handleOpenDetails}
                      className={isDarkTheme ? 'w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-100 transition-colors hover:bg-white/5' : 'w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100'}
                    >
                      <Info className={menuIconClass} />
                      Info. del ticket
                    </button>
                  )}

                  {onOpenDetails && (canManageStatus || canDelete) && (
                    <div className={menuDividerClass} />
                  )}

                  {isCoordinator && (
                    <>
                      <div className={`${menuHeaderClass} lg:hidden`}>
                        Asignacion
                      </div>

                      <div className="px-4 pb-3 lg:hidden">
                        <div className={inlineSelectWrapClass}>
                          <User className={`${menuIconClass} flex-shrink-0`} />
                          <select
                            value={ticket.assignee?.id || ''}
                            onChange={(e) => {
                              setShowMenu(false)
                              handleAssigneeChange(e.target.value)
                            }}
                            disabled={updating}
                            className={inlineSelectClass}
                          >
                            <option value="" className={isDarkTheme ? 'bg-slate-800 text-slate-100' : 'bg-white text-gray-900'}>Sin asignar</option>
                            {Array.isArray(agents) && agents.map(agent => (
                              <option key={agent.id} value={agent.id} className={isDarkTheme ? 'bg-slate-800 text-slate-100' : 'bg-white text-gray-900'}>
                                {agent.name || agent.email}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={`${menuDividerClass} lg:hidden`} />
                    </>
                  )}

                  {canManagePriority && (
                    <>
                      <div className={menuHeaderClass}>
                        Prioridad
                      </div>

                      {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as TicketPriority[]).map((priority) => (
                          <button
                            type="button"
                            key={priority}
                            onClick={() => { setShowMenu(false); handlePriorityChange(priority) }}
                            className={menuButtonClass}
                        >
                          {priorityLabels[priority]}
                        </button>
                      ))}

                      <div className={menuDividerClass} />
                    </>
                  )}

                  {canManageStatus && (
                    <>
                      <div className={menuHeaderClass}>
                        Estado
                      </div>

                        <button
                          type="button"
                          onClick={() => { setShowMenu(false); handleStatusChange('OPEN') }}
                          className={menuButtonClass}
                      >
                        <CircleDot className={menuIconClass} />
                        Marcar como abierto
                      </button>
                        <button
                          type="button"
                          onClick={() => { setShowMenu(false); handleStatusChange('PENDING') }}
                          className={menuButtonClass}
                      >
                        <PauseCircle className={menuIconClass} />
                        Marcar como pendiente
                      </button>
                        <button
                          type="button"
                          onClick={() => { setShowMenu(false); handleStatusChange('SOLVED') }}
                          className={menuButtonClass}
                      >
                        <CheckCircle2 className={menuIconClass} />
                        Marcar como resuelto
                      </button>
                        <button
                          type="button"
                          onClick={() => { setShowMenu(false); handleStatusChange('CLOSED') }}
                          className={menuButtonClass}
                      >
                        <Lock className={menuIconClass} />
                        Marcar como cerrado
                      </button>
                    </>
                  )}

                  {canDelete && (onOpenDetails || canManageStatus) && (
                    <div className={`${menuDividerClass} mt-1`} />
                  )}

                  {canDelete && (
                          <button
                            type="button"
                            onClick={() => { setShowMenu(false); setShowDeleteConfirm(true) }}
                            className={dangerButtonClass}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar ticket
                    </button>
                  )}
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
            ¿Estás seguro de que deseas eliminar el <span className="font-medium">Ticket {ticketIdentifier}</span>? Esta acción no se puede deshacer y se eliminarán todos los mensajes asociados.
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
