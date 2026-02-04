'use client'

import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
import EventCard from './EventCard'

interface Event {
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

export default function Timeline() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        type: '',
        status: ''
    })

    useEffect(() => {
        fetchEvents()
    }, [filters])

    const fetchEvents = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filters.type) params.append('type', filters.type)
            if (filters.status) params.append('status', filters.status)

            const response = await fetch(`/api/events?${params.toString()}`)
            if (response.ok) {
                const data = await response.json()
                setEvents(data)
            }
        } catch (error) {
            console.error('Error al cargar eventos:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este evento?')) return

        try {
            const response = await fetch(`/api/events/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchEvents()
            }
        } catch (error) {
            console.error('Error al eliminar evento:', error)
        }
    }

    // Agrupar eventos por fecha
    const groupedEvents = events.reduce((acc, event) => {
        const date = new Date(event.startDate).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        if (!acc[date]) {
            acc[date] = []
        }
        acc[date].push(event)
        return acc
    }, {} as Record<string, Event[]>)

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos los tipos</option>
                            <option value="TASK">Tareas</option>
                            <option value="MEETING">Reuniones</option>
                            <option value="DEADLINE">Fechas límite</option>
                            <option value="REMINDER">Recordatorios</option>
                            <option value="MAINTENANCE">Mantenimiento</option>
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos los estados</option>
                            <option value="PENDING">Pendientes</option>
                            <option value="IN_PROGRESS">En progreso</option>
                            <option value="COMPLETED">Completados</option>
                            <option value="CANCELLED">Cancelados</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando eventos...</p>
                </div>
            ) : Object.keys(groupedEvents).length === 0 ? (
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No hay eventos para mostrar</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                        <div key={date} className="relative">
                            {/* Línea vertical */}
                            <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 to-purple-600" />

                            {/* Fecha */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md">
                                    {date}
                                </div>
                                <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-600/20 to-transparent" />
                            </div>

                            {/* Eventos del día */}
                            <div className="ml-12 space-y-4">
                                {dateEvents.map((event) => (
                                    <div key={event.id} className="relative">
                                        {/* Punto en la línea */}
                                        <div className="absolute -left-[35px] top-6 w-3 h-3 rounded-full bg-white border-2 border-blue-600 shadow-md" />

                                        <EventCard
                                            event={event}
                                            onDelete={handleDelete}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
