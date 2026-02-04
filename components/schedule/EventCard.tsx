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

export default function EventCard({ event, onDelete, onEdit }: EventCardProps) {
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

                    {onDelete && (
                        <button
                            onClick={() => onDelete(event.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                            title="Eliminar evento"
                        >
                            <X className="w-4 h-4 text-red-600" />
                        </button>
                    )}
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
                {onEdit && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <button
                            onClick={() => onEdit(event.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Editar evento
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
