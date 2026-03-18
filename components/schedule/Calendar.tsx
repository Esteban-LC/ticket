'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Kanban } from 'lucide-react'
import EventCard from './EventCard'
import CreateEventModal from './CreateEventModal'
import KanbanBoard from './KanbanBoard'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useResourceStream } from '@/lib/useResourceStream'

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

const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

type ViewMode = 'CALENDAR' | 'KANBAN'

interface CalendarProps {
    currentUserId: string
    currentUserRole: string
}

export default function Calendar({ currentUserId, currentUserRole }: CalendarProps) {
    const canManageEvent = (eventUserId: string) => eventUserId === currentUserId
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<Event[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<ViewMode>('CALENDAR')
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const fetchEvents = async () => {
        try {
            setLoading(true)
            const startOfMonth = new Date(year, month, 1)
            const endOfMonth = new Date(year, month + 1, 0)

            const response = await fetch(
                `/api/events?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`,
                { cache: 'no-store' }
            )

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

    useEffect(() => {
        fetchEvents()
    }, [currentDate])
    useResourceStream('events', fetchEvents)

    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    const getDaysInMonth = () => {
        const firstDay = new Date(year, month, 1).getDay()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const daysInPrevMonth = new Date(year, month, 0).getDate()

        const days: Array<{ date: Date; isCurrentMonth: boolean }> = []

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, daysInPrevMonth - i),
                isCurrentMonth: false
            })
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            })
        }

        const remainingDays = 42 - days.length
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            })
        }

        return days
    }

    const getEventsForDay = (date: Date) => {
        return events.filter(event => {
            const eventDate = new Date(event.startDate)
            return (
                eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear()
            )
        })
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    }

    const handleDayClick = (date: Date) => {
        setSelectedDate(date)
        setEditingEvent(null)
        setShowCreateModal(true)
    }

    const handleEditEvent = (eventId: string) => {
        const event = events.find(e => e.id === eventId)
        if (event) {
            setEditingEvent(event)
            setShowCreateModal(true)
        }
    }

    const handleEditEventFromKanban = (event: Event) => {
        setEditingEvent(event)
        setShowCreateModal(true)
    }

    const requestDeleteEvent = (event: Event) => {
        setEventToDelete(event)
    }

    const handleDeleteEvent = async (id: string) => {
        try {
            const response = await fetch(`/api/events/${id}`, { method: 'DELETE', cache: 'no-store' })
            if (response.ok) {
                setEvents(prev => prev.filter(event => event.id !== id))
                setEventToDelete(null)
            }
        } catch (error) {
            console.error('Error al eliminar evento:', error)
        }
    }

    const handleEventCreated = (savedEvent?: Event) => {
        if (savedEvent?.id) {
            setEvents(prev => {
                const exists = prev.some(event => event.id === savedEvent.id)
                if (exists) {
                    return prev.map(event => event.id === savedEvent.id ? savedEvent : event)
                }

                const next = [...prev, savedEvent]
                next.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                return next
            })
        } else {
            fetchEvents()
        }
        setShowCreateModal(false)
        setSelectedDate(null)
        setEditingEvent(null)
    }

    const handleEventUpdate = (updatedEvent: Event) => {
        setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e))
    }

    const days = getDaysInMonth()

    return (
        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-3 md:px-6 md:py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                    <div className="flex items-center justify-between md:justify-start md:gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <h2 className="text-lg md:text-2xl font-bold text-white whitespace-nowrap">
                                {MONTHS[month]} {year}
                            </h2>

                            <div className="flex bg-blue-700/50 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('CALENDAR')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'CALENDAR' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}
                                    title="Vista Calendario"
                                >
                                    <CalendarIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('KANBAN')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'KANBAN' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}
                                    title="Vista Kanban"
                                >
                                    <Kanban className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={goToToday}
                            className="md:hidden px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-xs font-medium"
                        >
                            Hoy
                        </button>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3">
                        <button
                            onClick={goToToday}
                            className="hidden md:block px-3 py-1.5 md:px-4 md:py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-xs md:text-sm font-medium"
                        >
                            Hoy
                        </button>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={previousMonth}
                                className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition-colors"
                                aria-label="Mes anterior"
                            >
                                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition-colors"
                                aria-label="Mes siguiente"
                            >
                                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedDate(null)
                                setEditingEvent(null)
                                setShowCreateModal(true)
                            }}
                            className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 md:gap-2 font-medium text-xs md:text-sm shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Nuevo Evento</span>
                            <span className="sm:hidden">Nuevo</span>
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'CALENDAR' ? (
                <>
                    <div className="grid grid-cols-7 bg-gray-100 dark:bg-slate-700">
                        {DAYS.map(day => (
                            <div
                                key={day}
                                className="py-2 md:py-3 text-center text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 bg-white dark:bg-slate-800">
                        {days.map((day, index) => {
                            const dayEvents = getEventsForDay(day.date)
                            const today = isToday(day.date)

                            return (
                                <div
                                    key={index}
                                    onClick={() => day.isCurrentMonth && handleDayClick(day.date)}
                                    className={`
                                        min-h-[80px] md:min-h-[120px] p-1 md:p-2 border-b border-r border-gray-200 dark:border-slate-700
                                        ${day.isCurrentMonth
                                            ? 'bg-white dark:bg-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700'
                                            : 'bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-gray-600'
                                        }
                                        ${today ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                    `}
                                >
                                    <div className={`
                                        text-xs md:text-sm font-semibold mb-1
                                        ${today ? 'text-blue-600 dark:text-blue-400' : ''}
                                        ${!day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                                    `}>
                                        {day.date.getDate()}
                                    </div>

                                    <div className="space-y-0.5 md:space-y-1">
                                        {dayEvents.slice(0, 2).map(event => (
                                            <EventCard
                                                key={event.id}
                                                event={event}
                                                compact
                                                onEdit={canManageEvent(event.user.id) ? handleEditEvent : undefined}
                                                onDelete={canManageEvent(event.user.id) ? () => requestDeleteEvent(event) : undefined}
                                            />
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                +{dayEvents.length - 2} mas
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            ) : (
                <div className="flex-1 p-4 bg-gray-100 dark:bg-black/20 overflow-hidden">
                    <KanbanBoard
                        events={events}
                        onEventUpdate={handleEventUpdate}
                        onEditEvent={handleEditEventFromKanban}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                    />
                </div>
            )}

            {showCreateModal && (
                <CreateEventModal
                    onClose={() => {
                        setShowCreateModal(false)
                        setSelectedDate(null)
                        setEditingEvent(null)
                    }}
                    onEventCreated={handleEventCreated}
                    initialDate={selectedDate || undefined}
                    eventToEdit={editingEvent}
                />
            )}

            <ConfirmDialog
                isOpen={Boolean(eventToDelete)}
                onClose={() => setEventToDelete(null)}
                onConfirm={() => eventToDelete && handleDeleteEvent(eventToDelete.id)}
                title="Eliminar evento"
                message={eventToDelete ? `Se eliminara "${eventToDelete.title}". Esta accion no se puede deshacer.` : ''}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    )
}
