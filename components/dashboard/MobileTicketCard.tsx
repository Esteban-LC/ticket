'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TicketStatus, TicketPriority } from '@prisma/client'
import { MessageCircle, User, Clock } from 'lucide-react'

interface Ticket {
    id: string
    number: number
    subject: string
    status: TicketStatus
    priority: TicketPriority
    createdAt: Date
    updatedAt: Date
    customer: {
        id: string
        name: string | null
        email: string
        avatar: string | null
    }
    assignee: {
        id: string
        name: string | null
        email: string
    } | null
    _count: {
        messages: number
    }
}

interface MobileTicketCardProps {
    ticket: Ticket
    onAssign?: (ticketId: string) => void
}

const statusColors = {
    OPEN: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    SOLVED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    CLOSED: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
}

const statusLabels = {
    OPEN: 'Abierto',
    PENDING: 'Pendiente',
    SOLVED: 'Resuelto',
    CLOSED: 'Cerrado',
}

const priorityColors = {
    LOW: 'text-gray-600 dark:text-gray-400',
    NORMAL: 'text-blue-600 dark:text-blue-400',
    HIGH: 'text-orange-600 dark:text-orange-400',
    URGENT: 'text-red-600 dark:text-red-400',
}

const priorityLabels = {
    LOW: 'Baja',
    NORMAL: 'Normal',
    HIGH: 'Alta',
    URGENT: 'Urgente',
}

export default function MobileTicketCard({ ticket, onAssign }: MobileTicketCardProps) {
    const router = useRouter()

    return (
        <div
            onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
            className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-primary-600 dark:text-primary-400 font-semibold">
                            #{ticket.number}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[ticket.status]}`}>
                            {statusLabels[ticket.status]}
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {ticket.subject}
                    </h3>
                </div>
            </div>

            {/* Customer Info */}
            <div className="flex items-center gap-2 mb-3 text-sm">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-medium text-xs">
                        {ticket.customer.name?.[0] || ticket.customer.email[0].toUpperCase()}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-medium truncate">
                        {ticket.customer.name || 'Sin nombre'}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                        {ticket.customer.email}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{ticket._count.messages}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{format(new Date(ticket.updatedAt), 'dd/MM/yy')}</span>
                    </div>
                </div>
                <span className={`font-medium ${priorityColors[ticket.priority]}`}>
                    {priorityLabels[ticket.priority]}
                </span>
            </div>

            {/* Assignee */}
            {ticket.assignee ? (
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <User className="h-3.5 w-3.5" />
                    <span>{ticket.assignee.name || ticket.assignee.email}</span>
                </div>
            ) : onAssign && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onAssign(ticket.id)
                    }}
                    className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-md transition"
                >
                    Asignármelo
                </button>
            )}
        </div>
    )
}
