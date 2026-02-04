'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TicketStatus, TicketPriority, TicketType } from '@prisma/client'
import { MessageSquare, User, Calendar } from 'lucide-react'

interface Ticket {
  id: string
  number: number
  subject: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType | null
  createdAt: Date
  updatedAt: Date
  customer: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  category: {
    id: string
    name: string
  } | null
  assignee: {
    id: string
    name: string | null
    email: string
  } | null
  _count: {
    messages: number
  }
}

interface TicketsTableProps {
  tickets: Ticket[]
  agents: Array<{
    id: string
    name: string | null
    email: string
  }>
  currentUserId: string
}

const statusColors = {
  OPEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  SOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
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

const typeLabels = {
  INCIDENT: 'Incidente',
  CHANGE_REQUEST: 'Solicitud de cambio',
  PROJECT: 'Proyecto',
}

export default function TicketsTable({ tickets, agents, currentUserId }: TicketsTableProps) {
  const router = useRouter()

  if (tickets.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron tickets</p>
        <p className="text-gray-400 dark:text-gray-500 mt-2">Intenta ajustar los filtros o crea un nuevo ticket</p>
      </div>
    )
  }

  return (
    <>
      {/* Vista de Cards para Móvil */}
      <div className="md:hidden space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
            className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
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

            {/* Info Grid */}
            <div className="space-y-2 text-xs">
              {/* Cliente */}
              <div className="flex items-center space-x-2">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {ticket.customer.name || ticket.customer.email}
                </span>
              </div>

              {/* Mensajes y Prioridad */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {ticket._count.messages} mensajes
                  </span>
                </div>
                <span className={`text-xs font-medium ${priorityColors[ticket.priority]}`}>
                  {priorityLabels[ticket.priority]}
                </span>
              </div>

              {/* Fecha */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {format(new Date(ticket.updatedAt), 'dd MMM yyyy', { locale: es })}
                </span>
              </div>

              {/* Asignado */}
              {ticket.assignee && (
                <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                  <span className="text-gray-500 dark:text-gray-500 text-xs">
                    Asignado a: <span className="text-gray-700 dark:text-gray-300 font-medium">{ticket.assignee.name}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Vista de Tabla para Desktop */}
      <div className="hidden md:block bg-gray-50 dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Asignado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actualizado
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-50 dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                  className="hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-primary-600 dark:text-primary-400 font-medium">
                      #{ticket.number}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">{ticket.subject}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {ticket._count.messages} mensajes
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {ticket.customer.name?.[0] || ticket.customer.email[0].toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {ticket.customer.name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{ticket.customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.type ? (
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {typeLabels[ticket.type]}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.category ? (
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {ticket.category.name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[ticket.status]}`}>
                      {statusLabels[ticket.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${priorityColors[ticket.priority]}`}>
                      {priorityLabels[ticket.priority]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {ticket.assignee?.name || 'Sin asignar'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(ticket.updatedAt), 'PPp', { locale: es })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
