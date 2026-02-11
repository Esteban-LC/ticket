'use client'

import { useState } from 'react'
import {
    Users,
    Ticket,
    Calendar,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    ChevronDown,
    Eye,
    BarChart3,
    Building2,
} from 'lucide-react'

interface VistaGeneralClientProps {
    totalUsers: number
    totalTickets: number
    openTicketsCount: number
    ticketsByStatus: Array<{ status: string; _count: { status: number } }>
    ticketsByPriority: Array<{ priority: string; _count: { priority: number } }>
    recentTickets: Array<{
        id: string
        number: number
        subject: string
        status: string
        priority: string
        updatedAt: string
        customer: { id: string; name: string | null; email: string }
        assignee: { id: string; name: string | null; email: string } | null
        category: { id: string; name: string } | null
    }>
    allUsers: Array<{
        id: string
        name: string | null
        email: string
        role: string
        department: { name: string } | null
        _count: {
            createdTickets: number
            assignedTickets: number
            events: number
        }
    }>
    departments: Array<{
        id: string
        name: string
        _count: { users: number }
    }>
    recentEvents: Array<{
        id: string
        title: string
        startDate: string
        type: string
        status: string
        user: { id: string; name: string | null; email: string }
        ticket: { id: string; number: number; subject: string } | null
    }>
}

const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    SOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
}

const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    NORMAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const statusLabels: Record<string, string> = {
    OPEN: 'Abierto',
    PENDING: 'Pendiente',
    SOLVED: 'Resuelto',
    CLOSED: 'Cerrado',
}

const priorityLabels: Record<string, string> = {
    LOW: 'Baja',
    NORMAL: 'Normal',
    HIGH: 'Alta',
    URGENT: 'Urgente',
}

const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    COORDINATOR: 'Coordinador',
    EDITOR: 'Editor',
    VIEWER: 'Lector',
}

export default function VistaGeneralClient({
    totalUsers,
    totalTickets,
    openTicketsCount,
    ticketsByStatus,
    ticketsByPriority,
    recentTickets,
    allUsers,
    departments,
    recentEvents,
}: VistaGeneralClientProps) {
    const [activeTab, setActiveTab] = useState<'resumen' | 'usuarios' | 'tickets' | 'eventos'>('resumen')
    const [filterDepartment, setFilterDepartment] = useState<string>('')

    const solvedCount = ticketsByStatus.find(t => t.status === 'SOLVED')?._count.status || 0
    const pendingCount = ticketsByStatus.find(t => t.status === 'PENDING')?._count.status || 0
    const closedCount = ticketsByStatus.find(t => t.status === 'CLOSED')?._count.status || 0

    const filteredUsers = filterDepartment
        ? allUsers.filter(u => u.department?.name === filterDepartment)
        : allUsers

    const tabs = [
        { id: 'resumen' as const, label: 'Resumen', icon: BarChart3 },
        { id: 'usuarios' as const, label: 'Usuarios', icon: Users },
        { id: 'tickets' as const, label: 'Tickets Recientes', icon: Ticket },
        { id: 'eventos' as const, label: 'Eventos', icon: Calendar },
    ]

    return (
        <div className="p-4 lg:p-8 space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <Eye className="h-7 w-7 text-primary-600 dark:text-primary-400" />
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Vista General</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 ml-10">
                    Vista de solo lectura de todos los datos del sistema
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Usuarios</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTickets}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Tickets</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{openTicketsCount}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Abiertos</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{departments.length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Departamentos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-slate-700">
                <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'resumen' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tickets por Estado */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tickets por Estado</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Abiertos', count: openTicketsCount, icon: AlertCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500' },
                                { label: 'Pendientes', count: pendingCount, icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500' },
                                { label: 'Resueltos', count: solvedCount, icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500' },
                                { label: 'Cerrados', count: closedCount, icon: XCircle, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-500' },
                            ].map(item => {
                                const Icon = item.icon
                                const percentage = totalTickets > 0 ? (item.count / totalTickets) * 100 : 0
                                return (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <Icon className={`h-5 w-5 ${item.color}`} />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 w-24">{item.label}</span>
                                        <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                                            <div className={`${item.bg} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">{item.count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Tickets por Prioridad */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tickets por Prioridad</h3>
                        <div className="space-y-3">
                            {['URGENT', 'HIGH', 'NORMAL', 'LOW'].map(priority => {
                                const count = ticketsByPriority.find(t => t.priority === priority)?._count.priority || 0
                                const percentage = totalTickets > 0 ? (count / totalTickets) * 100 : 0
                                return (
                                    <div key={priority} className="flex items-center gap-3">
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${priorityColors[priority]}`}>
                                            {priorityLabels[priority]}
                                        </span>
                                        <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                                            <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Departamentos */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Departamentos</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {departments.map(dept => (
                                <div key={dept.id} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{dept.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{dept._count.users} usuario(s)</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'usuarios' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                    {/* Filtro por departamento */}
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Filtrar por departamento:</label>
                            <select
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            >
                                <option value="">Todos</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                ))}
                            </select>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {filteredUsers.length} usuario(s)
                            </span>
                        </div>
                    </div>

                    {/* Tabla de usuarios */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-800">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Departamento</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rol</th>
                                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tickets Creados</th>
                                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tickets Asignados</th>
                                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Eventos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name || 'Sin nombre'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {u.department?.name || 'Sin departamento'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                                                u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                u.role === 'COORDINATOR' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                u.role === 'EDITOR' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                                {roleLabels[u.role]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{u._count.createdTickets}</td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{u._count.assignedTickets}</td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{u._count.events}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'tickets' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">10 tickets m&aacute;s recientes</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-800">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Asunto</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prioridad</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Creado por</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Asignado a</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {recentTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">#{ticket.number}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">{ticket.subject}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[ticket.status]}`}>
                                                {statusLabels[ticket.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${priorityColors[ticket.priority]}`}>
                                                {priorityLabels[ticket.priority]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {ticket.customer.name || ticket.customer.email}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {ticket.assignee ? (ticket.assignee.name || ticket.assignee.email) : <span className="text-gray-400 italic">Sin asignar</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'eventos' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Eventos recientes de todos los usuarios</h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-slate-700">
                        {recentEvents.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No hay eventos registrados
                            </div>
                        ) : (
                            recentEvents.map(event => (
                                <div key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(event.startDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-gray-400">|</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {event.user.name || event.user.email}
                                                </span>
                                                {event.ticket && (
                                                    <>
                                                        <span className="text-xs text-gray-400">|</span>
                                                        <span className="text-xs text-primary-600 dark:text-primary-400">
                                                            Ticket #{event.ticket.number}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                            {event.type}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                                            event.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                            event.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                            event.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                        }`}>
                                            {event.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
