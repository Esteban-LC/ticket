'use client'

import { Ticket, Clock, User, X } from 'lucide-react'
import Link from 'next/link'

interface EventCardProps {
    event: {
        id: string
        title: string
        description?: string
        startDate: string
        endDate?: string
        allDay: boolean
        color?: string
        type: string
        status: string
        ticketId?: string
        user: {
            id: string
            name: string
            email: string
            avatar?: string
        }
        ticket?: {
            id: string
            number: number
            subject: string
            status: string
        }
    }
    onDelete?: (id: string) => void
    onEdit?: (id: string) => void
    compact?: boolean
}

const TYPE_LABELS: Record<string, string> = {
    TASK: 'Tarea',
    MEETING: 'Reunión',
    DEADLINE: 'Fecha límite',
    REMINDER: 'Recordatorio',
    MAINTENANCE: 'Mantenimiento'
}

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En progreso',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado'
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800'
}

export default function EventCard({ event, onDelete, onEdit, compact }: EventCardProps) {
    const startDate = new Date(event.startDate)
    const endDate = event.endDate ? new Date(event.endDate) : null

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    if (compact) {
        return (
            <div
                onClick={(e) => e.stopPropagation()}
                className="group relative flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 border-l-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-r overflow-hidden"
                style={{ borderLeftColor: event.color || '#3b82f6' }}
                title={`${event.title} - ${formatTime(startDate)}`}
            >
                <div
                    className={`flex-1 truncate font-medium text-gray-700 dark:text-gray-200 ${onEdit ? 'cursor-pointer' : ''}`}
                    onClick={() => { if (onEdit) onEdit(event.id) }}
                >
                    {!event.allDay && <span className="opacity-75 mr-1">{formatTime(startDate)}</span>}
                    {event.title}
                </div>
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(event.id) }}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 hover:bg-red-100 rounded transition-all"
                        title="Eliminar"
                    >
                        <X className="w-3 h-3 text-red-500" />
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all overflow-hidden group">
            {/* Color bar */}
            <div
                className="h-1"
                style={{ backgroundColor: event.color || '#3b82f6' }}
            />

            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[event.status]}`}>
                                {STATUS_LABELS[event.status]}
                            </span>
                            <span className="text-xs text-gray-500">
                                {TYPE_LABELS[event.type]}
                            </span>
                        </div>
                    </div>

                </div>

                {/* Description */}
                {event.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {event.description}
                    </p>
                )}

                {/* Date and time */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Clock className="w-4 h-4" />
                    <span>
                        {event.allDay ? (
                            formatDate(startDate)
                        ) : (
                            <>
                                {formatDate(startDate)} • {formatTime(startDate)}
                                {endDate && ` - ${formatTime(endDate)}`}
                            </>
                        )}
                    </span>
                </div>

                {/* User */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <User className="w-4 h-4" />
                    <span>{event.user.name}</span>
                </div>

                {/* Linked ticket */}
                {event.ticket && (
                    <Link
                        href={`/dashboard/tickets/${event.ticket.id}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        <Ticket className="w-4 h-4" />
                        <span>Ticket #{event.ticket.number}: {event.ticket.subject}</span>
                    </Link>
                )}

                {/* Actions */}
                {(onEdit || onDelete) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(event.id)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Editar
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(event.id)}
                                className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                            >
                                <X className="w-3.5 h-3.5" /> Eliminar
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
